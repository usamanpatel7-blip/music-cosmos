BEGIN{
  while((getline line < SS) > 0){
    p=index(line,"\t");
    idx=substr(line,1,p-1); val=substr(line,p+1);
    S[idx]=val;
  }
  RS="<row ";
}
NR>1{
  row=$0; sub(/<\/row>.*/,"",row);
  hdr=row; sub(/>.*/,"",hdr);
  rn=""; if(match(hdr,/r="[0-9]+"/)){ rn=substr(hdr,RSTART+3,RLENGTH-4); }
  delete C;
  n=split(row,cells,"<c ");
  for(k=2;k<=n;k++){
    c=cells[k];
    ref=""; if(match(c,/^r="[A-Z]+[0-9]+"/)){ ref=substr(c,RSTART+3,RLENGTH-4); }
    col=ref; gsub(/[0-9]/,"",col);
    typ=""; if(match(c,/ t="[a-z]+"/)){ typ=substr(c,RSTART+4,RLENGTH-5); }
    v="";
    if(match(c,/<v>[^<]*<\/v>/)){ v=substr(c,RSTART+3,RLENGTH-7); }
    if(typ=="s"){ v=S[v] }
    else if(typ=="inlineStr"){ if(match(c,/<t[^>]*>[^<]*<\/t>/)){ vv=substr(c,RSTART,RLENGTH); sub(/^<t[^>]*>/,"",vv); sub(/<\/t>$/,"",vv); v=vv } }
    C[col]=v;
  }
  line=rn;
  split("A B C D E F G H I J K",cols," ");
  for(k=1;k<=11;k++){ line=line "\t" C[cols[k]] }
  print line;
}
