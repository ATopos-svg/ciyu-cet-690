'use strict';
window.ciyuMedia=(()=>{
  const index=window.CIYU_AUDIO_INDEX||{};
  const pending=new Map(), recent=new Map();
  const href=p=>new URL(p,document.baseURI).href;
  const pack=i=>href('media-pack/v110-'+i+'.bin');
  const downloads=assets=>[...new Set(assets.map(a=>index[a]?pack(index[a][0]):href(a)))];
  async function contents(url){
    if(recent.has(url)){const found=recent.get(url);recent.delete(url);recent.set(url,found);return found;}
    if(!pending.has(url)){
      const request=(async()=>{const res=await fetch(url);if(!res.ok)throw Error('Audio pack unavailable');const buffer=await res.arrayBuffer();recent.set(url,buffer);if(recent.size>4)recent.delete(recent.keys().next().value);return buffer;})();
      pending.set(url,request);
      request.then(()=>pending.delete(url),()=>pending.delete(url));
    }
    return pending.get(url);
  }
  async function clip(asset){
    const [group,offset,length]=index[asset], data=await contents(pack(group));
    if(offset+length>data.byteLength)throw Error('Incomplete audio pack');
    return URL.createObjectURL(new Blob([data.slice(offset,offset+length)],{type:'audio/mpeg'}));
  }
  return {has:asset=>!!index[asset],clip,downloads};
})();
