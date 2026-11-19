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
const statusPill = (M,mm) => mm.kind==='past'?'<span class="pill sent">已結束・只能看</span>':(M.status==='sent'?'<span class="pill sent">已送出・只能看</span>':(M.status==='saved'?'<span class="pill saved">草稿・已存檔</span>':'<span class="pill draft">草稿・還沒存檔</span>'));
function schedTabs(cur){
  return `<div class="tabs"><button data-h="#/month" class="${cur==='m'?'on':''}">月班表</button><button data-h="#/day" class="${cur==='d'?'on':''}">日作業表</button></div>`;
}
function bindTabs(main){ main.querySelectorAll('button[data-h]').forEach(b=>b.onclick=()=>location.hash=b.dataset.h); }
/* 班表上方精簡工具列（照 GPT 版）：第 1 列 模式＋月／日切換；第 2 列 左：月份、顯示、看哪些人；右：按鈕＋數字 */
function schedHead(cur, o){ o=o||{};
  return `<div class="sh"><div class="sh-r1">${L.modeSeg()}<div class="spacer"></div><div class="seg big">${[['m','#/month','📅 月班表'],['d','#/day','🕘 日作業表']].map(([k,h,t])=>`<button data-h="${h}" class="${cur===k?'on':''}">${t}</button>`).join('')}</div></div>
  <div class="sh-r2"><div class="sh-left"><div class="sh-line">${L.monthChips()}${o.line1||''}</div>${o.line2||''}</div>
    <div class="sh-right">${o.right?`<div class="sh-btns">${o.right}</div>`:''}${o.kpi?`<div class="sh-kpi">${o.kpi}</div>`:''}</div></div>${o.note?`<div class="sh-note">${o.note}</div>`:''}</div>`; }
const STAT_BY_GROUP={'管理':['管理'],'值班':['值班'],'乾貨':['收銀','乾貨人力'],'生鮮':['生鮮擔當','生鮮人力'],'熟食':['熟食擔當','熟食人力']};
L.STAT_BY_GROUP=STAT_BY_GROUP;
L.schedTabs=schedTabs; L.schedHead=schedHead; L.sortEmps=(l,b)=>sortEmps(l,b); L.bindTabs=bindTabs; L.statusPill=statusPill; L.SPECIAL=SPECIAL;
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
  main.innerHTML=`<div class="top"><h2>${L.modeTitle()}</h2><span class="muted">準備 ${NX.y} 年 ${NX.m} 月</span></div>${L.monthBar()}`;
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

/* 不可排班時段：回傳衝突的時段文字（沒有就回空） */
function unavailHit(id, dw, st, en){ const list=(L.S.unavail||{})[id]||[]; let a=L.tm(st), b=L.tm(en); if(b<=a) b+=1440;
  const h=list.find(u=>u.d===dw && L.tm(u.a)<b && L.tm(u.b)>a); return h?`${h.a}～${h.b}`:''; }
/* ============ 月班表 ============ */
route('/month', (main)=>{
  const S=L.S, mm=L.curMon(), M=L.curM();
  if(!M.generated){ main.innerHTML=L.monthBar(); L.bindMonthBar(main,'#/month'); prepPage(main); return; }
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
  const head = days.map(d=>`<th class="dlink ${L.dow(d,mm)%6===0?'wk-sun':''}" data-dd="${d}" title="點一下看 ${mm.m}/${d} 的日作業表" style="${isToday(d)?'background:#fff6b6':''}">${d}<br><small>${isToday(d)?'今天':L.DOW[L.dow(d,mm)]}</small></th>`+(wkEnd(d)?`<th class="wkh">週<br>工時</th>`:'')).join('');
  const ef=L.empF(), EMP=D.employees.filter(L.empFilterFn(ef)), fl=ef!=='all';
  const rows = sortEmps(EMP,'group').map(e=>{
    const lim=e.ft?48:40;
    const cells = days.map(d=>{
      const c=M.sched[e.id][d-1]; const sh=L.shiftOf(c);
      const cls = sh?'':(SPECIAL[c]?'sp':(c==='例'?'rest':(c==='休'?'off':'empty')));
      const k=e.id+'_'+d;
      const adj = sh && M.adj && M.adj[k], st0 = adj?adj.start:(sh&&sh.start), en0 = adj?adj.end:(sh&&sh.end);
      const ua = sh && unavailHit(e.id, L.dow(d,mm), st0, en0);
      const inner = sh ? (mode==='code'?`<div class="c">${c}${adj?'<sup class="adj-m">調</sup>':''}</div><div class="t">${st0}</div>`:`<div style="font-size:13px;font-weight:700">${st0}<br>${en0}${adj?'<sup class="adj-m">調</sup>':''}</div>`)+`<div class="t hrs">${L.hrsTag(c)}</div>` : `<div class="c">${cellText(c)}</div>`;
      return `<td class="cell ${cls} ${errSet.has(k)?'err':(warnSet.has(k)?'wrn':'')} ${M.changed[k]?'chg':''} ${ua?'ua':''}" data-id="${e.id}" data-d="${d}" ${ua?`title="排到不可排班時段：${ua}"`:''}>${inner}</td>`+(wkEnd(d)?wkCell(e,d,lim):'');
    }).join('');
    return `<tr><td class="sticky" style="min-width:150px"><b>${esc(e.name)}</b><br><small class="muted">${e.title}・${e.group||'未選組別'}</small></td><td><b>${L.monthHours(e.id,mm.key)}</b></td>${cells}</tr>`;
  }).join('');
  function wkCell(e,d,lim){ const h=M.sched[e.id].slice(wkStart(d)-1,d).reduce((a,c)=>a+L.netH(c),0); const full=d-wkStart(d)+1===7;
    return `<td class="wkc ${h>lim?'over':''}" title="${mm.m}/${wkStart(d)}～${mm.m}/${d}${full?'':'（不滿一週）'}，上限 ${lim} 小時">${h}</td>`; }
  const cnt = days.map(d=>EMP.filter(e=>L.isWork(M.sched[e.id][d-1])).length);
  // 下方統計：每個人用技能 ①（還沒設定就用歷史資料的技能）
  // 篩選某一組時，下面技能統計只列那一組的技能；跟上班人數一樣只算篩選到的人（技能加起來＝上班人數）
  let statSkills = ef.startsWith('g:') ? (STAT_BY_GROUP[ef.slice(2)]||L.SKILLS).slice() : L.SKILLS.slice();
  EMP.forEach(e=>{ const p=(S.skills[e.id]||[])[0]; if(p && !statSkills.includes(p)) statSkills.push(p); });   // 組裡有人 ① 是別組技能，也列出來，數字才加得起來
  statSkills = L.SKILLS.filter(x=>statSkills.includes(x));
  const primSkill=e=>(S.skills[e.id]&&S.skills[e.id][0])||'';   // 只看店長設定的技能 ①
  const noSkill=EMP.some(e=>!primSkill(e));
  // fn(d) 回傳那天符合的人；滑鼠移到數字上會浮出名字
  const statRow=(label,fn,cls)=>`<tr class="${cls}"><td class="sticky">${label}</td><td></td>${days.map(d=>{ const ps=sortEmps(fn(d),'group'), v=ps.length; return `<td>${v?`<span class="tip" data-tip="${mm.m}/${d}：${ps.map(e=>e.name).join('、')}">${v}</span>`:'<span class="muted">0</span>'}</td>`+(wkEnd(d)?'<td class="wkc"></td>':''); }).join('')}</tr>`;
  const wkTot = d=>EMP.reduce((a,e)=>a+M.sched[e.id].slice(wkStart(d)-1,d).reduce((x,c)=>x+L.netH(c),0),0);
  main.innerHTML=schedHead('m',{
    line1:`${statusPill(M,mm)}<span class="lbl" style="margin-left:10px">顯示</span><div class="seg">${[['code','名稱'],['time','時間']].map(([k,t])=>`<button data-mode="${k}" class="${mode===k?'on':''}">${t}</button>`).join('')}</div>`,
    line2:`<div class="sh-line">${L.empFilterBar()}</div>`,
    right:`<button class="btn" id="law">⚖ 勞基法檢核</button>${past?'':(sent?`<button class="btn soft" id="edit">✎ 編輯</button>`:`<button class="btn soft" id="saveD" ${M.status==='saved'?'disabled':''}>💾 儲存草稿</button><button class="btn pri" id="send" ${M.status!=='saved'?'disabled':''}>📤 送出</button>`)}`,
    kpi:`<div><small>已排班工時</small><b>${n(tot)}</b> hr</div>${mm.kind==='next'?`<div><small>目標</small><b>${n(tgt)}</b> hr</div><div><small>差距</small><b class="${tot<tgt?'bad':''}">${tot-tgt>0?'+':''}${n(tot-tgt)}</b></div>`:''}<div><small>勞基法</small><b class="${block.length?'bad':'okc'}" style="font-size:18px">${block.length?'⚠ '+block.length+' 個問題':'✓ 沒問題'}</b>${issues.length-block.length?`<small>另 ${issues.length-block.length} 個提醒</small>`:''}</div>`,
    note: past?'這是過去的月份，只能看。':(sent?`已送出，班表是唯讀。${mm.kind==='now'?'要調班':'要修改'}請按右上「✎ 編輯」，改完要再送出。`:'')
  });
  L.bindMonthBar(main,'#/month');
  main.insertAdjacentHTML('beforeend',`
  <div class="tbl-wrap ${ro?'ro':''}"><table class="g"><thead><tr><th class="sticky">姓名</th><th>總工時</th>${head}</tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td class="sticky">上班人數${fl?'<br><small class="muted">（只算篩選的人）</small>':''}</td><td></td>${cnt.map((c,i)=>`<td><span class="tip" data-tip="${mm.m}/${i+1}：${sortEmps(EMP.filter(e=>L.isWork(M.sched[e.id][i])),'group').map(e=>e.name).join('、')}">${c}</span></td>`+(wkEnd(i+1)?`<td class="wkc">${n(wkTot(i+1))}</td>`:'')).join('')}</tr>
      ${statRow('休假人數', d=>EMP.filter(e=>['休','例'].includes(M.sched[e.id][d-1])), 'st-off')}
      <tr class="st-sep"><td class="sticky">技能（看 ① 最優先${fl?'，只算篩選的人':''}）</td><td></td>${days.map(d=>'<td></td>'+(wkEnd(d)?'<td class="wkc"></td>':'')).join('')}</tr>
      ${statSkills.map(sk=>statRow(`<i class="st-dot" style="background:${L.taskColor(sk)}"></i>${sk}`, d=>EMP.filter(e=>L.isWork(M.sched[e.id][d-1]) && primSkill(e)===sk), 'st-sk')).join('')}
      ${noSkill?statRow('<span class="bad">還沒設定技能</span>', d=>EMP.filter(e=>L.isWork(M.sched[e.id][d-1]) && !primSkill(e)), 'st-sk'):''}
    </tfoot></table></div>
  <div class="legend" style="margin-top:10px"><span><i style="background:#ffe9e9"></i>例假</span><span><i style="background:#f3f3f3"></i>休假</span><span><i style="background:#dbe9c4"></i>支援／受訓／育嬰</span><span><i style="background:#fafafa"></i>不排（兼職）</span><span><i style="outline:3px solid var(--bad)"></i>勞基法問題（不能送出）</span><span><i style="outline:3px dashed var(--warn)"></i>提醒</span><span><i style="box-shadow:inset 0 -5px 0 var(--warn)"></i>手動改過</span><span><i style="background:#fff3b0"></i>週工時（正職超過 48、兼職超過 40 變紅）</span><span><i style="outline:3px dotted #8a3ffc;outline-offset:-3px"></i>排到不可排班時段</span><span><b style="color:var(--pri)">調</b>出勤檢核調整過的班</span><span>(8+1)＝工時 8 小時＋休息 1 小時</span></div>
  <ul class="note-below">
    <li>表格最下面是每天的統計：上班人數、休假人數（休＋例），和每個技能當天上班幾人（看每個人的技能 ①；技能項目跟「門市基本資料 → 最少人力」一樣）。上面選某一組時，只列那一組的技能、只算那一組的人；每天各技能加起來＝上班人數。還沒設定技能的人會另外列「還沒設定技能」。</li>
    <li>上面「看哪些人」可以只看某一組、正職或兼職；上方的已排班工時、勞基法檢核還是算全店。</li>
    <li>點格子可以改班別、休假。每改一格就做第一層勞基法檢查（六休一、每週例假、兩班間隔 11 小時、週工時），有問題只跳提醒、格子框紅，<b>不會擋住</b>。</li>
    <li>「儲存草稿」可以存很多次；有還沒存的修改時「送出」是灰的。送出時再做一次完整檢查，六休一、兩班間隔有問題就不能送出；每週例假、週工時超過先只提醒（原始班表用雙週變形、兼職可超排，規則待確認）。</li>
    <li>已送出後按「✎ 編輯」→ 回到草稿，總部報表回到「排班中」。</li>
  </ul>`);
  bindTabs(main); L.bindEmpFilter(main);
  main.querySelectorAll('th.dlink').forEach(th=>th.onclick=()=>location.hash='#/day/'+th.dataset.dd);
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
  const opts = Object.entries(S.shifts).sort((a,b)=>L.tm(a[1].start)-L.tm(b[1].start)).map(([c,s])=>`<button data-c="${esc(c)}" class="${c===cur?'cur':''}"><b>${esc(c)}</b><small>${s.start}～${s.end} ${L.hrsTag(c)}</small></button>`).join('');
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

/* ============ 預先排休（一頁式：左上設定、右上小月曆、下面總表／列表） ============ */
const OPEN=`${NW.m}/16`, DUE=`${NW.m}/15`, REVIEW=`${NW.m}/26`;
const LV_STEPS=['店長設定',`員工劃休（${OPEN}～${NW.m}/25）`,'店長審核','確定，帶入跑班表'];
const PH_IDX={setting:0,review:2,confirmed:4};
function fmtDays(arr,m){ m=m||NX.m; const a=[...arr].sort((x,y)=>x-y), out=[]; for(let i=0;i<a.length;){ let j=i; while(j+1<a.length&&a[j+1]===a[j]+1) j++; out.push(i===j?`${m}/${a[i]}`:`${m}/${a[i]}～${m}/${a[j]}`); i=j+1; } return out.join('、'); }
function reqDays(id){ const lv=L.S.leave; return (lv.reqs[id]||[]).filter(d=>!lv.returned[id+'_'+d]); }
function returnConflicts(){ const lv=L.S.leave; let k=0; D.employees.forEach(e=>reqDays(e.id).forEach(d=>{ if(lv.noLeave.includes(d)){ lv.returned[e.id+'_'+d]='碰到不能休的日子'; k++; } })); return k; }
function histLeave(mm){ // 過去月份的劃休（示範：從那個月班表的休假日推回來）
  const M=L.S.months[mm.key], nol=mm.kind==='now'?[31]:[], out={};
  D.employees.forEach((e,i)=>{ const off=M.sched[e.id].map((c,j)=>c==='休'&&!nol.includes(j+1)?j+1:0).filter(Boolean);
    out[e.id]=off.length?[...new Set([off[i%off.length],off[(i+2)%off.length]])].sort((a,b)=>a-b):[]; });
  return {reqs:out, nol, days:2};
}
/* 進度（唯讀的小步驟，不是按鈕） */
function stepMini(cur){ return `<div class="stepmini">${LV_STEPS.map((t,i)=>`<span class="${i<cur?'done':(i===cur?'cur':'')}"><i>${i<cur?'✓':i+1}</i>${t}</span>`).join('<em>›</em>')}</div>`; }
/* 列表：每個人劃了哪幾天 */
function leaveList(mm, days, reqOf, opened){
  const pf=sessionStorage.getItem('lsp_lvpf')||'all', dd=d=>`${mm.m}/${d}（${L.DOW[L.dow(d,mm)]}）`;
  const by=sessionStorage.getItem('lsp_lvgrp')||'group'; let lastG=null;
  const list=sortEmps(D.employees.filter(L.empFilterFn()),by).map(e=>{ const r=reqOf(e.id); return {e,r,done:opened&&r.length>=days}; }).filter(x=>pf==='all'||(pf==='done'?x.done:!x.done));
  const gOf=e=>by==='title'?e.title:(e.group||'未選組別');
  return `<div class="tbl-wrap"><table class="g" style="width:100%"><thead><tr><th style="text-align:left">姓名</th><th>職稱・組別</th>${[...Array(days)].map((_,i)=>`<th>休假 ${i+1}</th>`).join('')}<th>已劃休</th><th>還可劃休</th><th>狀態</th></tr></thead><tbody>
    ${list.map(x=>{ const g=gOf(x.e), gh=g!==lastG?`<tr class="grp-row"><td colspan="${5+days}" style="text-align:left">${esc(g)}　<small class="muted">${list.filter(y=>gOf(y.e)===g).length} 人</small></td></tr>`:''; lastG=g; return gh+`<tr><td style="text-align:left"><b>${esc(x.e.name)}</b> <small class="muted">${x.e.id}</small></td><td>${x.e.title}・${x.e.group||'未選組別'}</td>${[...Array(days)].map((_,i)=>`<td>${x.r[i]?dd(x.r[i]):'<span class="muted">—</span>'}</td>`).join('')}<td><b>${x.r.length}</b></td><td class="${opened&&days-x.r.length>0?'bad b':''}">${Math.max(0,days-x.r.length)}</td><td>${!opened?'<span class="pill">還沒開放</span>':(x.done?'<span class="st-pill done">✓ 已完成</span>':'<span class="st-pill todo">還沒劃完</span>')}</td></tr>`; }).join('')||`<tr><td colspan="${5+days}" class="muted" style="padding:16px">沒有人</td></tr>`}
  </tbody></table></div>`;
}
/* 總表：每個人 × 每一天 */
function leaveGrid(mm, o){ // o:{reqOf, nol, special, returned, days, ro}
  const by=sessionStorage.getItem('lsp_lvgrp')||'group', days=[...Array(mm.days)].map((_,i)=>i+1), nol=new Set(o.nol);
  const head=days.map(d=>`<th class="${L.dow(d,mm)%6===0?'wk-sun':''} ${nol.has(d)?'lv nol':''}">${d}<br><small>${L.DOW[L.dow(d,mm)]}</small></th>`).join('');
  const dayReq=days.map(()=>0), daySp=days.map(()=>0), EMP=D.employees.filter(L.empFilterFn());
  let lastG=null;
  const rows=sortEmps(EMP,by).map(e=>{
    const req=new Set(o.reqOf(e.id)), cnt=req.size, g=by==='title'?e.title:e.group;
    const cells=days.map(d=>{ const k=e.id+'_'+d; let cls='', txt='';
      if(o.special[k]){ cls=o.special[k]; txt=SPECIAL[o.special[k]]; daySp[d-1]++; }
      else if(o.returned[k]){ cls='ret'; txt='退回'; }
      else if(req.has(d)){ cls='req'; txt='休'; dayReq[d-1]++; }
      return `<td class="lv ${cls}" data-id="${e.id}" data-d="${d}" style="cursor:${o.ro?'default':'pointer'}">${txt}</td>`; }).join('');
    const ret=Object.keys(o.returned).filter(k=>k.startsWith(e.id+'_')).length;
    const gh = g!==lastG ? `<tr class="grp-row"><td class="sticky" colspan="2">${esc(g||'未選組別')}</td><td colspan="${mm.days}"></td></tr>` : ''; lastG=g;
    return gh+`<tr><td class="sticky" style="min-width:140px"><b>${esc(e.name)}</b><br><small class="muted">${e.title}・${e.group||'未選組別'}</small></td>
      <td class="${cnt>o.days?'bad b':''}">${cnt} / ${o.days}${cnt>o.days?'<br><small>超過</small>':''}${ret?`<br><small class="bad">退回 ${ret}</small>`:''}</td>${cells}</tr>`; }).join('');
  const total=EMP.length;
  return `<div class="tbl-wrap"><table class="g"><thead><tr><th class="sticky">姓名</th><th>劃休</th>${head}</tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td class="sticky">休假人數</td><td></td>${dayReq.map(c=>`<td class="${c>=4?'hot':''}">${c}</td>`).join('')}</tr>
      <tr><td class="sticky">特殊人數</td><td></td>${daySp.map(c=>`<td>${c}</td>`).join('')}</tr>
      <tr><td class="sticky">還可排人數</td><td></td>${days.map((d,i)=>`<td>${total-dayReq[i]-daySp[i]}</td>`).join('')}</tr></tfoot></table></div>
    <div class="legend" style="margin-top:8px"><span><i style="background:#ffd9d9"></i>員工 App 劃休</span><span><i style="outline:2px solid var(--bad);background:#fff"></i>退回</span><span><i style="background:#dbe9c4"></i>支援</span><span><i style="background:#ebe5f3"></i>受訓</span><span><i style="background:#d9d9d9"></i>育嬰留停</span><span><i class="hot"></i>當天休假 4 人以上</span><span><i class="nol"></i>不能休的日子</span></div>`;
}
function bindGridEdit(box, mm){
  const S=L.S, lv=S.leave;
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
        m.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{ const sv=b.dataset.s; if(sv) lv.special[k]=sv; else delete lv.special[k]; L.log('排休',`${e.name} ${mm.m}/${d}`,'',sv?SPECIAL[sv]:'清除'); L.save(); close(); L.redraw(); });});
    }
  });
}
route('/leave', (main)=>{
  const S=L.S, lv=S.leave;
  const mm=L.mon(sessionStorage.getItem('lsp_lvmk')||NX.key)||NX, isNext=mm.kind==='next';
  const h=isNext?null:histLeave(mm);
  const days=isNext?lv.days:h.days, nol=isNext?lv.noLeave:h.nol, opened=isNext?lv.phase!=='setting':true;
  const reqOf=isNext?(id=>lv.phase==='setting'?[]:reqDays(id)):(id=>h.reqs[id]);
  const unlocked=sessionStorage.getItem('lsp_lvedit')==='1';
  const canSet=isNext && (lv.phase==='setting' || (lv.phase==='review' && unlocked));   // 設定可不可以改
  const canReview=isNext && lv.phase==='review';
  const view=sessionStorage.getItem('lsp_lvview')||(opened?'grid':'list');
  const EMP=D.employees.filter(L.empFilterFn()), nDone=opened?EMP.filter(e=>reqOf(e.id).length>=days).length:0, nTodo=EMP.length-nDone;
  const pf=sessionStorage.getItem('lsp_lvpf')||'all';
  // 右上按鈕
  let right='';
  const lvPill = !isNext?'<span class="pill sent">已確定・只能看</span>':({setting:'<span class="pill draft">設定中</span>',review:'<span class="pill saved">審核中</span>',confirmed:'<span class="pill ok">已確定</span>'}[lv.phase]);
  if(!isNext) right='';
  else if(lv.phase==='setting') right=`<button class="btn" id="saveSet">💾 儲存</button><button class="btn pri" id="open">📤 送出、開放劃休</button>`;
  else if(lv.phase==='review') right=`${unlocked?'':'<button class="btn" id="editSet">✎ 修改設定</button>'}<button class="btn pri" id="confirm">✓ 確定排休</button>`;
  else right='';
  // 小月曆
  const lead=(mm.fd+6)%7, sel=new Set(nol);
  let cal=['一','二','三','四','五','六','日'].map(x=>`<div class="h">${x}</div>`).join('')+'<div class="o"></div>'.repeat(lead);
  for(let d=1; d<=mm.days; d++) cal+=`<button class="cd ${sel.has(d)?'sel':''} ${[0,6].includes(L.dow(d,mm))?'we':''}" data-cd="${d}" ${canSet?'':'disabled'}>${d}</button>`;
  main.innerHTML=`
  <div class="sh">
    <div class="sh-r1">${isNext?stepMini(PH_IDX[lv.phase]):'<span class="muted" style="font-size:17px">過去、本月的排休已確定，只能看</span>'}</div>
    <div class="sh-r2"><div class="sh-left"><div class="sh-line">${L.monthPick(mm.key,'data-lvmk')}${lvPill}</div><div class="sh-line" style="font-size:17px">${isNext?(lv.phase==='setting'?`⏰ 請在 <b>${DUE}</b> 前設定好，<b>${OPEN}</b> 起員工就能用 App 劃 ${mm.m} 月的休假。`:(lv.phase==='review'?`員工已經劃完（示範：今天 ${REVIEW}），請審核後按「確定排休」。`:`${mm.m} 月排休已確定，產生班表時會把劃休的日子排成「休」。`)):`${mm.y} 年 ${mm.m} 月的排休已經確定、班表也排好了。`}</div></div>
      <div class="sh-right"><div class="sh-btns">${right}</div></div></div>
  </div>
  <div class="lv-top">
    <div class="card lv-set">
      <div class="b" style="font-size:20px;margin-bottom:10px">${mm.y} 年 ${mm.m} 月</div>
      <div class="sh-line" style="font-size:20px"><span>每人可以休</span><select class="sel-big" id="days" ${canSet?'':'disabled'} style="font-size:24px;font-weight:700;width:90px">${[1,2,3,4,5,6].map(x=>`<option ${x===days?'selected':''}>${x}</option>`).join('')}</select><span>天</span>${canSet?'<span class="muted" style="font-size:15px">先帶上個月的天數，可以改</span>':''}</div>
      <div class="lv-cards">
        <button class="lvp-card ok ${pf==='done'?'on':''}" data-pf="done"><small>已完成預先排休</small><b>${nDone}</b> 人</button>
        <button class="lvp-card todo ${pf==='todo'?'on':''}" data-pf="todo"><small>還沒劃完</small><b>${nTodo}</b> 人</button>
      </div>
      <div class="muted" style="font-size:15px">${opened?'點卡片可以只看那些人（下面列表）；再點一次看全部。':`還沒開放員工劃休，${OPEN} 開放後這裡會即時更新。`}</div>
      ${isNext&&lv.phase==='review'&&unlocked?'<div class="banner" style="margin:10px 0 0">正在修改設定：改了會通知全店，已劃的休碰到新的不能休日子會自動退回。</div>':''}
    </div>
    <div class="card lv-cal">
      <div class="sh-line" style="margin-bottom:8px"><b style="font-size:20px">${mm.m} 月不能休的日子</b><div class="spacer"></div>${canSet?`<button class="btn sm ${sel.size?'':'soft'}" id="none">無</button>`:''}</div>
      <div class="muted" style="font-size:15px;margin-bottom:6px">${canSet?'點日子就能選或取消，紅色＝員工在 App 上不能劃休。':'紅色＝不能休的日子。'}</div>
      <div class="cal2">${cal}</div>
      <div class="sh-line" style="margin-top:8px"><span class="lbl">已選：</span><span>${sel.size?fmtDays([...sel],mm.m):'無'}</span></div>
    </div>
  </div>
  <div class="sh-line" style="margin:6px 0 10px"><div class="seg big">${[['grid','📊 總表（每天）'],['list','📋 列表（每人）']].map(([k,t])=>`<button data-lvv="${k}" class="${view===k?'on':''}">${t}</button>`).join('')}</div>
    <div class="seg">${[['group','依組別'],['title','依職稱']].map(([k,t])=>`<button data-by="${k}" class="${(sessionStorage.getItem('lsp_lvgrp')||'group')===k?'on':''}">${t}</button>`).join('')}</div>
    <div class="spacer"></div>${L.empFilterBar()}</div>
  <div id="lvBody">${view==='grid'
    ? (opened ? leaveGrid(mm,{reqOf, nol, special:isNext?lv.special:{}, returned:isNext?lv.returned:{}, days, ro:!canReview}) : '<div class="empty-page">還沒開放員工劃休，開放後這裡會顯示每天誰休假。</div>')
    : leaveList(mm, days, reqOf, opened)}</div>
  ${canReview&&view==='grid'?'<div class="muted" style="margin-top:6px">點「休」可以退回；點空白格可以設定支援、受訓、育嬰留停。</div>':''}
  <ul class="note-below"><li>不能休的日子只有店長設定（總部不設定）。${DUE} 還沒送出：系統自動沿用上個月的天數，${OPEN} 照常開放並通知店長。</li><li>還可排人數＝人數－休假－特殊（支援、受訓、育嬰留停佔工時，但不算門市戰力）。</li>${isNext?'':'<li>示範資料：過去月份的劃休是從那個月班表的休假日推回來的。</li>'}</ul>`;
  // 綁定
  L.bindEmpFilter(main);
  main.querySelectorAll('[data-lvmk]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_lvmk',b.dataset.lvmk); sessionStorage.removeItem('lsp_lvview'); L.redraw(); });
  main.querySelectorAll('[data-lvv]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_lvview',b.dataset.lvv); L.redraw(); });
  main.querySelectorAll('[data-by]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_lvgrp',b.dataset.by); L.redraw(); });
  main.querySelectorAll('[data-pf]').forEach(b=>b.onclick=()=>{ const cur=sessionStorage.getItem('lsp_lvpf'); sessionStorage.setItem('lsp_lvpf',cur===b.dataset.pf?'all':b.dataset.pf); sessionStorage.setItem('lsp_lvview','list'); L.redraw(); });
  if(!isNext) return;
  const changed=()=>{ if(lv.phase==='review'){ const k=returnConflicts(); L.save(); toast('已更新，已通知全店',k?`有 ${k} 筆劃休碰到不能休的日子，已自動退回。`:'沒有劃休受影響。','info'); } else L.save(); L.redraw(); };
  if(canSet){
    main.querySelector('#days').onchange=ev=>{ lv.days=Number(ev.target.value); L.log('排休','每人可休天數','',`${lv.days} 天`); changed(); };
    main.querySelectorAll('[data-cd]').forEach(c=>c.onclick=()=>{ const d=Number(c.dataset.cd); const i=lv.noLeave.indexOf(d); if(i>=0) lv.noLeave.splice(i,1); else lv.noLeave.push(d); changed(); });
    const nn=main.querySelector('#none'); if(nn) nn.onclick=()=>{ lv.noLeave=[]; changed(); };
  }
  if(canReview) bindGridEdit(main.querySelector('#lvBody'), mm);
  const ss=main.querySelector('#saveSet'); if(ss) ss.onclick=()=>{ L.log('排休','儲存設定'); L.save(); toast('已儲存','設定好了再按「送出、開放劃休」。','info'); };
  const op=main.querySelector('#open'); if(op) op.onclick=()=>{
    returnConflicts(); lv.phase='review'; sessionStorage.setItem('lsp_lvview','grid');
    L.log('排休','送出、開放劃休',`可休 ${lv.days} 天`,lv.noLeave.length?'不能休 '+fmtDays(lv.noLeave):'不能休：無'); L.save(); L.redraw();
    toast('已開放劃休',`示範：時間跳到 ${REVIEW}，員工已經劃完，可以開始審核。`,'info'); };
  const es=main.querySelector('#editSet'); if(es) es.onclick=()=>modal(`<h3 class="bad">⚠ 員工已經開始劃休了</h3><p style="font-size:19px">改了設定會通知全店員工。已經劃的休如果碰到新的不能休日子，會自動退回。</p>
    <div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn" data-x>取消</button><button class="btn pri" data-ok>確定修改</button></div>`,(m,close)=>{
      m.querySelector('[data-x]').onclick=close; m.querySelector('[data-ok]').onclick=()=>{ close(); sessionStorage.setItem('lsp_lvedit','1'); L.redraw(); };});
  const cf=main.querySelector('#confirm'); if(cf) cf.onclick=()=>{
    const over=D.employees.filter(e=>reqDays(e.id).length>lv.days);
    if(over.length && !confirm(`還有 ${over.length} 人劃休超過 ${lv.days} 天（${over.map(e=>e.name).join('、')}），還是要確定嗎？`)) return;
    lv.phase='confirmed'; sessionStorage.removeItem('lsp_lvedit'); L.log('排休',`確定 ${NX.m} 月排休`,'','已確定'); L.save(); L.redraw();
    toast('排休已確定',`「智能排班 → ${NX.m} 月」準備跑班表的第 4 項已自動打勾。`,'info');
  };
});

/* ============ 員工技能（排序＋分組） ============ */
const GROUP_SKILLS={'管理':['管理','值班','收銀'],'值班':['值班','收銀','乾貨人力'],'乾貨':['乾貨人力','收銀'],'生鮮':['生鮮擔當','生鮮人力','收銀'],'熟食':['熟食擔當','熟食人力','收銀']};
function setGroup(e, g){ if(!e||!g||g===e.group) return; const S=L.S, old=e.group||'未選'; S.empGroup=S.empGroup||{}; S.empGroup[e.id]=g; sessionStorage.removeItem('lsp_skpg_'+e.id);
  L.log('技能',`${e.name} 組別`,old,g); L.save(); toast('已改組別',`${e.name}：${old} → ${g}。現在可以點「${g}」的技能。`,'info'); L.redraw(); }
route('/skills',(main)=>{
  const S=L.S;
  const mode = sessionStorage.getItem('lsp_skmode')||'table';   // table | person
  const order=a=>a.map((x,i)=>`${i+1}.${x}`).join(' ')||'無';
  const changed=(e,before)=>{ Object.values(S.months).forEach(M=>M.dayPlans={}); L.log('技能',`${e.name} 技能順位`,before,order(S.skills[e.id])); L.redraw(); };
  const head=`<div class="top"><h2>員工技能</h2><span class="muted">設定每個人會做的工作和順位：① 最優先。日作業表先分 ① 的工作，① 人夠了才分 ②</span></div>
  <div style="display:flex;gap:14px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><b>畫面：</b>
    <div class="seg-toggle">${[['table','📋 表格設定'],['person','👤 列表設定']].map(([k,t])=>`<button data-mode="${k}" class="${mode===k?'on':''}">${t}</button>`).join('')}</div>
    <span style="flex:1"></span><button class="btn" id="skSample" title="示範用：組別和技能照原始班表資料填好">📥 帶入範例資料</button><button class="btn" id="skClear" style="border-color:var(--bad);color:var(--bad)">🗑️ 清空全部技能</button></div>`;
  const bindHead=()=>{
    main.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_skmode',b.dataset.mode); L.redraw(); });
    main.querySelector('#skSample').onclick=()=>modal(`<h3>帶入範例資料？</h3><div class="b">全部 ${D.employees.length} 位員工的組別和技能，會照原始班表資料填好（示範用）。現在設定的會被蓋掉。</div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px"><button class="btn" data-x>不要</button><button class="btn pri" data-ok>帶入</button></div>`,(m,close)=>{
      m.querySelector('[data-x]').onclick=close; m.querySelector('[data-ok]').onclick=()=>{ L.fillSample(); L.log('技能','帶入範例組別與技能'); close(); L.toast('已帶入範例資料'); L.redraw(); }; });
    main.querySelector('#skClear').onclick=()=>modal(`<h3>清空全部技能？</h3><div class="b">全部 ${D.employees.length} 位員工的技能和順位都會清掉，要重新一個一個設定。</div><div class="muted" style="margin-top:6px">清空後日作業表沒辦法自動分工。不小心按到，可以按左下「重設示範資料」恢復。</div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px"><button class="btn" data-x>不要</button><button class="btn" data-ok style="background:var(--bad);border-color:var(--bad);color:#fff">確定清空</button></div>`,(m,close)=>{
      m.querySelector('[data-x]').onclick=close;
      m.querySelector('[data-ok]').onclick=()=>{ D.employees.forEach(e=>S.skills[e.id]=[]); Object.values(S.months).forEach(M=>M.dayPlans={}); L.log('技能','清空全部員工技能','','全部清空'); close(); L.toast('已清空全部技能'); L.redraw(); };
    });
  };

  /* ---- 模式二：一個一個設定（選人 → 選組別 → 點技能 → 排順位） ---- */
  if(mode==='person'){
    const fg = sessionStorage.getItem('lsp_skfg')??'all';
    const list = sortEmps(D.employees,'group').filter(e=>fg==='all'||e.group===fg);
    let sel = sessionStorage.getItem('lsp_sksel'); if(!list.some(e=>e.id===sel)) sel = list[0]&&list[0].id;
    const e = sel && L.emp(sel), arr = e ? S.skills[e.id] : [];
    const pg = (e && sessionStorage.getItem('lsp_skpg_'+e.id)) || (e && arr.length ? e.group : '');   // 還沒點組別、也還沒技能 → 只先出現第 1 步
    const groups = GROUP_ORDER.filter(g=>GROUP_SKILLS[g]);
    const cnt=g=>D.employees.filter(x=>x.group===g).length;
    main.innerHTML = head + `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><b>看哪一組：</b>
      ${[['all','全部',D.employees.length],...groups.filter(cnt).map(g=>[g,g,cnt(g)]),...(cnt('')?[['','未選組別',cnt('')]]:[])].map(([k,t,n])=>`<button class="chip-btn ${fg===k?'on':''}" data-fg="${k}">${t} <small>${n}</small></button>`).join('')}</div>
    <div class="sk2">
      <div class="tbl-wrap sk2-list">${list.map(x=>{ const a=S.skills[x.id]; return `<button class="sk2-emp ${x.id===sel?'on':''} ${a.length?'':'empty'}" data-sel="${x.id}"><b>${esc(x.name)}</b> <small class="muted">${x.id}・${x.title}・${x.group}</small><div class="sk2-sum">${a.length?a.map((s,i)=>`<span>${'①②③④⑤⑥⑦⑧'[i]}${s}</span>`).join(''):'<span class="warn-t">還沒設定</span>'}</div></button>`; }).join('')||'<div class="muted" style="padding:16px">這一組沒有人</div>'}</div>
      ${e?`<div class="sk2-panel">
        <div class="sk2-ph"><div><b style="font-size:22px">${esc(e.name)}</b> <span class="muted">${e.id}　${e.title}・${e.group||'未選組別'}</span></div>
          <label class="sk2-ref">照誰設定：<select id="skRef"><option value="">選一位同事…</option>${groups.filter(cnt).map(g=>`<optgroup label="${g}">${sortEmps(D.employees,'group').filter(x=>x.group===g&&x.id!==e.id).map(x=>`<option value="${x.id}">${esc(x.name)}（${x.title}）${S.skills[x.id].length?'：'+S.skills[x.id].map((s,i)=>'①②③④⑤⑥⑦⑧'[i]+s).join(' '):'：還沒設定'}</option>`).join('')}</optgroup>`).join('')}</select></label></div>
        <div class="sk2-sec"><div class="sk2-step"><span class="num">1</span> 選組別${pg?'':'<span class="bad" style="font-size:16px">　← 先點一個組別</span>'}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${groups.map(g=>`<button class="chip-btn ${pg===g?'on':''}" data-pg="${g}">${g}${g===e.group?' <small>(本組)</small>':''}</button>`).join('')}</div>
        </div>
        ${pg?`<div class="sk2-sec"><div class="sk2-step"><span class="num">2</span> 點會做的技能（再點一次取消）</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">${(GROUP_SKILLS[pg]||[]).map(s=>{ const k=arr.indexOf(s); return `<button class="sk2-skill ${k>=0?'on':''}" data-tog="${s}"><i style="background:${L.taskColor(s)}"></i>${s}${k>=0?` <b>${'①②③④⑤⑥⑦⑧'[k]}</b>`:''}</button>`; }).join('')}</div></div>
        <div class="sk2-sec"><div class="sk2-step"><span class="num">3</span> 排順位（① 最優先）</div>
        ${arr.length?arr.map((s,i)=>`<div class="sk2-row"><span class="rank on ${i===0?'first':''}">${i+1}</span><i style="background:${L.taskColor(s)}"></i><b style="flex:1">${s}</b>
          <button class="btn sm" data-up="${i}" ${i===0?'disabled':''} title="往上">▲</button><button class="btn sm" data-down="${i}" ${i===arr.length-1?'disabled':''} title="往下">▼</button><button class="btn sm" data-rm="${i}" style="color:var(--bad)" title="移除">✕</button></div>`).join(''):'<div class="muted" style="padding:10px 0">還沒有技能，請在上面第 2 步點選。</div>'}</div>`:'<div class="sk2-sec muted" style="font-size:17px">點好組別後，會出現 ② 選技能、③ 排順位。</div>'}
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
      sessionStorage.setItem('lsp_skpg_'+e.id, r.group); if(e.group!==r.group){ S.empGroup=S.empGroup||{}; S.empGroup[e.id]=r.group; }
      edit(()=>{ arr.splice(0, arr.length, ...S.skills[r.id]); });
      L.toast(`已照 ${r.name} 設定`, `組別：${r.group}　技能：${order(S.skills[r.id])}`); };
    main.querySelectorAll('[data-pg]').forEach(b=>b.onclick=()=>{ if(!e.group) setGroup(e,b.dataset.pg); sessionStorage.setItem('lsp_skpg_'+e.id,b.dataset.pg); L.redraw(); });
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
    const gh = (by!=='none' && g!==lastG) ? `<tr class="grp-row"><td class="sticky">${esc(g||'未選組別')}　<small class="muted">${list.filter(x=>(by==='title'?x.title:x.group)===g).length} 人</small></td><td colspan="${2+L.SKILLS.length}"></td></tr>` : ''; lastG=g;
    const okS=GROUP_SKILLS[e.group]||[];
    return gh+`<tr><td class="sticky"><b>${esc(e.name)}</b><br><small class="muted">${e.id}</small></td><td>${e.title}</td><td><select class="grp-sel ${e.group?'':'need'}" data-gid="${e.id}">${e.group?'':'<option value="" selected>請選組別</option>'}${GROUP_ORDER.map(g=>`<option ${g===e.group?'selected':''}>${g}</option>`).join('')}</select></td>${L.SKILLS.map(s=>{ const k=S.skills[e.id].indexOf(s), off=k<0&&!okS.includes(s); return `<td class="${off?'sk-off':''}">${off?`<span class="sk-na" title="${e.group?'不是這個組別的技能，要先換組別':'請先選組別'}">－</span>`:`<button class="rank ${k<0?'':'on'} ${k===0?'first':''}" data-id="${e.id}" data-s="${s}" title="${k<0?'點一下加入':'點一下改順位或取消'}">${k<0?'':k+1}</button>`}</td>`; }).join('')}</tr>`;
  }).join('');
  main.innerHTML=head+`<div style="display:flex;gap:14px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><b>分組看：</b>
    <div class="seg-toggle">${[['group','依組別'],['title','依職稱'],['none','不分組']].map(([k,t])=>`<button data-by="${k}" class="${by===k?'on':''}">${t}</button>`).join('')}</div>
    <span class="muted">點表頭可以排序（再點一次反過來）</span>${sk?'<button class="btn sm" id="unsort">取消排序</button>':''}</div>
  <div class="tbl-wrap"><table class="g"><thead><tr>${cols.map(([c,t],i)=>`<th class="sort ${i===0?'sticky':''}" data-col="${c}">${t}${arrow(c)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
  <ul class="note-below"><li>技能只有 8 種：管理、值班、收銀、乾貨人力、生鮮擔當、生鮮人力、熟食擔當、熟食人力。顏色由總部「🎨 工作項目與顏色」設定。</li><li>一開始每個人都還沒有組別：先在「組別」選這個人是哪一組，那一組的技能才可以點；之後還可以再換組別。</li><li>不是這一組的技能會顯示「－」，要先換組別才能點。</li><li>點空格＝加在最後一個順位；點有數字的格子可以改順位或取消，其他順位自動補位。</li><li>點技能的表頭，會把這個技能順位高的人排前面。依組別、依職稱分組時，會在每一組裡面排序。</li></ul>`;
  bindHead();
  main.querySelectorAll('[data-by]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_skgrp',b.dataset.by); L.redraw(); });
  main.querySelectorAll('.grp-sel').forEach(sel=>sel.onchange=()=>setGroup(L.emp(sel.dataset.gid), sel.value));
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
/* 員工班別：三個頁籤 */
const SH_TABS=[['list','班別名稱與時間'],['unavail','不可排班時段'],['pref','個人常用班別']];
function shTabs(cur){ return `<div class="tabs">${SH_TABS.map(([k,t])=>`<button data-sht="${k}" class="${cur===k?'on':''}">${t}</button>`).join('')}</div>`; }
function bindShTabs(main){ main.querySelectorAll('[data-sht]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_shtab',b.dataset.sht); L.redraw(); window.scrollTo(0,0); }); }
const DOWS=[[1,'一'],[2,'二'],[3,'三'],[4,'四'],[5,'五'],[6,'六'],[0,'日']];
function tSel(id,val){ let o=''; for(let m=5*60;m<=1440;m+=15){ const t=m===1440?'24:00':L.fmt(m); o+=`<option ${t===val?'selected':''}>${t}</option>`; } return `<select class="sel-big" id="${id}">${o}</select>`; }
function unavailPage(main){
  const S=L.S; S.unavail=S.unavail||{};
  const list=sortEmps(D.employees.filter(L.empFilterFn()),'group');
  main.innerHTML=`<div class="top"><h2>員工班別</h2><span class="muted">每個人固定哪幾天、哪個時段不能上班（例如上課、接小孩）</span></div>${shTabs('unavail')}
  ${L.empFilterBar()}
  <div class="tbl-wrap"><table class="g" style="width:100%"><thead><tr><th class="sticky" style="text-align:left">姓名</th><th>職稱・組別</th><th>設定</th>${DOWS.map(([d,t])=>`<th class="${d===0||d===6?'wk-sun':''}" style="min-width:110px">${t}</th>`).join('')}</tr></thead><tbody>
  ${list.map(e=>{ const u=S.unavail[e.id]||[]; return `<tr><td class="sticky" style="text-align:left"><b>${esc(e.name)}</b><br><small class="muted">${e.id}</small></td><td>${e.title}・${e.group||'未選組別'}</td><td><button class="btn sm" data-ua="${e.id}">設定</button></td>
    ${DOWS.map(([d])=>`<td>${u.map((x,i)=>x.d===d?`<button class="ua-chip" data-uid="${e.id}" data-ui="${i}" title="點一下刪除">${x.a}～${x.b}</button>`:'').join('')}</td>`).join('')}</tr>`; }).join('')}
  </tbody></table></div>
  <ul class="note-below"><li>按「設定」選星期幾、哪個時段不能排班；點紅色時段可以刪除。</li><li>月班表如果把人排到不可排班的時段，格子會用紫色點線框起來提醒。</li></ul>`;
  bindShTabs(main); L.bindEmpFilter(main);
  main.querySelectorAll('[data-ua]').forEach(b=>b.onclick=()=>{ const e=L.emp(b.dataset.ua), pick=new Set();
    modal(`<h3>不可排班時段　${esc(e.name)}</h3>
      <div class="b" style="margin-top:8px">1. 星期幾不能排（可以選很多天）</div>
      <div class="picks" style="grid-template-columns:repeat(auto-fill,minmax(90px,1fr))">${DOWS.map(([d,t])=>`<button data-pd="${d}">星期${t}</button>`).join('')}</div>
      <div class="b">2. 哪個時段不能排</div>
      <div style="display:flex;gap:12px;align-items:center;font-size:20px;margin:10px 0 4px;flex-wrap:wrap">從 ${tSel('ua_a','12:00')} 到 ${tSel('ua_b','17:30')}</div>
      <div style="display:flex;justify-content:space-between;gap:10px;margin-top:16px;flex-wrap:wrap"><button class="btn" data-clr style="border-color:var(--bad);color:var(--bad)">全部清除（每天都可以排）</button><div><button class="btn" data-x>取消</button> <button class="btn pri" data-ok>確定</button></div></div>`,(m,close)=>{
      m.querySelectorAll('[data-pd]').forEach(x=>x.onclick=()=>{ const d=+x.dataset.pd; pick.has(d)?pick.delete(d):pick.add(d); x.classList.toggle('cur',pick.has(d)); });
      m.querySelector('[data-x]').onclick=close;
      m.querySelector('[data-clr]').onclick=()=>{ S.unavail[e.id]=[]; L.log('班別',`${e.name} 不可排班時段`,'','全部清除'); L.save(); close(); L.redraw(); };
      m.querySelector('[data-ok]').onclick=()=>{ const a=m.querySelector('#ua_a').value, z=m.querySelector('#ua_b').value;
        if(!pick.size){ toast('還沒選星期','請先點星期幾。'); return; } if(L.tm(z)<=L.tm(a)&&z!=='24:00'){ toast('時間不對','結束要比開始晚。'); return; }
        S.unavail[e.id]=(S.unavail[e.id]||[]).concat([...pick].map(d=>({d,a,b:z})));
        L.log('班別',`${e.name} 不可排班時段`,'',`星期${[...pick].map(d=>DOWS.find(x=>x[0]===d)[1]).join('、')} ${a}～${z}`); L.save(); close(); L.redraw(); };
    }); });
  main.querySelectorAll('[data-uid]').forEach(b=>b.onclick=()=>{ const e=L.emp(b.dataset.uid), arr=S.unavail[e.id], x=arr[+b.dataset.ui];
    if(!confirm(`刪除 ${e.name} 星期${DOWS.find(y=>y[0]===x.d)[1]} ${x.a}～${x.b} 的不可排班時段？`)) return;
    arr.splice(+b.dataset.ui,1); L.log('班別',`${e.name} 刪除不可排班時段`,`${x.a}～${x.b}`,''); L.save(); L.redraw(); });
}
/* 個人常用班別：最近的班表統計（11 月整月＋12 月到昨天），可設平日／假日預設 */
function prefPage(main){
  const S=L.S; S.prefShift=S.prefShift||{};
  const t=L.today(), months=[[L.MONTHS[0],L.MONTHS[0].days],[NW,t.d-1]];
  const stat=id=>{ const r={}; months.forEach(([mm,last])=>{ const row=S.months[mm.key].sched[id]; for(let d=1; d<=last; d++){ const c=row[d-1]; if(!L.shiftOf(c)) continue; const we=[0,6].includes(L.dow(d,mm));
      r[c]=r[c]||{n:0,wd:0,we:0}; r[c].n++; r[c][we?'we':'wd']++; } }); return Object.entries(r).sort((a,b)=>b[1].n-a[1].n); };
  const list=sortEmps(D.employees.filter(L.empFilterFn()),'group');
  let sel=sessionStorage.getItem('lsp_prefsel'); if(!list.some(e=>e.id===sel)) sel=list[0]&&list[0].id;
  const e=sel&&L.emp(sel), st=e?stat(e.id):[], pf=(e&&S.prefShift[e.id])||{};
  const sum=x=>{ const p=S.prefShift[x.id]||{}; return p.wd||p.we?`平日 <b>${p.wd||'—'}</b>　假日 <b>${p.we||'—'}</b>`:'<span class="muted">還沒設預設</span>'; };
  main.innerHTML=`<div class="top"><h2>員工班別</h2><span class="muted">看每個人最近最常上哪些班，設定平日／假日的預設班別</span></div>${shTabs('pref')}
  ${L.empFilterBar()}
  <div class="sk2">
    <div class="tbl-wrap sk2-list">${list.map(x=>`<button class="sk2-emp ${x.id===sel?'on':''}" data-ps="${x.id}"><b>${esc(x.name)}</b> <small class="muted">${x.id}・${x.title}・${x.group||'未選組別'}</small><div class="sk2-sum">${sum(x)}</div></button>`).join('')||'<div class="muted" style="padding:16px">沒有人</div>'}</div>
    ${e?`<div class="sk2-panel">
      <div class="sk2-ph"><div><b style="font-size:22px">${esc(e.name)}</b> <span class="muted">${e.id}　${e.title}・${e.group||'未選組別'}</span></div></div>
      <div class="muted" style="margin:10px 0">統計期間：${L.MONTHS[0].m}/1～${NW.m}/${t.d-1}（假日＝週六、週日）</div>
      <div class="tbl-wrap"><table class="g" style="width:100%"><thead><tr><th>班別</th><th>工時</th><th>總次數</th><th>平日次數</th><th>假日次數</th><th>平日預設</th><th>假日預設</th></tr></thead><tbody>
      ${st.map(([c,v],i)=>{ const sh=L.shiftOf(c); return `<tr><td><b>${esc(c)}</b><br><small class="muted">${sh.start}～${sh.end}</small></td><td>${L.hrsTag(c)}</td><td><b>${v.n}</b>${i===0?'<br><small class="muted">最常上</small>':''}</td><td>${v.wd}</td><td>${v.we}</td>
        <td><button class="pref ${pf.wd===c?'on':''}" data-pk="wd" data-pc="${esc(c)}">${pf.wd===c?'★ 主力':'＋'}</button></td><td><button class="pref ${pf.we===c?'on':''}" data-pk="we" data-pc="${esc(c)}">${pf.we===c?'★ 主力':'＋'}</button></td></tr>`; }).join('')||'<tr><td colspan="7" class="muted">這段期間沒有上班紀錄</td></tr>'}
      </tbody></table></div>
      <div class="muted" style="margin-top:10px">點「＋」設成預設（主力），再點一次取消。平日、假日各一個。</div>
    </div>`:''}
  </div>
  <ul class="note-below"><li>預設班別＝產生下個月班表時，這個人平日／假日優先排的班別（示範：先記錄，排班規則之後接上）。</li></ul>`;
  bindShTabs(main); L.bindEmpFilter(main);
  main.querySelectorAll('[data-ps]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_prefsel',b.dataset.ps); L.redraw(); });
  main.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{ const k=b.dataset.pk, c=b.dataset.pc, p=S.prefShift[e.id]=S.prefShift[e.id]||{}; const old=p[k]||'';
    p[k]= p[k]===c ? '' : c; L.log('班別',`${e.name} ${k==='wd'?'平日':'假日'}預設班別`,old,p[k]||'取消'); L.save(); L.redraw(); });
}
route('/shifts',(main)=>{
  const tab=sessionStorage.getItem('lsp_shtab')||'list';
  if(tab==='unavail'){ unavailPage(main); return; }
  if(tab==='pref'){ prefPage(main); return; }
  const S=L.S, mk=NW.key;
  const use={}; Object.values(S.months[mk].sched).forEach(r=>r.forEach(c=>{ if(L.isWork(c)) use[c]=(use[c]||0)+1; }));
  const tot=Object.values(use).reduce((a,b)=>a+b,0);
  const ord=sessionStorage.getItem('lsp_shsort')||'pct';
  const byTime=(a,b)=>L.tm(a[1].start)-L.tm(b[1].start) || L.tm(a[1].end)-L.tm(b[1].end);
  const list=Object.entries(S.shifts).sort(ord==='time'?byTime:((a,b)=>(use[b[0]]||0)-(use[a[0]]||0) || byTime(a,b)));
  const maxU=Math.max(1,...Object.values(use));
  const inp='font-size:18px;padding:6px 10px;border:1.5px solid var(--ink);border-radius:8px';
  main.innerHTML=`<div class="top"><h2>員工班別</h2><span class="muted">上下班時間從歷史班表抓出來，不能改；班別名稱由門市自己取（就是班表上顯示的字）；人次是 ${NW.m} 月（本月）的使用次數</span><div class="spacer"></div><button class="btn soft" id="add">＋ 新增班別</button></div>
  ${shTabs('list')}
  <div style="display:flex;gap:14px;align-items:center;margin-bottom:12px"><b>排序：</b><div class="seg-toggle">${[['pct','占比高→低'],['time','上班時間早→晚']].map(([k,t])=>`<button data-ord="${k}" class="${ord===k?'on':''}">${t}</button>`).join('')}</div></div>
  <div class="tbl-wrap"><table class="g" style="width:100%"><thead><tr><th>上班</th><th>下班</th><th>淨工時</th><th>早／晚</th><th>本月人次</th><th>占比</th><th style="text-align:left">班別名稱</th><th></th></tr></thead><tbody>
  ${list.map(([c,s])=>`<tr>
    <td style="font-size:20px;font-weight:700">${s.start}</td><td style="font-size:20px;font-weight:700">${s.end}</td>
    <td>${L.netH(c)} h <small class="muted">${L.hrsTag(c)}</small></td><td>${L.tm(s.start)<L.tm('13:30')?'早班':'晚班'}</td><td>${use[c]||0}</td><td style="min-width:260px;text-align:left"><div style="display:flex;align-items:center;gap:10px"><div style="flex:1;height:22px;background:#eef1f6;border-radius:6px;overflow:hidden"><div style="height:100%;width:${(use[c]||0)/maxU*100}%;background:#6f9be0;border-radius:6px"></div></div><b style="width:58px;text-align:right">${tot?((use[c]||0)/tot*100).toFixed(1):0}%</b></div></td>
    <td style="text-align:left"><input data-code="${esc(c)}" value="${esc(c)}" style="${inp};width:160px;font-weight:400;border-color:var(--line)"></td>
    <td>${inUse(c)?'<small class="muted">使用中</small>':`<button class="btn sm" data-del="${esc(c)}">刪除</button>`}</td></tr>`).join('')}
  </tbody></table></div>
  <ul class="note-below"><li>班別名稱（A、A1、早晨、晚收銀…）由門市自己取，月班表格子上顯示的就是這個名稱；改名稱會一起改掉所有月份班表。名稱盡量短（2～4 個字），格子才放得下。</li><li>淨工時：班長 4 小時以下不扣休息；4～7 小時扣 30 分；7 小時以上扣 1 小時。13:30 以前上班算早班。</li><li>有排在任何月份班表上的班別不能刪，要先在月班表換掉。</li></ul>`;
  bindShTabs(main);
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
  let peakK;
  if(mode==='simple'){ const tot=k=>S.staffing.reduce((a,x)=>a+firstNum(x[k]),0); peakK=`<div class="k"><small>每天人數（週一／平日／週六）</small><b style="font-size:18px">${tot('mon')}／${tot('wk')}／${tot('sat')}</b> 人</div>`; }
  else { const tt=[...Array(L.NSLOT)].map((_,i)=>L.SKILLS.reduce((a,x)=>a+(S.req[x][i]||0),0)); peakK=`<div class="k"><small>最多同時</small><b>${Math.max(...tt)}</b> 人</div>`; }
  const over=month>st.budget, overT=month>S.target;
  const stTxt = over?`<b class="bad">⚠ 超過可用時數 ${n(month-st.budget)} hr（爆工時）</b>`:(overT?`<b style="color:var(--warn)">⚠ 超過目標 ${n(month-S.target)} hr，但還在可用時數內</b>`:`<b class="okc">✓ 在目標內，還剩 ${n(S.target-month)} hr 可以彈性排</b>`);
  return `<div class="kpi" style="margin-bottom:6px">
    <div class="k"><small>每天最少人時</small><b style="font-size:${mode==='simple'?'18px':'24px'}">${daily}</b> 人時</div>
    <div class="k"><small>換算 ${mm.m} 月（${mm.days} 天）</small><b class="${over?'bad':''}">${n(month)}</b> hr</div>
    <div class="k"><small>目標排班工時</small><b>${n(S.target)}</b> hr</div>
    <div class="k"><small>可用時數</small><b>${n(st.budget)}</b> hr</div>
    ${peakK}
  </div><div style="margin-bottom:12px;font-size:18px">${stTxt}　<small class="muted">${how}</small></div>`;
}
function simpleStaff(box){
  const S=L.S;
  box.innerHTML=`<div class="muted" style="margin-bottom:8px">客戶原本的每天最少人數（照星期分）。</div>
  <div class="tbl-wrap"><table class="g" style="width:100%"><thead><tr><th style="text-align:left">職務</th><th>週一</th><th>週二～五、日</th><th>週六</th><th>平日換算人時</th><th style="text-align:left">怎麼算</th></tr></thead><tbody>
  ${S.staffing.map((s,i)=>`<tr><td style="text-align:left"><b>${esc(s.job)}</b></td>${['mon','wk','sat'].map(k=>`<td><input data-i="${i}" data-k="${k}" value="${esc(s[k])}" style="width:70px;font-size:18px;text-align:center;padding:4px;border:1.5px solid var(--line);border-radius:8px"></td>`).join('')}<td><b>${firstNum(s.wk)*PER_PERSON}</b></td><td style="text-align:left;white-space:normal;max-width:420px"><small>${esc(s.rule)}</small></td></tr>`).join('')}
  </tbody><tfoot>${(()=>{ const ld=lastMonthDays(), tot=k=>S.staffing.reduce((a,s)=>a+firstNum(s[k]),0), K=['mon','wk','sat'];
    return `<tr><td style="text-align:left">合計人數</td>${K.map(k=>`<td class="${tot(k)>ld[k].avg?'cmp-hi':''}">${tot(k)}</td>`).join('')}<td>${tot('wk')*PER_PERSON}</td><td></td></tr>
    <tr class="ref"><td style="text-align:left">${NW.m} 月最低</td>${K.map(k=>`<td>${ld[k].min}</td>`).join('')}<td colspan="2" style="text-align:left"><small>上個月同一種日子（週一／平日／週六）實際上班人數</small></td></tr>
    <tr class="ref"><td style="text-align:left">${NW.m} 月平均</td>${K.map(k=>`<td>${ld[k].avg}</td>`).join('')}<td colspan="2"></td></tr>`; })()}</tfoot></table></div>
  <div class="muted" style="margin-top:8px;font-size:15px">簡易版是一整天的人數，所以跟上個月「同一種日子」一整天上班的人數比。<span class="cmp-hi" style="padding:1px 6px;border-radius:4px">紅底</span>＝比上個月平均還多，要注意會不會爆人時。<br>※ 上個月的人數是照班別算有排班的人，所以會比實際在場的人略多。</div>`;
}
function runs(arr){ const out=[]; let i=0; while(i<arr.length){ if(!arr[i]){ i++; continue; } let j=i; while(j+1<arr.length&&arr[j+1]===arr[i]) j++; out.push({a:i,b:j+1,n:arr[i]}); i=j+1; } return out; }
/* 上個月（本月 12 月）實際班表：每半小時上班人數的最低／平均，用來對標、避免爆人時 */
function lastMonthSlots(){
  const mm=NW, M=L.S.months[mm.key], per=[];
  for(let d=1; d<=mm.days; d++){
    const row=Array(L.NSLOT).fill(0);
    D.employees.forEach(e=>{ const sh=L.shiftOf(M.sched[e.id][d-1]); if(!sh) return; const a=L.tm(sh.start); let z=L.tm(sh.end); if(z<=a) z+=1440;
      for(let i=0;i<L.NSLOT;i++){ const t=L.SLOT0+i*30; if(t>=a && t<z) row[i]++; } });
    per.push(row);
  }
  const min=[...Array(L.NSLOT)].map((_,i)=>Math.min(...per.map(r=>r[i])));
  const avg=[...Array(L.NSLOT)].map((_,i)=>Math.round(per.reduce((x,r)=>x+r[i],0)/per.length*10)/10);
  return {min,avg,mm};
}
function lastMonthDays(){ // 簡易版：照星期分的上班人數
  const mm=NW, M=L.S.months[mm.key], cat=d=>{ const w=L.dow(d,mm); return w===1?'mon':(w===6?'sat':'wk'); }, by={mon:[],wk:[],sat:[]};
  for(let d=1; d<=mm.days; d++) by[cat(d)].push(D.employees.filter(e=>L.isWork(M.sched[e.id][d-1])).length);
  const r={}; Object.entries(by).forEach(([k,v])=>r[k]={min:Math.min(...v), avg:Math.round(v.reduce((a,b)=>a+b,0)/v.length*10)/10}); return r;
}
const cmpCls=(t,lm,i)=> t>lm.avg[i]?'cmp-hi':'';
function hourStaff(box){
  const S=L.S, PX=2.4, SW=30*PX, W=L.NSLOT*SW, LW=150;
  const total=[...Array(L.NSLOT)].map((_,i)=>L.SKILLS.reduce((a,s)=>a+(S.req[s][i]||0),0));
  const manH = total.reduce((a,b)=>a+b,0)/2, peak = Math.max(...total), lm=lastMonthSlots();
  const grid=`background-image:repeating-linear-gradient(90deg,transparent 0,transparent ${SW-1}px,#eef0f4 ${SW-1}px,#eef0f4 ${SW}px),repeating-linear-gradient(90deg,transparent 0,transparent ${2*SW-1.5}px,#d5d9e1 ${2*SW-1.5}px,#d5d9e1 ${2*SW}px)`;
  const numRow=(label,arr,cls,fn)=>`<div class="hs-row ${cls}"><div class="hs-lab">${label}</div><div style="position:relative;width:${W}px;height:34px">${arr.map((t,i)=>`<div class="hs-num ${fn?fn(t,i):''}" style="left:${i*SW}px;width:${SW}px">${t||''}</div>`).join('')}</div></div>`;
  box.innerHTML=`<div class="muted" style="margin-bottom:8px">每個技能在哪些時段要幾個人，每格半小時。<b>拖長條中間＝整段移動；拖左右兩邊＝改開始／結束；在空白處拖一下＝新增一段</b>；點一下長條可以改人數。（照 Miro「關鍵職務／必要人力」）</div>
  <div class="tbl-wrap" style="max-height:none"><div style="width:${W+LW}px">
    <div class="hs-row hs-head"><div class="hs-lab">技能</div>
      <div style="position:relative;width:${W}px;height:44px">${[...Array(L.NSLOT)].map((_,i)=>{ const full=i%2===0; return `<div class="hs-tick ${full?'h':''}" style="left:${i*SW}px;width:${SW}px">${full?fmtSlot(i).slice(0,2)+'<small>:00</small>':'<small>:30</small>'}</div>`; }).join('')}</div></div>
    ${L.SKILLS.map(s=>`<div class="hs-row"><div class="hs-lab"><i style="background:${L.taskColor(s)}"></i> <b>${s}</b></div>
      <div class="rq" data-s="${s}" style="position:relative;width:${W}px;height:52px;cursor:crosshair;touch-action:none;${grid}">
      ${runs(S.req[s]).map(r=>`<div class="rqb" data-s="${s}" data-a="${r.a}" data-b="${r.b}" style="left:${r.a*SW}px;width:${(r.b-r.a)*SW}px;background:${L.taskColor(s)}"><i class="hl"></i><span>${r.n} 人　<small>${fmtSlot(r.a)}～${fmtSlot(r.b)}</small></span><i class="hr"></i></div>`).join('')}
      </div></div>`).join('')}
    ${numRow('合計人數',total,'hs-sum',(t,i)=>cmpCls(t,lm,i))}
    ${numRow(`${lm.mm.m} 月最低`,lm.min,'hs-ref')}
    ${numRow(`${lm.mm.m} 月平均`,lm.avg,'hs-ref')}
  </div></div>
  ${cmpNote(lm)}`;
  bindRunDrag(box, SW);
}
function cmpNote(lm){ return `<div class="muted" style="margin-top:8px;font-size:15px">「${lm.mm.m} 月最低／平均」＝上個月實際班表，同一個時段上班的人數。<span class="cmp-hi" style="padding:1px 6px;border-radius:4px">紅底</span>＝合計比上個月平均還多，要注意會不會爆人時。<br>※ 上個月的人數是照班別起訖時間算，休息時間也算在內，所以數字會比實際在場的人略多。</div>`; }
/* 依時段：拖拉移動／調整／新增 */
function bindRunDrag(box, SW){
  const S=L.S; let st=null;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const paint=()=>{ st.el.style.left=st.na*SW+'px'; st.el.style.width=(st.nb-st.na)*SW+'px'; const sp=st.el.querySelector('span'); if(sp) sp.innerHTML=`${st.n} 人　<small>${fmtSlot(st.na)}～${fmtSlot(st.nb)}</small>`; };
  box.querySelectorAll('.rq').forEach(row=>{
    row.addEventListener('pointerdown',ev=>{
      if(ev.button>0) return;
      const rect=row.getBoundingClientRect(), s=row.dataset.s, b=ev.target.closest('.rqb'), CW=SW*L.zoomF();
      if(b){ const a=+b.dataset.a, z=+b.dataset.b; st={s,row,rect,CW,el:b,a,b:z,n:S.req[s][a],na:a,nb:z,x0:ev.clientX,moved:false,
          kind: ev.target.classList.contains('hl')?'l':(ev.target.classList.contains('hr')?'r':'m')}; b.classList.add('drag'); }
      else { const i=clamp(Math.floor((ev.clientX-rect.left)/CW),0,L.NSLOT-1); const el=document.createElement('div'); el.className='rqb drag';
        el.style.background=L.taskColor(s); el.innerHTML='<span></span>'; row.appendChild(el);
        st={s,row,rect,CW,el,kind:'new',i0:i,na:i,nb:i+1,n:1,x0:ev.clientX,moved:false}; paint(); }
      row.setPointerCapture(ev.pointerId); ev.preventDefault();
    });
    row.addEventListener('pointermove',ev=>{
      if(!st||st.row!==row) return;
      if(Math.abs(ev.clientX-st.x0)>4) st.moved=true; if(!st.moved) return;
      const dx=Math.round((ev.clientX-st.x0)/st.CW), len=st.b-st.a;
      if(st.kind==='m'){ st.na=clamp(st.a+dx,0,L.NSLOT-len); st.nb=st.na+len; }
      else if(st.kind==='l'){ st.na=clamp(st.a+dx,0,st.b-1); }
      else if(st.kind==='r'){ st.nb=clamp(st.b+dx,st.a+1,L.NSLOT); }
      else { const c=clamp(Math.floor((ev.clientX-st.rect.left)/st.CW),0,L.NSLOT-1); st.na=Math.min(st.i0,c); st.nb=Math.max(st.i0,c)+1; }
      paint();
    });
    const end=ev=>{
      if(!st||st.row!==row) return; const x=st; st=null;
      if(!x.moved){ if(x.kind==='new'){ x.el.remove(); editRun(x.s,x.i0,Math.min(L.NSLOT,x.i0+2),true); } else { x.el.classList.remove('drag'); editRun(x.s,x.a,x.b); } return; }
      const arr=S.req[x.s];
      if(x.kind!=='new') for(let i=x.a;i<x.b;i++) arr[i]=0;
      for(let i=x.na;i<x.nb;i++) arr[i]=x.n;
      L.log('最少人力',`${x.s} ${x.kind==='new'?'新增':'拖拉'} ${fmtSlot(x.na)}～${fmtSlot(x.nb)}`,x.kind==='new'?'':`${fmtSlot(x.a)}～${fmtSlot(x.b)}`,`${x.n} 人`);
      L.redraw();
    };
    row.addEventListener('pointerup',end); row.addEventListener('pointercancel',ev=>{ if(st&&st.row===row){ L.redraw(); st=null; } });
  });
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
  const S=L.S, lm=lastMonthSlots();
  box.innerHTML=`<div class="muted" style="margin-bottom:8px">每個技能、每半小時最少要幾個人（照 GPT 版／Miro 表格版）。直接改數字，改完自動存。</div>
  <div class="tbl-wrap"><table class="g"><thead><tr><th class="sticky">技能</th>${[...Array(L.NSLOT)].map((_,i)=>`<th style="font-size:13px;padding:4px">${fmtSlot(i)}</th>`).join('')}<th>人時</th></tr></thead><tbody>
  ${L.SKILLS.map(s=>`<tr><td class="sticky"><i style="display:inline-block;width:14px;height:14px;border-radius:3px;background:${L.taskColor(s)};border:1px solid #999;vertical-align:-2px"></i> <b>${s}</b></td>${S.req[s].map((v,i)=>`<td style="padding:3px"><input class="req-in ${v?'nz':''}" data-s="${s}" data-i="${i}" value="${v||''}"></td>`).join('')}<td><b>${S.req[s].reduce((a,b)=>a+b,0)/2}</b></td></tr>`).join('')}
  </tbody><tfoot><tr><td class="sticky">合計人數</td>${[...Array(L.NSLOT)].map((_,i)=>{ const t=L.SKILLS.reduce((a,s)=>a+(S.req[s][i]||0),0); return `<td class="${cmpCls(t,lm,i)}">${t||''}</td>`; }).join('')}<td>${L.SKILLS.reduce((a,s)=>a+S.req[s].reduce((x,y)=>x+y,0),0)/2}</td></tr>
    <tr class="ref"><td class="sticky">${lm.mm.m} 月最低</td>${lm.min.map(v=>`<td>${v||''}</td>`).join('')}<td></td></tr>
    <tr class="ref"><td class="sticky">${lm.mm.m} 月平均</td>${lm.avg.map(v=>`<td>${v||''}</td>`).join('')}<td></td></tr></tfoot></table></div>${cmpNote(lm)}`;
  box.querySelectorAll('.req-in').forEach(i=>i.onchange=()=>{ const v=Math.max(0,parseInt(i.value,10)||0); S.req[i.dataset.s][i.dataset.i]=v; L.log('最少人力',`${i.dataset.s} ${fmtSlot(Number(i.dataset.i))}`,'',`${v} 人`); L.redraw(); });
}

/* ============ 出勤檢核（示意，12 月今天以前） ============ */
/* ============ 出勤檢核（整個月：小月曆看哪天還沒處理；加班累計） ============ */
function hsh(a,b){ let x=Math.imul(a+1,73856093)^Math.imul(b+7,19349663); x=Math.imul(x^(x>>>13),1274126177); return (x^(x>>>16))>>>0; }
const OT_LIMIT=40*60, OT_WARN=32*60;
const ATT_DONE={'走請假':'已請假','補刷卡':'已補卡','加班申請':'已申請加班'}, ATT_TODO={'走請假':'還沒請假','補刷卡':'還沒補卡','加班申請':'還沒申請加班'};
function attRow(mm, M, e, i, d, di, dout){
  const code=M.sched[e.id][d-1], s=L.shiftOf(code); if(!s) return null;
  const st=L.tm(s.start), en=L.tm(s.end), late=di>0?di:0, early=di<0?-di:0, over=dout>0?dout:0, leaveE=dout<0?-dout:0;
  let ab=[], sug='', act=null, shift=0;
  if(di===null){ ab.push('上班沒刷卡'); sug='補刷卡'; act='補刷卡'; }
  else {
    if(late) ab.push(`遲到 ${late} 分`); if(early) ab.push(`提早上班 ${early} 分`);
    if(over) ab.push(`延後下班 ${over} 分`); if(leaveE) ab.push(`早退 ${leaveE} 分`);
    if(late&&over) shift=Math.floor(Math.min(late,over)/30)*30;
    if(early&&leaveE) shift=-Math.floor(Math.min(early,leaveE)/30)*30;
    if(shift){ sug=`可以請假，或調整班表（上下班都${shift>0?'延後':'提前'} ${Math.abs(shift)} 分，工時不變）`; act='走請假'; }
    else if(late||leaveE){ sug='請假'; act='走請假'; }
    else if(over||early){ sug='加班申請'; act='加班申請'; }
  }
  if(!ab.length) return null;
  return {e,i,d,code,s,di,dout,ab,sug,act,shift,k:`${mm.key}_${e.id}_${d}`,ak:e.id+'_'+d,inP:di===null?'—':L.fmt(st+di),outP:L.fmt(en+dout),newS:L.fmt(st+shift),newE:L.fmt(en+shift)};
}
/* 一整個月的異常（示範資料：依日期、人固定算出來；昨天放固定的 6 個情境） */
function attMonth(mm){
  const S=L.S, M=S.months[mm.key], t=L.today(), last=mm.kind==='now'?t.d-1:mm.days, byDay={};
  const FIX=[[12,0],[44,45],[null,0],[0,45],[-30,-30],[0,-30]];
  for(let d=1; d<=last; d++){
    const ago=mm.kind==='now'?last-d:40, rows=[];
    if(mm.kind==='now' && d===last){ let k=0; D.employees.forEach((e,i)=>{ if(k<FIX.length && L.shiftOf(M.sched[e.id][d-1])){ const r=attRow(mm,M,e,i,d,FIX[k][0],FIX[k][1]); k++; if(r) rows.push(r); } }); }
    else D.employees.forEach((e,i)=>{
      if(!L.shiftOf(M.sched[e.id][d-1]) || hsh(d+mm.m*40,i)%100>=8) return;
      const r1=hsh(d,i*3), r2=hsh(i*5,d), kind=hsh(i,d+mm.m)%6; let di=0, dout=0;
      if(kind===0) di=5+r1%25; else if(kind===1){ di=30+r1%25; dout=30+r2%30; } else if(kind===2) di=null;
      else if(kind===3) dout=20+r2%40; else if(kind===4){ di=-(30+r1%20); dout=-(30+r2%20); } else dout=-(15+r2%30);
      const r=attRow(mm,M,e,i,d,di,dout); if(!r) return;
      if(mm.kind==='past' || hsh(d*3,i+11)%10 < (r.shift?(ago>=4?5:0):(ago>=4?9:ago>=2?6:ago>=1?4:1))) r.ext=ATT_DONE[r.act];   // 其他系統已經處理（過去月份都已結算）
      rows.push(r);
    });
    rows.forEach(r=>{ if(S.att[r.k]==='調整班表') r.adjusted=true; r.pending=!r.ext&&!r.adjusted; });
    byDay[d]=rows;
  }
  return {byDay,last};
}
const fmtHM=m=>`${Math.floor(m/60)} 小時${m%60?' '+(m%60)+' 分':''}`;
route('/attendance',(main)=>{
  const S=L.S; S.att=S.att||{};
  const mk=sessionStorage.getItem('lsp_attmk')||NW.key, mm=L.mon(mk)||NW, M=S.months[mm.key]; M.adj=M.adj||{};
  const tab=sessionStorage.getItem('lsp_atttab')||'abn';
  const {byDay,last}=attMonth(mm);
  const pendAll=Object.values(byDay).flat().filter(r=>r.pending), pendDays=Object.values(byDay).filter(r=>r.some(x=>x.pending)).length;
  const head=`<div class="sh"><div class="sh-r1"><div class="seg big">${[['abn','⚠️ 出勤異常'],['ot','⏱ 加班累計']].map(([k,t])=>`<button data-atab="${k}" class="${tab===k?'on':''}">${t}</button>`).join('')}</div><div class="spacer"></div><span class="muted">（示意資料）</span></div>
    <div class="sh-r2"><div class="sh-left"><div class="sh-line">${L.monthPick(mm.key,'data-amk',['past','now'])}${mm.kind==='past'?'<span class="pill sent">已結束・只能看</span>':''}</div></div></div></div>`;
  const bindHead=()=>{ main.querySelectorAll('[data-atab]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_atttab',b.dataset.atab); L.redraw(); });
    main.querySelectorAll('[data-amk]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_attmk',b.dataset.amk); L.redraw(); }); };

  if(tab==='ot'){ // ---- 加班累計 ----
    const ot={}; D.employees.forEach((e,i)=>{ let m=0; for(let d=1; d<=last; d++){ if(!L.shiftOf(M.sched[e.id][d-1])) continue; m+= i===1?118 : (i===4?100 : hsh(d,i)%5); }
      Object.values(byDay).flat().filter(r=>r.e.id===e.id).forEach(r=>{ if(r.di===null) return; let x=Math.max(0,r.dout)+Math.max(0,-r.di); if(r.adjusted) x=Math.max(0,x-Math.abs(r.shift)*2); m+=x; }); ot[e.id]=m; });
    const list=D.employees.filter(L.empFilterFn()).sort((a,b)=>ot[b.id]-ot[a.id]), total=Object.values(ot).reduce((a,b)=>a+b,0);
    main.innerHTML=head+`<div class="sh-line" style="margin-bottom:10px">${L.empFilterBar()}<div class="spacer"></div><b style="font-size:20px">全店加班合計：${fmtHM(total)}</b></div>
    <div class="banner blue">依提早上班和延後下班的打卡分鐘累計（${mm.m}/1～${mm.m}/${last}）；沒刷卡要補卡後才算。<b>累計到 40 小時變紅，不能再加班</b>；32 小時以上黃色提醒。</div>
    <div class="tbl-wrap"><table class="g" style="width:100%"><thead><tr><th style="text-align:left">姓名</th><th>職稱・組別</th><th style="min-width:240px">累計加班</th><th>還可加班</th><th style="text-align:left">提醒</th></tr></thead><tbody>
    ${list.map(e=>{ const m=ot[e.id], over=m>=OT_LIMIT, near=!over&&m>=OT_WARN;
      return `<tr class="${over?'ot-over':(near?'ot-near':'')}"><td style="text-align:left"><b>${esc(e.name)}</b> <small class="muted">${e.id}</small></td><td>${e.title}・${e.group||'未選組別'}</td><td style="text-align:left"><b>${fmtHM(m)}</b><div class="ot-bar"><i style="width:${Math.min(100,m/OT_LIMIT*100)}%;${over?'background:#e02424':(near?'background:#f5a524':'')}"></i></div></td><td><b>${over?'0 小時':fmtHM(OT_LIMIT-m)}</b></td><td style="text-align:left">${over?'<b>已達 40 小時，不能再加班</b>':(near?`<b style="color:#b54708">快到上限，只剩 ${fmtHM(OT_LIMIT-m)}</b>`:'<span class="muted">—</span>')}</td></tr>`; }).join('')}
    </tbody></table></div>`;
    bindHead(); L.bindEmpFilter(main); return;
  }

  // ---- 出勤異常：左邊小月曆、右邊那一天的明細 ----
  let sd=Number(sessionStorage.getItem('lsp_attd_'+mm.key)); if(!(sd>=1&&sd<=last)){ const pd=Object.keys(byDay).map(Number).filter(d=>byDay[d].some(r=>r.pending)); sd=pd.length?pd[pd.length-1]:last; }
  const lead=(mm.fd+6)%7, rows=byDay[sd]||[], past=mm.kind==='past';
  let cal=['一','二','三','四','五','六','日'].map(x=>`<div class="h">${x}</div>`).join('')+'<div></div>'.repeat(lead);
  for(let d=1; d<=mm.days; d++){ if(d>last){ cal+=`<div class="att-day fut">${d}</div>`; continue; }
    const r=byDay[d], p=r.filter(x=>x.pending).length; cal+=`<button class="att-day ${d===sd?'on':''}" data-ad="${d}">${d}${p?`<span class="cnt">${p}</span>`:(r.length?'<span class="ok">✓</span>':'')}</button>`; }
  const pend=rows.filter(r=>r.pending).length;
  main.innerHTML=head+`<div class="att-wrap">
    <div class="att-cal"><div class="b" style="text-align:center;font-size:19px;margin-bottom:8px">${mm.y} 年 ${mm.m} 月</div><div class="g7">${cal}</div>
      </div>
    <div class="att-side">
      <div class="muted" style="font-size:16px"><span class="cnt-dot">●</span> 紅色數字＝那天還沒處理的筆數<br>✓＝那天都處理好了<br>點日子看下面的明細</div>
      <div class="att-sum"><small>${mm.m} 月還沒處理</small><b class="${pendAll.length?'bad':'okc'}">${pendAll.length}</b> 筆，分在 <b>${pendDays}</b> 天</div>
      <div class="att-sum"><small>現在看</small><b>${mm.m}/${sd}（${L.DOW[L.dow(sd,mm)]}）</b><br>異常 ${rows.length} 筆　${pend?`<span class="st-pill todo">還沒處理 ${pend} 筆</span>`:(rows.length?'<span class="st-pill done">✓ 都處理好了</span>':'')}</div>
    </div></div>
    <div>
      <div class="tbl-wrap"><table class="g" style="width:100%"><thead><tr><th style="text-align:left">姓名</th><th>班別</th><th>上班卡</th><th>下班卡</th><th>異常</th><th style="text-align:left">建議</th><th>調整班表</th><th>處理</th></tr></thead><tbody>
      ${rows.map(x=>{
        const adjCell=!x.shift?'<span class="muted">—</span>':`<div class="adj-info ${x.adjusted||x.ext?'done':''}"><b>${x.shift>0?'⏩ 上下班都延後':'⏪ 上下班都提前'} ${Math.abs(x.shift)} 分</b><br>${x.s.start}～${x.s.end} → <b>${x.newS}～${x.newE}</b></div>`;
        let doCell;
        if(x.adjusted) doCell=`<span class="st-pill done">✓ 已調整班表</span>${past?'':`<br><button class="btn sm" data-undo="${x.k}" style="margin-top:4px">復原</button>`}`;
        else if(x.ext) doCell=`<span class="st-pill done">✓ ${x.ext}</span>`;
        else if(x.shift && !past) doCell=`<button class="btn pri" data-adj="${x.k}">調整班表</button><div class="muted" style="font-size:14px;margin-top:4px">或員工去請假</div>`;
        else doCell=`<span class="st-pill todo">${ATT_TODO[x.act]}</span>`;
        return `<tr class="${x.pending?'':'att-done'}"><td style="text-align:left"><b>${esc(x.e.name)}</b><br><small class="muted">${x.e.title}</small></td><td>${x.s.start}～${x.s.end}<br><small class="muted">${x.code} ${L.hrsTag(x.code)}</small></td><td>${x.inP}</td><td>${x.outP}</td><td class="bad b">${x.ab.join('<br>')}</td><td style="text-align:left;white-space:normal;max-width:280px">${x.sug}</td><td>${adjCell}</td><td>${doCell}</td></tr>`; }).join('')||'<tr><td colspan="8" class="muted" style="padding:20px">這天沒有異常</td></tr>'}
      </tbody></table></div>
    </div>
  <ul class="note-below"><li>這個系統只能「調整班表」：遲到又延後下班（或提早上班又早退）時，按「調整班表」把那天的上下班時間一起往後（往前）移，工時不變，異常就解除；以 30 分為單位（例：遲到 44 分、晚走 45 分 → 延後 30 分）。調整後月班表那一格會標「調」。</li>
    <li>請假、補刷卡、加班申請在其他系統辦；辦好後這裡會自動顯示「✓ 已請假」「✓ 已補卡」「✓ 已申請加班」（示範資料）。</li>${past?'<li>過去的月份已經結算，只能看，不能調整班表。</li>':''}</ul>`;
  bindHead();
  main.querySelectorAll('[data-ad]').forEach(b=>b.onclick=()=>{ sessionStorage.setItem('lsp_attd_'+mm.key,b.dataset.ad); L.redraw(); });
  const byK=k=>rows.find(x=>x.k===k);
  main.querySelectorAll('[data-adj]').forEach(b=>b.onclick=()=>{ const x=byK(b.dataset.adj);
    modal(`<h3>調整 ${esc(x.e.name)} ${mm.m}/${sd} 的班</h3><div style="font-size:20px;margin:10px 0">${x.s.start}～${x.s.end} → <b>${x.newS}～${x.newE}</b></div><div class="muted">上下班都${x.shift>0?'延後':'提前'} ${Math.abs(x.shift)} 分，工時不變。調整後異常解除。</div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px"><button class="btn" data-x>取消</button><button class="btn pri" data-ok>確定調整</button></div>`,(m,close)=>{
      m.querySelector('[data-x]').onclick=close;
      m.querySelector('[data-ok]').onclick=()=>{ M.adj[x.ak]={start:x.newS,end:x.newE}; S.att[x.k]='調整班表'; L.log('出勤',`調整班表 ${x.e.name} ${mm.m}/${sd}`,`${x.s.start}～${x.s.end}`,`${x.newS}～${x.newE}`); L.save(); close(); toast('已調整班表',`${x.e.name} ${mm.m}/${sd} 改成 ${x.newS}～${x.newE}，月班表那一格會標「調」。`,'info'); L.redraw(); };
    }); });
  main.querySelectorAll('[data-undo]').forEach(b=>b.onclick=()=>{ const x=byK(b.dataset.undo); delete M.adj[x.ak]; delete S.att[x.k]; L.log('出勤',`復原調整 ${x.e.name} ${mm.m}/${sd}`); L.save(); L.redraw(); });
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
