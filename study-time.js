'use strict';
// Count foreground study with a monotonic clock. Wall time only assigns dates.
window.studyTime=(()=>{
  const IDLE=120000,MAX_GAP=5000;
  let ready=false,foreground=true,active=false,lastMono=0,lastInput=0,lastWall=0,lastSaved=0;
  function eligible(){return foreground&&!document.hidden&&!document.getElementById('settings-dialog').open&&((currentView==='review'&&!!current())||currentView==='library')}
  function add(ms,end){let cursor=end-ms;while(cursor<end){const d=new Date(cursor),next=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getTime(),stop=Math.min(end,next),key=dayKey(d);state.studyMs[key]=Math.min(DAY,(state.studyMs[key]||0)+stop-cursor);cursor=stop;}}
  function tick(force=false){if(!ready)return;const mono=performance.now(),wall=Date.now(),gap=Math.max(0,mono-lastMono);if(active&&gap<=MAX_GAP){const counted=Math.max(0,Math.min(mono,lastInput+IDLE)-lastMono);if(counted)add(counted,Math.abs((wall-lastWall)-gap)<MAX_GAP?lastWall+counted:wall);}lastMono=mono;lastWall=wall;active=eligible()&&mono-lastInput<IDLE;if(force||mono-lastSaved>=5000){save();lastSaved=mono;}render();}
  function render(){if(!ready)return;const today=state.studyMs[dayKey()]||0;const time=document.getElementById('today-study-time');if(time)time.textContent=format(today);const status=document.getElementById('study-timer-status');if(status)status.textContent=active?'正在记录学习时长':'计时已暂停';}
  function format(ms){const sec=Math.floor(ms/1000),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h?`${h} 小时 ${m} 分`:`${m} 分 ${String(s).padStart(2,'0')} 秒`;}
  function activity(event){if(!ready||!event.isTrusted)return;tick();lastInput=performance.now();active=eligible();}
  function init(){if(ready)return;state.studyMs=valid(state.studyMs)?state.studyMs:{};ready=true;lastMono=lastInput=lastSaved=performance.now();lastWall=Date.now();active=eligible();['pointerdown','keydown','scroll','input'].forEach(type=>document.addEventListener(type,activity,{capture:true,passive:true}));document.addEventListener('visibilitychange',()=>{tick(true);active=eligible()&&performance.now()-lastInput<IDLE;});window.addEventListener('pagehide',()=>pause());window.addEventListener('pageshow',()=>resume());setInterval(()=>tick(),1000);render();}
  function pause(){tick(true);foreground=false;active=false;}
  function resume(){if(!ready)return;foreground=true;lastMono=lastInput=performance.now();lastWall=Date.now();active=eligible();render();}
  function sync(){tick();active=ready&&eligible()&&performance.now()-lastInput<IDLE;}
  function valid(values){return values&&typeof values==='object'&&!Array.isArray(values)&&Object.entries(values).every(([key,ms])=>/^\d{4}-\d{2}-\d{2}$/.test(key)&&Number.isFinite(ms)&&ms>=0&&ms<=86400000);}
  function merge(values){tick(true);for(const [key,ms]of Object.entries(values||{}))state.studyMs[key]=Math.max(state.studyMs[key]||0,ms);save();render();}
  return{init,sync,pause,resume,flush:()=>tick(true),format,valid,merge,render};
})();
