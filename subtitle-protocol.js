export function splitCaption(text,fits){
  const words=text.trim().replace(/\s+/g," ").split(" ").filter(Boolean),parts=[];
  let current="";
  for(const word of words){
    const next=current?current+" "+word:word;
    if(fits(next)){current=next;continue}
    if(current){parts.push(current);current=""}
    if(fits(word)){current=word;continue}
    const graphemes=typeof Intl.Segmenter==="function"?[...new Intl.Segmenter("en",{granularity:"grapheme"}).segment(word)].map(part=>part.segment):Array.from(word);
    for(const grapheme of graphemes){
      if(current&&!fits(current+grapheme)){parts.push(current);current=""}
      current+=grapheme;
    }
  }
  if(current)parts.push(current);
  if(parts.join(" ")===words.join(" "))for(let index=parts.length-1;index>0;index--){
    const previous=parts[index-1].split(" ");
    while(previous.length>1&&parts[index].length<previous.join(" ").length*.6){
      const next=previous.at(-1)+" "+parts[index];
      if(!fits(next))break;
      previous.pop();parts[index-1]=previous.join(" ");parts[index]=next;
    }
  }
  return parts;
}

const weight=text=>Math.max(1,text.replace(/\s/g,"").length);

export function timedCaptions(cues,paginate){
  const timed=[];
  for(const [start,end,text] of cues){
    if(end<=start||!text?.trim())continue;
    const parts=paginate(text);
    if(!parts.length)continue;
    const total=parts.reduce((sum,part)=>sum+weight(part),0);
    let used=0;
    for(const [index,part] of parts.entries()){
      const from=start+(end-start)*used/total;
      used+=weight(part);
      const to=index===parts.length-1?end:start+(end-start)*used/total;
      timed.push([from,to,part]);
    }
  }
  return timed;
}

export function captionAt(cues,time){return cues.find(([start,end])=>start<=time&&time<end)?.[2]||""}

export function captionAtProgress(parts,progress){
  if(!parts.length)return "";
  const total=parts.reduce((sum,part)=>sum+weight(part),0),target=Math.max(0,Math.min(1,progress))*total;
  let used=0;
  for(const part of parts){used+=weight(part);if(target<used)return part}
  return parts.at(-1);
}
