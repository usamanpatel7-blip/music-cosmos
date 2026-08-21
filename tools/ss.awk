BEGIN{RS="<si>"; i=-1}
{
  if(NR==1) next;
  s=$0; sub(/<\/si>.*/,"",s);
  out="";
  n=split(s,parts,"<t");
  for(k=2;k<=n;k++){
    p=parts[k];
    sub(/^[^>]*>/,"",p);
    sub(/<\/t>.*/,"",p);
    out=out p;
  }
  gsub(/\n/," ",out);
  i++;
  print i "\t" out;
}
