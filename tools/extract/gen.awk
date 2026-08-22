function jesc(s,  o,i,c){ o="";
  for(i=1;i<=length(s);i++){ c=substr(s,i,1);
    if(c=="\\") o=o "\\\\"; else if(c=="\"") o=o "\\\""; else o=o c }
  return o }
BEGIN{FS="\t"; ng=0; ns=0; nt=0; nb=0}
FILENAME==ARGV[1]{ ep=$2; g=ep; p=index(g," / "); if(p>0) g=substr(g,1,p-1);
  sub(/ *\([^)]*\) *$/,"",g); sub(/ +$/,"",g);
  if(match(ep,/\([0-9]{3,4}/)){ y=substr(ep,RSTART+1,4)+0; if(!(g in GY) || y<GY[g]) GY[g]=y }
  next }
{
  sup=$1+0; gal=$2; dir=$3; sys=$4; trk=$5; yr=$6+0; rep=$7+0;
  gk=sup "\x01" gal;
  if(!(gk in GI)){ GI[gk]=ng; GN[ng]=gal; GS[ng]=sup; ng++ }
  gi=GI[gk];
  if(!(dir in BI)){ BI[dir]=nb; BN[nb]=dir; nb++ }
  sk=gi "\x01" sys;
  if(!(sk in SI)){ SI[sk]=ns; SN[ns]=sys; SG[ns]=gi; SB[ns]=BI[dir]; ns++ }
  si=SI[sk];
  TN[nt]=trk; TS[nt]=si; TY[nt]=yr; TR[nt]=rep; nt++;
  GC[gi]++; SC[si]++; PC[sup]++;
  AG[sys "\x01" gi]=1; AL[sys]=AL[sys] "," gi;
}
END{
  printf "{\n";
  printf "\"sup\":[[\"Классическая\",%d],[\"Популярная\",%d]],\n", PC[0], PC[1];
  printf "\"sub\":[";
  for(i=0;i<nb;i++) printf "%s\"%s\"", (i?",":""), jesc(BN[i]);
  printf "],\n\"gal\":[";
  for(i=0;i<ng;i++){ y = (GN[i] in GY) ? GY[i==-1?0:0] : 0;
    yy = (GN[i] in GY) ? GY[GN[i]] : 0;
    printf "%s[\"%s\",%d,%d,%d]", (i?",":""), jesc(GN[i]), GS[i], yy, GC[i] }
  printf "],\n\"sys\":[";
  for(i=0;i<ns;i++) printf "%s[\"%s\",%d,%d,%d]", (i?",":""), jesc(SN[i]), SG[i], SB[i], SC[i];
  printf "],\n\"trk\":[";
  for(i=0;i<nt;i++) printf "%s[\"%s\",%d,%d,%d]", (i?",":""), jesc(TN[i]), TS[i], TY[i], TR[i];
  printf "]\n}\n";
}
