/* LSP v2 示範：日作業表（拖拉指派工作） */
(function(){
const L=window.LSP, D=L.D, {esc,modal,toast}=L;
let M, DAYS, MM, MS;   // 目前看的月份（每次進頁面重設）
const T0=5*60, T1=24*60, PX=1.2, SNAP=15, DEF=60;   // 05:00～24:00，每分鐘 1.2px
const snap=m=>Math.round(m/SNAP)*SNAP;

/* ---------- 模型：每人每天 {start,len,segs:[{t,d}]}，t=null 代表空白 ---------- */
// 依技能順位分工作：① 的工作在他上班時段還缺人就做 ①，① 已經夠了才看 ②、③…
function slotsOf(start,len){ const out=[]; for(let i=0;i<L.NSLOT;i++){ const t=L.SLOT0+i*30; if(t>=start && t<start+len) out.push(i); } return out; }
function mainTask(e, start, len, cov){
  const sk=(L.S.skills[e.id]||[]).filter(t=>L.S.tasks.some(x=>x.name===t));
  if(!sk.length){ // 還沒設定技能：先用歷史資料的技能顯示，但不算進「人夠不夠」，免得擠掉有設定技能的人
    const h=(e.skills||[]).filter(t=>L.S.tasks.some(x=>x.name===t)); return h[0]||'乾貨人力'; }
  const sl=slotsOf(start,len);
  const t = sk.find(t=>sl.some(i=>(cov[t]?.[i]||0) < (L.S.req[t]?.[i]||0))) || sk[0];
  if(cov){ cov[t]=cov[t]||Array(L.NSLOT).fill(0); sl.forEach(i=>cov[t][i]++); }
  return t;
}
function defaultRow(e, code, cov){
  const s=L.shiftOf(code); let a=L.tm(s.start), b=L.tm(s.end); if(b<=a) b+=1440;
  const len=b-a, sp=len/60, br=L.breakH(sp)*60;
  const t=mainTask(e, a, len, cov||{});
  let segs;
  if(!br) segs=[{t,d:len}];
  else { const at = sp>=7 ? Math.floor(sp/2)*60 : 180; segs=[{t,d:at},{t:'休息',d:br},{t,d:len-at-br}]; }
  return {start:a, len, code, segs};
}
function plan(d){
  if(MS.planV!==2){ MS.dayPlans={}; MS.planV=2; }   // 分工規則改過：舊的自動分工重算
  let p=MS.dayPlans[d];
  const working=D.employees.filter(e=>L.isWork(MS.sched[e.id][d-1]));
  if(!p){
    p={}; const cov={};
    // 技能少的人先分（他們沒得選），再照上班時間
    const order=[...working].sort((x,y)=>(L.S.skills[x.id]||[]).length-(L.S.skills[y.id]||[]).length || L.tm(L.shiftOf(MS.sched[x.id][d-1]).start)-L.tm(L.shiftOf(MS.sched[y.id][d-1]).start));
    order.forEach(e=>p[e.id]=defaultRow(e,MS.sched[e.id][d-1],cov)); MS.dayPlans[d]=p; L.save();
  }
  // 月班表改過班別 → 該人重新產生
  working.forEach(e=>{ if(!p[e.id] || p[e.id].code!==MS.sched[e.id][d-1]) p[e.id]=defaultRow(e,MS.sched[e.id][d-1]); });
  Object.keys(p).forEach(id=>{ if(!working.find(e=>e.id===id)) delete p[id]; });
  return p;
}
function clean(row){
  const out=[];
  row.segs.forEach(s=>{ if(s.d<=0) return; const last=out[out.length-1];
    if(last && last.t===s.t) last.d+=s.d; else out.push({...s}); });
  while(out.length && out[out.length-1].t===null) out.pop();
  row.segs=out;
}
function trim(row){ // 超過上班時間的部分移除，回傳被移除的工作名稱
  let acc=0; const keep=[]; const cut=new Set();
  row.segs.forEach(s=>{
    if(acc>=row.len){ if(s.t) cut.add(s.t); return; }
    if(acc+s.d>row.len){ if(s.t) cut.add(s.t); keep.push({...s,d:row.len-acc}); acc=row.len; return; }
    keep.push(s); acc+=s.d;
  });
  row.segs=keep; return [...cut];
}
function splitAt(row, off){ // 在 off 分鐘處切開，回傳切點之後第一段的 index
  let acc=0;
  for(let i=0;i<row.segs.length;i++){
    const s=row.segs[i];
    if(off===acc) return i;
    if(off<acc+s.d){ row.segs.splice(i,1,{t:s.t,d:off-acc},{t:s.t,d:acc+s.d-off}); return i+1; }
    acc+=s.d;
  }
  if(off>acc) row.segs.push({t:null,d:off-acc});
  return row.segs.length;
}
function insert(row, off, t, dur){
  const i=splitAt(row, off);
  row.segs.splice(i,0,{t,d:dur});
  let need=dur;                       // 後面的空白先吸收，不夠才把後面的工作往後擠
  for(let j=i+1;j<row.segs.length && need>0;j++){ const s=row.segs[j]; if(s.t===null){ const k=Math.min(need,s.d); s.d-=k; need-=k; } }
  const cut=trim(row); clean(row); return cut;
}
function removeAt(row, idx){ row.segs[idx]={t:null,d:row.segs[idx].d}; clean(row); }
function resize(row, idx, nd){
  const s=row.segs[idx], delta=nd-s.d; if(!delta) return [];
  s.d=nd;
  if(delta<0){ row.segs.splice(idx+1,0,{t:null,d:-delta}); clean(row); return []; }
  let need=delta;
  for(let j=idx+1;j<row.segs.length && need>0;j++){ const g=row.segs[j]; if(g.t===null){ const k=Math.min(need,g.d); g.d-=k; need-=k; } }
  const cut=trim(row); clean(row); return cut;
}
function taskAt(row, minuteAbs){ let acc=row.start; for(const s of row.segs){ if(minuteAbs>=acc && minuteAbs<acc+s.d) return s.t; acc+=s.d; } return null; }

/* ---------- 畫面 ---------- */
L.route('/day',(main, r)=>{
  const S=L.S;
  MM=L.curMon(); M=MM.m; DAYS=MM.days; MS=L.curM();
  if(!MS.generated){ main.innerHTML=`<div class="top"><h2>${L.modeTitle()}</h2></div>${L.monthBar()}<div class="empty-page">${M} 月班表還沒產生。<br><br><a class="btn pri" href="#/schedule">去準備跑班表</a></div>`; L.bindMonthBar(main,'#/day'); return; }
  const t0=L.today(), defD = MM.key===t0.mm.key ? t0.d : 1;
  let d=Number((r.split('/')[2])||sessionStorage.getItem('lsp_day_'+MM.key)||defD); if(!(d>=1&&d<=DAYS)) d=defD;
  sessionStorage.setItem('lsp_day_'+MM.key,d);
  const sent=MS.status==='sent' || MM.kind==='past';
  const p=plan(d);
  const allIds=Object.keys(p);
  const ff=L.empFilterFn(), ids=L.sortEmps(allIds.map(id=>L.emp(id)).filter(ff),'group').map(e=>e.id);   // 跟月班表同樣的順序
  const W=(T1-T0)*PX;
  const hours=[]; for(let m=T0;m<T1;m+=60) hours.push(m);
  const dw=L.dow(d);
  main.innerHTML=L.schedHead('d',{
    line1:`${L.statusPill(MS,MM)}<span class="lbl" style="margin-left:10px">日期</span><button class="btn sm" id="prev" ${d<=1?'disabled':''}>◀</button><select class="sel-big" id="pickDay" style="font-size:19px;font-weight:700">${[...Array(DAYS)].map((_,i)=>`<option value="${i+1}" ${i+1===d?'selected':''}>${M}/${i+1}（${L.DOW[L.dow(i+1)]}）</option>`).join('')}</select><button class="btn sm" id="next" ${d>=DAYS?'disabled':''}>▶</button><span class="muted">${ids.length===allIds.length?`${ids.length} 人上班`:`顯示 ${ids.length}／全店 ${allIds.length} 人上班`}</span>`,
    line2:`<div class="sh-line">${L.empFilterBar()}</div>`,
    right:`<button class="btn" id="redo" ${sent?'disabled':''}>這天重新分配</button>`
  })+`
  ${sent?`<div class="banner blue">${MM.kind==='past'?'這是過去的月份，只能看。':'月班表已送出，日作業表是唯讀。要改請到月班表按「✎ 編輯」。'}</div>`:`
  <div class="card" id="palette" style="padding:14px 16px;position:sticky;top:0;z-index:20">
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <b style="font-size:18px">把工作拖到下面的格子：</b>
      ${S.tasks.map(t=>`<div class="pal" data-t="${esc(t.name)}" style="background:${t.color};padding:10px 18px;border-radius:10px;border:1.5px solid rgba(0,0,0,.3);font-weight:700;cursor:grab;user-select:none;touch-action:none">${esc(t.name)}</div>`).join('')}
      <div class="spacer"></div>
      <div id="trash" style="padding:10px 18px;border:2px dashed var(--bad);border-radius:10px;color:var(--bad);font-weight:700">🗑 拖到這裡刪除</div>
    </div>
    <div class="muted" style="font-size:15px;margin-top:6px">放進去會從那個時間開始、先放 1 小時，後面的工作自動往後擠；超過下班時間的部分會被移除。拉方塊右邊可以調長短，點一下方塊可以改工作或刪除。</div>
  </div>`}
  <div class="tbl-wrap" style="max-height:none">
   <div id="grid" style="position:relative;width:${W+190}px">
    <div style="display:flex;position:sticky;top:0;z-index:5;background:#f0f3f8;border-bottom:1.5px solid var(--line)">
      <div style="width:190px;flex:none;padding:8px 10px;font-weight:700;position:sticky;left:0;background:#f0f3f8">姓名／班別</div>
      <div style="position:relative;width:${W}px;height:40px">${hours.map(m=>`<div style="position:absolute;left:${(m-T0)*PX}px;top:8px;font-size:15px;font-weight:700;transform:translateX(-50%)">${L.fmt(m).slice(0,2)}</div>`).join('')}</div>
    </div>
    ${ids.map(id=>{ const e=L.emp(id), row=p[id]; const s=L.shiftOf(row.code);
      let acc=row.start;
      const blocks=row.segs.map((g,i)=>{ const left=(acc-T0)*PX, w=g.d*PX; acc+=g.d; if(g.t===null) return '';
        const known=S.tasks.find(t=>t.name===g.t);
        return `<div class="blk" data-id="${id}" data-i="${i}" title="${esc(g.t)} ${L.fmt(acc-g.d)}～${L.fmt(acc)}" style="position:absolute;left:${left}px;top:6px;width:${w}px;height:44px;background:${known?known.color:'#ddd'};border:1.5px solid rgba(0,0,0,.35);border-radius:8px;overflow:hidden;white-space:nowrap;font-size:${w<50?12:15}px;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:${sent?'default':'grab'};user-select:none;touch-action:none">${esc(known?g.t:g.t+'(已刪除)')}${sent?'':'<div class="rz" style="position:absolute;right:0;top:0;bottom:0;width:10px;cursor:ew-resize;background:rgba(0,0,0,.12)"></div>'}</div>`;}).join('');
      const sx=(row.start-T0)*PX, sw=row.len*PX;
      return `<div style="display:flex;border-bottom:1px solid #e3e6ec">
        <div style="width:190px;flex:none;padding:6px 10px;position:sticky;left:0;background:#fff;z-index:2;border-right:1px solid var(--line)"><b>${esc(e.name)}</b> <small class="muted">${e.group}</small><br><small><b>${row.code}</b> ${s.start}～${s.end} <span class="muted">${L.hrsTag(row.code)}</span></small>${prioTag(id,row)}</div>
        <div class="trow" data-id="${id}" style="position:relative;width:${W}px;height:56px;background:#eceef2">
          <div style="position:absolute;left:${sx}px;width:${sw}px;top:0;bottom:0;background:#fff;background-image:repeating-linear-gradient(90deg,transparent 0,transparent ${60*PX-1}px,#e3e6ec ${60*PX-1}px,#e3e6ec ${60*PX}px);background-position:${-((row.start-T0)%60)*PX}px 0"></div>
          ${blocks}
        </div></div>`; }).join('')}
    ${ids.length?'':'<div class="muted" style="padding:16px">這一天篩選的人沒有上班。</div>'}
    ${coverage(p,ids,d,W)}
   </div>
  </div>
  <ul class="note-below"><li>「看哪些人」選組別時，下面「人力」只列這組的工作、只算這組的人（跟月班表統計一樣）；選正職／兼職時只算數字，不跟最少人力比紅字。</li><li>下面「人力」列是每個小時排到幾個人／最少要幾人（門市基本資料的「依時段」最少人力），不夠會變紅。</li><li>工作項目和顏色由總部設定（總部 →「🎨 工作項目與顏色」）。</li></ul>`;
  L.bindTabs(main); L.bindMonthBar(main,'#/day'); L.bindEmpFilter(main);
  main.querySelector('#prev').onclick=()=>location.hash='#/day/'+(d-1);
  main.querySelector('#next').onclick=()=>location.hash='#/day/'+(d+1);
  main.querySelector('#pickDay').onchange=ev=>location.hash='#/day/'+ev.target.value;
  if(sent) return;
  main.querySelector('#redo').onclick=()=>{ if(!confirm(`把 ${M}/${d} 的工作全部重新分配？手動拖過的會不見。`)) return; delete MS.dayPlans[d]; L.save(); L.redraw(); };
  bindDrag(main, d, p);
});

/* 這個人今天做的是他的第幾順位技能（不是 ① 就標出來，說明為什麼） */
function prioTag(id,row){ const sk=L.S.skills[id]||[]; if(!sk.length) return '<br><small class="muted">還沒設定技能</small>';
  const g=row.segs.find(x=>x.t&&x.t!=='休息'); if(!g) return ''; const k=sk.indexOf(g.t);
  if(k===0) return ''; if(k<0) return `<br><small class="bad">不是他的技能</small>`;
  return `<br><small style="color:#b54708">① ${sk[0]} 人已夠 → 做 ${'①②③④⑤⑥⑦⑧'[k]}</small>`; }
function needAt(task, minute){ const r=L.S.req[task]; if(!r) return null; const i=Math.floor((minute-L.SLOT0)/30); return (i>=0&&i<L.NSLOT)?r[i]:0; }
function coverage(p, ids, d, W){
  const ef=L.empF(), grp=ef.startsWith('g:'), cmp=ef==='all'||grp;   // 正職／兼職只看一部分人，不跟最少人力比
  let tasks=L.S.tasks.filter(t=>t.name!=='休息').map(t=>t.name);
  if(grp){ const keep=(L.STAT_BY_GROUP[ef.slice(2)]||tasks).slice();
    ids.forEach(id=>(p[id].segs||[]).forEach(g=>{ if(g.t&&g.t!=='休息'&&!keep.includes(g.t)) keep.push(g.t); }));   // 組裡有人做別組工作，也列出來
    tasks=tasks.filter(t=>keep.includes(t)); }
  const hrs=[]; for(let m=T0;m<T1;m+=60) hrs.push(m);
  const rows=tasks.map(t=>{
    const cnt=hrs.map(m=>ids.filter(id=>taskAt(p[id],m+30)===t).length);
    if(!cnt.some(Boolean) && !(cmp&&(L.S.req[t]||[]).some(Boolean))) return '';
    const cells=hrs.map((m,i)=>{
      const req=cmp?needAt(t, m+30):0;
      const low = !!req && cnt[i]<req;
      return `<div style="position:absolute;left:${(m-T0)*PX}px;width:${60*PX}px;top:0;bottom:0;display:flex;align-items:center;justify-content:center;font-size:15px;${low?'background:#ffe3e3;color:#bd0a0a;font-weight:700':''}">${cnt[i]||''}${req?`<small class="muted">/${req}</small>`:''}</div>`;}).join('');
    return `<div style="display:flex;border-bottom:1px solid #e3e6ec;background:#f7f8fb"><div style="width:190px;flex:none;padding:4px 10px;position:sticky;left:0;background:#f7f8fb;z-index:2;border-right:1px solid var(--line);font-size:15px"><i style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${L.taskColor(t)};border:1px solid #999;vertical-align:-2px"></i> ${t}</div><div style="position:relative;width:${W}px;height:34px">${cells}</div></div>`;
  }).join('');
  return `<div style="padding:8px 10px;font-weight:700;background:#f0f3f8;border-top:2px solid var(--line);position:sticky;left:0;width:190px">人力（每小時・${ef==='all'?'全店':ef==='ft'?'正職':ef==='pt'?'兼職':ef.slice(2)+'組'}）</div>${rows}`;
}

/* ---------- 拖拉 ---------- */
function bindDrag(main, d, p){
  const S=L.S;
  let drag=null, ghost=null, marker=null;
  const after=(cut,msg)=>{ L.save(); L.go('#/day/'+d,true); if(cut&&cut.length) toast('超過下班時間，已移除',`「${cut.join('、')}」超過下班時間的部分被移除了。`); else if(msg) toast(msg[0],msg[1],'info'); };
  function skillWarn(id,t){ if(t==='休息') return null; const sk=S.skills[id]||[]; if(!sk.includes(t)) return ['提醒',`${L.emp(id).name} 沒有「${t}」技能（還是放進去了，可到員工技能勾選）。`]; return null; }
  function start(ev, info){
    ev.preventDefault();
    drag={...info, x0:ev.clientX, y0:ev.clientY, moved:false};
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up,{once:true});
  }
  function mkGhost(){
    ghost=document.createElement('div');
    Object.assign(ghost.style,{position:'fixed',zIndex:100,height:'44px',width:(drag.dur*PX)+'px',background:L.taskColor(drag.t),border:'2px solid #1a1a1a',borderRadius:'8px',opacity:.85,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'15px'});
    ghost.textContent=drag.t; document.body.appendChild(ghost);
    marker=document.createElement('div'); Object.assign(marker.style,{position:'absolute',top:0,bottom:0,width:'4px',background:'#1f5fbf',zIndex:4,pointerEvents:'none'});
  }
  function target(ev, dr){
    dr=dr||drag;
    // 用每一列的位置判斷（字體放大時 elementFromPoint 會不準）
    const inside=el=>{ if(!el) return false; const r=el.getBoundingClientRect(); return ev.clientX>=r.left&&ev.clientX<=r.right&&ev.clientY>=r.top&&ev.clientY<=r.bottom; };
    if(inside(document.getElementById('trash'))) return {trash:true};
    const tr=[...document.querySelectorAll('#main .trow')].find(inside); if(!tr || inside(tr.previousElementSibling) || inside(document.getElementById('palette'))) return null;   // 被固定的姓名欄、工作列擋住就不算
    const row=p[tr.dataset.id]; const rect=tr.getBoundingClientRect();
    const abs=T0+(ev.clientX-rect.left-(dr.grab||0))/(PX*L.zoomF());
    const off=snap(abs-row.start);
    return {tr,id:tr.dataset.id,row,off};
  }
  function move(ev){
    if(!drag) return;
    if(!drag.moved){ if(Math.abs(ev.clientX-drag.x0)+Math.abs(ev.clientY-drag.y0)<5) return; drag.moved=true; mkGhost(); }
    const zf=L.zoomF(); ghost.style.left=(ev.clientX-(drag.grab||0))/zf+'px'; ghost.style.top=(ev.clientY/zf-22)+'px';
    if(drag.kind==='resize'){
      const row=p[drag.id]; const nd=Math.max(SNAP,snap(drag.d0+(ev.clientX-drag.x0)/(PX*L.zoomF())));
      ghost.style.display='none'; drag.el.style.width=(nd*PX)+'px'; drag.nd=nd; return;
    }
    const tg=target(ev); marker.remove();
    if(tg && tg.tr){ const ok=tg.off>=0 && tg.off<tg.row.len; marker.style.left=((tg.row.start+Math.max(0,tg.off)-T0)*PX)+'px'; marker.style.background=ok?'#1f5fbf':'#bd0a0a'; tg.tr.appendChild(marker); }
    const tr=document.getElementById('trash'); if(tr) tr.style.background = tg&&tg.trash?'#ffe3e3':'';
  }
  function up(ev){
    window.removeEventListener('pointermove',move);
    const dr=drag; drag=null; ghost&&ghost.remove(); marker&&marker.remove(); ghost=null;
    if(!dr) return;
    if(!dr.moved){ if(dr.kind==='move') editBlock(dr.id, dr.i); return; }
    if(dr.kind==='resize'){
      const row=p[dr.id]; const cut=resize(row, dr.i, dr.nd||dr.d0);
      L.log('日作業表',`${M}/${d} ${L.emp(dr.id).name} 調整「${dr.t}」長度`,`${dr.d0} 分`,`${dr.nd} 分`); return after(cut);
    }
    const tg=target(ev, dr);
    if(!tg){ if(dr.kind==='move') L.go('#/day/'+d,true); return; }
    if(tg.trash){ if(dr.kind==='move'){ removeAt(p[dr.id],dr.i); L.log('日作業表',`${M}/${d} ${L.emp(dr.id).name} 刪除「${dr.t}」`); after(); } return; }
    if(tg.off<0 || tg.off>=tg.row.len){ toast('放不進去','這個時間不在他的上班時間內。'); return; }
    if(dr.kind==='move'){ removeAt(p[dr.id],dr.i); }
    const cut=insert(tg.row, tg.off, dr.t, dr.dur);
    L.log('日作業表',`${M}/${d} ${L.emp(tg.id).name} 放入「${dr.t}」`,'',`${L.fmt(tg.row.start+tg.off)} 起 ${dr.dur} 分`);
    after(cut, skillWarn(tg.id, dr.t));
  }
  main.querySelectorAll('.pal').forEach(el=>el.addEventListener('pointerdown',ev=>start(ev,{kind:'new',t:el.dataset.t,dur:DEF,grab:10})));
  main.querySelectorAll('.blk').forEach(el=>el.addEventListener('pointerdown',ev=>{
    const id=el.dataset.id, i=Number(el.dataset.i), g=p[id].segs[i];
    if(ev.target.classList.contains('rz')) return start(ev,{kind:'resize',id,i,t:g.t,d0:g.d,el});
    const rect=el.getBoundingClientRect();
    start(ev,{kind:'move',id,i,t:g.t,dur:g.d,grab:ev.clientX-rect.left});
  }));
  function editBlock(id,i){
    const row=p[id], g=row.segs[i]; let st=row.start; for(let k=0;k<i;k++) st+=row.segs[k].d;
    modal(`<h3>${esc(L.emp(id).name)}　${L.fmt(st)}～${L.fmt(st+g.d)}　${esc(g.t)}</h3>
      <div class="b">改成：</div><div class="picks">${S.tasks.map(t=>`<button data-t="${esc(t.name)}" class="${t.name===g.t?'cur':''}" style="background:${t.color}">${esc(t.name)}</button>`).join('')}</div>
      <div style="display:flex;align-items:center;gap:12px;margin:10px 0"><b>長度：</b><button class="btn" data-dd="-${SNAP}">－15 分</button><span id="dl" style="font-size:22px;font-weight:700;min-width:90px;text-align:center">${g.d} 分</span><button class="btn" data-dd="${SNAP}">＋15 分</button></div>
      <div style="display:flex;justify-content:space-between;margin-top:14px"><button class="btn" data-del style="border-color:var(--bad);color:var(--bad)">🗑 刪除</button><div><button class="btn" data-x>取消</button> <button class="btn pri" data-ok>確定</button></div></div>`,(m,close)=>{
      let nt=g.t, nd=g.d;
      m.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{ nt=b.dataset.t; m.querySelectorAll('[data-t]').forEach(x=>x.classList.toggle('cur',x===b)); });
      m.querySelectorAll('[data-dd]').forEach(b=>b.onclick=()=>{ nd=Math.max(SNAP,nd+Number(b.dataset.dd)); m.querySelector('#dl').textContent=nd+' 分'; });
      m.querySelector('[data-x]').onclick=close;
      m.querySelector('[data-del]').onclick=()=>{ close(); removeAt(row,i); L.log('日作業表',`${M}/${d} ${L.emp(id).name} 刪除「${g.t}」`); after(); };
      m.querySelector('[data-ok]').onclick=()=>{ close(); const old=g.t; g.t=nt; const cut=resize(row,i,nd); clean(row);
        L.log('日作業表',`${M}/${d} ${L.emp(id).name} 修改工作`,`${old} ${g.d}分`,`${nt} ${nd}分`); after(cut, nt!==old?skillWarn(id,nt):null); };
    });
  }
}
})();
