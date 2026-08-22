function repl(s,f,t,  out,p,n){ n=length(f); out="";
  while((p=index(s,f))>0){ out=out substr(s,1,p-1) t; s=substr(s,p+n) } return out s }
function unesc(s){ s=repl(s,"&lt;","<"); s=repl(s,"&gt;",">"); s=repl(s,"&quot;","\"");
  s=repl(s,"&apos;","'"); s=repl(s,"&#39;","'"); s=repl(s,"&amp;","&"); return s }
BEGIN{FS=OFS="\t"}
FILENAME==ARGV[1]{ CE[$1]=$2; CC[$1]=$3; CA[$1]=$6; next }
FILENAME==ARGV[2]{ PG[$1]=$2; PS[$1]=$3; PA[$1]=$4; PB[$1]=$5; PY[$1]=$6; next }
{
  id=$1; typ=$7; trk=$2; alb=$4; yr=$5;
  if(typ=="Classical"){ sup=0; ep=CE[id]; comp=CC[id];
    if(ep=="") ep=$8; if(comp=="") comp=$10;
    if(CA[id]!="") alb=CA[id];
    gal=ep; sub(/ *\([^)]*\) *$/,"",gal);
    dir=""; p=index(gal," / "); if(p>0){ dir=substr(gal,p+3); gal=substr(gal,1,p-1) }
    sys=comp; if(sys=="") sys="Композитор не определён";
  } else {
    sup=1; gal=PG[id]; dir=PS[id]; sys=PA[id]; if(PB[id]!="") alb=PB[id]; if(PY[id]!="") yr=PY[id];
    if(gal=="") gal=$8; if(dir=="") dir=$9; if(sys=="") sys=$3;
    sub(/ *\([^)]*\) *$/,"",gal);
  }
  sub(/ +$/,"",gal); sub(/^ +/,"",gal);
  if(gal=="") gal="Без жанра"; if(dir=="") dir="—"; if(sys=="") sys="—";
  best=0; for(i=14;i<=20;i++){ v=$i+0; if($i!="" && v>0 && (best==0 || v<best)) best=v }
  print sup, unesc(gal), unesc(dir), unesc(sys), unesc(trk), yr+0, best, unesc(alb);
}
