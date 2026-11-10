/*
 * 8-bit 像素場景（原創，以程式繪製，無授權問題）
 * 每個場景畫在 160×90 的畫布上，網頁再放大成馬賽克顆粒感。
 * draw(c, t)：c＝canvas 2D context，t＝秒數（已量化成每秒 12 格，讓動作有 8-bit 的頓點感）
 * 新增場景：在 SCENES 加一個 key，並在 index.html 的景點加上 px:'同一個 key'
 */
(function(){
  const W = 160, H = 90;

  /* ---------- 基本繪圖工具 ---------- */
  const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
  function hash(i){            // 固定的偽亂數，讓沙粒、星星每格都在同一位置
    i = (i ^ 61) ^ (i >>> 16); i = i + (i << 3); i = i ^ (i >>> 4);
    i = Math.imul(i, 0x27d4eb2d); i = i ^ (i >>> 15); return (i >>> 0) / 4294967296;
  }
  function bands(c, cols, y0, h){ const bh = h / cols.length; cols.forEach((col, i) => R(c, 0, y0 + Math.floor(i * bh), W, Math.ceil(bh) + 1, col)); }
  function disc(c, cx, cy, r, col){ for(let y = -r; y <= r; y++){ const w = Math.round(Math.sqrt(r * r - y * y)); R(c, cx - w, cy + y, w * 2 + 1, 1, col); } }
  function cloud(c, x, y){ R(c, x + 3, y, 8, 2, '#ffffff'); R(c, x, y + 2, 15, 3, '#ffffff'); R(c, x + 1, y + 5, 13, 1, '#d6ecf5'); }
  function speckle(c, x0, y0, w, h, col, n, seed){ for(let i = 0; i < n; i++) R(c, x0 + Math.floor(hash(seed + i) * w), y0 + Math.floor(hash(seed + i + 999) * h), 1, 1, col); }
  function line(c, x0, y0, x1, y1, col){
    let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for(;;){ R(c, x0, y0, 1, 1, col); if(x0 === x1 && y0 === y1) break; const e2 = 2 * err; if(e2 >= dy){ err += dy; x0 += sx; } if(e2 <= dx){ err += dx; y0 += sy; } }
  }
  function sprite(c, rows, x, y, pal){ rows.forEach((row, j) => [...row].forEach((ch, i) => { if(pal[ch]) R(c, x + i, y + j, 1, 1, pal[ch]); })); }
  function gull(c, x, y, up){
    const col = '#4b5563';
    if(up){ R(c, x, y + 1, 1, 1, col); R(c, x + 1, y, 1, 1, col); R(c, x + 2, y + 1, 1, 1, col); R(c, x + 3, y, 1, 1, col); R(c, x + 4, y + 1, 1, 1, col); }
    else  { R(c, x, y, 1, 1, col); R(c, x + 1, y + 1, 3, 1, col); R(c, x + 4, y, 1, 1, col); }
  }

  /* ---------- 場景 1：Brighton 七彩沙灘屋 ---------- */
  function bathingBox(c, x, y, a, b){
    // 屋頂（階梯三角形）
    for(let r = 0; r < 6; r++) R(c, x + 7 - r, y - 6 + r, r * 2 + 1, 1, r === 5 ? '#f5f5f5' : '#6b3f2a');
    if(a === 'flag'){
      R(c, x, y, 15, 16, '#1d3f8f');
      R(c, x + 1, y + 2, 7, 3, '#ffffff'); R(c, x + 3, y + 1, 3, 5, '#ffffff');   // 英國國旗白十字（粗）
      R(c, x + 1, y + 3, 7, 1, '#e63946'); R(c, x + 4, y + 2, 1, 3, '#e63946');
      [[11, 3], [12, 7], [9, 9], [13, 10], [4, 10]].forEach(([dx, dy]) => R(c, x + dx, y + dy, 1, 1, '#ffffff'));
    } else {
      for(let i = 0; i < 15; i++) R(c, x + i, y, 1, 16, Math.floor(i / 2) % 2 ? b : a);
    }
    R(c, x + 5, y + 7, 5, 9, '#3b2a20');          // 門
    R(c, x + 6, y + 8, 3, 7, '#5a4030');
    R(c, x - 1, y + 16, 17, 1, '#d4b77c');        // 影子
  }
  function brighton(c, t){
    bands(c, ['#5ec4f2', '#7dd3f5', '#a5e3f8', '#cdf0fb'], 0, 44);
    disc(c, 134, 13, 7, '#fff3b0'); disc(c, 134, 13, 5, '#ffe066');
    [[0, 8, .6], [70, 17, .4], [120, 5, .5]].forEach(([b, y, s]) => cloud(c, ((b + t * s * 6) % 200) - 30, y));
    // 遠方墨爾本市區天際線
    [[4, 36, 4], [9, 31, 3], [13, 34, 5], [19, 27, 3], [23, 32, 4], [28, 35, 6], [35, 30, 3], [39, 35, 5]]
      .forEach(([x, y, w]) => R(c, x, y, w, 44 - y, '#8fa9ba'));
    // 海
    R(c, 0, 44, W, 16, '#1f8fd1'); R(c, 0, 44, W, 3, '#2aa6e0'); R(c, 0, 53, W, 7, '#1677b5');
    for(let i = 0; i < 16; i++){
      if((Math.floor(t * 2) + i) % 3 === 0) continue;
      R(c, (hash(i) * W + t * (4 + hash(i + 50) * 6)) % W, 45 + Math.floor(hash(i + 20) * 13), 3, 1, '#bfe9ff');
    }
    // 浪花
    const fy = 59 + Math.round(Math.sin(t * 1.5));
    R(c, 0, fy, W, 2, '#eaf8ff');
    for(let x = -6; x < W; x += 6) R(c, x + (Math.floor(t * 3) % 6), fy + 2, 3, 1, '#eaf8ff');
    // 沙灘
    R(c, 0, fy + 2, W, H, '#f2d9a0'); R(c, 0, 76, W, 14, '#ead09a');
    speckle(c, 0, 63, W, 27, '#d6b97c', 90, 7);
    // 沙灘屋
    const cols = [['#e63946', '#ffffff'], ['#2a9d8f', '#e9c46a'], ['flag'], ['#f4a261', '#ffffff'], ['#457b9d', '#a8dadc'], ['#ffb703', '#fb8500'], ['#8338ec', '#ffd166']];
    cols.forEach(([a, b], i) => bathingBox(c, 7 + i * 21, 59, a, b));
    // 海鷗
    gull(c, (t * 14) % 200 - 20, 24 + Math.round(Math.sin(t * 2) * 2), Math.floor(t * 4) % 2);
    gull(c, (t * 11 + 90) % 200 - 20, 30 + Math.round(Math.sin(t * 2 + 1) * 2), Math.floor(t * 4 + 1) % 2);
  }

  /* ---------- 場景 2：菲利普島 神仙小企鵝夜歸巢 ---------- */
  const PENGUIN = [
    ['..BB..', '.BBEK.', '.BWBB.', '.BWWB.', '.BWWB.', '..WW..', '.F..F.'],
    ['..BB..', '.BBEK.', '.BWBB.', '.BWWB.', '.BWWB.', '..WW..', '..FF..']
  ];
  const PPAL = { B: '#4a6fa5', W: '#f4f4f4', E: '#ffffff', K: '#222222', F: '#e9a3a3' };
  function penguins(c, t){
    bands(c, ['#24183f', '#4a2462', '#8a3468', '#d05a55', '#f19149', '#fbc66e'], 0, 50);
    for(let i = 0; i < 14; i++) if((Math.floor(t * 2) + i) % 4) R(c, hash(i + 300) * W, hash(i + 400) * 16, 1, 1, '#fff2c4');
    disc(c, 80, 50, 9, '#ffd27a');                       // 夕陽（下半被海蓋住）
    R(c, 0, 50, W, 16, '#2c3f73'); R(c, 0, 50, W, 2, '#4a5a8f');
    for(let y = 52; y < 66; y += 2){                     // 夕陽倒影閃爍
      const w = 9 - Math.floor((y - 52) / 2) + (Math.floor(t * 4 + y) % 2);
      R(c, 80 - w, y, w * 2, 1, '#f6b26b');
    }
    for(let i = 0; i < 10; i++) if((Math.floor(t * 3) + i) % 3) R(c, (hash(i + 60) * W + t * 3) % W, 53 + Math.floor(hash(i + 70) * 12), 2, 1, '#6d7fb5');
    const fy = 66 + Math.round(Math.sin(t * 1.2) * 1.5);
    R(c, 0, fy, W, H, '#8a6f5a'); R(c, 0, 78, W, 12, '#7d6450');
    for(let x = -5; x < W; x += 5) R(c, x + (Math.floor(t * 2) % 5), fy, 3, 1, '#d9e3f0');
    speckle(c, 0, 70, W, 20, '#6e5745', 60, 21);
    // 右側沙丘與草
    for(let x = 104; x < W; x++){
      const top = Math.round(72 - (x - 104) * 0.22 + Math.sin(x * 0.35));
      R(c, x, top, 1, H - top, '#6b5d3f');
      if(hash(x) > .55) R(c, x, top - 2, 1, 2, hash(x + 1) > .5 ? '#4f6b33' : '#3e5628');
    }
    // 左側觀景看台與觀眾剪影
    R(c, 3, 66, 34, 3, '#3a2a28'); [5, 18, 31].forEach(x => R(c, x, 69, 2, 9, '#3a2a28'));
    for(let i = 0; i < 8; i++){ R(c, 5 + i * 4, 61, 2, 2, '#1f1a24'); R(c, 4 + i * 4, 63, 4, 3, '#1f1a24'); }
    // 企鵝隊伍從海邊走向沙丘
    for(let i = 0; i < 6; i++){
      const prog = (t * 0.055 + i / 6) % 1;
      const x = 44 + prog * 66, y = 73 - prog * 6 + (i % 2) * 3;
      const f = Math.floor(t * 6 + i) % 2;
      sprite(c, PENGUIN[f], x, y - f, PPAL);
    }
  }

  /* ---------- 場景 3：普芬比利蒸汽火車 過木棧橋 ---------- */
  function wheel(c, x, y, col, frame){
    R(c, x + 1, y, 2, 4, col); R(c, x, y + 1, 4, 2, col);
    const hub = [[1, 1], [2, 1], [2, 2], [1, 2]][frame % 4];
    R(c, x + hub[0], y + hub[1], 1, 1, '#1a1a1a');
  }
  function puffingBilly(c, t){
    bands(c, ['#7ec8f0', '#a2dbf5', '#c9edfb'], 0, 42);
    [[10, 6, .5], [90, 12, .35]].forEach(([b, y, s]) => cloud(c, ((b + t * s * 6) % 200) - 30, y));
    for(let x = 0; x < W; x++){                          // 遠山
      const top = Math.round(34 + Math.sin(x * 0.05) * 4 + Math.sin(x * 0.13) * 2);
      R(c, x, top, 1, 60 - top, '#6aa36f');
    }
    for(let i = 0; i < 11; i++){                         // 高大的山梣樹（白樹幹）
      const x = Math.floor(hash(i + 500) * 156), top = 16 + Math.floor(hash(i + 510) * 12);
      R(c, x + 1, top + 4, 2, 60 - top, '#ddd2bf');
      R(c, x - 2, top, 8, 4, '#2f6b3c'); R(c, x - 1, top - 2, 6, 2, '#3f8a4c'); R(c, x - 3, top + 2, 10, 2, '#2f6b3c');
    }
    R(c, 0, 58, W, 24, '#4f8f55');                       // 河谷林下
    speckle(c, 0, 58, W, 24, '#3f7a47', 120, 33);
    R(c, 0, 82, W, 8, '#3b7fb0');                        // 溪流
    for(let i = 0; i < 8; i++) R(c, (hash(i + 80) * W + t * 8) % W, 83 + Math.floor(hash(i + 90) * 6), 3, 1, '#8cc6ea');
    // 木棧橋
    R(c, 0, 50, W, 1, '#2b2018'); R(c, 0, 51, W, 3, '#5a3a22');
    for(let x = 0; x <= W; x += 12){
      R(c, x, 54, 2, 28, '#6b4426');
      for(let y = 54; y < 82; y += 9){ line(c, x + 1, y, x + 12, Math.min(y + 9, 81), '#7d5230'); line(c, x + 12, y, x + 1, Math.min(y + 9, 81), '#7d5230'); }
      for(let y = 54; y < 82; y += 9) R(c, x, y, 12, 1, '#5a3a22');
    }
    // 火車（由左往右開，循環）
    const L = 96, x0 = ((t * 16) % (W + L + 30)) - L, f = Math.floor(t * 8);
    for(let k = 0; k < 3; k++){                          // 三節車廂
      const cx = x0 + k * 24;
      R(c, cx - 1, 37, 24, 2, '#3a2a2a');
      R(c, cx, 39, 22, 9, '#8b1e2d');
      for(let w = 0; w < 4; w++){
        const wx = cx + 2 + w * 5;
        R(c, wx, 40, 4, 4, '#2a1a1a'); R(c, wx + 1, 41, 2, 2, '#f1c7a1');       // 乘客
        const swing = (f + w + k) % 2;                                            // 窗邊晃腳
        R(c, wx + 1 + swing, 44, 1, 4, '#2b3a67'); R(c, wx + 1 + swing, 48, 1, 1, '#1a1a1a');
      }
      wheel(c, cx + 2, 47, '#2a2a2a', f); wheel(c, cx + 16, 47, '#2a2a2a', f);
    }
    const lx = x0 + 72;                                  // 火車頭
    R(c, lx, 36, 7, 12, '#1c1c1c'); R(c, lx + 1, 38, 4, 3, '#ffcf6b');
    R(c, lx + 7, 41, 14, 7, '#1c1c1c'); R(c, lx + 12, 39, 3, 2, '#d4a017');
    R(c, lx + 18, 35, 3, 6, '#1c1c1c'); R(c, lx + 17, 34, 5, 1, '#1c1c1c');
    R(c, lx + 21, 45, 2, 3, '#c1121f');
    [lx + 6, lx + 11, lx + 16].forEach(wx => wheel(c, wx, 47, '#c1121f', f));
    // 蒸汽白煙
    for(let k = 0; k < 7; k++){
      const age = (t * 1.1 + k / 7) % 1;
      const r = 1 + Math.floor(age * 4);
      disc(c, lx + 19 - age * 26, 32 - age * 22, r, age < .5 ? '#ffffff' : '#e3e8ec');
    }
  }

  /* ---------- 共用：3×5 小字、兩頭身小人 ---------- */
  const FONT = {
    A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'], C: ['011', '100', '100', '100', '011'], E: ['111', '100', '110', '100', '111'],
    H: ['101', '101', '111', '101', '101'], I: ['111', '010', '010', '010', '111'], K: ['101', '101', '110', '101', '101'], L: ['100', '100', '100', '100', '111'],
    M: ['10001', '11011', '10101', '10001', '10001'], N: ['110', '101', '101', '101', '101'], O: ['010', '101', '101', '101', '010'],
    P: ['110', '101', '110', '100', '100'], Q: ['010', '101', '101', '110', '011'], R: ['110', '101', '110', '101', '101'],
    S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'], W: ['10001', '10001', '10101', '11011', '10001'],
    U: ['101', '101', '101', '101', '111'], V: ['101', '101', '101', '101', '010'],
    G: ['011', '100', '101', '101', '011'], D: ['110', '101', '101', '101', '110'], "'": ['1', '1', '0', '0', '0']
  };
  const glyphW = ch => (FONT[ch] ? FONT[ch][0].length : 3) + 1;   // 字寬＋1 格字距（M 較寬）
  function text(c, str, x, y, col){
    [...str].forEach(ch => { const g = FONT[ch]; if(g) g.forEach((row, j) => [...row].forEach((b, i) => { if(b === '1') R(c, x + i, y + j, 1, 1, col); })); x += glyphW(ch); });
  }
  const textW = str => [...str].reduce((s, ch) => s + glyphW(ch), 0) - 1;
  // 熱血躲避球風格的小人（8×13，sc＝放大倍率）。o：hair、skin、shirt、pants、cup（coffee／beer／wine）；sip＝舉杯；step＝走路腳步
  function chibi(c, x, y, o, sip, step, sc){
    const s = sc || 1, P = (dx, dy, w, h, col) => R(c, x + dx * s, y + dy * s, w * s, h * s, col);
    const skin = o.skin || '#f1c7a1', pants = o.pants || '#2b3a67';
    P(2, 0, 4, 1, o.hair); P(1, 1, 6, 2, o.hair);
    P(1, 3, 6, 3, skin); P(1, 3, 1, 2, o.hair); P(6, 3, 1, 2, o.hair);
    if(o.mask){ P(1, 4, 6, 1, '#4a4a8a'); }                           // 眼罩
    else if(o.tired){ P(2, 4, 1, 1, '#555'); P(5, 4, 1, 1, '#555'); if(s > 1){ P(2, 5, 1, 1, '#a99bc4'); P(5, 5, 1, 1, '#a99bc4'); } }   // 瞇眼＋黑眼圈
    else if(sip){ P(2, 4, 1, 1, '#7a4a3a'); P(5, 4, 1, 1, '#7a4a3a'); }
    else { P(2, 4, 1, 1, '#222'); P(5, 4, 1, 1, '#222'); }
    if(o.yawn) P(3, 5, 2, 1, '#7a3030');                              // 打哈欠張大嘴
    else if(s > 1 && !o.tired) P(3, 5, 2, 1, '#e7a99b');               // 放大時加一點腮紅／嘴
    P(2, 6, 4, 1, skin);
    P(1, 7, 6, 3, o.shirt);
    P(0, 7, 1, 2, skin);
    P(1, 10, 6, 1, pants);
    const a = step ? 1 : 0;
    P(1 + a, 11, 2, 1, pants); P(5 - a, 11, 2, 1, pants);
    P(1 + a, 12, 2, 1, '#222'); P(5 - a, 12, 2, 1, '#222');
    if(!o.cup){ P(7, 7, 1, 2, skin); return; }
    const cx = sip ? 6 : 7, cy = sip ? 3 : 7;
    if(sip) P(7, 6, 1, 2, skin); else P(7, 9, 1, 1, skin);
    if(o.cup === 'coffee'){ P(cx, cy, 2, 3, '#ffffff'); P(cx, cy, 2, 1, '#6b4226'); }
    else if(o.cup === 'beer'){ P(cx, cy, 3, 4, '#f4b942'); P(cx, cy, 3, 1, '#fffaf0'); }
    else if(o.cup === 'wine'){ P(cx, cy, 2, 2, '#8e1b2e'); P(cx + 1, cy + 2, 1, 2, '#dfe6ee'); }
  }
  // 睡覺冒出的 Zzz（往右上飄）
  function zzz(c, x, y, t, col){
    for(let k = 0; k < 3; k++){
      const age = (t * .5 + k / 3) % 1, zx = Math.round(x + age * 10), zy = Math.round(y - age * 12), sz = 2 + Math.floor(age * 2);
      R(c, zx, zy, sz, 1, col); R(c, zx + sz - 1, zy + 1, 1, 1, col); if(sz > 2) R(c, zx + 1, zy + 2, 1, 1, col); R(c, zx, zy + sz, sz, 1, col);
    }
  }
  // 小小的熱氣（往上飄、左右擺）
  function steam(c, x, y, t, n){
    for(let k = 0; k < n; k++){
      const age = (t * .8 + k / n) % 1;
      R(c, x + k * 3 + Math.round(Math.sin(age * 6 + k) * 1.5), y - age * 12, 1, 2, age < .6 ? '#ffffff' : '#e8edf2');
    }
  }

  /* ---------- 共用：餐廳場景（白天／晚上＋不同料理）：一張大桌、六個小人拿飲料，偶爾一起舉杯 ---------- */
  const DINERS = [
    { hair: '#3b2416', shirt: '#457b9d' }, { hair: '#d9a441', shirt: '#e9c46a' }, { hair: '#111111', shirt: '#e76f51' },
    { hair: '#7a4a2a', shirt: '#2a9d8f' }, { hair: '#c0392b', shirt: '#6d597a' }, { hair: '#222222', shirt: '#f4a261' }
  ];
  function restaurant(o){
    return function(c, t){
      const night = o.night;
      R(c, 0, 0, W, 62, night ? '#5a3b2e' : '#f3e3c9');
      R(c, 0, 46, W, 16, night ? '#3d2619' : '#9a6a45'); R(c, 0, 46, W, 1, night ? '#6e4a36' : '#c08a5c');
      // 窗外：白天街景＋路面電車／晚上夜景燈火
      c.save(); c.beginPath(); c.rect(50, 7, 60, 26); c.clip();
      R(c, 50, 7, 60, 26, night ? '#1b2440' : '#9fd3f0');
      if(night){
        for(let i = 0; i < 8; i++) if((Math.floor(t * 2) + i) % 3) R(c, 52 + hash(i + 700) * 56, 8 + hash(i + 710) * 8, 1, 1, '#fff2c4');
        disc(c, 102, 12, 3, '#fdf1c7');
      } else cloud(c, ((t * 3) % 90) + 30, 9);
      [[50, 19, 9], [60, 14, 8], [69, 22, 7], [77, 11, 9], [87, 18, 8], [96, 15, 8], [105, 21, 6]].forEach(([x, y, w], k) => {
        R(c, x, y, w, 34 - y, night ? '#2c3550' : '#a9b6c4');
        for(let wy = y + 2; wy < 30; wy += 3) for(let wx = x + 1; wx < x + w - 1; wx += 3)
          R(c, wx, wy, 1, 1, night ? ((hash(wx * 31 + wy + k) + Math.floor(t / 2) * .37) % 1 > .45 ? '#ffd27a' : '#3a4566') : '#d8e2ec');
      });
      const tx = ((t * 14) % 120) + 20;
      R(c, tx, 27, 16, 5, '#7a1f2b'); R(c, tx + 1, 28, 14, 1, '#f2d27a'); R(c, tx + 7, 25, 1, 2, '#333');
      c.restore();
      R(c, 48, 5, 64, 2, '#6b4426'); R(c, 48, 33, 64, 3, '#6b4426'); R(c, 48, 5, 2, 31, '#6b4426'); R(c, 110, 5, 2, 31, '#6b4426'); R(c, 79, 5, 2, 30, '#6b4426');
      for(let i = 0; i < 20; i++){
        const x = i * 8 + 2, col = o.flags[i % o.flags.length];
        for(let r = 0; r < 4; r++) R(c, x + r, 1 + r, 6 - r * 2, 1, col);
      }
      [20, 140].forEach(x => {
        R(c, x, 0, 1, 10, '#333');
        if(night){ c.globalAlpha = .22; disc(c, x, 16, 11, '#ffcf6b'); c.globalAlpha = 1; }
        R(c, x - 4, 10, 9, 3, night ? '#d99a3d' : '#2f5d50'); R(c, x - 2, 13, 5, 1, '#fff3c4');
      });
      // 木頭地板
      R(c, 0, 62, W, 28, night ? '#4a2f20' : '#b07a4c');
      for(let y = 66; y < H; y += 6) R(c, 0, y, W, 1, night ? '#3a2418' : '#94643c');
      for(let y = 62; y < H; y += 6) for(let x = (y / 6 % 2) * 14; x < W; x += 28) R(c, x, y, 1, 6, night ? '#3a2418' : '#94643c');
      // 每隔一段時間大家一起舉杯（乾杯！）
      const cheers = Math.floor(t * .7) % 4 === 0;
      const cups = o.cups;
      // 桌子後面四個人（坐著，下半身被桌子擋住）
      [30, 54, 90, 114].forEach((x, k) => chibi(c, x, 30, { ...DINERS[k], cup: cups[k % cups.length] }, cheers || Math.floor(t * 1.5 + k * 1.7) % 6 === 0, false, 2));
      // 桌子：桌巾桌面、垂下的桌巾、桌腳
      R(c, 24, 66, 3, 16, '#5a3a22'); R(c, 133, 66, 3, 16, '#5a3a22');
      for(let y = 52; y < 58; y += 3) for(let x = 22; x < 138; x += 3) R(c, x, y, 3, 3, (Math.floor((x - 22) / 3) + (y - 52) / 3) % 2 ? o.cloth[0] : o.cloth[1]);
      R(c, 22, 58, 116, 8, o.cloth[0]); for(let x = 22; x < 138; x += 6) R(c, x, 58, 3, 8, o.cloth[1]);
      R(c, 22, 66, 116, 1, 'rgba(0,0,0,.25)');
      // 桌子兩端站著的兩個人
      chibi(c, 4, 52, { ...DINERS[4], cup: cups[0] }, cheers || Math.floor(t * 1.5 + 3) % 6 === 0, false, 2);
      chibi(c, 140, 52, { ...DINERS[5], cup: cups[1 % cups.length] }, cheers || Math.floor(t * 1.5 + 5) % 6 === 0, false, 2);
      if(cheers){ [[42, 38], [80, 34], [118, 38]].forEach(([x, y]) => { R(c, x, y, 1, 3, '#fff6cf'); R(c, x - 1, y + 1, 3, 1, '#fff6cf'); }); }
      // 桌上的料理（小小的，當配角）
      o.dish(c, t, (dx, dy, w, h, col) => R(c, 80 + dx, 55 + dy, w, h, col));
    };
  }
  function platter(D){ D(-12, 0, 24, 2, '#ffffff'); D(-10, 2, 20, 1, '#cfd8e0'); [-30, 22].forEach(x => { D(x, 1, 9, 1, '#ffffff'); D(x + 1, 2, 7, 1, '#cfd8e0'); }); }
  function pasta(c, t, D){
    platter(D);
    for(let r = 0; r < 4; r++) D(-8 + r * 2, -1 - r, 16 - r * 4, 1, r % 2 ? '#e8b53f' : '#f2c14e');
    D(-3, -4, 6, 1, '#c0392b'); D(0, -5, 1, 1, '#3f8a3a');
    steam(c, 75, 50, t, 3);
  }
  function porkKnuckle(c, t, D){
    platter(D);
    for(let r = 0; r < 5; r++) D(-7 + r, -1 - r, 14 - r * 2, 1, r % 2 ? '#a0522d' : '#b5652f');
    D(-4, -3, 5, 1, '#d2884a'); D(5, -4, 4, 1, '#f3ead7'); D(8, -5, 1, 3, '#f3ead7');
    [-22, 16].forEach(x => { D(x, -6, 5, 7, '#f4b942'); D(x - 1, -7, 7, 2, '#fffaf0'); D(x + 5, -4, 2, 1, '#e6edf2'); D(x + 6, -4, 1, 4, '#e6edf2'); });
    steam(c, 75, 50, t, 3);
  }

  /* ---------- D2：聖派翠克大教堂（哥德復興式，藍石） ---------- */
  function spire(c, cx, top, base, col, edge, slope){
    for(let y = top; y < base; y++){ const w = Math.floor((y - top) / slope); R(c, cx - w, y, w * 2 + 1, 1, col); if(w) R(c, cx - w, y, 1, 1, edge); }
  }
  function lancet(c, x, y, w, h, col){ R(c, x, y + 2, w, h - 2, col); R(c, x + 1, y + 1, w - 2, 1, col); if(w > 2) R(c, x + Math.floor(w / 2), y, 1, 1, col); }
  function stPatricks(c, t){
    bands(c, ['#6fbfec', '#8fd0f2', '#b4e1f7', '#d6effa'], 0, 72);
    [[10, 10, .4], [100, 20, .3]].forEach(([b, y, s]) => cloud(c, ((b + t * s * 6) % 200) - 30, y));
    const stone = '#5b6475', light = '#76819a', dark = '#434b5a';
    // 中央高塔（最高的尖頂）
    spire(c, 80, 0, 26, dark, stone, 5);
    R(c, 75, 24, 11, 22, stone); R(c, 75, 24, 1, 22, light);
    lancet(c, 78, 28, 5, 9, '#2c3240');
    [74, 86].forEach(px => { R(c, px, 20, 1, 5, dark); R(c, px, 19, 1, 1, light); });
    // 本堂與尖拱山牆
    R(c, 54, 46, 52, 26, stone); R(c, 54, 46, 52, 1, light);
    for(let y = 34; y < 46; y++){ const w = Math.floor((y - 34) * 1.9); R(c, 80 - w, y, w * 2 + 1, 1, stone); R(c, 80 - w, y, 1, 1, light); }
    R(c, 80, 32, 1, 3, dark);
    // 兩側塔（細長尖頂、扶壁、尖拱窗）
    [[52, 6], [108, 6]].forEach(([cx, top]) => {
      spire(c, cx, top, 28, dark, stone, 4);
      R(c, cx - 5, 26, 11, 46, stone); R(c, cx - 5, 26, 1, 46, light);
      R(c, cx - 6, 26, 13, 2, light);
      [cx - 6, cx + 6].forEach(px => { R(c, px, 22, 1, 5, dark); R(c, px, 21, 1, 1, light); });
      lancet(c, cx - 1, 32, 3, 9, '#2c3240'); lancet(c, cx - 1, 46, 3, 10, '#2c3240');
      R(c, cx - 6, 60, 2, 12, dark); R(c, cx + 5, 60, 2, 12, dark);
    });
    // 大彩繪玻璃尖拱窗（會閃光）
    const cols = ['#e63946', '#3a86ff', '#ffbe0b', '#2a9d8f', '#8338ec'];
    for(let y = 46; y < 62; y++){
      const half = y < 51 ? Math.floor((y - 46) * 1.2) + 1 : 6;
      for(let x = 80 - half; x <= 80 + half; x++){
        const sparkle = (Math.floor(t * 3) + x + y) % 11 === 0;
        R(c, x, y, 1, 1, sparkle ? '#fff6cf' : ((x - 74) % 3 === 0 || y % 4 === 0) ? '#2c3240' : cols[(x * 7 + y * 3) % 5]);
      }
    }
    for(let y = 64; y < 72; y++){ const half = y < 66 ? (y - 64) + 2 : 4; R(c, 80 - half, y, half * 2, 1, '#3a2a20'); }
    for(let x = 56; x < 105; x += 5) R(c, x, 45, 1, 2, dark);
    // 兩旁樹、前庭與水景步道
    [[4, 44], [20, 50], [136, 46], [150, 50]].forEach(([x, y]) => { R(c, x + 3, y + 8, 2, 20, '#6b4f3a'); disc(c, x + 4, y + 6, 7, '#3f8a4c'); disc(c, x + 2, y + 4, 4, '#4fa35a'); });
    R(c, 0, 72, W, 18, '#d9d3c7'); speckle(c, 0, 72, W, 18, '#c9c2b4', 60, 41);
    R(c, 0, 79, W, 4, '#4f9fd1');
    for(let i = 0; i < 8; i++) R(c, (hash(i + 900) * W + t * 6) % W, 80 + (i % 3), 3, 1, '#bfe6fb');
    [0, 1].forEach(k => gull(c, (t * 12 + k * 70) % 200 - 20, 14 + k * 9 + Math.round(Math.sin(t * 2 + k) * 2), Math.floor(t * 4 + k) % 2));
  }

  /* ---------- D2：維多利亞女王市場 ---------- */
  function queenVicMarket(c, t){
    bands(c, ['#8fd0f2', '#b4e1f7', '#d6effa'], 0, 40);
    [[8, 26, 8], [18, 16, 7], [27, 22, 6], [128, 14, 8], [138, 24, 9], [149, 18, 7]].forEach(([x, y, w]) => R(c, x, y, w, 30 - y, '#a3b3c3'));
    cloud(c, ((t * 3) % 200) - 30, 6);
    // 大棚（波浪鐵皮屋頂）與招牌
    for(let r = 0; r < 8; r++) R(c, 30 + r * 3, 24 - r, 100 - r * 6, 1, r % 2 ? '#e8e2d2' : '#d6cdb8');
    R(c, 30, 24, 100, 5, '#2f6b4f'); R(c, 30, 24, 100, 1, '#3f8a66');
    const sign = 'QUEEN VIC MARKET'; text(c, sign, 80 - Math.floor(textW(sign) / 2), 24, '#f6f1e3');
    for(let x = 32; x < 130; x += 12) R(c, x, 29, 2, 22, '#efe8d6');
    R(c, 30, 29, 100, 22, 'rgba(60,45,30,.25)');
    // 攤位：條紋雨棚＋蔬果箱
    const aw = [['#e63946', '#ffffff'], ['#2a9d8f', '#ffffff'], ['#ffb703', '#ffffff'], ['#457b9d', '#ffffff'], ['#e76f51', '#fff3d6']];
    const fruit = ['#d62828', '#f77f00', '#6a994e', '#fcbf49', '#9d4edd'];
    aw.forEach(([a, b], i) => {
      const x = 4 + i * 31;
      for(let s = 0; s < 26; s += 2) R(c, x + s, 40, 2, 5, (s / 2) % 2 ? a : b);
      for(let s = 0; s < 26; s += 4) R(c, x + s, 45, 2, 1, a);
      R(c, x, 52, 26, 8, '#8b5a3c'); R(c, x, 52, 26, 1, '#a8743f');
      for(let k = 0; k < 12; k++) R(c, x + 1 + (k % 6) * 4, 50 + Math.floor(k / 6) * 2, 3, 2, fruit[(i + k) % 5]);
      R(c, x + 1, 45, 1, 7, '#6b4426'); R(c, x + 24, 45, 1, 7, '#6b4426');
    });
    R(c, 0, 60, W, 30, '#b8b2a6'); speckle(c, 0, 60, W, 30, '#a59f93', 70, 51);
    for(let x = 0; x < W; x += 10) R(c, x + 2, 76, 6, 1, '#ece8de');
    // 甜甜圈餐車（冒熱氣）
    R(c, 128, 54, 30, 16, '#d62828'); R(c, 128, 54, 30, 3, '#ffffff'); R(c, 133, 59, 14, 6, '#ffe8b0');
    for(let k = 0; k < 4; k++) disc(c, 135 + k * 3, 62, 1, '#c58940');
    R(c, 131, 70, 4, 3, '#222'); R(c, 151, 70, 4, 3, '#222');
    for(let k = 0; k < 5; k++){ const age = (t * .9 + k / 5) % 1; disc(c, 140 + Math.sin(age * 5 + k) * 3, 52 - age * 18, 1 + Math.floor(age * 3), '#ffffff'); }
    // 逛市場的人
    const people = [{ hair: '#3b2416', shirt: '#e76f51' }, { hair: '#111', shirt: '#2a9d8f' }, { hair: '#d9a441', shirt: '#6d597a' }, { hair: '#7a4a2a', shirt: '#264653' }];
    people.slice(0, 3).forEach((p, k) => {
      const dir = k % 2 ? -1 : 1, sp = 8 + k * 3;
      let x = ((t * sp + k * 60) % 200) - 20; if(dir < 0) x = 160 - x;
      chibi(c, x, 60 + (k % 2) * 3, p, false, Math.floor(t * 6 + k) % 2, 2);
      R(c, x + (dir > 0 ? 16 : -4), 76 + (k % 2) * 3, 4, 6, '#f4e3b5');   // 購物袋
    });
  }

  /* ---------- D2：Market Lane Coffee（紅磚老建築轉角店） ---------- */
  function marketLane(c, t){
    bands(c, ['#8fd0f2', '#b4e1f7', '#d6effa'], 0, 60);
    cloud(c, ((t * 3) % 200) - 30, 6);
    // 兩層樓紅磚立面
    R(c, 14, 14, 112, 56, '#a8483a');
    for(let y = 15; y < 70; y += 3){ R(c, 14, y, 112, 1, '#8c3a2f'); for(let x = 14 + ((y / 3) % 2) * 3; x < 126; x += 6) R(c, x, y - 2, 1, 2, '#8c3a2f'); }
    R(c, 12, 10, 116, 4, '#e8dcc3'); R(c, 12, 14, 116, 1, '#c9b998'); R(c, 40, 6, 60, 4, '#e8dcc3');
    // 二樓拱窗
    for(let i = 0; i < 6; i++){
      const x = 20 + i * 18;
      R(c, x, 22, 8, 12, '#e8dcc3'); R(c, x + 1, 23, 6, 11, '#3d5a73'); R(c, x + 2, 22, 4, 1, '#e8dcc3');
      R(c, x + 1, 23, 1, 1, '#e8dcc3'); R(c, x + 6, 23, 1, 1, '#e8dcc3'); R(c, x + 4, 24, 1, 9, '#e8dcc3');
      R(c, x + 2, 25, 1, 3, '#7fa6c4');
    }
    // 白色店招
    R(c, 30, 38, 80, 9, '#f7f4ee'); R(c, 30, 46, 80, 1, '#cfc8bb');
    const name = 'MARKET LANE'; text(c, name, 70 - Math.floor(textW(name) / 2), 40, '#2b2b2b');
    // 一樓大玻璃窗（暖光、店內咖啡師）
    [[18, 49, 30], [92, 49, 30]].forEach(([x, y, w]) => {
      R(c, x, y, w, 18, '#4a3326'); R(c, x + 1, y + 1, w - 2, 16, '#f6d38b'); R(c, x + 1, y + 11, w - 2, 1, '#c79a52');
      R(c, x + 1, y + 12, w - 2, 5, '#a26b3c');
    });
    chibi(c, 30, 52, { hair: '#222', shirt: '#2f2f2f' }, false);   // 店內咖啡師
    for(let k = 0; k < 3; k++){ const age = (t * .8 + k / 3) % 1; R(c, 104 + k * 3, 58 - age * 6, 1, 1, '#ffffff'); }
    R(c, 56, 49, 28, 21, '#2b2b2b'); R(c, 58, 51, 24, 19, '#4e3a2c'); R(c, 69, 51, 2, 19, '#2b2b2b'); R(c, 66, 60, 1, 2, '#e3c26b');
    // 右側樹、人行道
    R(c, 137, 34, 3, 36, '#6b4f3a'); disc(c, 138, 28, 10, '#3f8a4c'); disc(c, 135, 24, 6, '#4fa35a');
    R(c, 0, 70, W, 20, '#c9c3b8'); for(let x = 0; x < W; x += 8) R(c, x, 70, 1, 20, '#b6afa2'); R(c, 0, 70, W, 1, '#8e877b');
    // 門口：長凳上喝咖啡的人、站著拿外帶杯、走過來的人
    const sipA = Math.floor(t * 1.2) % 3 === 0, sipB = Math.floor(t * 1.2 + 1) % 3 === 0;
    chibi(c, 16, 58, { hair: '#3b2416', shirt: '#e76f51', cup: 'coffee' }, sipA, false, 2);
    chibi(c, 36, 58, { hair: '#d9a441', shirt: '#457b9d', cup: 'coffee' }, sipB, false, 2);
    R(c, 12, 78, 46, 3, '#6b4426'); R(c, 14, 81, 3, 6, '#4a2f1a'); R(c, 53, 81, 3, 6, '#4a2f1a');   // 長凳（擋住腿）
    if(!sipA) steam(c, 30, 70, t, 2);
    chibi(c, 92, 60, { hair: '#111', shirt: '#2a9d8f', cup: 'coffee' }, Math.floor(t + 1) % 4 === 0, false, 2);
    const wx = 170 - ((t * 9) % 110);
    chibi(c, wx, 62, { hair: '#7a4a2a', shirt: '#ffb703', cup: 'coffee' }, false, Math.floor(t * 6) % 2, 2);
  }


  /* ---------- D2：Pellegrini's Espresso Bar（1954 年老義式咖啡吧） ---------- */
  function pellegrinis(c, t){
    // 牆：上半奶油色、下半木頭護牆板
    R(c, 0, 0, W, 50, '#efe3c8'); R(c, 0, 30, W, 20, '#6b4430'); for(let x = 0; x < W; x += 10) R(c, x, 30, 1, 20, '#55331f');
    R(c, 0, 29, W, 1, '#3a2418');
    // 紅色霓虹招牌（偶爾閃一下）
    const on = Math.floor(t * 3) % 17 !== 0;
    R(c, 26, 3, 108, 13, '#2a1616'); R(c, 27, 4, 106, 11, '#3a1d1d');
    const name = "PELLEGRINI'S", nx = 80 - Math.floor(textW(name) / 2);
    if(on){ text(c, name, nx + 1, 8, '#7a1f1f'); }
    text(c, name, nx, 7, on ? '#ff5a4f' : '#8a3a36');
    // 老鏡子與層架（玻璃罐、酒瓶）
    R(c, 6, 18, 40, 11, '#c8d4d8'); R(c, 7, 19, 38, 9, '#e3ecef'); R(c, 9, 20, 6, 1, '#ffffff');
    [[112, 20], [112, 26]].forEach(([x, y]) => R(c, x, y, 42, 1, '#55331f'));
    const jar = ['#d64545', '#ffbe0b', '#2a9d48', '#f4a261', '#8e1b2e', '#e9c46a'];
    for(let i = 0; i < 9; i++){ R(c, 114 + i * 4, 16 - (i % 2), 3, 4 + (i % 2), jar[i % 6]); R(c, 114 + i * 4, 15 - (i % 2), 3, 1, '#dcdcdc'); }
    for(let i = 0; i < 9; i++){ R(c, 114 + i * 4, 22, 3, 4, jar[(i + 3) % 6]); }
    // 義大利三色小旗
    [['#2a9d48', 52], ['#ffffff', 55], ['#ce2b37', 58]].forEach(([col, x]) => R(c, x, 20, 3, 6, col)); R(c, 51, 19, 1, 9, '#55331f');
    // 咖啡師（在吧台後面）
    const pull = Math.floor(t * .7) % 2;
    chibi(c, 98, 30, { hair: '#222', shirt: '#ffffff' }, false, false, 2);
    R(c, 100, 44, 12, 6, '#2b2b2b');   // 黑圍裙
    // 鍍鉻拉桿式咖啡機
    R(c, 56, 32, 38, 18, '#c9d1d9'); R(c, 57, 33, 36, 16, '#e6ebef'); R(c, 57, 40, 36, 1, '#aab4bd');
    R(c, 60, 28, 30, 4, '#b8c1c9'); R(c, 72, 24, 6, 4, '#d4a017'); R(c, 70, 22, 10, 2, '#d4a017'); R(c, 74, 20, 2, 2, '#d4a017');   // 頂上金色老鷹裝飾
    [62, 82].forEach((gx, k) => {
      R(c, gx, 41, 6, 3, '#8a949d');            // 沖煮頭
      const down = k === 0 ? pull : 1 - pull;   // 兩支拉桿輪流壓下
      if(down) line(c, gx + 3, 41, gx + 9, 34, '#2b2b2b'); else line(c, gx + 3, 41, gx + 3, 30, '#2b2b2b');
      R(c, down ? gx + 8 : gx + 2, down ? 33 : 29, 3, 2, '#1a1a1a');
      if(down){ R(c, gx + 2, 44, 1, 3 + Math.floor(t * 6) % 2, '#6b3b1f'); }
      R(c, gx + 1, 47, 4, 3, '#ffffff');        // 小杯 espresso
    });
    steam(c, 66, 30, t, 2); steam(c, 86, 30, t + .5, 2);
    // 吧台：鍍鉻檯面＋紅白檯身
    R(c, 0, 50, W, 3, '#c9d1d9'); R(c, 0, 50, W, 1, '#ffffff');
    R(c, 0, 53, W, 13, '#b3262e'); R(c, 0, 58, W, 2, '#f2efe9');
    // 吧台上的義大利麵、西瓜冰沙（Granita）
    R(c, 18, 46, 12, 4, '#ffffff'); R(c, 19, 44, 10, 2, '#f2c14e'); R(c, 21, 43, 6, 1, '#d64545'); steam(c, 22, 42, t + .3, 2);
    R(c, 128, 42, 5, 8, '#dfe6ee'); R(c, 129, 43, 3, 6, '#ff6f91'); R(c, 130, 40, 1, 3, '#2a9d48');
    // 紅白格子地板
    for(let y = 66; y < H; y += 6) for(let x = 0; x < W; x += 6) R(c, x, y, 6, 6, ((x + y) / 6) % 2 ? '#c8323a' : '#f4efe6');
    // 坐在高腳凳上喝咖啡的客人（腳被吧台擋住）
    const guests = [{ x: 30, p: { hair: '#3b2416', shirt: '#457b9d', cup: 'coffee' } }, { x: 54, p: { hair: '#d9a441', shirt: '#e76f51', cup: 'coffee' } }, { x: 108, p: { hair: '#111', shirt: '#2a9d8f', cup: 'coffee' } }];
    guests.forEach((g, k) => {
      const sip = Math.floor(t * 1.1 + k * 1.3) % 3 === 0;
      chibi(c, g.x, 46, g.p, sip, false, 2);
      R(c, g.x + 2, 70, 12, 3, '#d64545'); R(c, g.x + 7, 73, 2, 12, '#9aa4ad'); R(c, g.x + 4, 85, 8, 1, '#9aa4ad');   // 紅色高腳凳
      if(!sip) steam(c, g.x + 15, 58, t + k, 1);
    });
    // 推門走進來的客人
    const wx = 170 - ((t * 8) % 120);
    if(wx > 74 && wx < 100){} else chibi(c, wx, 60, { hair: '#7a4a2a', shirt: '#ffb703' }, false, Math.floor(t * 6) % 2, 2);
  }

  /* ---------- D2：費茲洛花園 庫克船長小屋 ---------- */
  function cooksCottage(c, t){
    bands(c, ['#8fd0f2', '#b4e1f7', '#d6effa'], 0, 52);
    [[20, 8, .4]].forEach(([b, y, s]) => cloud(c, ((b + t * s * 6) % 200) - 30, y));
    // 背景大榆樹
    [[8, 22, 16], [36, 16, 14], [124, 18, 16], [150, 26, 12]].forEach(([x, y, r]) => { R(c, x - 1, y + 8, 3, 40, '#5c4433'); disc(c, x, y, r, '#2f6b3c'); disc(c, x - 3, y - 3, r - 5, '#3f8a4c'); });
    R(c, 0, 52, W, 38, '#5f9e4f'); speckle(c, 0, 52, W, 38, '#4f8a41', 90, 61);
    // 石頭小屋
    const wall = '#c9a97c', stoneD = '#a8875c';
    R(c, 52, 38, 56, 26, wall);
    for(let i = 0; i < 60; i++) R(c, 52 + Math.floor(hash(i + 1200) * 54), 38 + Math.floor(hash(i + 1300) * 25), 2, 1, stoneD);
    for(let r = 0; r < 12; r++) R(c, 50 + r, 37 - r, 60 - r * 2, 1, r % 2 ? '#6b3b2a' : '#7d4632');   // 屋頂
    R(c, 94, 18, 7, 16, '#a8875c'); R(c, 93, 17, 9, 2, '#8c6d47');                                  // 煙囪
    for(let k = 0; k < 6; k++){ const age = (t * .6 + k / 6) % 1; disc(c, 97 + age * 10 + Math.sin(age * 6) * 2, 15 - age * 14, 1 + Math.floor(age * 3), age < .5 ? '#f2f2f2' : '#dcdcdc'); }
    [[58, 44], [96, 44]].forEach(([x, y]) => { R(c, x, y, 9, 8, '#ffffff'); R(c, x + 1, y + 1, 7, 6, '#4a6a85'); R(c, x + 4, y + 1, 1, 6, '#ffffff'); R(c, x + 1, y + 4, 7, 1, '#ffffff'); });
    R(c, 75, 48, 9, 16, '#4b2e1f'); R(c, 76, 49, 7, 15, '#6b4229'); R(c, 81, 56, 1, 1, '#e3c26b');
    for(let i = 0; i < 26; i++) R(c, 52 + Math.floor(hash(i + 1400) * 8), 44 + Math.floor(hash(i + 1410) * 20), 1, 1, '#3f7a3a');   // 爬藤
    // 矮石牆與花圃
    R(c, 30, 64, 100, 5, '#b39b74'); for(let x = 30; x < 130; x += 5) R(c, x, 64, 1, 5, '#9a8260');
    const flowers = ['#e63946', '#ffbe0b', '#ff8fab', '#ffffff', '#9d4edd'];
    for(let i = 0; i < 26; i++){ const x = 32 + i * 3.8, sway = Math.round(Math.sin(t * 2 + i) * .6); R(c, x, 60, 1, 4, '#3f7a3a'); R(c, x + sway - 1, 58, 3, 2, flowers[i % 5]); }
    R(c, 72, 69, 16, 21, '#d8c6a0');
    // 拍照的遊客（閃光燈）
    chibi(c, 112, 62, { hair: '#111', shirt: '#e76f51' }, false, false, 2);
    R(c, 106, 76, 6, 4, '#333'); R(c, 107, 77, 2, 2, '#8fb3d1');   // 相機
    if(Math.floor(t * 2) % 6 === 0){ R(c, 102, 74, 3, 3, '#ffffff'); R(c, 100, 75, 7, 1, '#fff6cf'); R(c, 103, 72, 1, 7, '#fff6cf'); }
    // 蝴蝶
    [0, 1].forEach(k => {
      const bx = 30 + ((t * 8 + k * 60) % 110), by = 50 + Math.sin(t * 3 + k) * 6, up = Math.floor(t * 8 + k) % 2;
      R(c, bx, by, 1, 1, '#333'); R(c, bx - 1, by - up, 1, 1, k ? '#ffbe0b' : '#ffffff'); R(c, bx + 1, by - up, 1, 1, k ? '#ffbe0b' : '#ffffff');
    });
  }

  /* ---------- D2 附近：維多利亞議會大廈（柱廊＋大台階） ---------- */
  function parliament(c, t){
    bands(c, ['#79c4ee', '#9ad5f3', '#bfe5f8', '#ddf2fb'], 0, 60);
    cloud(c, ((t * 3) % 200) - 30, 8);
    const cream = '#eadfc6', shade = '#c8b995', deep = '#a8996f';
    R(c, 14, 22, 132, 6, cream); R(c, 12, 20, 136, 2, shade); R(c, 14, 28, 132, 2, deep);        // 簷口
    for(let x = 16; x < 144; x += 4) R(c, x, 17, 2, 3, cream); R(c, 14, 16, 132, 1, shade);       // 欄杆
    R(c, 14, 30, 132, 26, '#d8cba9');                                                            // 柱廊後牆
    for(let x = 18; x < 142; x += 9){ R(c, x, 30, 4, 26, cream); R(c, x + 3, 30, 1, 26, shade); R(c, x - 1, 30, 6, 2, shade); R(c, x - 1, 54, 6, 2, shade); }
    for(let x = 22; x < 140; x += 9) R(c, x + 1, 38, 3, 10, '#6e6250');                           // 柱間的深色門窗
    // 旗桿＋飄動的澳洲國旗
    R(c, 80, 4, 1, 13, '#666'); const wave = Math.floor(t * 4) % 2;
    R(c, 81, 4 + wave, 9, 6, '#1d3f8f'); R(c, 81, 6 + wave, 4, 1, '#ffffff'); R(c, 83, 4 + wave, 1, 3, '#ffffff'); R(c, 81, 6 + wave, 4, 1, '#e63946');
    R(c, 87, 7 + wave, 1, 1, '#ffffff'); R(c, 86, 9 + wave, 1, 1, '#ffffff');
    // 大台階
    for(let k = 0; k < 8; k++) R(c, 10 - k * 2, 56 + k * 2, 140 + k * 4, 2, k % 2 ? '#ddd3bf' : '#cfc4ac');
    // 兩側燈柱
    [8, 150].forEach(x => { R(c, x, 40, 2, 18, '#2d2d2d'); R(c, x - 2, 36, 6, 4, '#2d2d2d'); R(c, x - 1, 37, 4, 2, '#ffe9a8'); });
    // 前方 Spring St 與經過的電車
    R(c, 0, 72, W, 18, '#8e8a84'); for(let x = 0; x < W; x += 12) R(c, x + 2, 81, 6, 1, '#e8e4dc');
    const tx = ((t * 18) % 260) - 90;
    R(c, tx, 66, 70, 14, '#2f9e5a'); R(c, tx, 66, 70, 3, '#e9f5ee'); for(let w = 0; w < 6; w++) R(c, tx + 4 + w * 11, 70, 8, 5, '#bfe3f2');
    R(c, tx + 34, 62, 1, 4, '#333'); R(c, tx + 8, 80, 5, 2, '#222'); R(c, tx + 56, 80, 5, 2, '#222');
    // 坐在台階上的人、鴿子
    chibi(c, 30, 42, { hair: '#3b2416', shirt: '#e76f51', cup: 'coffee' }, Math.floor(t * 1.2) % 4 === 0, false, 2);
    chibi(c, 116, 44, { hair: '#d9a441', shirt: '#457b9d' }, false, false, 2);
    [0, 1].forEach(k => gull(c, (t * 12 + k * 80) % 200 - 20, 10 + k * 7, Math.floor(t * 4 + k) % 2));
  }

  /* ---------- D2 附近：公主劇院（華麗立面＋跑馬燈招牌） ---------- */
  function princessTheatre(c, t){
    bands(c, ['#2a2350', '#46306a', '#6e3f7d', '#a35a86'], 0, 60);   // 傍晚紫色天空
    for(let i = 0; i < 10; i++) if((Math.floor(t * 2) + i) % 4) R(c, hash(i + 1500) * W, hash(i + 1510) * 18, 1, 1, '#fff2c4');
    const wall = '#ead7c3', trim = '#c9a98a', roof = '#4a5160';
    // 馬薩式屋頂與三座小塔
    R(c, 26, 22, 108, 8, roof); for(let x = 28; x < 132; x += 6) R(c, x, 24, 3, 4, '#6b7385');
    [[36, 10], [80, 4], [124, 10]].forEach(([cx, top]) => {
      R(c, cx - 6, top + 8, 13, 12, roof); for(let r = 0; r < 6; r++) R(c, cx - 5 + r, top + 2 + r, 11 - r * 2 < 1 ? 1 : 11 - r * 2, 1, roof);
      R(c, cx, top - 2, 1, 4, '#d4a017'); R(c, cx - 1, top + 11, 3, 4, '#ffd27a');
    });
    R(c, 81, 2, 5, 3, '#e63946');                                                                 // 小旗
    // 立面
    R(c, 22, 30, 116, 44, wall); R(c, 22, 30, 116, 2, trim);
    for(let i = 0; i < 7; i++){ const x = 28 + i * 15; R(c, x, 34, 7, 10, trim); R(c, x + 1, 36, 5, 8, '#ffd27a'); R(c, x + 2, 34, 3, 1, trim); }
    for(let x = 22; x < 138; x += 15) R(c, x, 30, 2, 44, trim);
    // 跑馬燈招牌
    R(c, 30, 48, 100, 12, '#1d1d2b');
    const name = 'PRINCESS'; text(c, name, 80 - Math.floor(textW(name) / 2), 52, '#ffd166');
    const f = Math.floor(t * 8);
    for(let x = 30; x < 130; x += 3){ R(c, x, 48, 1, 1, (x / 3 + f) % 3 ? '#7a5a2a' : '#fff2a8'); R(c, x, 59, 1, 1, (x / 3 - f + 99) % 3 ? '#7a5a2a' : '#fff2a8'); }
    for(let y = 48; y < 60; y += 3){ R(c, 30, y, 1, 1, (y / 3 + f) % 3 ? '#7a5a2a' : '#fff2a8'); R(c, 129, y, 1, 1, (y / 3 + f) % 3 ? '#7a5a2a' : '#fff2a8'); }
    // 入口與海報
    R(c, 60, 62, 40, 12, '#3a2420'); R(c, 62, 63, 36, 11, '#ffcf80');
    [[34, 62], [110, 62]].forEach(([x, y]) => { R(c, x, y, 14, 10, '#c9a98a'); R(c, x + 1, y + 1, 12, 8, '#8e2b4b'); R(c, x + 3, y + 3, 8, 2, '#ffd166'); });
    R(c, 0, 74, W, 16, '#5c5866'); R(c, 0, 74, W, 1, '#7c7888');
    // 等著進場的觀眾
    [[48, 0], [70, 1], [92, 2], [118, 3]].forEach(([x, k]) => chibi(c, x, 62, DINERS[k], false, Math.floor(t * 2 + k) % 4 === 0, 2));
  }

  /* ---------- D2 附近：唐人街（牌樓＋紅燈籠） ---------- */
  function chinatown(c, t){
    bands(c, ['#7cc3ec', '#9fd4f2', '#c6e8f8'], 0, 50);
    // 牌樓後方延伸的街景（遠處建築）
    R(c, 54, 30, 52, 40, '#b8988a'); R(c, 66, 22, 28, 48, '#a98676');
    for(let wy = 26; wy < 66; wy += 6) for(let wx = 56; wx < 104; wx += 6) R(c, wx, wy, 3, 3, (hash(wx * 7 + wy) > .3) ? '#f6e7c6' : '#8a6c60');
    // 兩旁商店與閃爍招牌
    const shops = [[0, 20, 30, '#c46a4a'], [30, 26, 24, '#d9b36b'], [106, 24, 26, '#7a9e7e'], [132, 18, 28, '#b5838d']];
    shops.forEach(([x, y, w, col], k) => {
      R(c, x, y, w, 70 - y, col);
      for(let wy = y + 4; wy < 56; wy += 7) for(let wx = x + 3; wx < x + w - 4; wx += 7) R(c, wx, wy, 4, 4, '#f6e7c6');
      const on = (Math.floor(t * 2) + k) % 3 !== 0;
      R(c, x + 4, y + 2, w - 8, 3, on ? ['#ff4d6d', '#ffd60a', '#4cc9f0', '#80ed99'][k] : '#5a4a4a');
    });
    // 牌樓：紅柱、綠瓦屋頂、金色匾額
    [44, 112].forEach(x => { R(c, x, 30, 5, 44, '#c1121f'); R(c, x + 1, 30, 1, 44, '#e63946'); R(c, x - 2, 70, 9, 4, '#7a5a3a'); });
    R(c, 40, 30, 80, 4, '#c1121f'); R(c, 40, 34, 80, 2, '#ffd166'); R(c, 46, 40, 68, 3, '#c1121f');
    for(let r = 0; r < 6; r++) R(c, 34 + r * 2 - (r === 0 ? 2 : 0), 24 - r, 92 - r * 4 + (r === 0 ? 4 : 0), 1, r % 2 ? '#2a9d8f' : '#21867a');
    R(c, 32, 25, 4, 1, '#21867a'); R(c, 124, 25, 4, 1, '#21867a'); R(c, 31, 24, 2, 1, '#2a9d8f'); R(c, 127, 24, 2, 1, '#2a9d8f');   // 上翹的屋簷
    R(c, 70, 16, 20, 7, '#ffd166'); R(c, 72, 18, 16, 3, '#c1121f');
    // 一串紅燈籠（輕輕擺動）
    for(let i = 0; i < 9; i++){
      const x = 10 + i * 18, sway = Math.round(Math.sin(t * 2 + i) * 1);
      R(c, x + sway + 2, 44, 1, 3, '#333');
      R(c, x + sway, 47, 6, 5, '#e63946'); R(c, x + sway + 1, 46, 4, 1, '#ffd166'); R(c, x + sway + 1, 52, 4, 1, '#ffd166'); R(c, x + sway + 2, 53, 2, 2, '#ffd166');
    }
    line(c, 0, 44, 159, 44, '#5a3a2a');
    // 街道與行人
    R(c, 0, 70, W, 20, '#9a948a'); for(let x = 0; x < W; x += 10) R(c, x, 70, 1, 20, '#8a847a');
    [{ hair: '#111', shirt: '#e63946' }, { hair: '#3b2416', shirt: '#2a9d8f' }, { hair: '#d9a441', shirt: '#6d597a' }].forEach((p, k) => {
      const dir = k % 2 ? -1 : 1; let x = ((t * (8 + k * 3) + k * 70) % 200) - 20; if(dir < 0) x = 160 - x;
      chibi(c, x, 60 + (k % 2) * 3, p, false, Math.floor(t * 6 + k) % 2, 2);
    });
  }

  /* ---------- D1：夜間機艙的飛機餐 ---------- */
  function planeMeal(c, t){
    // 窗外夜空（星星、雲往後飄）
    R(c, 0, 16, W, 18, '#16213e');
    for(let i = 0; i < 14; i++) if((Math.floor(t * 2) + i) % 4) R(c, (hash(i + 1600) * W - t * 2 + W * 9) % W, 17 + hash(i + 1610) * 15, 1, 1, '#fff2c4');
    for(let k = 0; k < 4; k++){ const x = ((k * 50 - t * 20) % 200 + 200) % 200 - 20; R(c, x, 28, 14, 2, '#3a4a6e'); R(c, x + 3, 27, 8, 1, '#3a4a6e'); }
    // 機艙牆、橢圓窗、行李置物櫃
    const wall = '#e4ded3';
    for(let x = 0; x < W; x++){
      const k = (x - 10) % 36, inWin = x >= 10 && k >= 0 && k < 14;
      if(!inWin){ R(c, x, 16, 1, 18, wall); continue; }
      const edge = (k === 0 || k === 13) ? 4 : (k === 1 || k === 12) ? 2 : (k === 2 || k === 11) ? 1 : 0;
      if(edge){ R(c, x, 16, 1, edge, wall); R(c, x, 34 - edge, 1, edge, wall); }
    }
    for(let x = 10; x < W; x += 36){ R(c, x - 1, 16, 1, 18, '#c9c2b5'); R(c, x + 14, 16, 1, 18, '#c9c2b5'); }
    R(c, 0, 0, W, 14, '#d4cdc1'); for(let x = 0; x < W; x += 32) R(c, x, 0, 1, 14, '#b7af9f'); R(c, 0, 13, W, 2, '#a59d8c');
    for(let x = 6; x < W; x += 32) R(c, x, 15, 3, 1, '#9fd3ff');                                   // 閱讀燈
    R(c, 0, 34, W, 32, '#efe9df');
    // 後面一排：從椅背後露出的頭（經濟艙擁擠感）
    const backHair = ['#3b2416', '#111', '#d9a441', '#7a4a2a', '#222', '#c0392b', '#3b2416'];
    for(let k = 0; k < 7; k++){
      const x = 12 + k * 22;
      R(c, x + 1, 34, 6, 2, backHair[k]); R(c, x + 1, 36, 6, 3, '#f1c7a1'); R(c, x + 1, 36, 1, 2, backHair[k]); R(c, x + 6, 36, 1, 2, backHair[k]);
      if(k % 3 === 1) zzz(c, x + 6, 34, t + k, '#8a96b4');
    }
    // 前排六個並排座位（大多在睡覺）
    const P6 = [
      [{ hair: '#3b2416', shirt: '#e76f51' }, 'eat'], [{ hair: '#d9a441', shirt: '#457b9d', mask: true }, 'sleep'],
      [{ hair: '#111', shirt: '#6d597a', tired: true }, 'sleep'], [{ hair: '#7a4a2a', shirt: '#2a9d8f', cup: 'coffee' }, 'drink'],
      [{ hair: '#c0392b', shirt: '#e9c46a', mask: true }, 'sleep'], [{ hair: '#222', shirt: '#f4a261', tired: true }, 'sleep']
    ];
    P6.forEach(([p, act], k) => {
      const x = 4 + k * 26;
      R(c, x - 1, 38, 20, 26, '#2f4f7f'); R(c, x + 1, 38, 16, 4, '#e9eef2');                       // 椅背、頭枕套
      chibi(c, x + 1, 41 + (act === 'sleep' && k % 2 ? 1 : 0), p, act === 'drink' && Math.floor(t * 1.2) % 4 === 0, false, 2);
      R(c, x - 3, 58, 3, 8, '#26406a');                                                            // 扶手（相鄰共用，很擠）
      R(c, x - 1, 60, 20, 2, '#9aa5b1');                                                           // 餐桌板
      if(act === 'eat' || act === 'drink'){
        R(c, x, 57, 17, 3, '#d7dde3');
        R(c, x + 1, 55, 7, 3, '#ffffff'); R(c, x + 2, 55, 5, 2, act === 'eat' ? '#e8c06b' : '#c8873a');
        R(c, x + 10, 56, 3, 2, '#e3b36b'); R(c, x + 14, 54, 2, 4, '#f6a04d');
      }
      if(act === 'eat'){ const fy = Math.floor(t * 3) % 2; R(c, x + 16, 48 + fy * 3, 1, 6, '#b9c2cc'); }
      if(act === 'sleep') zzz(c, x + 14, 40, t + k * .37, '#5b6b8c');
    });
    R(c, 155, 58, 3, 8, '#26406a');
    // 走道地毯＋空服員推餐車經過
    R(c, 0, 66, W, 24, '#5b6b8c'); for(let x = 0; x < W; x += 8) R(c, x, 72 + (x / 8 % 2) * 8, 3, 1, '#6d7da0');
    const cx = ((t * 10) % 230) - 50;
    R(c, cx, 62, 26, 20, '#c9ced6'); R(c, cx, 62, 26, 2, '#e9edf2'); R(c, cx + 2, 66, 22, 1, '#9aa5b1'); R(c, cx + 2, 72, 22, 1, '#9aa5b1');
    R(c, cx + 2, 59, 4, 3, '#f6a04d'); R(c, cx + 8, 60, 3, 2, '#ffffff'); R(c, cx + 2, 82, 3, 3, '#222'); R(c, cx + 21, 82, 3, 3, '#222');
    chibi(c, cx - 15, 60, { hair: '#111', shirt: '#1d3557', pants: '#1d3557' }, false, Math.floor(t * 4) % 2, 2);
    R(c, cx - 11, 74, 8, 2, '#e63946');                                                            // 空服員的紅絲巾
  }

  /* ---------- D1：抵達墨爾本（推行李＋沒睡好） ---------- */
  function arrival(c, t){
    // 大片玻璃窗外：中午的藍天、停機坪與飛機
    bands(c, ['#79c4ee', '#9ad5f3', '#bfe5f8'], 0, 46);
    cloud(c, ((t * 3) % 200) - 30, 16);
    R(c, 0, 38, W, 8, '#9aa3ab');
    const px = 70;
    R(c, px, 30, 56, 7, '#f4f6f8'); R(c, px - 4, 31, 4, 5, '#f4f6f8'); R(c, px + 50, 22, 6, 9, '#e63946');   // 機身、機尾
    for(let w = 0; w < 8; w++) R(c, px + 6 + w * 5, 32, 2, 2, '#4a6a85');
    R(c, px + 20, 36, 16, 2, '#c9ced6'); R(c, px + 24, 38, 6, 2, '#5a6470');
    for(let x = 0; x < W; x += 20) R(c, x, 0, 2, 46, '#55606b');                                     // 窗框
    R(c, 0, 0, W, 2, '#55606b');
    // WELCOME TO MELBOURNE 招牌
    const sign = 'WELCOME TO MELBOURNE', sw = textW(sign);
    R(c, 80 - Math.floor(sw / 2) - 4, 4, sw + 8, 9, '#1d3557'); R(c, 80 - Math.floor(sw / 2) - 4, 12, sw + 8, 1, '#0f1f33');
    text(c, sign, 80 - Math.floor(sw / 2), 6, '#ffd166');
    // 亮亮的地板
    R(c, 0, 46, W, 44, '#cfd4d9'); for(let y = 52; y < H; y += 8) R(c, 0, y, W, 1, '#bcc2c8');
    for(let x = 0; x < W; x += 16) R(c, x, 46, 1, 44, '#bcc2c8');
    // 邊睡邊推行李的人（前後兩排、不同速度，晃來晃去）
    const walkers = [
      { lane: 50, sp: 6,   off: 0,   p: { hair: '#d9a441', shirt: '#e9c46a', tired: true }, bags: ['#457b9d', '#e9c46a', '#2a9d8f'] },
      { lane: 50, sp: 6,   off: 115, p: { hair: '#111', shirt: '#6d597a', tired: true, yawn: true }, bags: ['#8338ec', '#ff8fab', '#264653'] },
      { lane: 58, sp: 7.5, off: 60,  p: { hair: '#3b2416', shirt: '#2a9d8f', tired: true }, bags: ['#e63946', '#ffb703', '#6d597a'] },
      { lane: 58, sp: 7.5, off: 175, p: { hair: '#c0392b', shirt: '#457b9d', tired: true }, bags: ['#f4a261', '#2a9d48', '#1d3557'] }
    ];
    walkers.forEach((w, k) => {
      const x = ((t * w.sp + w.off) % 230) - 60, wob = Math.round(Math.sin(t * 3 + k * 1.3));
      const yawn = w.p.yawn ? Math.floor(t * .8 + k) % 3 === 0 : false;
      chibi(c, x, w.lane + wob, { ...w.p, yawn }, false, Math.floor(t * 3 + k) % 2, 2);
      const tx = x + 18, y = w.lane;
      R(c, tx, y + 10, 1, 10, '#8a939c'); R(c, tx, y + 20, 30, 2, '#8a939c'); R(c, tx - 2, y + 10, 3, 1, '#8a939c');
      R(c, tx + 3, y + 4, 22, 16, w.bags[0]); R(c, tx + 3, y + 4, 22, 1, 'rgba(255,255,255,.35)'); R(c, tx + 12, y + 2, 4, 2, '#333');
      R(c, tx + 6, y - 6, 16, 10, w.bags[1]); R(c, tx + 12, y - 8, 4, 2, '#333');
      R(c, tx + 9, y - 12, 9, 6, w.bags[2]);
      R(c, tx + 2, y + 22, 3, 3, '#333'); R(c, tx + 26, y + 22, 3, 3, '#333');
      zzz(c, x + 12, w.lane - 6 + wob, t + k * .4, '#5b6b8c');
    });
  }

  /* ---------- D3：Meat & Wine Co. 牛排（套用餐廳場景） ---------- */
  function steak(c, t, D){
    platter(D);
    D(-8, -4, 14, 4, '#7a3b1c'); D(-8, -4, 14, 1, '#9a5230');                  // 炭烤牛排
    for(let k = 0; k < 4; k++) D(-7 + k * 4, -4, 1, 4, '#3d1d0c');             // 烤紋
    for(let k = 0; k < 5; k++) D(7 + (k % 3), -3 - Math.floor(k / 2), 1, 3, '#f2c14e');   // 薯條
    D(-12, -2, 3, 2, '#4f9a3f'); D(-11, -3, 2, 1, '#6abf4b'); D(-10, -1, 1, 1, '#e63946'); // 沙拉
    steam(c, 72, 50, t, 4);
  }

  /* ---------- D3：菲利普島 戶外澳洲 BBQ ---------- */
  function bbq(c, t){
    bands(c, ['#3b2a63', '#7a3f74', '#d06a5a', '#f29b56', '#fbc97a'], 0, 40);   // 傍晚
    disc(c, 128, 40, 8, '#ffd58a');
    R(c, 0, 36, W, 8, '#2f5a8a'); for(let i = 0; i < 8; i++) R(c, (hash(i + 1700) * W + t * 3) % W, 38 + (i % 3) * 2, 3, 1, '#f6b26b');  // 遠方的海
    R(c, 0, 44, W, 46, '#5f9e4f'); speckle(c, 0, 44, W, 46, '#4f8a41', 80, 71);
    // 小燈泡串（會閃）
    line(c, 0, 10, 80, 18, '#3a2a2a'); line(c, 80, 18, 159, 8, '#3a2a2a');
    for(let i = 0; i < 16; i++){ const x = i * 10 + 3, y = x < 80 ? 10 + Math.round(x * 8 / 80) : 18 - Math.round((x - 80) * 10 / 80); R(c, x, y + 1, 2, 2, (Math.floor(t * 3) + i) % 4 ? '#ffe08a' : '#a8743f'); }
    // 廚師小人站在烤肉爐後面
    chibi(c, 27, 30, { hair: '#3b2416', shirt: '#ffffff', pants: '#2b3a67' }, false, false, 2);
    R(c, 31, 46, 8, 6, '#e63946');                                     // 圍裙
    R(c, 18, 58, 34, 6, '#2b2b2b'); R(c, 16, 56, 38, 2, '#444'); R(c, 20, 64, 2, 16, '#2b2b2b'); R(c, 48, 64, 2, 16, '#2b2b2b');
    for(let k = 0; k < 4; k++){ const sz = (Math.floor(t * 4) + k) % 5 === 0; R(c, 19 + k * 8, 54 - (sz ? 1 : 0), 6, 2, k % 2 ? '#7a3b1c' : '#b5652f'); }   // 香腸、牛排滋滋作響
    for(let k = 0; k < 6; k++){ const age = (t * .9 + k / 6) % 1; disc(c, 22 + (k % 3) * 10 + Math.sin(age * 6 + k) * 2, 52 - age * 26, 1 + Math.floor(age * 3), age < .5 ? '#e9e9e9' : '#c9c9c9'); }
    const flip = Math.floor(t * 2) % 2; R(c, 43, 46 - flip * 3, 1, 8, '#9aa5b1'); R(c, 43, 53 - flip * 3, 3, 1, '#9aa5b1');   // 夾子翻肉
    // 野餐桌與舉啤酒的朋友
    const cheers = Math.floor(t * .7) % 4 === 0;
    [[74, 0], [94, 1], [114, 2], [134, 3]].forEach(([x, k]) => chibi(c, x, 44, { ...DINERS[k + 1], cup: 'beer' }, cheers || Math.floor(t * 1.5 + k * 1.7) % 6 === 0, false, 2));
    R(c, 70, 64, 84, 4, '#8b5a3c'); R(c, 70, 64, 84, 1, '#a8743f'); R(c, 74, 68, 3, 12, '#6b4426'); R(c, 147, 68, 3, 12, '#6b4426');
    R(c, 66, 74, 92, 3, '#7a4e33');
    R(c, 96, 61, 26, 3, '#ffffff'); for(let k = 0; k < 5; k++) R(c, 98 + k * 5, 59, 3, 2, k % 2 ? '#7a3b1c' : '#b5652f');     // 共享盤
    if(cheers) [[86, 48], [126, 48]].forEach(([x, y]) => { R(c, x, y, 1, 3, '#fff6cf'); R(c, x - 1, y + 1, 3, 1, '#fff6cf'); });
  }

  /* ---------- D3 附近：菲利普島 GP 賽車場（靠海的賽道） ---------- */
  function gpCircuit(c, t){
    bands(c, ['#6fbfec', '#8fd0f2', '#b4e1f7'], 0, 30);
    cloud(c, ((t * 4) % 200) - 30, 6);
    R(c, 0, 26, W, 10, '#1f7fb8'); for(let i = 0; i < 10; i++) R(c, (hash(i + 1800) * W + t * 5) % W, 28 + (i % 4) * 2, 3, 1, '#bfe6fb');   // 背景的巴斯海峽
    R(c, 0, 36, W, 54, '#6aa84f'); speckle(c, 0, 36, W, 54, '#5a9443', 70, 81);
    // 看台與觀眾
    R(c, 10, 34, 70, 14, '#d9d4c8'); R(c, 8, 32, 74, 2, '#e63946');
    for(let r = 0; r < 3; r++) for(let k = 0; k < 16; k++){ const x = 13 + k * 4 + (r % 2) * 2, jump = (Math.floor(t * 4) + k + r) % 7 === 0;
      R(c, x, 36 + r * 4 - (jump ? 1 : 0), 2, 2, ['#e63946', '#ffb703', '#457b9d', '#2a9d8f', '#ffffff'][(k + r) % 5]); }
    // 賽道（彎道＋紅白路緣）
    R(c, 0, 52, W, 22, '#4a4a4a'); R(c, 0, 62, W, 1, '#6a6a6a');
    for(let x = 0; x < W; x += 6){ R(c, x, 50, 3, 2, '#e63946'); R(c, x + 3, 50, 3, 2, '#ffffff'); R(c, x, 74, 3, 2, '#ffffff'); R(c, x + 3, 74, 3, 2, '#e63946'); }
    // 起跑線、方格旗
    for(let y = 52; y < 74; y += 2) R(c, 120 + ((y / 2) % 2) * 2, y, 2, 2, '#ffffff');
    const wave = Math.floor(t * 5) % 2;
    R(c, 132, 30, 1, 20, '#666');
    for(let j = 0; j < 4; j++) for(let i = 0; i < 6; i++) R(c, 133 + i * 2, 30 + j * 2 + (wave && i > 2 ? 1 : 0), 2, 2, (i + j) % 2 ? '#111' : '#ffffff');
    // 呼嘯而過的賽車與重機
    const cars = [{ y: 54, sp: 90, off: 0, col: '#e63946', bike: false }, { y: 64, sp: 75, off: 120, col: '#2a7de1', bike: true }, { y: 58, sp: 82, off: 230, col: '#ffb703', bike: false }];
    cars.forEach(car => {
      const x = ((t * car.sp + car.off) % 360) - 60;
      for(let k = 1; k < 4; k++) R(c, x - k * 7, car.y + 2 + (k % 2), 5, 1, '#9a9a9a');   // 速度線
      if(car.bike){ R(c, x, car.y + 1, 9, 3, car.col); R(c, x + 3, car.y - 2, 4, 3, '#222'); R(c, x + 4, car.y - 3, 3, 2, '#ffffff'); R(c, x, car.y + 4, 3, 3, '#111'); R(c, x + 7, car.y + 4, 3, 3, '#111'); }
      else { R(c, x, car.y, 16, 4, car.col); R(c, x + 6, car.y - 2, 5, 2, '#222'); R(c, x + 14, car.y + 1, 3, 2, car.col); R(c, x - 1, car.y - 1, 2, 3, car.col);
        R(c, x + 1, car.y + 4, 4, 3, '#111'); R(c, x + 11, car.y + 4, 4, 3, '#111'); R(c, x + 7, car.y + 1, 2, 2, '#ffffff'); }
    });
  }

  /* ---------- D5 附近：Flinders St 車站復古拍貼機（黑白四格） ---------- */
  function photoBooth(c, t){
    // 車站大廳：赭黃牆面、拱門
    R(c, 0, 0, W, 66, '#d9a441'); R(c, 0, 16, W, 2, '#b8862f');
    for(let x = 4; x < W; x += 38){ R(c, x, 30, 22, 36, '#7a5a2a'); for(let r = 0; r < 5; r++) R(c, x + 5 - r, 25 + r, 12 + r * 2, 1, '#7a5a2a'); R(c, x + 2, 34, 18, 32, '#5a4020'); }
    // 經過的通勤小人（在拱門裡，遠處）
    for(let k = 0; k < 3; k++){ const x = ((t * (10 + k * 4) + k * 60) % 190) - 15; chibi(c, x, 50, DINERS[k + 2], false, Math.floor(t * 6 + k) % 2); }
    // 「Under the Clocks」：一排時鐘
    R(c, 0, 2, W, 14, '#3a2a1a');
    for(let k = 0; k < 7; k++){
      const cx = 12 + k * 22; disc(c, cx, 9, 5, '#f4efe4'); R(c, cx, 9, 1, 1, '#222');
      const a = (t * .2 + k * 1.3), hx = Math.round(Math.cos(a) * 3), hy = Math.round(Math.sin(a) * 3);
      line(c, cx, 9, cx + hx, 9 + hy, '#222'); line(c, cx, 9, cx, 6, '#222');
    }
    // 地板
    for(let y = 66; y < H; y += 6) for(let x = 0; x < W; x += 6) R(c, x, y, 6, 6, ((x + y) / 6) % 2 ? '#d8d0c0' : '#c4bba9');
    // 拍貼機本體
    const cyc = t % 7, flash = cyc < 4 && (cyc % 1) > .5 && (cyc % 1) < .72;
    R(c, 46, 22, 44, 56, '#efe6d2'); R(c, 46, 74, 44, 4, '#5a3a22'); R(c, 46, 22, 44, 1, '#fff8e8');
    R(c, 46, 22, 44, 10, '#c1121f');
    const sign = 'PHOTOS'; text(c, sign, 68 - Math.floor(textW(sign) / 2), 25, '#ffffff');
    // 布簾（拍照時透出閃光）＋布簾下的腳
    R(c, 50, 34, 20, 36, flash ? '#fff6cf' : '#2b2b2b');
    for(let x = 50; x < 70; x += 3) R(c, x + (Math.floor(t * 2) % 2), 36, 2, 34, flash ? '#ff8a8a' : '#a4161a');
    R(c, 50, 34, 20, 3, '#7a0f13');
    if(cyc < 4.3){ const st = Math.floor(cyc) % 2; R(c, 53 + st, 70, 5, 3, '#2b3a67'); R(c, 61 - st, 70, 5, 3, '#2b3a67'); R(c, 53 + st, 73, 5, 1, '#222'); R(c, 61 - st, 73, 5, 1, '#222'); }
    if(flash){                                                   // 閃光：放射狀光線
      [[-1, -1], [1, -1], [0, -1], [-1, 0], [1, 0]].forEach(([dx, dy]) => line(c, 60 + dx * 12, 52 + dy * 20, 60 + dx * 20, 52 + dy * 28, '#fff6cf'));
      R(c, 44, 40, 2, 2, '#ffffff'); R(c, 74, 40, 2, 2, '#ffffff');
    }
    // 右側面板：範例照片、投幣口、出照片口
    R(c, 74, 34, 12, 18, '#d8ccb2');
    for(let k = 0; k < 3; k++){ R(c, 75 + k * 4, 35, 3, 16, '#ffffff'); for(let j = 0; j < 4; j++){ R(c, 75 + k * 4, 36 + j * 4, 3, 3, '#7a7a7a'); R(c, 76 + k * 4, 37 + j * 4, 1, 1, '#d0d0d0'); } }
    R(c, 78, 55, 4, 2, '#222'); R(c, 77, 54, 6, 1, '#b8a682');                     // 投幣口
    R(c, 75, 62, 10, 2, '#222');                                                  // 出照片口
    // 黑白四格照片慢慢滑出來
    const len = cyc >= 4.4 ? Math.min(1, (cyc - 4.4) / 1.4) * 24 : 0;
    if(len > 0){
      R(c, 77, 64, 6, len, '#ffffff');
      for(let j = 0; j < 4; j++){ const fy = 65 + j * 6; if(fy + 4 <= 64 + len){ R(c, 78, fy, 4, 5, '#6a6a6a'); R(c, 79, fy + 1, 2, 2, '#e0e0e0'); R(c, 79, fy + 3, 2, 1, '#333'); } }
    }
    // 等著拿照片的朋友（照片出來時開心跳一下）
    const happy = len >= 24 && Math.floor(t * 4) % 2 === 0;
    chibi(c, 96, 52 - (happy ? 2 : 0), { hair: '#3b2416', shirt: '#2a9d8f' }, false, false, 2);
    if(len >= 24) [[94, 48], [114, 50]].forEach(([x, y]) => { R(c, x, y, 1, 3, '#fff6cf'); R(c, x - 1, y + 1, 3, 1, '#fff6cf'); });
  }

  /* ---------- 重點店家：Chemist Warehouse（紅黃招牌、提著滿滿購物籃的小人） ---------- */
  function chemistWarehouse(c, t){
    bands(c, ['#8fd0f2', '#b4e1f7', '#d6effa'], 0, 30);
    cloud(c, ((t * 3) % 200) - 30, 4);
    R(c, 0, 14, W, 60, '#e9e4da');                                            // 建築立面
    // 紅色招牌＋黃字（偶爾閃一下）
    const glow = Math.floor(t * 2) % 6 === 0;
    R(c, 6, 16, 148, 13, '#d71920'); R(c, 6, 28, 148, 2, '#a5121a');
    const sign = 'CHEMIST WAREHOUSE'; text(c, sign, 80 - Math.floor(textW(sign) / 2), 20, glow ? '#ffffff' : '#ffd400');
    // 大片玻璃窗：貨架上滿滿的商品、黃色價格牌
    R(c, 8, 32, 144, 38, '#3a3f47');
    R(c, 10, 34, 140, 34, '#f5f1e6');
    const goods = ['#e63946', '#2a9d8f', '#ffb703', '#457b9d', '#ff8fab', '#ffffff', '#8338ec', '#6abf4b'];
    for(let row = 0; row < 3; row++){
      const y = 37 + row * 10;
      R(c, 10, y + 7, 140, 1, '#b8ad96');
      for(let x = 12; x < 148; x += 4) R(c, x, y + 2 + (x % 3), 3, 5 - (x % 3), goods[(x * 7 + row * 3) % goods.length]);
    }
    for(let k = 0; k < 6; k++){                                                  // 價格牌輪流閃
      const x = 16 + k * 24, on = (Math.floor(t * 3) + k) % 3 === 0;
      R(c, x, 34 + (k % 2) * 10, 8, 5, on ? '#ffd400' : '#ffe680'); R(c, x + 1, 35 + (k % 2) * 10, 6, 1, '#d71920'); R(c, x + 2, 37 + (k % 2) * 10, 4, 1, '#d71920');
    }
    R(c, 66, 46, 28, 24, '#3a3f47'); R(c, 68, 48, 24, 22, '#cfe6f2'); R(c, 79, 48, 2, 22, '#3a3f47');   // 自動門
    R(c, 0, 70, W, 20, '#cfc9be'); for(let x = 0; x < W; x += 10) R(c, x, 70, 1, 20, '#bcb5a8');
    // 提著購物籃、購物袋進出的小人
    const shoppers = [
      { p: { hair: '#3b2416', shirt: '#2a9d8f' }, sp: 9, off: 0, dir: 1, bag: '#d71920' },
      { p: { hair: '#d9a441', shirt: '#e76f51' }, sp: 7, off: 90, dir: -1, bag: '#ffd400' },
      { p: { hair: '#111', shirt: '#6d597a' }, sp: 8, off: 170, dir: 1, bag: '#d71920' }
    ];
    shoppers.forEach((s, k) => {
      let x = ((t * s.sp + s.off) % 210) - 25; if(s.dir < 0) x = 160 - x;
      const bob = Math.floor(t * 6 + k) % 2;
      chibi(c, x, 62, s.p, false, bob, 2);
      const bx = s.dir > 0 ? x + 15 : x - 9;                                      // 滿滿的購物籃
      R(c, bx, 76 + bob, 10, 7, s.bag); R(c, bx + 1, 74 + bob, 8, 2, s.bag === '#d71920' ? '#a5121a' : '#c9a400');
      for(let j = 0; j < 4; j++) R(c, bx + 1 + j * 2, 72 + bob - (j % 2), 2, 3, goods[(j + k * 2) % goods.length]);
    });
  }

  window.PIXEL_SCENES = {
    'brighton-boxes': { name: 'Brighton 七彩沙灘屋', draw: brighton },
    'penguin-parade': { name: '神仙小企鵝夜歸巢', draw: penguins },
    'puffing-billy':  { name: '普芬比利蒸汽火車', draw: puffingBilly },
    'st-patricks':    { name: '聖派翠克大教堂', draw: stPatricks },
    'queen-vic-market': { name: '維多利亞女王市場', draw: queenVicMarket },
    'market-lane':    { name: 'Market Lane Coffee', draw: marketLane },
    'cooks-cottage':  { name: '庫克船長小屋', draw: cooksCottage },
    'pellegrinis':    { name: "Pellegrini's Espresso Bar", draw: pellegrinis },
    'parliament':     { name: '維多利亞議會大廈', draw: parliament },
    'princess-theatre': { name: '公主劇院', draw: princessTheatre },
    'chinatown':      { name: '唐人街', draw: chinatown },
    'plane-meal':     { name: '飛機餐', draw: planeMeal },
    'arrival':        { name: '抵達墨爾本', draw: arrival },
    'bbq':            { name: '澳洲 BBQ', draw: bbq },
    'chemist-warehouse': { name: 'Chemist Warehouse', draw: chemistWarehouse },
    'photo-booth':    { name: 'Flinders St 復古拍貼機', draw: photoBooth },
    'gp-circuit':     { name: '菲利普島 GP 賽車場', draw: gpCircuit },
    'meal-steak':     { name: 'Meat & Wine Co. 牛排', draw: restaurant({ night: false, flags: ['#8b5a3c', '#d4a017', '#5a3a22'], cloth: ['#6b4426', '#7d5230'], cups: ['wine', 'beer'], dish: steak }) },
    // 餐廳共用場景：換白天／晚上、旗串、桌巾、料理
    'meal-pasta':     { name: '義大利麵', draw: restaurant({ night: false, flags: ['#2a9d48', '#ffffff', '#ce2b37'], cloth: ['#d64545', '#ffffff'], cups: ['wine', 'beer'], dish: pasta }) },
    'meal-knuckle':   { name: '德國豬腳＋啤酒', draw: restaurant({ night: true, flags: ['#1f5fa8', '#ffffff'], cloth: ['#2f6db5', '#ffffff'], cups: ['beer'], dish: porkKnuckle }) }
  };
  window.PIXEL_SIZE = { w: W, h: H };
})();
