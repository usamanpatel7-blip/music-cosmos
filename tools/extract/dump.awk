BEGIN{ RS="\n"; while((getline line < SS) > 0){ n=index(line,"\t"); S[substr(line,1,n-1)]=substr(line,n+1) } RS="<row " }
NR>1{
  rec=$0; sub(/<\/row>.*/,"",rec);
  match(rec,/r="[0-9]+"/); rn=substr(rec,RSTART+3,RLENGTH-4);
  if(rn+0<MINR || (MAXR>0 && rn+0>MAXR)) next;
  delete C; nc=split(rec,cs,"<c ");
  for(i=2;i<=nc;i++){ c=cs[i];
    match(c,/r="[A-Z]+[0-9]+"/); ref=substr(c,RSTART+3,RLENGTH-4);
    col=ref; gsub(/[0-9]/,"",col);
    ist = (c ~ /t="s"/); isinl=(c ~ /t="inlineStr"/);
    v="";
    if(isinl){ if(match(c,/<t[^>]*>[^<]*<\/t>/)){ v=substr(c,RSTART,RLENGTH); sub(/^<t[^>]*>/,"",v); sub(/<\/t>$/,"",v);} }
    else if(match(c,/<v>[^<]*<\/v>/)){ v=substr(c,RSTART+3,RLENGTH-7); if(ist) v=S[v]; }
    C[col]=v;
  }
  m=split(COLS,cl,","); out="";
  for(k=1;k<=m;k++){ out = out (k>1?"\t":"") C[cl[k]] }
  print rn "\t" out;
}
