param([string]$Pdf,[string]$Out)
Add-Type -AssemblyName System.IO.Compression
$latin=[System.Text.Encoding]::GetEncoding(28591)
$bytes=[System.IO.File]::ReadAllBytes($Pdf)
$s=$latin.GetString($bytes)

function Inflate([byte[]]$d){
  try{
    $ms=New-Object System.IO.MemoryStream(,$d)
    $ms.ReadByte()|Out-Null; $ms.ReadByte()|Out-Null
    $ds=New-Object System.IO.Compression.DeflateStream($ms,[System.IO.Compression.CompressionMode]::Decompress)
    $o=New-Object System.IO.MemoryStream
    $ds.CopyTo($o); $ds.Dispose(); $ms.Dispose()
    return $o.ToArray()
  } catch { return $null }
}

# --- index objects ---
$objStart=@{}; $objEnd=@{}
foreach($m in [regex]::Matches($s,'(?m)(\d+)\s+0\s+obj')){
  $n=[int]$m.Groups[1].Value
  $e=$s.IndexOf('endobj',$m.Index)
  $objStart[$n]=$m.Index; $objEnd[$n]=$e
}
function ObjText([int]$n){
  if(-not $objStart.ContainsKey($n)){return ''}
  return $s.Substring($objStart[$n], $objEnd[$n]-$objStart[$n])
}
function ObjStreamBytes([int]$n){
  if(-not $objStart.ContainsKey($n)){return $null}
  $seg=$s.Substring($objStart[$n], $objEnd[$n]-$objStart[$n])
  $mm=[regex]::Match($seg,'stream\r?\n')
  if(-not $mm.Success){return $null}
  $st=$objStart[$n]+$mm.Index+$mm.Length
  $en=$s.IndexOf('endstream',$st)
  $len=$en-$st
  $chunk=New-Object byte[] $len
  [Array]::Copy($bytes,$st,$chunk,0,$len)
  return (Inflate $chunk)
}

# --- parse ToUnicode CMap object -> hashtable code(int) -> string ---
function ParseCMap([int]$n){
  $map=@{}
  $d=ObjStreamBytes $n
  if($d -eq $null){return $map}
  $t=$latin.GetString($d)
  foreach($blk in [regex]::Matches($t,'beginbfchar([\s\S]*?)endbfchar')){
    foreach($pair in [regex]::Matches($blk.Groups[1].Value,'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>')){
      $src=[Convert]::ToInt32($pair.Groups[1].Value,16)
      $dstHex=$pair.Groups[2].Value
      $sb=''
      for($i=0;$i+3 -lt $dstHex.Length+1;$i+=4){
        if($i+4 -le $dstHex.Length){ $sb += [char][Convert]::ToInt32($dstHex.Substring($i,4),16) }
      }
      $map[$src]=$sb
    }
  }
  foreach($blk in [regex]::Matches($t,'beginbfrange([\s\S]*?)endbfrange')){
    foreach($tri in [regex]::Matches($blk.Groups[1].Value,'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>')){
      $lo=[Convert]::ToInt32($tri.Groups[1].Value,16)
      $hi=[Convert]::ToInt32($tri.Groups[2].Value,16)
      $base=[Convert]::ToInt32($tri.Groups[3].Value,16)
      for($c=$lo;$c -le $hi;$c++){ $map[$c]=[char]($base+($c-$lo)) }
    }
  }
  return $map
}

# --- font object -> cmap cache ---
$cmapCache=@{}
function FontCMap([int]$fontObj){
  if($cmapCache.ContainsKey($fontObj)){return $cmapCache[$fontObj]}
  $t=ObjText $fontObj
  $m=[regex]::Match($t,'/ToUnicode\s+(\d+)\s+0\s+R')
  $map=@{}
  if($m.Success){ $map=ParseCMap ([int]$m.Groups[1].Value) }
  $cmapCache[$fontObj]=$map
  return $map
}

# --- decode a PDF literal string to raw byte codes ---
function DecodeLiteral([string]$lit){
  $codes=New-Object System.Collections.Generic.List[int]
  $i=0
  while($i -lt $lit.Length){
    $ch=$lit[$i]
    if($ch -eq '\'){
      $i++
      if($i -ge $lit.Length){break}
      $c2=$lit[$i]
      switch($c2){
        'n' { $codes.Add(10); $i++ }
        'r' { $codes.Add(13); $i++ }
        't' { $codes.Add(9); $i++ }
        'b' { $codes.Add(8); $i++ }
        'f' { $codes.Add(12); $i++ }
        '(' { $codes.Add(40); $i++ }
        ')' { $codes.Add(41); $i++ }
        '\' { $codes.Add(92); $i++ }
        default {
          if($c2 -match '[0-7]'){
            $oct=''
            while($i -lt $lit.Length -and $lit[$i] -match '[0-7]' -and $oct.Length -lt 3){ $oct+=$lit[$i]; $i++ }
            $codes.Add([Convert]::ToInt32($oct,8))
          } else { $codes.Add([int][char]$c2); $i++ }
        }
      }
    } else { $codes.Add([int][char]$ch); $i++ }
  }
  return $codes
}

# --- collect pages in order ---
$pageObjs=New-Object System.Collections.Generic.List[int]
foreach($n in ($objStart.Keys | Sort-Object)){
  $t=ObjText $n
  if($t -match '/Type\s*/Page[^s]'){ $pageObjs.Add($n) }
}

$sbOut=New-Object System.Text.StringBuilder
$pageIdx=0
foreach($pn in $pageObjs){
  $pageIdx++
  $pt=ObjText $pn
  # font name -> object number (search the Resources font dict)
  $fontMap=@{}
  $rt=$pt
  $rm=[regex]::Match($pt,'/Resources\s+(\d+)\s+0\s+R')
  if($rm.Success){ $rt=ObjText ([int]$rm.Groups[1].Value) }
  $fm=[regex]::Match($rt,'/Font\s*<<([\s\S]*?)>>')
  if($fm.Success){
    foreach($fe in [regex]::Matches($fm.Groups[1].Value,'/([A-Za-z0-9#+._-]+)\s+(\d+)\s+0\s+R')){
      $fontMap[$fe.Groups[1].Value]=[int]$fe.Groups[2].Value
    }
  }
  # contents
  $contents=New-Object System.Collections.Generic.List[int]
  $cm=[regex]::Match($pt,'/Contents\s+(\d+)\s+0\s+R')
  if($cm.Success){ $contents.Add([int]$cm.Groups[1].Value) }
  else {
    $cm2=[regex]::Match($pt,'/Contents\s*\[([^\]]*)\]')
    if($cm2.Success){ foreach($r in [regex]::Matches($cm2.Groups[1].Value,'(\d+)\s+0\s+R')){ $contents.Add([int]$r.Groups[1].Value) } }
  }
  [void]$sbOut.AppendLine("")
  [void]$sbOut.AppendLine("=== PAGE $pageIdx ===")
  foreach($cn in $contents){
    $d=ObjStreamBytes $cn
    if($d -eq $null){continue}
    $ct=$latin.GetString($d)
    $curMap=@{}
    $line=New-Object System.Text.StringBuilder
    $tokens=[regex]::Matches($ct,'/([A-Za-z0-9#+._-]+)\s+[\d.]+\s+Tf|\(((?:\\.|[^\\()])*)\)\s*Tj|\[((?:\\.|[^\\\[\]])*)\]\s*TJ|(T\*)|(ET)|(Td|TD|Tm)')
    foreach($tk in $tokens){
      if($tk.Groups[1].Success){
        $fn=$tk.Groups[1].Value
        if($fontMap.ContainsKey($fn)){ $curMap=FontCMap $fontMap[$fn] } else { $curMap=@{} }
      }
      elseif($tk.Groups[2].Success){
        foreach($c in (DecodeLiteral $tk.Groups[2].Value)){
          if($curMap.ContainsKey($c)){ [void]$line.Append($curMap[$c]) } else { [void]$line.Append([char]$c) }
        }
      }
      elseif($tk.Groups[3].Success){
        foreach($lm in [regex]::Matches($tk.Groups[3].Value,'\(((?:\\.|[^\\()])*)\)')){
          foreach($c in (DecodeLiteral $lm.Groups[1].Value)){
            if($curMap.ContainsKey($c)){ [void]$line.Append($curMap[$c]) } else { [void]$line.Append([char]$c) }
          }
        }
      }
      elseif($tk.Groups[4].Success -or $tk.Groups[5].Success){
        if($line.Length -gt 0){ [void]$sbOut.AppendLine($line.ToString()); [void]$line.Clear() }
      }
    }
    if($line.Length -gt 0){ [void]$sbOut.AppendLine($line.ToString()) }
  }
}
[System.IO.File]::WriteAllText($Out,$sbOut.ToString(),[System.Text.Encoding]::UTF8)
Write-Output ("pages: " + $pageObjs.Count + "  chars: " + $sbOut.Length)
