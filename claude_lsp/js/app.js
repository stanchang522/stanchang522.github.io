/* LSP v2 示範：核心（狀態、月份、路由、側欄、共用工具、勞基法檢查） */
(function(){
const D = window.LSP_DATA;
const KEY = 'lsp_v2_demo_state';
const VER = 5;
const DEFAULT_TASKS = [
  {name:'管理',     color:'#c6dcff'},
  {name:'值班',     color:'#ffd6a5'},
  {name:'收銀',     color:'#ffe999'},
  {name:'乾貨人力', color:'#adf0c7'},
  {name:'生鮮擔當', color:'#f4a6a6'},
  {name:'生鮮人力', color:'#ffd6d6'},
  {name:'熟食擔當', color:'#c9a7f0'},
  {name:'熟食人力', color:'#e9dcfb'},
  {name:'休息',     color:'#e2e2e2'}
];
const SKILLS = DEFAULT_TASKS.filter(t=>t.name!=='休息').map(t=>t.name);
// 示範的三個月：11 月過去、12 月本月、1 月下個月（準備預排）
const MONTHS = [
  {key:'2026-11', y:2026, m:11, days:30, fd:0, kind:'past', tag:'過去'},
  {key:'2026-12', y:2026, m:12, days:31, fd:2, kind:'now',  tag:'本月'},
  {key:'2027-01', y:2027, m:1,  days:31, fd:5, kind:'next', tag:'下個月'},
];
const NEXT = MONTHS[2], NOW = MONTHS[1];
const mon = k => MONTHS.find(x=>x.key===k);
// 半小時需求格：05:00～24:00，共 38 格
const SLOT0 = 5*60, NSLOT = 38;

/* ---------- 由 11 月實際班表推出其他月份（星期對齊） ---------- */
function mapFromNov(mm){ // 11/2（一）～11/29（日）剛好 4 週
  const off=(mm.fd-1+7)%7, out={};
  D.employees.forEach(e=>{
    const row=[...Array(mm.days)].map((_,i)=>e.sched[1+((i+off)%28)]);
    let run=0; row.forEach((c,i)=>{ if(D.shifts[c]){ run++; if(run===7){ row[i]='休'; run=0; } } else run=0; }); // 接回第 1 週時避免連上 7 天
    out[e.id]=row; });
  return out;
}
function defaultReq(){
  const r={}; SKILLS.forEach(s=>r[s]=Array(NSLOT).fill(0));
  const set=(s,a,b,n)=>{ for(let i=0;i<NSLOT;i++){ const t=SLOT0+i*30; if(t>=tm(a)&&t<tm(b)) r[s][i]=n; } };
  set('值班','05:30','23:00',1);
  set('管理','11:00','20:00',1);
  set('收銀','08:00','13:30',2); set('收銀','13:30','23:00',3); set('收銀','17:00','20:00',4);
  set('乾貨人力','05:30','08:00',2); set('乾貨人力','08:00','22:00',1);
  set('生鮮擔當','06:30','15:30',1);
  set('生鮮人力','08:00','18:00',2);
  return r;
}
function leaveReqs(){ // 每人 2 天劃休（從 1 月推估班表的休假日挑 2 天）
  const base=mapFromNov(NEXT), out={};
  D.employees.forEach((e,i)=>{ const off=base[e.id].map((c,j)=>c==='休'?j+1:0).filter(Boolean);
    const a=off[i%off.length], b=off[(i+2)%off.length]; out[e.id]=[...new Set([a,b])].sort((x,y)=>x-y); });
  return out;
}
function freshState(){
  const nov={}; D.employees.forEach(e=>nov[e.id]=e.sched.slice());
  const skills = {}; D.employees.forEach(e=>skills[e.id]=e.skills.slice());
  const shifts = {}; Object.entries(D.shifts).forEach(([c,s])=>shifts[c]={...s});
  const mk=(sched,status)=>({generated:!!sched, status, sched:sched||{}, changed:{}, dayPlans:{}});
  return {
    v:VER, role:'store', cur:NOW.key,
    months:{ [MONTHS[0].key]:mk(nov,'sent'), [NOW.key]:mk(mapFromNov(NOW),'sent'), [NEXT.key]:mk(null,'unsaved') },
    target: Math.round(D.store.budget*0.95),
    leave:{ phase:'setting', days:2, noLeave:[], reqs:leaveReqs(), returned:{}, special:{} },
    tasks: DEFAULT_TASKS.map(t=>({...t})),
    skills, shifts, shiftNames:{},
    staffing: D.staffing.map(s=>({...s})), staffMode:'table', req: defaultReq(),
    storeInfo:{open:D.store.open, close:D.store.close, bizStart:D.store.bizStart, bizEnd:D.store.bizEnd,
      peak1:'11:00~13:00', peak2:'17:00~19:30', dc1:'05:30', dc2:'13:00', fresh:'06:00'},
    log:[]
  };
}
let S;
function load(){
  try{ const s = JSON.parse(localStorage.getItem(KEY)||'null'); if(s && s.v===VER){ S=s; return; } }catch(e){}
  S = freshState();
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
function reset(){ try{ localStorage.removeItem(KEY);}catch(e){} S=freshState(); go(location.hash||'#/month', true); }

/* ---------- 時間 ---------- */
function tm(s){ const [h,m]=String(s).split(':').map(Number); return h*60+(m||0); }
const fmt = m => { m=((m%1440)+1440)%1440; return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); };
const DOW = ['日','一','二','三','四','五','六'];
function dow(d, mm){ mm=mm||curMon(); return (mm.fd + d - 1) % 7; }
function today(){ return S.leave.phase==='setting' ? {mm:NOW,d:10} : {mm:NOW,d:26}; }   // 示範的「今天」
function todayStr(){ const t=today(); return `${t.mm.y}/${t.mm.m}/${t.d}（${DOW[dow(t.d,t.mm)]}）`; }
function curMon(){ return mon(S.cur)||NOW; }
function curM(){ return S.months[curMon().key]; }
const prevM = mm => mm.m===1?12:mm.m-1;

/* ---------- 班別 ---------- */
function shiftOf(code){ return code && S.shifts[code] || null; }
function span(code){ const s=shiftOf(code); if(!s) return 0; let a=tm(s.start), b=tm(s.end); if(b<=a) b+=1440; return (b-a)/60; }
function breakH(sp){ return sp<=4?0:(sp<7?0.5:1); }
function netH(code){ const sp=span(code); return sp? sp-breakH(sp):0; }
const isWork = c => !!shiftOf(c);
const emp = id => D.employees.find(e=>e.id===id);

/* ---------- 勞基法檢查（指定月份） ---------- */
function laborCheck(mk, ids){
  const mm=mon(mk), M=S.months[mk], out=[], days=mm.days, m=mm.m;
  (ids||D.employees.map(e=>e.id)).forEach(id=>{
    const e=emp(id), row=M.sched[id]; if(!row) return;
    let run=0;
    for(let d=1; d<=days; d++){
      if(isWork(row[d-1])){ run++; if(run===7) out.push({id,day:d,kind:'六休一',msg:`${e.name} 連續上班 7 天（到 ${m}/${d}），超過六休一`}); }
      else run=0;
    }
    if(e.ft){
      let ws=1;
      for(let d=1; d<=days; d++){
        if(dow(d,mm)===6 || d===days){
          if(d-ws+1>=7 && !row.slice(ws-1,d).includes('例')) out.push({id,day:d,kind:'例假',msg:`${e.name} ${m}/${ws}～${m}/${d} 這週沒有例假`});
          ws=d+1;
        }
      }
    }
    for(let d=1; d<days; d++){
      const a=shiftOf(row[d-1]), b=shiftOf(row[d]);
      if(a&&b){ let endA=tm(a.end); if(endA<=tm(a.start)) endA+=1440; const gap=(tm(b.start)+1440-endA)/60;
        if(gap<11) out.push({id,day:d+1,kind:'間隔',msg:`${e.name} ${m}/${d} 下班到 ${m}/${d+1} 上班只隔 ${gap} 小時（要 11 小時）`}); }
    }
    let ws=1, h=0;
    for(let d=1; d<=days; d++){
      h+=netH(row[d-1]);
      if(dow(d,mm)===6 || d===days){ const lim=e.ft?48:40;
        if(h>lim) out.push({id,day:d,kind:'週工時',msg:`${e.name} ${m}/${ws}～${m}/${d} 週工時 ${h} 小時，超過 ${lim}`});
        ws=d+1; h=0; }
    }
  });
  return out;
}
function monthHours(id, mk){ const r=S.months[mk||S.cur].sched[id]; return r? r.reduce((a,c)=>a+netH(c),0):0; }
function totalHours(mk){ return D.employees.reduce((a,e)=>a+monthHours(e.id,mk),0); }

/* ---------- 異動紀錄（用示範日期） ---------- */
function log(type,what,before,after){
  const t=today(), now=new Date();
  S.log.unshift({t:`${t.mm.y}/${t.mm.m}/${t.d} ${fmt(now.getHours()*60+now.getMinutes())}`,type,what,before:before||'',after:after||'',who: S.role==='hq'?'總部主管':'店長'});
  S.log = S.log.slice(0,300); save();
}

/* ---------- ui ---------- */
const $ = (sel,root=document)=>root.querySelector(sel);
const h = (html)=>{ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; };
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function modal(html, onMount){
  const m=h(`<div class="mask"><div class="modal">${html}</div></div>`);
  m.addEventListener('click',ev=>{ if(ev.target===m) close(); });
  function close(){ m.remove(); }
  $('#layer').appendChild(m); onMount && onMount(m.querySelector('.modal'), close); return close;
}
let toastTimer;
function toast(title, body, kind){
  const old=$('.toast'); old&&old.remove();
  const t=h(`<div class="toast ${kind||''}"><button class="btn sm x">知道了</button><h4>${title}</h4><div>${body}</div></div>`);
  t.querySelector('.x').onclick=()=>t.remove();
  document.body.appendChild(t);
  clearTimeout(toastTimer); if(kind==='info') toastTimer=setTimeout(()=>t.remove(),4500);
}
function taskColor(name){ const t=S.tasks.find(x=>x.name===name); return t?t.color:'#eeeeee'; }
// 月份切換列
function monthBar(onPick){
  return `<div class="mbar">${MONTHS.map(x=>{ const M=S.months[x.key];
    const st = !M.generated?'還沒產生':(M.status==='sent'?'已送出':'草稿');
    return `<button data-mk="${x.key}" class="${x.key===S.cur?'on':''}"><b>${x.y!==NOW.y?x.y+' 年 ':''}${x.m} 月</b><small>${x.tag}・${st}</small></button>`;}).join('')}</div>`;
}
function bindMonthBar(root, hash){
  root.querySelectorAll('.mbar [data-mk]').forEach(b=>b.onclick=()=>{ S.cur=b.dataset.mk; save(); go(hash||location.hash,true); });
}

/* ---------- 側欄與路由 ---------- */
const STORE_NAV = [
  ['#/month','📅','智能排班',['#/schedule','#/run','#/month','#/day']],
  ['#/leave','🌴','預先排休'],
  'gap',
  ['#/skills','🛠️','員工技能'],
  ['#/shifts','🕘','員工班別'],
  ['#/store','🏪','門市基本資料'],
  'gap',
  ['#/attendance','✅','出勤檢核'],
  ['#/changes','📝','異動紀錄'],
];
const HQ_NAV = [
  ['#/hq/report','📊','班別狀況報表'],
  ['#/hq/tasks','🎨','工作項目與顏色'],
  'gap',
  ['#/hq/stores','🏬','門市新增'],
  ['#/hq/shifts','🕘','共用班別'],
  ['#/hq/special','🗓️','特殊日設定'],
];
function renderSide(route){
  const nav = S.role==='hq'?HQ_NAV:STORE_NAV;
  const items = nav.map(n=>{
    if(n==='gap') return '<div class="gap"></div>';
    const on = (n[3]||[n[0]]).some(r=>route.startsWith(r));
    return `<a href="${n[0]}" class="${on?'on':''}"><span class="em">${n[1]}</span>${n[2]}</a>`;
  }).join('');
  $('#side').innerHTML = `
    <h1>${S.role==='hq'?'總部':'xx門店'} 排班系統</h1>
    <div class="store">${S.role==='hq'?'總部主管':D.store.name+'店　店長'}</div>
    <div class="today">今天（示範）<br><b>${todayStr()}</b></div>
    <div class="role"><button data-r="store" class="${S.role==='store'?'on':''}">店長</button><button data-r="hq" class="${S.role==='hq'?'on':''}">總部</button></div>
    <nav class="nav">${items}</nav>
    <div class="note-below" style="font-size:14px">示範版：資料只存在這台電腦的瀏覽器。<br><button class="btn sm" id="resetBtn" style="margin-top:8px">重設示範資料</button></div>`;
  $('#side').querySelectorAll('.role button').forEach(b=>b.onclick=()=>{
    S.role=b.dataset.r; save(); location.hash = S.role==='hq'?'#/hq/report':'#/month';
  });
  $('#resetBtn').onclick=()=>{ if(confirm('要把示範資料全部還原嗎？')) reset(); };
}
const routes = {};
function route(path, fn){ routes[path]=fn; }
let lastHash='';
// keep=true：同一頁重畫，保留捲動位置（點設定不會跳回上面）
function go(hash, keep){
  let r = (hash||'').replace(/^#/,'') || '/month';
  if(S.role==='hq' && !r.startsWith('/hq')) { S.role='store'; save(); }
  if(S.role==='store' && r.startsWith('/hq')) { S.role='hq'; save(); }
  const base='/'+r.split('/').filter(Boolean).slice(0, r.startsWith('/hq')?2:1).join('/');
  const same = keep || ('#'+r)===lastHash;
  const sx=window.scrollX, sy=window.scrollY;
  const wraps=[...document.querySelectorAll('#main .tbl-wrap')].map(w=>[w.scrollLeft,w.scrollTop]);
  renderSide('#'+r);
  const fn = routes[base] || routes['/month'];
  const main=$('#main'); main.innerHTML='';
  fn(main, r);
  lastHash='#'+r;
  if(same){ window.scrollTo(sx,sy); document.querySelectorAll('#main .tbl-wrap').forEach((w,i)=>{ if(wraps[i]){ w.scrollLeft=wraps[i][0]; w.scrollTop=wraps[i][1]; } }); }
  else window.scrollTo(0,0);
}
const redraw = ()=>go(location.hash, true);
window.addEventListener('hashchange',()=>go(location.hash));

window.LSP = {D, get S(){return S;}, save, log, tm, fmt, span, netH, breakH, isWork, shiftOf, dow, DOW, emp,
  laborCheck, monthHours, totalHours, $, h, esc, modal, toast, taskColor, route, go, redraw, SKILLS,
  MONTHS, NEXT, NOW, mon, curMon, curM, prevM, today, todayStr, monthBar, bindMonthBar, mapFromNov, SLOT0, NSLOT,
  start(){ load(); go(location.hash||'#/month'); }};
})();
