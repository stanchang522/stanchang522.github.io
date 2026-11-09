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

  window.PIXEL_SCENES = {
    'brighton-boxes': { name: 'Brighton 七彩沙灘屋', draw: brighton },
    'penguin-parade': { name: '神仙小企鵝夜歸巢', draw: penguins },
    'puffing-billy':  { name: '普芬比利蒸汽火車', draw: puffingBilly }
  };
  window.PIXEL_SIZE = { w: W, h: H };
})();
