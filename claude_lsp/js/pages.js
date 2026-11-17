/* LSP v2 示範：各頁面 */
(function(){
const L = window.LSP, D = L.D, {esc,modal,toast,route} = L;
const n = x => Number(x).toLocaleString('en-US');
const BLOCKING = ['六休一','間隔'];   // 例假（每週日～六一天）、週工時先當提醒，待確認
const SPECIAL={sp1:'支援',sp2:'受訓',sp3:'育嬰留停'};
const NX = L.NEXT, NW = L.NOW;
const GROUP_ORDER=['管理','值班','乾貨','生鮮','熟食'];
const TITLE_ORDER=['店經理','組長','副組長','營業員','助理營業員','部分工時'];

function stepper(steps, cur){
  return `<div class="stepper">${steps.map((s,i)=>{
    const cls = i<cur?'done':(i===cur?'cur':''); const dot = i<cur?'✓':(i+1);
    return `<div class="st ${cls}"><div class="dot">${dot}</div>${s}${i===cur?'（現在）':''}</div>`;}).join('')}</div>`;
}
const statusPill = (M,mm) => mm.kind==='past'?'<span class="pill sent">已結束（只能看）</span>':(M.status==='sent'?'<span class="pill sent">已送出（唯讀）</span>':(M.status==='saved'?'<span class="pill saved">草稿（已存檔）</span>':'<span class="pill draft">草稿（還沒存檔）</span>'));
function schedTabs(cur){
  return `<div class="tabs"><button data-h="#/month" class="${cur==='m'?'on':''}">月班表</button><button data-h="#/day" class="${cur==='d'?'on':''}">日作業表</button></div>`;
}
function bindTabs(main){ main.querySelectorAll('.tabs button[data-h]').forEach(b=>b.onclick=()=>location.hash=b.dataset.h); }
L.schedTabs=schedTabs; L.bindTabs=bindTabs; L.statusPill=statusPill; L.SPECIAL=SPECIAL;
function cellText(c){ return SPECIAL[c]||c||''; }
L.cellText=cellText;

/* ============ 準備跑班表（下個月） ============ */
function prepPage(main){
  const S=L.S, st=D.store, M=S.months[NX.key];
  const leaveOk = S.leave.phase==='confirmed';
  const tgt=S.target, def=Math.round(st.budget*0.95);
  const ph={setting:'店長設定中',review:'員工已劃完，待店長審核'}[S.leave.phase]||'';
  main.insertAdjacentHTML('beforeend',`
  ${stepper(['確認設定','系統排班','檢查、調整','送出'], M.generated?(M.status==='sent'?4:2):0)}
  <div class="card" style="padding:14px 22px"><div class="b" style="font-size:22px">${NX.y} 年 ${NX.m} 月班表${M.generated?'已經產生過':'還沒產生'}</div>
    <div class="muted">先確認下面 5 項，沒問題再按「產生月班表」。${M.generated?'重新產生會蓋掉目前的班表。':''}</div></div>
  ${chk(1,'門市基本資料','首次使用要填；營業時間、到貨時間、最少人力',`營業 ${S.storeInfo.bizStart}～${S.storeInfo.bizEnd}，最少人力已設定`,true,'#/store')}
  ${chk(2,'員工班別',`本店共 ${Object.keys(S.shifts).length} 種班別`,'名稱與時間都已設定',true,'#/shifts')}
  ${chk(3,'員工技能',`${D.employees.length} 位員工`,'每人都已設定技能（新進員工要先設定才排得進去）',true,'#/skills')}
  ${chk(4,'預先排休','每個月都要做',leaveOk?`${NX.m} 月排休已確定`:`${NX.m} 月排休還沒確定（目前：${ph}）`,leaveOk,'#/leave')}
  <div class="card chk" style="align-items:flex-start">
    <div class="no">5</div>
    <div style="flex:1">
      <div class="tt">本月排班工時</div>
      <div class="hrs">可用時數 <b>${n(st.budget)} hr</b>｜去年同期（${NX.y-1}/${NX.m}）<b>${n(st.lastYear)} hr</b>（示意）｜前 3 個月平均 <b>${n(st.avg3)} hr</b></div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:10px;flex-wrap:wrap">
        <span class="b" style="font-size:20px">目標</span>
        <input class="inp-big" id="tgt" value="${n(tgt)}"> <span style="font-size:20px">hr</span>
        <span class="muted">＝可用時數 × ${(tgt/st.budget*100).toFixed(1)}%</span>
        <button class="btn sm" id="tgtReset">還原 95%（${n(def)}）</button>
      </div>
    </div>
    <div class="st"><span class="pill ok">✓ 已帶入</span></div>
  </div>
  <div class="card" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
    <div style="flex:1;font-size:18px">排班範圍：${NX.y}/${NX.m}/1～${NX.m}/${NX.days}（${NX.days} 天）｜員工 ${D.employees.length} 位｜排班工時 <b>${n(tgt)} hr</b>
      ${leaveOk?'':'<div class="bad b">第 4 項排休還沒確定，先去確定排休才能產生。</div>'}</div>
    <button class="btn pri big" id="gen" ${leaveOk?'':'disabled'}>產生月班表</button>
  </div>
  <ul class="note-below">
    <li>第 4 項要先到「🌴 預先排休」按「確定排休」才會打勾。</li>
    <li>目標工時預設＝可用時數 × 95%，店長可以直接改；排班時系統會盡量貼近這個數字。</li>
  </ul>`);
  function chk(no,tt,sub,state,ok,href){
    return `<div class="card chk"><div class="no">${no}</div><div><div class="tt">${tt}</div><div class="sub">${sub}</div><div class="${ok?'':'bad b'}" style="font-size:17px">${state}</div></div>
      <div class="st"><span class="pill ${ok?'ok':'draft'}">${ok?'✓ 完成':'⚠ 還沒好'}</span><a class="btn sm" href="${href}">前往設定</a></div></div>`;
  }
  const inp=main.querySelector('#tgt');
  inp.onchange=()=>{ const v=Number(inp.value.replace(/[^\d]/g,'')); if(v>0){ S.target=v; L.save(); L.redraw(); } };
  main.querySelector('#tgtReset').onclick=()=>{ S.target=def; L.save(); L.redraw(); };
  main.querySelector('#gen').onclick=()=>{
    if(M.generated && !confirm('重新產生會蓋掉目前的班表，確定嗎？')) return;
    location.hash='#/run';
  };
}
route('/schedule',(main)=>{ L.S.cur=NX.key; L.save();
  main.innerHTML=`<div class="top"><h2>智能排班</h2><span class="muted">準備 ${NX.y} 年 ${NX.m} 月</span></div>${L.monthBar()}`;
  L.bindMonthBar(main,'#/month'); prepPage(main); });

/* ============ 執行跑班表（產生 1 月） ============ */
function buildNext(){
  const S=L.S, lv=S.leave, base=L.mapFromNov(NX);
  D.employees.forEach(e=>{
    const row=base[e.id];
    (lv.reqs[e.id]||[]).forEach(d=>{
      const k=e.id+'_'+d; if(lv.returned[k]||lv.special[k]) return;
      const c=row[d-1];
      if(L.isWork(c)){ // 把同一週另一天「休」換成上班，工時不變
        const w0=d-L.dow(d,NX), cand=[...Array(7)].map((_,i)=>w0+i).filter(x=>x>=1&&x<=NX.days&&x!==d&&row[x-1]==='休'&&!(lv.reqs[e.id]||[]).includes(x));
        if(cand.length) row[cand[0]-1]=c;
      }
      if(c!=='例') row[d-1]='休';
    });
    Object.keys(lv.special).filter(k=>k.startsWith(e.id+'_')).forEach(k=>{ row[Number(k.split('_')[1])-1]=lv.special[k]; });
    let run=0; row.forEach((c,i)=>{ if(L.isWork(c)){ run++; if(run===7){ row[i]='休'; run=0; } } else run=0; });  // 不連上 7 天
  });
  return base;
}
route('/run', (main)=>{
  const steps=[['載入設定','門市資料、班別、技能、排休'],['月排班','決定每個人哪天上什麼班（排休、勞基法、最少人力、排班工時）'],['日作業表','把工作分到每個人、每個時段'],['檢查','人數、工時、勞基法、職務缺口'],['完成','顯示月班表，可以手動調整']];
  main.innerHTML=`<div class="top"><h2>正在產生 ${NX.y} 年 ${NX.m} 月班表…</h2></div>
  <div class="card"><div style="height:24px;border:1.5px solid var(--ink);border-radius:12px;overflow:hidden;background:var(--pri-xl)"><div id="bar" style="height:100%;width:0;background:var(--pri);transition:width .4s"></div></div>
  <div class="muted" id="pct" style="margin-top:6px">0%</div></div>
  ${steps.map((s,i)=>`<div class="card chk" id="rs${i}"><div class="no">${i+1}</div><div><div class="tt">${s[0]}</div><div class="sub">${s[1]}</div></div><div class="st"><span class="pill" style="border-color:#b0b0b0;color:#8a8a8a">等待中</span></div></div>`).join('')}`;
  let i=0;
  const tick=()=>{
    if(!document.getElementById('rs0')) return;
    if(i>0){ const p=main.querySelector('#rs'+(i-1)+' .pill'); p.className='pill ok'; p.textContent='✓ 完成'; }
    if(i<steps.length){ const p=main.querySelector('#rs'+i+' .pill'); p.className='pill sent'; p.textContent='進行中…'; }
    main.querySelector('#bar').style.width=(i/steps.length*100)+'%'; main.querySelector('#pct').textContent=Math.round(i/steps.length*100)+'%';
    if(i===steps.length){
      const S=L.S; S.months[NX.key]={generated:true,status:'unsaved',sched:buildNext(),changed:{},dayPlans:{}}; S.cur=NX.key;
      L.log('班表',`產生 ${NX.m} 月班表`,'',`目標 ${n(S.target)} hr`); L.save();
      setTimeout(()=>location.hash='#/month',600); return;
    }
    i++; setTimeout(tick,700);
  };
  setTimeout(tick,300);
});

/* ============ 月班表 ============ */
route('/month', (main)=>{
  const S=L.S, mm=L.curMon(), M=L.curM();
  main.innerHTML=`<div class="top"><h2>智能排班</h2></div>${L.monthBar()}`;
  L.bindMonthBar(main,'#/month');
  if(!M.generated){ prepPage(main); return; }
  const past = mm.kind==='past', sent = M.status==='sent', ro = past||sent;
  const mode = sessionStorage.getItem('lsp_mode')||'code';
  const issues = L.laborCheck(mm.key);
  const block = issues.filter(x=>BLOCKING.includes(x.kind));
  const errSet = new Set(block.map(x=>x.id+'_'+x.day));
  const warnSet = new Set(issues.filter(x=>!BLOCKING.includes(x.kind)).map(x=>x.id+'_'+x.day));
  const tot=L.totalHours(mm.key), tgt=S.target;
  const days=[...Array(mm.days)].map((_,i)=>i+1);
  const td=L.today(); const isToday=d=>mm.key===td.mm.key&&d===td.d;
  const sat=d=>L.dow(d,mm)===6?'border-right:2px solid #888;':'';
  const wkEnd=d=>L.dow(d,mm)===6||d===mm.days;
  const wkStart=d=>{ let x=d; while(x>1 && L.dow(x-1,mm)!==6) x--; return x; };
  const head = days.map(d=>`<th class="${L.dow(d,mm)%6===0?'wk-sun':''}" style="${isToday(d)?'background:#fff6b6':''}">${d}<br><small>${isToday(d)?'今天':L.DOW[L.dow(d,mm)]}</small></th>`+(wkEnd(d)?`<th class="wkh">週<br>工時</th>`:'')).join('');
  const ef=L.empF(), EMP=D.employees.filter(L.empFilterFn(ef)), fl=ef!=='all';
  const rows = sortEmps(EMP,'group').map(e=>{
    const lim=e.ft?48:40;
    const cells = days.map(d=>{
      const c=M.sched[e.id][d-1]; const sh=L.shiftOf(c);
      const cls = sh?'':(SPECIAL[c]?'sp':(c==='例'?'rest':(c==='休'?'off':'empty')));
      const k=e.id+'_'+d;
      const inner = sh ? (mode==='code'?`<div class="c">${c}</div><div class="t">${sh.start}</div>`:`<div style="font-size:13px;font-weight:700">${sh.start}<br>${sh.end}</div>`) : `<div class="c">${cellText(c)}</div>`;
      return `<td class="cell ${cls} ${errSet.has(k)?'err':(warnSet.has(k)?'wrn':'')} ${M.changed[k]?'chg':''}" data-id="${e.id}" data-d="${d}">${inner}</td>`+(wkEnd(d)?wkCell(e,d,lim):'');
    }).join('');
    return `<tr><td class="sticky" style="min-width:150px"><b>${esc(e.name)}</b><br><small class="muted">${e.title}・${e.group}</small></td><td><b>${L.monthHours(e.id,mm.key)}</b></td>${cells}</tr>`;
  }).join('');
  function wkCell(e,d,lim){ const h=M.sched[e.id].slice(wkStart(d)-1,d).reduce((a,c)=>a+L.netH(c),0); const full=d-wkStart(d)+1===7;
    return `<td class="wkc ${h>lim?'over':''}" title="${mm.m}/${wkStart(d)}～${mm.m}/${d}${full?'':'（不滿一週）'}，上限 ${lim} 小時">${h}</td>`; }
  const cnt = days.map(d=>EMP.filter(e=>L.isWork(M.sched[e.id][d-1])).length);
  const wkTot = d=>EMP.reduce((a,e)=>a+M.sched[e.id].slice(wkStart(d)-1,d).reduce((x,c)=>x+L.netH(c),0),0);
  main.insertAdjacentHTML('beforeend',`
  <div class="top"><h2 style="font-size:26px">${mm.y} 年 ${mm.m} 月班表</h2>${statusPill(M,mm)}<div class="spacer"></div>
    <button class="btn" id="law">⚖ 勞基法檢核</button>
    ${past?'':(sent?`<button class="btn soft" id="edit">✎ 編輯</button>`:`<button class="btn soft" id="saveD" ${M.status==='saved'?'disabled':''}>儲存草稿</button><button class="btn pri" id="send" ${M.status!=='saved'?'disabled':''}>送出</button>`)}
  </div>
  ${schedTabs('m')}
  <div class="kpi" style="margin-bottom:12px">
    <div class="k"><small>已排班工時</small><b>${n(tot)}</b> hr</div>
    ${mm.kind==='next'?`<div class="k"><small>目標排班工時</small><b>${n(tgt)}</b> hr</div><div class="k"><small>差距</small><b class="${tot<tgt?'bad':''}">${tot-tgt>0?'+':''}${n(tot-tgt)}</b> hr</div>`:''}
    <div class="k"><small>勞基法</small><b class="${block.length?'bad':'okc'}">${block.length?'⚠ '+block.length+' 個問題':'✓ 沒問題'}</b>${issues.length-block.length?`<small>另有 ${issues.length-block.length} 個提醒</small>`:''}</div>
    <div class="spacer"></div>
    <div style="align-self:center">顯示：<button class="btn sm ${mode==='code'?'soft':''}" data-mode="code">班別名稱</button> <button class="btn sm ${mode==='time'?'soft':''}" data-mode="time">時間</button></div>
  </div>
  ${L.empFilterBar()}
  ${past?'<div class="banner blue">這是過去的月份，只能看，不能改。</div>':(sent?`<div class="banner blue">已送出，班表是唯讀。${mm.kind==='now'?'本月要調班':'要修改'}請按右上「✎ 編輯」，班表會回到草稿，改完要再送出。</div>`:'')}
  <div class="tbl-wrap ${ro?'ro':''}"><table class="g"><thead><tr><th class="sticky">姓名</th><th>總工時</th>${head}</tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td class="sticky">上班人數${fl?'<br><small class="muted">（只算篩選的人）</small>':''}</td><td></td>${cnt.map((c,i)=>`<td>${c}</td>`+(wkEnd(i+1)?`<td class="wkc">${n(wkTot(i+1))}</td>`:'')).join('')}</tr></tfoot></table></div>
  <div class="legend" style="margin-top:10px"><span><i style="background:#ffe9e9"></i>例假</span><span><i style="background:#f3f3f3"></i>休假</span><span><i style="background:#dbe9c4"></i>支援／受訓／育嬰</span><span><i style="background:#fafafa"></i>不排（兼職）</span><span><i style="outline:3px solid var(--bad)"></i>勞基法問題（不能送出）</span><span><i style="outline:3px dashed var(--warn)"></i>提醒</span><span><i style="box-shadow:inset 0 -5px 0 var(--warn)"></i>手動改過</span><span><i style="background:#fff3b0"></i>週工時（正職超過 48、兼職超過 40 變紅）</span></div>
  <ul class="note-below">
    <li>上面「看哪些人」可以只看某一組、正職或兼職；上方的已排班工時、勞基法檢核還是算全店。</li>
    <li>點格子可以改班別、休假。每改一格就做第一層勞基法檢查（六休一、每週例假、兩班間隔 11 小時、週工時），有問題只跳提醒、格子框紅，<b>不會擋住</b>。</li>
    <li>「儲存草稿」可以存很多次；有還沒存的修改時「送出」是灰的。送出時再做一次完整檢查，六休一、兩班間隔有問題就不能送出；每週例假、週工時超過先只提醒（原始班表用雙週變形、兼職可超排，規則待確認）。</li>
    <li>已送出後按「✎ 編輯」→ 回到草稿，總部報表回到「排班中」。</li>
  </ul>`);
  bindTabs(main); L.bindEmpFilter(main);
  main.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_mode',b.dataset.mode); L.redraw(); });
  main.querySelector('#law').onclick=()=>showIssues(issues,false,mm);
  if(past) return;
  if(sent){ main.querySelector('#edit').onclick=()=>{ M.status='unsaved'; L.log('班表',`${mm.m} 月送出後編輯`,'已送出','草稿'); L.save(); L.redraw(); }; return; }
  main.querySelector('#saveD').onclick=()=>{ M.status='saved'; L.log('班表',`${mm.m} 月儲存草稿`); L.save(); L.redraw(); toast('已儲存草稿','可以按「送出」了。','info'); };
  main.querySelector('#send').onclick=()=>{
    const iss=L.laborCheck(mm.key); const bl=iss.filter(x=>BLOCKING.includes(x.kind));
    if(bl.length){ showIssues(bl,true,mm); return; }
    M.status='sent'; L.log('班表',`送出 ${mm.m} 月班表`,'草稿（已存檔）','已送出'); L.save(); L.redraw();
    toast('已送出',`${mm.m} 月班表已送出，總部報表顯示「已送出」。${iss.length?`（另有 ${iss.length} 個提醒）`:''}`,'info');
  };
  main.querySelectorAll('td.cell').forEach(td=>td.onclick=()=>pickShift(mm, td.dataset.id, Number(td.dataset.d)));
});
function showIssues(list, blocking, mm){
  const body = list.length? list.map((x,i)=>`<div class="issue" data-i="${i}"><b class="${BLOCKING.includes(x.kind)?'bad':''}">【${x.kind}】</b>${esc(x.msg)}</div>`).join('') : '<div class="okc b" style="font-size:20px">✓ 整份班表沒有勞基法問題</div>';
  modal(`<h3>${blocking?`還有 ${list.length} 個問題，不能送出`:`${mm.m} 月勞基法檢核：${list.length} 筆`}</h3>
    <div class="muted" style="margin-bottom:8px">點一筆就跳到那一格。紅字＝送出前一定要改；黑字＝提醒。</div>${body}
    <div style="text-align:right;margin-top:14px"><button class="btn" data-x>關閉</button></div>`, (m,close)=>{
    m.querySelector('[data-x]').onclick=close;
    m.querySelectorAll('.issue').forEach(el=>el.onclick=()=>{ const x=list[el.dataset.i]; close();
      const td=document.querySelector(`td.cell[data-id="${x.id}"][data-d="${x.day}"]`); if(td){ td.scrollIntoView({block:'center',inline:'center',behavior:'smooth'}); td.animate([{background:'#ffd400'},{background:''}],{duration:1600}); } });
  });
}
function pickShift(mm,id,d){
  const S=L.S, M=S.months[mm.key], e=L.emp(id), cur=M.sched[id][d-1];
  const opts = Object.entries(S.shifts).sort((a,b)=>L.tm(a[1].start)-L.tm(b[1].start)).map(([c,s])=>`<button data-c="${esc(c)}" class="${c===cur?'cur':''}"><b>${esc(c)}</b><small>${s.start}～${s.end}（${L.netH(c)}h）</small></button>`).join('');
  modal(`<h3>${esc(e.name)}　${mm.m}/${d}（${L.DOW[L.dow(d,mm)]}）</h3><div class="muted">現在：${cellText(cur)||'不排'}</div>
    <div class="picks">${opts}<button data-c="休" class="${cur==='休'?'cur':''}"><b>休</b><small>休息日</small></button><button data-c="例" class="${cur==='例'?'cur':''}"><b>例</b><small>例假</small></button><button data-c="" class="${cur===''?'cur':''}"><b>不排</b><small>兼職不排班</small></button></div>
    <div style="text-align:right"><button class="btn" data-x>取消</button></div>`,(m,close)=>{
    m.querySelector('[data-x]').onclick=close;
    m.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{
      const c=b.dataset.c; close(); if(c===cur) return;
      M.sched[id][d-1]=c; M.changed[id+'_'+d]=true; M.status='unsaved'; delete M.dayPlans[d];
      L.log('班表',`改班 ${e.name} ${mm.m}/${d}`,cellText(cur)||'不排',c||'不排'); L.save(); L.redraw();
      const iss=L.laborCheck(mm.key,[id]).filter(x=>Math.abs(x.day-d)<=7);
      if(iss.length){ const hard=iss.some(x=>BLOCKING.includes(x.kind));
        toast('⚠ 勞基法提醒（不會擋住，可以繼續改）', iss.map(x=>'・'+esc(x.msg)).join('<br>')+`<div class="muted" style="margin-top:6px">${hard?'紅框的問題送出前要改好；可以先儲存草稿。':'這是提醒，送出時不會擋。'}</div>`); }
    });
  });
}

/* ============ 排序／分組（員工技能、月班表共用） ============ */
function sortEmps(list, by){
  const gi=e=>{ const i=GROUP_ORDER.indexOf(e.group); return i<0?99:i; }, ti=e=>{ const i=TITLE_ORDER.indexOf(e.title); return i<0?99:i; };
  return [...list].sort((a,b)=> by==='title' ? (ti(a)-ti(b)||gi(a)-gi(b)) : (gi(a)-gi(b)||ti(a)-ti(b)) );
}

/* ============ 預先排休（1 月） ============ */
const OPEN=`${NW.m}/16`, DUE=`${NW.m}/15`, REVIEW=`${NW.m}/26`;
const LV_STEPS=['店長設定',`員工劃休（${OPEN}～${NW.m}/25）`,'店長審核','確定，帶入跑班表'];
const PH_IDX={setting:0,review:2,confirmed:4};
route('/leave', (main, r)=>{
  const S=L.S, lv=S.leave;
  const tab = r.includes('review')?'review':(r.includes('setting')?'setting':(lv.phase==='setting'?'setting':'review'));
  const summary = `${NX.m} 月：每人可休 <b>${lv.days} 天</b>｜不能休 <b>${lv.noLeave.length?fmtDays(lv.noLeave):'無'}</b>`;
  main.innerHTML=`<div class="top"><h2>預先排休</h2><span class="muted">${NX.y} 年 ${NX.m} 月（下個月）</span><div class="spacer"></div>
    ${tab==='setting'?'<button class="btn" id="saveSet">儲存</button>':(lv.phase!=='confirmed'?'<button class="btn pri" id="confirm">確定排休</button>':'<span class="pill ok">✓ 排休已確定</span>')}</div>
    ${stepper(LV_STEPS, PH_IDX[lv.phase])}
    <div class="tabs"><button data-t="setting" class="${tab==='setting'?'on':''}">① 設定</button><button data-t="review" class="${tab==='review'?'on':''}" ${lv.phase==='setting'?'disabled style="opacity:.5"':''}>② 審核</button>
      ${tab==='review'?`<span class="note" style="margin-left:12px;color:var(--ink);font-size:17px">${summary}</span><button class="btn sm" id="editSet" style="margin-left:auto">✎ 修改設定</button>`:(lv.phase==='setting'?`<span class="note">（${OPEN} 員工開始劃休後才能用）</span>`:'')}</div>
    <div id="body"></div>`;
  main.querySelectorAll('.tabs [data-t]').forEach(b=>b.onclick=()=>{ if(b.dataset.t==='review'&&lv.phase==='setting') return; location.hash='#/leave/'+b.dataset.t; });
  if(tab==='setting') leaveSetting(main.querySelector('#body'), main); else leaveReview(main.querySelector('#body'));
  const cf=main.querySelector('#confirm'); if(cf) cf.onclick=()=>{
    const over=D.employees.filter(e=>reqDays(e.id).length>lv.days);
    if(over.length && !confirm(`還有 ${over.length} 人劃休超過 ${lv.days} 天（${over.map(e=>e.name).join('、')}），還是要確定嗎？`)) return;
    lv.phase='confirmed'; L.log('排休',`確定 ${NX.m} 月排休`,'','已確定'); L.save(); L.redraw();
    toast('排休已確定',`「智能排班 → ${NX.m} 月」準備跑班表的第 4 項已自動打勾。`,'info');
  };
  const es=main.querySelector('#editSet'); if(es) es.onclick=()=>modal(`<h3 class="bad">⚠ 員工已經開始劃休了</h3><p style="font-size:19px">改了設定會通知全店員工。已經劃的休如果碰到新的不能休日子，會自動退回。</p>
    <div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" data-x>取消</button><button class="btn pri" data-ok>確定修改</button></div>`,(m,close)=>{
      m.querySelector('[data-x]').onclick=close; m.querySelector('[data-ok]').onclick=()=>{ close(); location.hash='#/leave/setting'; };});
});
function fmtDays(arr){ const a=[...arr].sort((x,y)=>x-y), m=NX.m, out=[]; for(let i=0;i<a.length;){ let j=i; while(j+1<a.length&&a[j+1]===a[j]+1) j++; out.push(i===j?`${m}/${a[i]}`:`${m}/${a[i]}～${m}/${a[j]}`); i=j+1; } return out.join('、'); }
function reqDays(id){ const lv=L.S.leave; return (lv.reqs[id]||[]).filter(d=>!lv.returned[id+'_'+d]); }
function leaveSetting(box, main){
  const S=L.S, lv=S.leave, sel=new Set(lv.noLeave), mm=NX;
  const lead=(mm.fd+6)%7, prevDays=31;
  let cal=['一','二','三','四','五','六','日'].map(x=>`<div class="h">${x}</div>`).join('');
  for(let i=0;i<lead;i++) cal+=`<div class="o">${prevDays-lead+1+i}</div>`;
  for(let d=1; d<=mm.days; d++) cal+= sel.has(d)?`<div class="sel" data-d="${d}">${d}<small>不能休</small></div>`:`<div data-d="${d}">${d}</div>`;
  box.innerHTML=`
    <div class="banner">⏰ 請在 ${DUE} 前設定好。${OPEN} 起，員工就可以用 App 劃 ${mm.m} 月的休假。</div>
    <div class="card chk"><div class="no">1</div><div><div class="tt">每人 ${mm.m} 月可以休幾天</div>
      <div style="display:flex;align-items:center;gap:14px;margin-top:8px"><select class="sel-big" id="days">${[1,2,3,4,5,6].map(x=>`<option ${x===lv.days?'selected':''}>${x}</option>`).join('')}</select><span style="font-size:22px">天</span>
      <span class="muted">先帶上個月的天數（2 天），可以改。</span></div></div></div>
    <div class="card chk" style="align-items:flex-start"><div class="no">2</div><div style="flex:1">
      <div class="tt">${mm.m} 月不能休的日子</div>
      <div style="display:flex;gap:30px;margin-top:12px;flex-wrap:wrap">
        <div style="min-width:300px">
          <div style="display:flex;gap:10px;margin-bottom:14px"><button class="btn ${sel.size?'':'soft'}" id="none">無</button><button class="btn ${sel.size?'soft':''}">選擇日期</button></div>
          <div class="b" style="margin-bottom:8px">已選的日子：</div>
          <div class="chips">${sel.size?[...sel].sort((a,b)=>a-b).map(d=>`<span class="chip">${mm.m}/${d}（${L.DOW[L.dow(d,mm)]}）<button data-rm="${d}">✕</button></span>`).join(''):'<span class="muted">還沒選</span>'}</div>
          <p class="muted">點日曆上的日子就能選或取消，按 ✕ 也能取消。<br>選好的日子，員工在 App 上不能劃休。</p>
        </div>
        <div><div class="b" style="text-align:center;font-size:20px;margin-bottom:6px">${mm.y} 年 ${mm.m} 月</div><div class="cal">${cal}</div>
          <div class="muted" style="margin-top:6px">紅色＝不能休（員工在 App 上那天會反灰、不能劃）</div></div>
      </div></div></div>
    <div class="card" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <div style="flex:1;font-size:19px">${mm.m} 月：每人可休 <b>${lv.days} 天</b>｜不能休 <b>${sel.size?fmtDays([...sel]):'無'}</b>
        <div class="muted" style="font-size:16px">${lv.phase==='setting'?`按下後，${OPEN} 起員工可以在 App 劃休；這一頁會自動換到「② 審核」。`:'已經開放劃休；改了設定按「儲存」就會通知全店。'}</div></div>
      ${lv.phase==='setting'?'<button class="btn pri big" id="open">送出、開放劃休</button>':''}
    </div>
    <ul class="note-below"><li>${DUE} 還沒送出：系統自動沿用上個月的天數，不能休的日子先空著，${OPEN} 照常開放，並通知店長。</li><li>不能休的日子只有店長設定（總部不設定）。</li></ul>`;
  box.querySelector('#days').onchange=ev=>{ lv.days=Number(ev.target.value); L.save(); L.redraw(); };
  box.querySelectorAll('.cal [data-d]').forEach(c=>c.onclick=()=>{ const d=Number(c.dataset.d); const i=lv.noLeave.indexOf(d); if(i>=0) lv.noLeave.splice(i,1); else lv.noLeave.push(d); L.save(); L.redraw(); });
  box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{ lv.noLeave=lv.noLeave.filter(x=>x!==Number(b.dataset.rm)); L.save(); L.redraw(); });
  box.querySelector('#none').onclick=()=>{ lv.noLeave=[]; L.save(); L.redraw(); };
  const op=box.querySelector('#open'); if(op) op.onclick=()=>{
    returnConflicts();
    lv.phase='review'; L.log('排休','送出、開放劃休',`可休 ${lv.days} 天`,lv.noLeave.length?'不能休 '+fmtDays(lv.noLeave):'不能休：無'); L.save(); location.hash='#/leave/review';
    toast('已開放劃休',`示範：時間跳到 ${REVIEW}，員工已經劃完，進入「② 審核」。`,'info'); };
  main.querySelector('#saveSet').onclick=()=>{
    if(lv.phase!=='setting'){
      const k=returnConflicts();
      L.log('排休','修改設定（已通知全店）','',`可休 ${lv.days} 天，不能休 ${lv.noLeave.length?fmtDays(lv.noLeave):'無'}`); L.save();
      toast('已儲存，已通知全店',k?`有 ${k} 筆劃休碰到不能休的日子，已自動退回。`:'沒有劃休受影響。','info'); location.hash='#/leave/review'; return;
    }
    L.log('排休','儲存設定'); L.save(); toast('已儲存','設定好了再按「送出、開放劃休」。','info');
  };
}
function returnConflicts(){ const lv=L.S.leave; let k=0; D.employees.forEach(e=>reqDays(e.id).forEach(d=>{ if(lv.noLeave.includes(d)){ lv.returned[e.id+'_'+d]='碰到不能休的日子'; k++; } })); return k; }
function leaveReview(box){
  const S=L.S, lv=S.leave, mm=NX, ro = lv.phase==='confirmed';
  const by = sessionStorage.getItem('lsp_lvgrp')||'group';
  const days=[...Array(mm.days)].map((_,i)=>i+1), nol=new Set(lv.noLeave);
  const head=days.map(d=>`<th class="${L.dow(d,mm)%6===0?'wk-sun':''} ${nol.has(d)?'lv nol':''}">${d}<br><small>${L.DOW[L.dow(d,mm)]}</small></th>`).join('');
  const dayReq=days.map(()=>0), daySp=days.map(()=>0);
  let lastG=null;
  const rows=sortEmps(D.employees,by).map(e=>{
    const req=new Set(reqDays(e.id)), cnt=req.size, g=by==='title'?e.title:e.group;
    const cells=days.map(d=>{
      const k=e.id+'_'+d; let cls='', txt='';
      if(lv.special[k]){ cls=lv.special[k]; txt=SPECIAL[lv.special[k]]; daySp[d-1]++; }
      else if(lv.returned[k]){ cls='ret'; txt='退回'; }
      else if(req.has(d)){ cls='req'; txt='休'; dayReq[d-1]++; }
      return `<td class="lv ${cls}" data-id="${e.id}" data-d="${d}" style="cursor:${ro?'default':'pointer'}">${txt}</td>`;
    }).join('');
    const ret=Object.keys(lv.returned).filter(k=>k.startsWith(e.id+'_')).length;
    const gh = g!==lastG ? `<tr class="grp-row"><td class="sticky" colspan="2">${esc(g)}</td><td colspan="${mm.days}"></td></tr>` : ''; lastG=g;
    return gh+`<tr><td class="sticky" style="min-width:140px"><b>${esc(e.name)}</b><br><small class="muted">${e.title}・${e.group}</small></td>
      <td class="${cnt>lv.days?'bad b':''}">${cnt} / ${lv.days}${cnt>lv.days?'<br><small>超過</small>':''}${ret?`<br><small class="bad">退回 ${ret}</small>`:''}</td>${cells}</tr>`;
  }).join('');
  const total=D.employees.length;
  box.innerHTML=`
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
      <div class="seg-toggle">${[['group','依組別'],['title','依職稱']].map(([k,t])=>`<button data-by="${k}" class="${by===k?'on':''}">${t}</button>`).join('')}</div>
      <div class="legend"><span><i style="background:#ffd9d9"></i>員工 App 劃休</span><span><i style="outline:2px solid var(--bad);background:#fff"></i>退回</span><span><i style="background:#dbe9c4"></i>支援</span><span><i style="background:#ebe5f3"></i>受訓</span><span><i style="background:#d9d9d9"></i>育嬰留停</span><span><i class="hot"></i>當天休假 4 人以上</span><span><i class="nol"></i>不能休的日子</span></div></div>
    ${ro?'<div class="banner blue">排休已確定。要改請先聯絡總部（示範：可按左下「重設示範資料」）。</div>':'<div class="muted" style="margin-bottom:8px">點「休」可以退回；點空白格可以設定支援、受訓、育嬰留停。</div>'}
    <div class="tbl-wrap"><table class="g"><thead><tr><th class="sticky">姓名</th><th>劃休</th>${head}</tr></thead><tbody>${rows}</tbody>
    <tfoot>
      <tr><td class="sticky">休假人數</td><td></td>${dayReq.map(c=>`<td class="${c>=4?'hot':''}">${c}</td>`).join('')}</tr>
      <tr><td class="sticky">特殊人數</td><td></td>${daySp.map(c=>`<td>${c}</td>`).join('')}</tr>
      <tr><td class="sticky">還可排人數</td><td></td>${days.map((d,i)=>`<td>${total-dayReq[i]-daySp[i]}</td>`).join('')}</tr>
    </tfoot></table></div>
    <ul class="note-below"><li>還可排人數＝全店 ${total} 人－休假－特殊（支援、受訓、育嬰留停佔工時，但不算門市戰力）。</li><li>按「確定排休」後，準備跑班表的排休那一項會自動打勾；產生 ${mm.m} 月班表時，劃休的日子會排成「休」。</li></ul>`;
  box.querySelectorAll('[data-by]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_lvgrp',b.dataset.by); L.redraw(); });
  if(ro) return;
  box.querySelectorAll('td.lv[data-id]').forEach(td=>td.onclick=()=>{
    const id=td.dataset.id, d=Number(td.dataset.d), k=id+'_'+d, e=L.emp(id);
    if(td.classList.contains('req')){
      modal(`<h3>${esc(e.name)} ${mm.m}/${d} 劃休</h3><p>要退回這天的休假嗎？選一個原因：</p><div class="picks">${['當天休假人數多','檔期','人力不足','其他'].map(x=>`<button data-r="${x}">${x}</button>`).join('')}</div><div style="text-align:right"><button class="btn" data-x>不退回</button></div>`,(m,close)=>{
        m.querySelector('[data-x]').onclick=close;
        m.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{ lv.returned[k]=b.dataset.r; L.log('排休',`退回 ${e.name} ${mm.m}/${d}`,'休','退回（'+b.dataset.r+'）'); L.save(); close(); L.redraw(); });});
    } else if(td.classList.contains('ret')){
      if(confirm('取消退回，恢復成休假？')){ delete lv.returned[k]; L.save(); L.redraw(); }
    } else {
      modal(`<h3>${esc(e.name)} ${mm.m}/${d}</h3><div class="picks">${Object.entries(SPECIAL).map(([c,t])=>`<button data-s="${c}">${t}</button>`).join('')}<button data-s="">清除</button></div><div style="text-align:right"><button class="btn" data-x>取消</button></div>`,(m,close)=>{
        m.querySelector('[data-x]').onclick=close;
        m.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{ const s=b.dataset.s; if(s) lv.special[k]=s; else delete lv.special[k]; L.log('排休',`${e.name} ${mm.m}/${d}`,'',s?SPECIAL[s]:'清除'); L.save(); close(); L.redraw(); });});
    }
  });
}

/* ============ 員工技能（排序＋分組） ============ */
const GROUP_SKILLS={'管理':['管理','值班','收銀'],'值班':['值班','收銀','乾貨人力'],'乾貨':['乾貨人力','收銀'],'生鮮':['生鮮擔當','生鮮人力','收銀'],'熟食':['熟食擔當','熟食人力','收銀']};
route('/skills',(main)=>{
  const S=L.S;
  const mode = sessionStorage.getItem('lsp_skmode')||'table';   // table | person
  const order=a=>a.map((x,i)=>`${i+1}.${x}`).join(' ')||'無';
  const changed=(e,before)=>{ Object.values(S.months).forEach(M=>M.dayPlans={}); L.log('技能',`${e.name} 技能順位`,before,order(S.skills[e.id])); L.redraw(); };
  const head=`<div class="top"><h2>員工技能</h2><span class="muted">設定每個人會做的工作和順位：① 最優先。日作業表先分 ① 的工作，① 人夠了才分 ②</span></div>
  <div style="display:flex;gap:14px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><b>畫面：</b>
    <div class="seg-toggle">${[['table','📋 表格設定'],['person','👤 列表設定']].map(([k,t])=>`<button data-mode="${k}" class="${mode===k?'on':''}">${t}</button>`).join('')}</div>
    <span style="flex:1"></span><button class="btn" id="skClear" style="border-color:var(--bad);color:var(--bad)">🗑️ 清空全部技能</button></div>`;
  const bindHead=()=>{
    main.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_skmode',b.dataset.mode); L.redraw(); });
    main.querySelector('#skClear').onclick=()=>modal(`<h3>清空全部技能？</h3><div class="b">全部 ${D.employees.length} 位員工的技能和順位都會清掉，要重新一個一個設定。</div><div class="muted" style="margin-top:6px">清空後日作業表沒辦法自動分工。不小心按到，可以按左下「重設示範資料」恢復。</div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px"><button class="btn" data-x>不要</button><button class="btn" data-ok style="background:var(--bad);border-color:var(--bad);color:#fff">確定清空</button></div>`,(m,close)=>{
      m.querySelector('[data-x]').onclick=close;
      m.querySelector('[data-ok]').onclick=()=>{ D.employees.forEach(e=>S.skills[e.id]=[]); Object.values(S.months).forEach(M=>M.dayPlans={}); L.log('技能','清空全部員工技能','','全部清空'); close(); L.toast('已清空全部技能'); L.redraw(); };
    });
  };

  /* ---- 模式二：一個一個設定（選人 → 選組別 → 點技能 → 排順位） ---- */
  if(mode==='person'){
    const fg = sessionStorage.getItem('lsp_skfg')||'all';
    const list = sortEmps(D.employees,'group').filter(e=>fg==='all'||e.group===fg);
    let sel = sessionStorage.getItem('lsp_sksel'); if(!list.some(e=>e.id===sel)) sel = list[0]&&list[0].id;
    const e = sel && L.emp(sel), arr = e ? S.skills[e.id] : [];
    const pg = (e && sessionStorage.getItem('lsp_skpg_'+e.id)) || (e && e.group);
    const groups = GROUP_ORDER.filter(g=>GROUP_SKILLS[g]);
    const cnt=g=>D.employees.filter(x=>x.group===g).length;
    main.innerHTML = head + `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><b>看哪一組：</b>
      ${[['all','全部',D.employees.length],...groups.filter(cnt).map(g=>[g,g,cnt(g)])].map(([k,t,n])=>`<button class="chip-btn ${fg===k?'on':''}" data-fg="${k}">${t} <small>${n}</small></button>`).join('')}</div>
    <div class="sk2">
      <div class="tbl-wrap sk2-list">${list.map(x=>{ const a=S.skills[x.id]; return `<button class="sk2-emp ${x.id===sel?'on':''} ${a.length?'':'empty'}" data-sel="${x.id}"><b>${esc(x.name)}</b> <small class="muted">${x.id}・${x.title}・${x.group}</small><div class="sk2-sum">${a.length?a.map((s,i)=>`<span>${'①②③④⑤⑥⑦⑧'[i]}${s}</span>`).join(''):'<span class="warn-t">還沒設定</span>'}</div></button>`; }).join('')||'<div class="muted" style="padding:16px">這一組沒有人</div>'}</div>
      ${e?`<div class="sk2-panel">
        <div class="sk2-ph"><div><b style="font-size:22px">${esc(e.name)}</b> <span class="muted">${e.id}　${e.title}・${e.group}</span></div>
          <label class="sk2-ref">照誰設定：<select id="skRef"><option value="">選一位同事…</option>${groups.filter(cnt).map(g=>`<optgroup label="${g}">${sortEmps(D.employees,'group').filter(x=>x.group===g&&x.id!==e.id).map(x=>`<option value="${x.id}">${esc(x.name)}（${x.title}）${S.skills[x.id].length?'：'+S.skills[x.id].map((s,i)=>'①②③④⑤⑥⑦⑧'[i]+s).join(' '):'：還沒設定'}</option>`).join('')}</optgroup>`).join('')}</select></label></div>
        <div class="sk2-step"><span class="num">1</span> 選組別</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${groups.map(g=>`<button class="chip-btn ${pg===g?'on':''}" data-pg="${g}">${g}${g===e.group?' <small>(本組)</small>':''}</button>`).join('')}</div>
        <div class="sk2-step"><span class="num">2</span> 點會做的技能（再點一次取消）</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">${(GROUP_SKILLS[pg]||[]).map(s=>{ const k=arr.indexOf(s); return `<button class="sk2-skill ${k>=0?'on':''}" data-tog="${s}"><i style="background:${L.taskColor(s)}"></i>${s}${k>=0?` <b>${'①②③④⑤⑥⑦⑧'[k]}</b>`:''}</button>`; }).join('')}</div>
        <div class="sk2-step"><span class="num">3</span> 排順位（① 最優先）</div>
        ${arr.length?arr.map((s,i)=>`<div class="sk2-row"><span class="rank on ${i===0?'first':''}">${i+1}</span><i style="background:${L.taskColor(s)}"></i><b style="flex:1">${s}</b>
          <button class="btn sm" data-up="${i}" ${i===0?'disabled':''} title="往上">▲</button><button class="btn sm" data-down="${i}" ${i===arr.length-1?'disabled':''} title="往下">▼</button><button class="btn sm" data-rm="${i}" style="color:var(--bad)" title="移除">✕</button></div>`).join(''):'<div class="muted" style="padding:10px 0">還沒有技能，請在上面第 2 步點選。</div>'}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;gap:10px;flex-wrap:wrap"><span class="muted">改了馬上存，不用另外按儲存。</span>${arr.length?'<button class="btn sm" id="skClr1" style="color:var(--bad)">清空這個人</button>':''}</div>
      </div>`:''}
    </div>
    <ul class="note-below"><li>跟其他組支援的技能（例如值班的人也會生鮮），在第 1 步切到那一組再點。</li><li>表格設定、列表設定，改的是同一份資料，兩邊會一樣。</li></ul>`;
    bindHead();
    main.querySelectorAll('[data-fg]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_skfg',b.dataset.fg); L.redraw(); });
    main.querySelectorAll('[data-sel]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_sksel',b.dataset.sel); L.redraw(); });
    if(!e) return;
    const edit=fn=>{ const before=order(arr); fn(); changed(e,before); };
    main.querySelector('#skRef').onchange=ev=>{ const r=L.emp(ev.target.value); if(!r) return;
      sessionStorage.setItem('lsp_skpg_'+e.id, r.group);
      edit(()=>{ arr.splice(0, arr.length, ...S.skills[r.id]); });
      L.toast(`已照 ${r.name} 設定`, `組別：${r.group}　技能：${order(S.skills[r.id])}`); };
    main.querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_skpg_'+e.id,b.dataset.pg); L.redraw(); });
    main.querySelectorAll('[data-tog]').forEach(b=>b.onclick=()=>edit(()=>{ const s=b.dataset.tog, k=arr.indexOf(s); if(k<0) arr.push(s); else arr.splice(k,1); }));
    main.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>edit(()=>{ const i=+b.dataset.up; [arr[i-1],arr[i]]=[arr[i],arr[i-1]]; }));
    main.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>edit(()=>{ const i=+b.dataset.down; [arr[i+1],arr[i]]=[arr[i],arr[i+1]]; }));
    main.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>edit(()=>arr.splice(+b.dataset.rm,1)));
    const c1=main.querySelector('#skClr1'); if(c1) c1.onclick=()=>edit(()=>arr.splice(0));
    return;
  }

  /* ---- 模式一：表格看全部（排序＋分組） ---- */
  const by = sessionStorage.getItem('lsp_skgrp')||'group';     // group | title | none
  const sk = JSON.parse(sessionStorage.getItem('lsp_sksort')||'null'); // {col,dir}
  let list = sortEmps(D.employees, by==='title'?'title':'group');
  if(sk){
    const val=e=> sk.col==='name'?e.name : sk.col==='title'?TITLE_ORDER.indexOf(e.title) : sk.col==='group'?GROUP_ORDER.indexOf(e.group) : (S.skills[e.id].includes(sk.col)?S.skills[e.id].indexOf(sk.col):99);
    list.sort((a,b)=>{ const x=val(a), y=val(b); return (x>y?1:x<y?-1:0)*sk.dir; });
    if(by!=='none'){ const key=e=>by==='title'?TITLE_ORDER.indexOf(e.title):GROUP_ORDER.indexOf(e.group); list.sort((a,b)=>key(a)-key(b)); } // 分組時組內排序（sort 穩定）
  }
  const arrow=c=> sk&&sk.col===c?(sk.dir>0?' ▲':' ▼'):'';
  const cols=[['name','姓名'],['title','職稱'],['group','組別'],...L.SKILLS.map(s=>[s,s])];
  let lastG=null;
  const rows=list.map(e=>{
    const g = by==='title'?e.title:(by==='group'?e.group:null);
    const gh = (by!=='none' && g!==lastG) ? `<tr class="grp-row"><td class="sticky">${esc(g)}　<small class="muted">${list.filter(x=>(by==='title'?x.title:x.group)===g).length} 人</small></td><td colspan="${2+L.SKILLS.length}"></td></tr>` : ''; lastG=g;
    return gh+`<tr><td class="sticky"><b>${esc(e.name)}</b><br><small class="muted">${e.id}</small></td><td>${e.title}</td><td>${e.group}</td>${L.SKILLS.map(s=>{ const k=S.skills[e.id].indexOf(s); return `<td><button class="rank ${k<0?'':'on'} ${k===0?'first':''}" data-id="${e.id}" data-s="${s}" title="${k<0?'點一下加入':'點一下改順位或取消'}">${k<0?'':k+1}</button></td>`; }).join('')}</tr>`;
  }).join('');
  main.innerHTML=head+`<div style="display:flex;gap:14px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><b>分組看：</b>
    <div class="seg-toggle">${[['group','依組別'],['title','依職稱'],['none','不分組']].map(([k,t])=>`<button data-by="${k}" class="${by===k?'on':''}">${t}</button>`).join('')}</div>
    <span class="muted">點表頭可以排序（再點一次反過來）</span>${sk?'<button class="btn sm" id="unsort">取消排序</button>':''}</div>
  <div class="tbl-wrap"><table class="g"><thead><tr>${cols.map(([c,t],i)=>`<th class="sort ${i===0?'sticky':''}" data-col="${c}">${t}${arrow(c)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
  <ul class="note-below"><li>技能只有 8 種：管理、值班、收銀、乾貨人力、生鮮擔當、生鮮人力、熟食擔當、熟食人力。顏色由總部「🎨 工作項目與顏色」設定。</li><li>點空格＝加在最後一個順位；點有數字的格子可以改順位或取消，其他順位自動補位。</li><li>點技能的表頭，會把這個技能順位高的人排前面。依組別、依職稱分組時，會在每一組裡面排序。</li></ul>`;
  bindHead();
  main.querySelectorAll('[data-by]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_skgrp',b.dataset.by); L.redraw(); });
  main.querySelectorAll('th[data-col]').forEach(th=>th.onclick=()=>{ const c=th.dataset.col; const dir = sk&&sk.col===c ? -sk.dir : 1; sessionStorage.setItem('lsp_sksort',JSON.stringify({col:c,dir})); L.redraw(); });
  const us=main.querySelector('#unsort'); if(us) us.onclick=()=>{ sessionStorage.removeItem('lsp_sksort'); L.redraw(); };
  main.querySelectorAll('.rank').forEach(b=>b.onclick=()=>{
    const id=b.dataset.id, s=b.dataset.s, arr=S.skills[id], e=L.emp(id), before=order(arr), k=arr.indexOf(s);
    const done=()=>changed(e,before);
    if(k<0){ arr.push(s); done(); return; }
    modal(`<h3>${esc(e.name)}　${s}</h3><div class="muted">現在是第 ${k+1} 順位。目前順序：${esc(order(arr))}</div>
      <div class="b" style="margin-top:12px">改成第幾順位：</div>
      <div class="picks">${arr.map((_,i)=>`<button data-to="${i}" class="${i===k?'cur':''}"><b>${i+1}</b>${i===0?'<small>最優先</small>':''}</button>`).join('')}</div>
      <div style="display:flex;justify-content:space-between;margin-top:8px"><button class="btn" data-rm style="border-color:var(--bad);color:var(--bad)">取消這個技能</button><button class="btn" data-x>關閉</button></div>`,(m,close)=>{
      m.querySelector('[data-x]').onclick=close;
      m.querySelector('[data-rm]').onclick=()=>{ arr.splice(k,1); close(); done(); };
      m.querySelectorAll('[data-to]').forEach(x=>x.onclick=()=>{ const to=Number(x.dataset.to); arr.splice(k,1); arr.splice(to,0,s); close(); done(); });
    });
  });
});

/* ============ 員工班別（門市自己填代號與時間） ============ */
route('/shifts',(main)=>{
  const S=L.S, mk=NW.key;
  const use={}; Object.values(S.months[mk].sched).forEach(r=>r.forEach(c=>{ if(L.isWork(c)) use[c]=(use[c]||0)+1; }));
  const tot=Object.values(use).reduce((a,b)=>a+b,0);
  const ord=sessionStorage.getItem('lsp_shsort')||'pct';
  const byTime=(a,b)=>L.tm(a[1].start)-L.tm(b[1].start) || L.tm(a[1].end)-L.tm(b[1].end);
  const list=Object.entries(S.shifts).sort(ord==='time'?byTime:((a,b)=>(use[b[0]]||0)-(use[a[0]]||0) || byTime(a,b)));
  const maxU=Math.max(1,...Object.values(use));
  const inp='font-size:18px;padding:6px 10px;border:1.5px solid var(--ink);border-radius:8px';
  main.innerHTML=`<div class="top"><h2>員工班別</h2><span class="muted">上下班時間從歷史班表抓出來，不能改；班別名稱由門市自己取（就是班表上顯示的字）；人次是 ${NW.m} 月（本月）的使用次數</span><div class="spacer"></div><button class="btn soft" id="add">＋ 新增班別</button></div>
  <div style="display:flex;gap:14px;align-items:center;margin-bottom:12px"><b>排序：</b><div class="seg-toggle">${[['pct','占比高→低'],['time','上班時間早→晚']].map(([k,t])=>`<button data-ord="${k}" class="${ord===k?'on':''}">${t}</button>`).join('')}</div></div>
  <div class="tbl-wrap"><table class="g" style="width:100%"><thead><tr><th>上班</th><th>下班</th><th>淨工時</th><th>早／晚</th><th>本月人次</th><th>占比</th><th style="text-align:left">班別名稱</th><th></th></tr></thead><tbody>
  ${list.map(([c,s])=>`<tr>
    <td style="font-size:20px;font-weight:700">${s.start}</td><td style="font-size:20px;font-weight:700">${s.end}</td>
    <td>${L.netH(c)} h</td><td>${L.tm(s.start)<L.tm('13:30')?'早班':'晚班'}</td><td>${use[c]||0}</td><td style="min-width:260px;text-align:left"><div style="display:flex;align-items:center;gap:10px"><div style="flex:1;height:22px;background:#eef1f6;border-radius:6px;overflow:hidden"><div style="height:100%;width:${(use[c]||0)/maxU*100}%;background:#6f9be0;border-radius:6px"></div></div><b style="width:58px;text-align:right">${tot?((use[c]||0)/tot*100).toFixed(1):0}%</b></div></td>
    <td style="text-align:left"><input data-code="${esc(c)}" value="${esc(c)}" style="${inp};width:160px;font-weight:400;border-color:var(--line)"></td>
    <td>${inUse(c)?'<small class="muted">使用中</small>':`<button class="btn sm" data-del="${esc(c)}">刪除</button>`}</td></tr>`).join('')}
  </tbody></table></div>
  <ul class="note-below"><li>班別名稱（A、A1、早晨、晚收銀…）由門市自己取，月班表格子上顯示的就是這個名稱；改名稱會一起改掉所有月份班表。名稱盡量短（2～4 個字），格子才放得下。</li><li>淨工時：班長 4 小時以下不扣休息；4～7 小時扣 30 分；7 小時以上扣 1 小時。13:30 以前上班算早班。</li><li>有排在任何月份班表上的班別不能刪，要先在月班表換掉。</li></ul>`;
  main.querySelectorAll('[data-ord]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_shsort',b.dataset.ord); L.redraw(); });
  function inUse(c){ return Object.values(S.months).some(M=>Object.values(M.sched).some(r=>r.includes(c))); }
  main.querySelectorAll('[data-code]').forEach(i=>i.onchange=()=>{
    const old=i.dataset.code, v=i.value.trim();
    if(!v || v===old) { i.value=old; return; }
    if(S.shifts[v] || ['休','例'].includes(v) || L.SPECIAL[v]){ toast('不能用這個名稱',`「${esc(v)}」已經有了或是保留字（休、例）。`); i.value=old; return; }
    S.shifts[v]=S.shifts[old]; delete S.shifts[old];
    if(S.shiftNames[old]!==undefined){ S.shiftNames[v]=S.shiftNames[old]; delete S.shiftNames[old]; }
    Object.values(S.months).forEach(M=>{ Object.values(M.sched).forEach(r=>r.forEach((c,k)=>{ if(c===old) r[k]=v; })); Object.values(M.dayPlans).forEach(p=>Object.values(p).forEach(row=>{ if(row.code===old) row.code=v; })); });
    L.log('班別',`改班別名稱`,old,v); L.redraw();
  });
  const setTime=(c,k,val)=>{ S.shifts[c][k]=val; Object.values(S.months).forEach(M=>M.dayPlans={}); L.log('班別',`${c} ${k==='start'?'上班':'下班'}時間`,'',val); L.redraw(); };
  main.querySelectorAll('[data-st]').forEach(i=>i.onchange=()=>setTime(i.dataset.st,'start',i.value));
  main.querySelectorAll('[data-en]').forEach(i=>i.onchange=()=>setTime(i.dataset.en,'end',i.value));
  main.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ const c=b.dataset.del; if(!confirm(`刪除班別「${c}」？`)) return; delete S.shifts[c]; L.log('班別','刪除',c,''); L.redraw(); });
  main.querySelector('#add').onclick=()=>modal(`<h3>新增班別</h3><div class="form-grid"><label>班別名稱<input id="nc" placeholder="例如 C2、午班"></label><label>上班<input id="ns" type="time" value="09:00" step="900"></label><label>下班<input id="ne" type="time" value="13:00" step="900"></label></div>
    <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px"><button class="btn" data-x>取消</button><button class="btn pri" data-ok>新增</button></div>`,(m,close)=>{
    m.querySelector('[data-x]').onclick=close;
    m.querySelector('[data-ok]').onclick=()=>{ const c=m.querySelector('#nc').value.trim(); if(!c||S.shifts[c]||['休','例'].includes(c)){ toast('名稱不能用','請換一個沒用過的名稱。'); return; }
      S.shifts[c]={start:m.querySelector('#ns').value,end:m.querySelector('#ne').value}; close(); L.log('班別','新增',`${c}`,`${S.shifts[c].start}～${S.shifts[c].end}`); L.redraw(); };
  });
});

/* ============ 門市基本資料（最少人力三種看法） ============ */
const fmtSlot=i=>L.fmt(L.SLOT0+i*30);
function timeSel(key,val){ let o=''; for(let m=0;m<=1440;m+=15){ const t=m===1440?'24:00':L.fmt(m); o+=`<option ${t===val?'selected':''}>${t}</option>`; }
  return `<select class="sel-big" data-tk="${key}" style="font-size:19px;padding:6px 8px">${o}</select>`; }
route('/store',(main)=>{
  const S=L.S, si=S.storeInfo, mode=S.staffMode;
  const f=[['open','開店'],['close','閉店'],['bizStart','營業開始'],['bizEnd','營業結束'],['peak1','尖峰時段 1'],['peak2','尖峰時段 2'],['dc1','物流 1 配到貨'],['dc2','物流 2 配到貨'],['fresh','生鮮到貨']];
  main.innerHTML=`<div class="top"><h2>門市基本資料</h2><span class="muted">${D.store.name}</span><div class="spacer"></div><button class="btn pri" id="sv">儲存</button></div>
  <div class="card"><div class="form-grid">${f.map(([k,t])=>{ const v=String(si[k]||''); const rng=v.includes('~');
      if(rng){ const [a,b]=v.split('~'); return `<label>${t}<span style="display:flex;gap:6px;align-items:center">${timeSel(k+'|a',a)}～${timeSel(k+'|b',b)}</span></label>`; }
      return `<label>${t}${timeSel(k,v)}</label>`; }).join('')}</div></div>
  <div class="card">
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:12px"><span class="b" style="font-size:22px">最少人力</span>
      <div class="seg-toggle">${[['table','表格版（每半小時）'],['hour','依時段（拉長條）'],['simple','簡易版（每天）']].map(([k,t])=>`<button data-mode="${k}" class="${mode===k?'on':''}">${t}</button>`).join('')}</div></div>
    <div id="staffBody"></div>
  </div>`;
  const body=main.querySelector('#staffBody');
  if(mode==='simple') simpleStaff(body); else if(mode==='hour') hourStaff(body); else tableStaff(body);
  body.insertAdjacentHTML('afterbegin', staffSummary(mode));
  main.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{ S.staffMode=b.dataset.mode; L.save(); L.redraw(); });
  main.querySelector('#sv').onclick=()=>{
    main.querySelectorAll('[data-k]').forEach(i=>{ if(i.dataset.i!==undefined) S.staffing[i.dataset.i][i.dataset.k]=i.value; });
    main.querySelectorAll('[data-tk]').forEach(i=>{ const [k,part]=i.dataset.tk.split('|'); if(!part) si[k]=i.value; else { const cur=String(si[k]).split('~'); cur[part==='a'?0:1]=i.value; si[k]=cur.join('~'); } });
    L.log('門市','儲存門市基本資料'); toast('已儲存','門市基本資料已更新。','info');
  };
});
/* 最少人力換算成一個月的工時，跟目標／可用時數比，看會不會爆工時 */
const PER_PERSON=8;   // 簡易版：1 個人＝1 個班，淨工時 8 小時
function firstNum(v){ return parseInt(String(v),10)||0; }
function simpleDay(dw){ const k=dw===1?'mon':(dw===6?'sat':'wk'); return L.S.staffing.reduce((a,s)=>a+firstNum(s[k])*PER_PERSON,0); }
function staffSummary(mode){
  const S=L.S, mm=NX, st=D.store;
  let daily, month, how;
  if(mode==='simple'){
    month=0; for(let d=1; d<=mm.days; d++) month+=simpleDay(L.dow(d,mm));
    daily=`週一 ${simpleDay(1)}／平日 ${simpleDay(2)}／週六 ${simpleDay(6)}`;
    how=`每個人算 1 個班（淨工時 ${PER_PERSON} 小時）；「2~3」先用小的數字。${mm.m} 月逐日加總。`;
  } else {
    const per=L.SKILLS.reduce((a,s)=>a+S.req[s].reduce((x,y)=>x+y,0),0)/2;
    daily=String(per); month=per*mm.days;
    how=`每半小時的人數 × 0.5 小時＝每天人時；× ${mm.days} 天（${mm.m} 月）。`;
  }
  const over=month>st.budget, overT=month>S.target;
  const stTxt = over?`<b class="bad">⚠ 超過可用時數 ${n(month-st.budget)} hr（爆工時）</b>`:(overT?`<b style="color:var(--warn)">⚠ 超過目標 ${n(month-S.target)} hr，但還在可用時數內</b>`:`<b class="okc">✓ 在目標內，還剩 ${n(S.target-month)} hr 可以彈性排</b>`);
  return `<div class="kpi" style="margin-bottom:6px">
    <div class="k"><small>每天最少人時</small><b style="font-size:${mode==='simple'?'18px':'24px'}">${daily}</b> 人時</div>
    <div class="k"><small>換算 ${mm.m} 月（${mm.days} 天）</small><b class="${over?'bad':''}">${n(month)}</b> hr</div>
    <div class="k"><small>目標排班工時</small><b>${n(S.target)}</b> hr</div>
    <div class="k"><small>可用時數</small><b>${n(st.budget)}</b> hr</div>
  </div><div style="margin-bottom:12px;font-size:18px">${stTxt}　<small class="muted">${how}</small></div>`;
}
function simpleStaff(box){
  const S=L.S;
  box.innerHTML=`<div class="muted" style="margin-bottom:8px">客戶原本的每天最少人數（照星期分）。</div>
  <div class="tbl-wrap"><table class="g" style="width:100%"><thead><tr><th style="text-align:left">職務</th><th>週一</th><th>週二～五、日</th><th>週六</th><th>平日換算人時</th><th style="text-align:left">怎麼算</th></tr></thead><tbody>
  ${S.staffing.map((s,i)=>`<tr><td style="text-align:left"><b>${esc(s.job)}</b></td>${['mon','wk','sat'].map(k=>`<td><input data-i="${i}" data-k="${k}" value="${esc(s[k])}" style="width:70px;font-size:18px;text-align:center;padding:4px;border:1.5px solid var(--line);border-radius:8px"></td>`).join('')}<td><b>${firstNum(s.wk)*PER_PERSON}</b></td><td style="text-align:left;white-space:normal;max-width:420px"><small>${esc(s.rule)}</small></td></tr>`).join('')}
  </tbody></table></div>`;
}
function runs(arr){ const out=[]; let i=0; while(i<arr.length){ if(!arr[i]){ i++; continue; } let j=i; while(j+1<arr.length&&arr[j+1]===arr[i]) j++; out.push({a:i,b:j+1,n:arr[i]}); i=j+1; } return out; }
function hourStaff(box){
  const S=L.S, PX=1.6, W=L.NSLOT*30*PX;
  const hrs=[...Array(L.NSLOT/2)].map((_,i)=>L.SLOT0+i*60);
  const total=[...Array(L.NSLOT)].map((_,i)=>L.SKILLS.reduce((a,s)=>a+(S.req[s][i]||0),0));
  const manH = total.reduce((a,b)=>a+b,0)/2;
  const peak = Math.max(...total);
  box.innerHTML=`<div class="muted" style="margin-bottom:8px">每個技能在哪些時段要幾個人。點長條可以改時間和人數；點空白處可以新增一段。（照 Miro「關鍵職務／必要人力」）</div>
  <div class="kpi" style="margin-bottom:10px"><div class="k"><small>全日必要人時</small><b>${manH}</b> 人時</div><div class="k"><small>最多同時</small><b>${peak}</b> 人</div></div>
  <div class="tbl-wrap" style="max-height:none"><div style="width:${W+150}px">
    <div style="display:flex;background:#f0f3f8;border-bottom:1.5px solid var(--line);position:sticky;top:0;z-index:3"><div style="width:150px;flex:none;padding:6px 10px;font-weight:700;position:sticky;left:0;background:#f0f3f8">技能</div>
      <div style="position:relative;width:${W}px;height:34px">${hrs.map(m=>`<div style="position:absolute;left:${(m-L.SLOT0)*PX}px;top:6px;font-weight:700;font-size:15px;transform:translateX(-50%)">${L.fmt(m).slice(0,2)}</div>`).join('')}</div></div>
    ${L.SKILLS.map(s=>`<div style="display:flex;border-bottom:1px solid #e3e6ec"><div style="width:150px;flex:none;padding:10px;position:sticky;left:0;background:#fff;z-index:2;border-right:1px solid var(--line)"><i style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${L.taskColor(s)};border:1px solid #999;vertical-align:-2px"></i> <b>${s}</b></div>
      <div class="rq" data-s="${s}" style="position:relative;width:${W}px;height:52px;cursor:copy;background-image:repeating-linear-gradient(90deg,transparent 0,transparent ${60*PX-1}px,#e3e6ec ${60*PX-1}px,#e3e6ec ${60*PX}px)">
      ${runs(S.req[s]).map(r=>`<div class="rqb" data-s="${s}" data-a="${r.a}" data-b="${r.b}" style="position:absolute;left:${r.a*30*PX}px;width:${(r.b-r.a)*30*PX}px;top:7px;height:38px;background:${L.taskColor(s)};border:1.5px solid rgba(0,0,0,.35);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;cursor:pointer;white-space:nowrap;overflow:hidden">${r.n} 人　<small>${fmtSlot(r.a)}～${fmtSlot(r.b)}</small></div>`).join('')}
      </div></div>`).join('')}
    <div style="display:flex;background:#f7f8fb"><div style="width:150px;flex:none;padding:8px 10px;position:sticky;left:0;background:#f7f8fb;font-weight:700;border-right:1px solid var(--line)">全店合計</div>
      <div style="position:relative;width:${W}px;height:36px">${total.map((t,i)=>`<div style="position:absolute;left:${i*30*PX}px;width:${30*PX}px;top:0;bottom:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700">${t||''}</div>`).join('')}</div></div>
  </div></div>`;
  box.querySelectorAll('.rqb').forEach(b=>b.onclick=ev=>{ ev.stopPropagation(); editRun(b.dataset.s, Number(b.dataset.a), Number(b.dataset.b)); });
  box.querySelectorAll('.rq').forEach(r=>r.onclick=ev=>{ const rect=r.getBoundingClientRect(); const i=Math.max(0,Math.min(L.NSLOT-2,Math.floor((ev.clientX-rect.left)/(30*PX)))); editRun(r.dataset.s,i,i+2,true); });
}
function editRun(s,a,b,isNew){
  const S=L.S, cur=isNew?1:S.req[s][a];
  const opt=(sel)=>[...Array(L.NSLOT+1)].map((_,i)=>`<option value="${i}" ${i===sel?'selected':''}>${fmtSlot(i)}</option>`).join('');
  modal(`<h3>${s}　${isNew?'新增時段':'修改時段'}</h3>
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:20px">從 <select class="sel-big" id="ra">${opt(a)}</select> 到 <select class="sel-big" id="rb">${opt(b)}</select>
      要 <select class="sel-big" id="rn">${[1,2,3,4,5,6,7,8].map(x=>`<option ${x===cur?'selected':''}>${x}</option>`).join('')}</select> 人</div>
    <div style="display:flex;justify-content:space-between;margin-top:18px">${isNew?'<span></span>':'<button class="btn" data-del style="border-color:var(--bad);color:var(--bad)">🗑 刪除這段</button>'}<div><button class="btn" data-x>取消</button> <button class="btn pri" data-ok>確定</button></div></div>`,(m,close)=>{
    m.querySelector('[data-x]').onclick=close;
    const del=m.querySelector('[data-del]'); if(del) del.onclick=()=>{ for(let i=a;i<b;i++) S.req[s][i]=0; close(); L.log('最少人力',`${s} 刪除 ${fmtSlot(a)}～${fmtSlot(b)}`); L.redraw(); };
    m.querySelector('[data-ok]').onclick=()=>{ const na=Number(m.querySelector('#ra').value), nb=Number(m.querySelector('#rb').value), nn=Number(m.querySelector('#rn').value);
      if(nb<=na){ toast('時間不對','結束要比開始晚。'); return; }
      if(!isNew) for(let i=a;i<b;i++) S.req[s][i]=0;
      for(let i=na;i<nb;i++) S.req[s][i]=nn; close(); L.log('最少人力',`${s} ${fmtSlot(na)}～${fmtSlot(nb)}`,'',`${nn} 人`); L.redraw(); };
  });
}
function tableStaff(box){
  const S=L.S;
  box.innerHTML=`<div class="muted" style="margin-bottom:8px">每個技能、每半小時最少要幾個人（照 GPT 版／Miro 表格版）。直接改數字，改完自動存。</div>
  <div class="tbl-wrap"><table class="g"><thead><tr><th class="sticky">技能</th>${[...Array(L.NSLOT)].map((_,i)=>`<th style="font-size:13px;padding:4px">${fmtSlot(i)}</th>`).join('')}<th>人時</th></tr></thead><tbody>
  ${L.SKILLS.map(s=>`<tr><td class="sticky"><i style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${L.taskColor(s)};border:1px solid #999;vertical-align:-2px"></i> <b>${s}</b></td>${S.req[s].map((v,i)=>`<td style="padding:3px"><input class="req-in ${v?'nz':''}" data-s="${s}" data-i="${i}" value="${v||''}"></td>`).join('')}<td><b>${S.req[s].reduce((a,b)=>a+b,0)/2}</b></td></tr>`).join('')}
  </tbody><tfoot><tr><td class="sticky">合計</td>${[...Array(L.NSLOT)].map((_,i)=>`<td>${L.SKILLS.reduce((a,s)=>a+(S.req[s][i]||0),0)||''}</td>`).join('')}<td>${L.SKILLS.reduce((a,s)=>a+S.req[s].reduce((x,y)=>x+y,0),0)/2}</td></tr></tfoot></table></div>`;
  box.querySelectorAll('.req-in').forEach(i=>i.onchange=()=>{ const v=Math.max(0,parseInt(i.value,10)||0); S.req[i.dataset.s][i.dataset.i]=v; L.log('最少人力',`${i.dataset.s} ${fmtSlot(Number(i.dataset.i))}`,'',`${v} 人`); L.redraw(); });
}

/* ============ 出勤檢核（示意，12 月今天以前） ============ */
route('/attendance',(main)=>{
  const S=L.S, t=L.today(), d=t.d-1, M=S.months[NW.key];
  const rows=D.employees.filter(e=>L.isWork(M.sched[e.id][d-1])).slice(0,6).map((e,i)=>{
    const s=L.shiftOf(M.sched[e.id][d-1]);
    const cases=[['遲到 18 分',L.fmt(L.tm(s.start)+18),s.end,'可調整班表解除異常'],['上班未刷卡','—',s.end,'補刷卡'],['延後下班 45 分',s.start,L.fmt(L.tm(s.end)+45),'加班申請'],['正常',s.start,s.end,''],['早退 30 分',s.start,L.fmt(L.tm(s.end)-30),'請假或調整班表'],['正常',s.start,s.end,'']][i];
    return {e,s,c:cases};
  }).filter(x=>x.c[0]!=='正常');
  main.innerHTML=`<div class="top"><h2>出勤檢核</h2><span class="muted">昨天 ${NW.m}/${d}（${L.DOW[L.dow(d,NW)]}）（示意資料）</span></div>
  <div class="tbl-wrap"><table class="g" style="width:100%"><thead><tr><th>姓名</th><th>班別</th><th>上班卡</th><th>下班卡</th><th>異常</th><th>建議</th><th>處理</th></tr></thead><tbody>
  ${rows.map(x=>`<tr><td><b>${esc(x.e.name)}</b></td><td>${x.s.start}～${x.s.end}</td><td>${x.c[1]}</td><td>${x.c[2]}</td><td class="bad b">${x.c[0]}</td><td>${x.c[3]}</td><td><button class="btn sm">待處理</button></td></tr>`).join('')}
  </tbody></table></div>
  <ul class="note-below"><li>這頁還是示意，跟 Miro「出勤檢核」與 GPT 版一樣：差 30 分鐘以上或缺卡列為異常；加班累計之後補。</li></ul>`;
});

/* ============ 異動紀錄 ============ */
route('/changes',(main)=>{
  const S=L.S;
  main.innerHTML=`<div class="top"><h2>異動紀錄</h2><span class="muted">這個示範裡做過的每一個動作（日期用示範的「今天」）</span></div>
  ${S.log.length?`<div class="tbl-wrap"><table class="g" style="width:100%"><thead><tr><th>時間</th><th>類別</th><th style="text-align:left">項目</th><th>異動前</th><th>異動後</th><th>操作人</th></tr></thead><tbody>
  ${S.log.map(x=>`<tr><td>${esc(x.t)}</td><td>${esc(x.type)}</td><td style="text-align:left">${esc(x.what)}</td><td>${esc(x.before)}</td><td>${esc(x.after)}</td><td>${esc(x.who)}</td></tr>`).join('')}</tbody></table></div>`
  :'<div class="empty-page">還沒有任何異動。改班表、排休、技能之後，這裡就會記下來。</div>'}`;
});

/* ============ 總部：班別狀況報表 ============ */
route('/hq/report',(main)=>{
  const S=L.S, M=S.months[NX.key];
  const live = !M.generated?['未產生','muted']:(M.status==='sent'?['已送出','okc']:['排班中','bad']);
  const stores=[['北一處','三重區',D.store.name+'（本示範）',live],['北一處','三重區','三重正義',['已送出','okc']],['北一處','新莊區','新莊中正',['排班中','bad']],['北二處','內湖區','內湖成功',['已送出','okc']],['北二處','內湖區','大直敬業',['未產生','muted']],['北二處','松山區','松山八德',['已送出','okc']]];
  main.innerHTML=`<div class="top"><h2>班別狀況報表</h2><span class="muted">${NX.y} 年 ${NX.m} 月班表</span></div>
  <div class="card" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">處 <select class="sel-big" id="c1" style="font-size:18px"><option>全部</option><option>北一處</option><option>北二處</option></select>
    區 <select class="sel-big" id="c2" style="font-size:18px"><option>全部</option><option>三重區</option><option>新莊區</option><option>內湖區</option><option>松山區</option></select></div>
  <div class="tbl-wrap"><table class="g" style="width:100%"><thead><tr><th>處</th><th>區</th><th style="text-align:left">門市</th><th>班表狀態</th></tr></thead><tbody id="tb"></tbody></table></div>
  <ul class="note-below"><li>本示範門市的狀態跟著 ${NX.m} 月班表變化：送出→已送出；送出後按編輯→排班中。其他門市是示意。</li></ul>`;
  const draw=()=>{ const a=main.querySelector('#c1').value, b=main.querySelector('#c2').value;
    main.querySelector('#tb').innerHTML=stores.filter(s=>(a==='全部'||s[0]===a)&&(b==='全部'||s[1]===b)).map(s=>`<tr><td>${s[0]}</td><td>${s[1]}</td><td style="text-align:left"><b>${s[2]}</b></td><td class="${s[3][1]} b">${s[3][0]}</td></tr>`).join(''); };
  main.querySelector('#c1').onchange=draw; main.querySelector('#c2').onchange=draw; draw();
});

/* ============ 總部：工作項目與顏色 ============ */
const PALETTE=['#c6dcff','#9cc2ff','#ffd6a5','#ffb870','#ffe999','#fff6b6','#adf0c7','#7fd9a4','#f4a6a6','#ffd6d6','#c9a7f0','#e9dcfb','#b8e8f0','#e2e2e2','#d4c4a8','#ffc6e5'];
route('/hq/tasks',(main)=>{
  const S=L.S;
  main.innerHTML=`<div class="top"><h2>工作項目與顏色</h2><span class="muted">全部門市共用；門市「日作業表」的工作方塊會用這裡的顏色</span><div class="spacer"></div><button class="btn soft" id="add">＋ 新增工作項目</button></div>
  <div class="card">${S.tasks.map((t,i)=>`<div class="task-row">
     <div class="task-prev" style="background:${t.color}">${esc(t.name)}</div>
     <input data-name="${i}" value="${esc(t.name)}" ${t.name==='休息'?'disabled':''} style="font-size:19px;padding:8px 12px;border:1.5px solid var(--ink);border-radius:10px;width:170px">
     <div style="display:flex;gap:8px;flex-wrap:wrap">${PALETTE.map(c=>`<div class="swatch ${c===t.color?'on':''}" data-i="${i}" data-c="${c}" style="background:${c}"></div>`).join('')}</div>
     <label class="muted" style="font-size:15px">自訂 <input type="color" data-cc="${i}" value="${t.color}" style="width:44px;height:44px;border:0;background:none"></label>
     ${t.name==='休息'?'':`<button class="btn sm" data-del="${i}">刪除</button>`}
   </div>`).join('')}</div>
  <ul class="note-below"><li>改完立即生效，門市打開日作業表就會看到新顏色。</li><li>刪除工作項目後，已排進日作業表的方塊會變成灰色「(已刪除)」。</li></ul>`;
  const done=(what)=>{ L.log('工作項目',what); L.redraw(); };
  main.querySelectorAll('.swatch').forEach(s=>s.onclick=()=>{ S.tasks[s.dataset.i].color=s.dataset.c; done(`${S.tasks[s.dataset.i].name} 顏色`); });
  main.querySelectorAll('[data-cc]').forEach(s=>s.onchange=()=>{ S.tasks[s.dataset.cc].color=s.value; done(`${S.tasks[s.dataset.cc].name} 顏色`); });
  main.querySelectorAll('[data-name]').forEach(s=>s.onchange=()=>{ const t=S.tasks[s.dataset.name]; const old=t.name; const v=s.value.trim(); if(!v) return;
    t.name=v; Object.values(S.months).forEach(M=>Object.values(M.dayPlans).forEach(p=>Object.values(p).forEach(r=>r.segs.forEach(g=>{ if(g.t===old) g.t=v; }))));
    Object.values(S.skills).forEach(a=>{ const k=a.indexOf(old); if(k>=0) a[k]=v; }); done(`改名 ${old}→${v}`); });
  main.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ const t=S.tasks[b.dataset.del]; if(!confirm(`刪除「${t.name}」？`)) return; S.tasks.splice(b.dataset.del,1); done(`刪除 ${t.name}`); });
  main.querySelector('#add').onclick=()=>{ const v=prompt('新工作項目名稱'); if(!v) return; S.tasks.splice(S.tasks.length-1,0,{name:v.trim(),color:PALETTE[S.tasks.length%PALETTE.length]}); done(`新增 ${v}`); };
});
['/hq/stores','/hq/shifts','/hq/special'].forEach(p=>route(p,(main)=>{
  const t={'/hq/stores':'門市新增','/hq/shifts':'共用班別','/hq/special':'特殊日設定'}[p];
  main.innerHTML=`<div class="top"><h2>${t}</h2></div><div class="empty-page">這頁之後補（Miro 有建議版，下一輪做）。</div>`;
}));
})();
