# 澳洲墨爾本七日遊 — 旅遊網頁

依兩份資料製作的互動式行程網頁：
- `【附件】2026澳洲墨爾本行程簡表.pdf`（旅行社團體行程，景點順序以此為準）
- 「行程精華整理手冊」文字檔（補充航班、每站時間、車程、採買焦點）

## 使用方式

- 直接雙擊 `index.html` 用瀏覽器開啟即可（需要網路載入地圖）。
- 開發預覽：`calude_test/.claude/launch.json` 的 `melbourne-trip` 設定（python http.server，port 8766）。
- 位置：GitHub Pages repo `stanchang522.github.io` 的 `claude_travel/` 資料夾（2026-11-09 從 `claude_retail/calude_travel` 搬入）。發佈後網址為 `https://stanchang522.github.io/claude_travel/`。

## 功能

| 功能 | 說明 |
|---|---|
| 每日頁籤 | 上方 D1～D7 ＋「小抄」，記住上次看的頁籤 |
| 卡片模式（預設，Trello 版型） | 每個行程是**一整欄**，整欄左右滑動；欄內每段資訊都是**獨立小卡片**：欄位標題（時間、名稱、車程）→ 照片 → 像素圖（有的話）→ 簡介＋Google 地圖 → 介紹 → 商品 → 必看 → 必買 → 小提醒 → 每個附近景點各一張 → 提醒。**停在中間的那一欄就是目前這個行程**，地圖跟著移過去；上方有「‹ 3 / 8 ›」。點地圖地標，看板會自動捲到那一欄；從長欄滑到短欄時，會自動捲回欄位頂端 |
| 列表模式 | 「🃏 卡片／☰ 列表」切換，列表就是原本的直向排法，可一眼看完整天；選擇會記住（`mel_view`） |
| 行程時間軸 | 依順序列出景點、餐食、住宿；有座標的項目編號與地圖地標對應 |
| 時間與車程 | 卡片上顯示每站時間，兩站之間顯示「🚌 車程」 |
| 航班 | D1、D6 顯示航班卡片。**航班可在小抄修改**（航空公司、航班號、起飛／抵達時間），所有用到航班的卡片（D1、D2 抵達、D6、D7）跟著變；**飛行時間依出發日期的兩地時差自動推算**，不合理時顯示警告；每班有「🔎 查即時航班」（Google 航班狀態）。網頁本身不會自動抓航班時刻 |
| 採買焦點 | 粉紅色「🛒 採買」卡片與地標（不編號、不連路線）；商品附 AUD／NT$ 價格與「已買到」勾選 |
| 地圖 | Leaflet＋Esri 底圖（免 API key，file:// 可用）；依類型分色：景點綠、餐廳橘、住宿紫、交通灰、採買粉紅；虛線連成當日路線 |
| 景點介紹 | 點地標或卡片展開：介紹、必看、必買／必吃、小提醒、附近有趣的地方 |
| 附近景點 | 展開後以白色小點顯示在地圖上，點名稱可飛過去 |
| Google 地圖 | 每個景點、餐廳、商店與附近景點都有「📍 在 Google 地圖開啟」按鈕（卡片、附近景點、地圖彈窗）；只是搜尋連結，**不需要 API key、免費**，手機會直接開 Google 地圖 App 看評論、營業時間、導航 |
| 天氣穿搭 | 「小抄」最上方是整趟旅程的總覽（出發日期、D2～D6 各天溫度、下雨比例＋行李建議），D2～D6 各有當天卡片，**預設收合成一行摘要**（溫度、☔、🐧 體感、預報／平均），點「穿搭」展開完整建議，展開狀態會記住（`mel_wx_open`）。**出發日期預設 11/10**，可改成 10/1～11/30，改了會重算各天日期與溫度，也可一鍵重設回 11/10；月份由出發日期決定。溫度來自各地點**歷年實際資料**；落在今天起 16 天內的日子自動改成 **Open-Meteo 即時預報**，7 天以上標「遠期預報，僅供參考」。D3 另外分開顯示企鵝歸巢時段（20–21 點）的**氣溫、體感溫度、風速** |
| 旅遊小抄 | 旅程天氣與穿搭（出發日期）、✈️ 航班資訊（可編輯）、匯率換算、**可勾選的採買清單（可新增自訂項目）**、退稅 TRS、ETA 與檢疫、時差電壓、交通、小費、伴手禮、實用英文；地圖顯示全部景點總覽 |
| 手機版 | 寬度 ≤ 820px 時，地圖**預設收合**，按「🗺 地圖」才展開。展開後固定在頁籤下方，滑卡片時看得到地圖移動；想改成展開後跟著頁面捲走，把 `index.html` 的 `STICKY_MAP` 改成 `false`。點「附近有趣的地方」時，地圖收著會自動展開。電腦版地圖一直顯示在右邊 |

## 天氣資料

- **歷年平均**：`data/climate.js`，由 `tools/build_climate.py` 從 Open-Meteo 歷史資料 API（ERA5 再分析資料，免費、不需 API key）抓取 2016–2025 年 10、11 月的每日資料計算。和氣象局測站可能相差約 1 度。
  - 地點：墨爾本市區（D2、D3 白天、D5）、菲利普島企鵝看台（D3 晚上 20–21 點的氣溫／體感／風速）、丹頓農山 Belgrave（D4）、巴拉瑞特（D6）
  - 每月數值：平均高溫、平均低溫、下雨天數比例（日雨量 ≥ 1mm）、30°C 以上日子比例
  - 重新計算：在 `claude_travel` 資料夾執行 `python3 tools/build_climate.py`
- **即時預報**：網頁開啟時，如果某天落在今天起 16 天內，直接向 `api.open-meteo.com` 抓當天預報（高低溫、降雨機率；D3 另抓 20–21 點逐時氣溫、體感、風速）。沒網路或抓取失敗時，自動退回歷年平均。
- 航班預設 `DEFAULT_FLIGHTS`（手冊的 CI057／CI058）；使用者改的存在 `mel_flights`，改了預設會作廢舊的修改。以手冊時間推算，回程 21:50→05:40 是飛 10 小時 50 分（手冊寫 9 小時 50 分），可見時間有誤，待旅行社確認
- 出發日期預設 `DEFAULT_START = '2026-11-10'`；改過的日期只存在這台裝置的瀏覽器裡（`mel_start`，存 `{d, def}`），按「重設」會清掉，回到 11/10。**之後若修改 `DEFAULT_START`，使用者先前選的日期會自動作廢**，改用新的預設（避免舊選擇蓋過新預設）。

## 8-bit 像素場景

- 檔案：`pixel/scenes.js`。用程式在 160×90 畫布上畫的**原創**像素插畫，沒有授權問題；網頁放大成馬賽克顆粒感，每秒 12 格循環播放。
- 目前 18 個場景：
  - D1：`plane-meal`（夜間機艙：吃飛機餐、戴眼罩睡覺冒 Zzz、空服員推餐車）、`arrival`（抵達大廳 WELCOME TO MELBOURNE：推行李推車、沒睡好的小人、打哈欠）
  - D2：`meal-pasta`（義大利分享餐）、`st-patricks`（聖派翠克大教堂）、`queen-vic-market`（女王市場）、`market-lane`（Market Lane Coffee 紅磚老建築轉角店＋門口喝咖啡的小人）、`cooks-cottage`（費茲洛花園 庫克船長小屋）、`meal-knuckle`（德國豬腳＋啤酒）
  - D2 附近景點（放在「附近有趣的地方」卡片裡）：`parliament`（議會大廈：柱廊、國旗、經過的電車）、`princess-theatre`（公主劇院：跑馬燈招牌）、`chinatown`（唐人街：牌樓、紅燈籠）
  - D3：`brighton-boxes`（沙灘小屋＋海浪＋海鷗）、`meal-steak`（Meat & Wine Co. 牛排，套用餐廳場景、木頭長桌）、`bbq`（傍晚海邊戶外烤肉：廚師翻肉冒煙、野餐桌舉啤酒、小燈泡串）、`penguin-parade`（夕陽＋企鵝隊伍上岸）、`gp-circuit`（附近景點：靠海的賽道、看台、方格旗、賽車與重機呼嘯而過）
  - D5 附近（塗鴉巷）：`photo-booth`（Flinders St 車站復古黑白拍貼機：一排時鐘、布簾閃光四下、四格照片滑出來）
  - D4：`puffing-billy`（蒸汽火車過木棧橋＋白煙＋窗邊晃腳的乘客）
- **餐廳共用場景** `restaurant({...})`：木地板＋一張長桌、六個小人拿飲料，每隔幾秒一起舉杯。參數有 `night`（白天／晚上）、`flags`（牆上旗串顏色）、`cloth`（格子桌巾兩色）、`cups`（小人手上的杯子，輪流套用：coffee／beer／wine）、`dish`（桌上料理的繪製函式，小小的當配角）。其他餐點只要寫一個新的 `dish` 函式就能套用。
- 共用工具：`chibi()` 熱血躲避球風格的兩頭身小人（可放大 2 倍；表情：`tired` 瞇眼黑眼圈、`yawn` 打哈欠、`mask` 戴眼罩）、`zzz()` 睡覺的 Zzz、`text()` 像素字（目前有 A B C E H I K L M N O P Q R S T U V W，M、W 為 5 格寬）、`steam()` 熱氣。
- 照片卡片維持原樣，像素圖是**照片下方的另一張卡片**（列表模式則是照片下方接像素圖），不需切換。
- 只播放畫面上看得到的畫布，捲出畫面就暫停；畫面上完全沒有動畫時，動畫迴圈會整個停止。手機開啟「減少動態效果」時只顯示靜止畫面。
- 新增場景：在 `pixel/scenes.js` 的 `PIXEL_SCENES` 加一個 key，並在 `DAYS` 的景點加上 `px:'同一個 key'`。

## 景點圖片

圖片存在本地 `images/` 資料夾，不需要連上維基也能顯示。
- 收合的卡片右側顯示縮圖
- 展開後頂部顯示大圖，下方標註作者與授權
- 地圖彈出視窗也有縮圖

### 換圖（自己的照片或其他來源）

1. **最簡單**：用**同樣的檔名**覆蓋 `images/` 裡的圖片，例如把自己拍的照片存成 `images/sovereign-hill.jpg`。
2. 打開 `images/images.js`，找到該代號，修改 `author`、`license`、`source`。如果是自己拍的照片，可以把 `author` 改成自己的名字，`license`、`source` 改成空字串 `""`。
3. 重新整理網頁（若圖片沒更新，按 Cmd+Shift+R 強制重新載入）。

### 新增圖片給沒有圖的項目

1. 把圖片放進 `images/`，例如 `images/oakwood.jpg`。
2. 在 `images/images.js` 加一筆：
   ```js
   "oakwood": {"file": "oakwood.jpg", "caption": "Oakwood 飯店", "author": "", "license": "", "source": ""},
   ```
3. 在 `index.html` 的 `DAYS` 裡，找到該項目，加上 `img:'oakwood',`。

### 圖片代號對照

| 代號 | 用在 | 代號 | 用在 |
|---|---|---|---|
| `tpe-airport` | 桃園機場（D1、D7） | `puffing-billy` | 普芬比利蒸汽火車 |
| `mel-airport` | 墨爾本機場（D1、D2、D6、D7） | `rochford-wines` | 羅奇福德酒莊（雅拉河谷風景） |
| `st-patricks` | 聖派翠克大教堂 | `chadstone` | Chadstone 購物中心 |
| `queen-vic-market` | 維多利亞女王市場 | `docklands` | Docklands Lotus 晚餐 |
| `fitzroy-gardens` | 費茲洛花園 | `hosier-lane` | 塗鴉巷 |
| `brighton-boxes` | Brighton 七彩沙灘屋 | `royal-arcade` | 皇家拱廊 |
| `southbank` | Meat & Wine Co、Oakwood 飯店 | `degraves-st` | 咖啡巷弄 |
| `maru-koala` | Maru 動物園（無尾熊照片） | `city-tram` | 路面電車 |
| `penguin-parade` | 企鵝歸巢（小企鵝照片） | `federation-square` | 聯邦廣場 |
| `ngv` | 國立維多利亞美術館 | `sovereign-hill` | 疏芬山金礦小鎮 |

圖片來源：維基百科／Wikimedia Commons。授權多為 CC BY-SA，使用時必須保留作者標註。如果你換成自己的照片，就不需要這些標註。

## 行程摘要

| 天 | 行程 | 住宿 |
|---|---|---|
| D1 | 20:30 桃園第二航廈報到，CI057 23:30 起飛 | 機上 |
| D2 | 11:50 抵達墨爾本 → 午餐 → 聖派翠克大教堂 → 維多利亞女王市場 → 費茲洛花園 | Oakwood Premier Melbourne |
| D3 | Brighton 七彩沙灘屋 → 回南岸午餐（可順路 ST. ALi）→ Maru 無尾熊動物園 → 菲利普島企鵝歸巢 | Oakwood |
| D4 | 普芬比利蒸汽火車 → 羅奇福德酒莊 → Chadstone → Docklands Lotus 晚餐 | Oakwood |
| D5 | 塗鴉巷 → 皇家拱廊 → 咖啡巷弄 → NGV 午餐 → NGV → 聯邦廣場 → 自由逛街（採買補齊） | Oakwood |
| D6 | 巴拉瑞特疏芬山金礦小鎮 → 煌府晚餐 → 18:30 抵達機場，CI058 21:50 起飛 | 機上 |
| D7 | 05:40 抵達桃園第二航廈 | — |

## 資料結構（修改內容看這裡）

所有內容都在 `index.html` 的 `<script>` 內：

- 渲染：`headHTML`（卡片標頭）與 `bodyHTML`（詳細內容）兩種模式共用；`listItemHTML` 是列表模式、`colHTML` 是卡片模式（Trello 欄位）。`selectItem(i, src)` 依 `viewMode` 分兩套行為
- `DAYS`：每天一筆，`items` 依行程順序排列。每個 item：
  - `type`：`spot` / `meal` / `hotel` / `transport` / `shop`（採買，不編號、不連路線）
  - `time`：時間標籤，例如 `'15:15–16:00'`
  - `drive`：從上一站過來的車程，例如 `'約 95 公里・1 小時 20 分'`
  - `flight`：`'out'`（去程）或 `'back'`（回程），對應 `DEFAULT_FLIGHTS`／使用者修改後的 `FL`；與航班時間有關的 `time`／`short`／`tips` 用 getter 寫，畫面渲染時才讀最新航班
  - `products`：採買商品代號陣列，對應 `PRODUCTS`
  - `extra`：自訂資訊卡 `[{title, items, note}]`，顯示在「介紹」下面（例如蒸汽火車的「🪑 座位攻略」）
  - `gq`：Google 地圖搜尋字串（英文名稱＋地址較準），例如 `'Sovereign Hill Ballarat'`；沒有就不顯示按鈕。`near` 裡的附近景點也可以加 `gq`
  - `name`、`en`、`short`、`intro`
  - `ll`：`[緯度, 經度]`，`null` 表示不標在地圖上
  - `see`（必看）、`buy`（必買／必吃）、`tips`（小提醒）：字串陣列
  - `near`：`[{name, ll, desc}]` 附近景點
  - `note`：橘色提醒框
- `wx`：當日天氣設定，`loc` 對應 `data/climate.js` 的地點（`mel`／`pi`／`dandenong`／`ballarat`）、`evening` 夜間時段的地點（D3 用 `pi`）、`notes` 額外提醒
- `OAKWOOD`：飯店資料，D2～D5 共用；各天用 `{...OAKWOOD, time:'20:15 入住'}` 加上當天時間
- `PRODUCTS`：六項採買焦點（Market Lane、ST. ALi、AFL 隊帽、遊戲卡牌、美麗諾羊毛衛生衣、Chemist Warehouse），欄位有名稱、說明、價格 `[標籤, AUD 低, AUD 高]`（單一價格時低＝高）、購買地點、`tips`（⚠️ 購買注意，商品卡片與採買清單都會顯示）
- `nearTitle`：自訂「附近有趣的地方」標題（例如美麗諾採買卡用「🏬 門市」）
- `timeNote`：當天的時間說明（目前只有 D2）
- 每天標題旁顯示當地日期與星期（依出發日期推算）。項目可加 `closed:{days:[星期], msg}`（0＝日），那天剛好休市就顯示紅色警告：目前女王市場（週一、三）、Market Lane Collins St 店（週六、日）
- `near` 附近景點也可以加 `px` 顯示像素圖
- `CLIMO`：由 `data/climate.js` 載入的歷年平均；`TRIP_MONTHS = [9,10]` 是選單提供的月份（0 起算，9＝10 月）

## 地圖授權

- 地圖程式 **Leaflet**：開源（BSD 授權），免費。
- 底圖 **Esri World Street Map**：不是開源，是 Esri 提供的圖磚服務，不用 API key。個人、非商業、少量使用，保留右下角來源標註即可。開源的 OpenStreetMap、CARTO 底圖在雙擊開啟本機檔案（file://）時會拒絕提供圖磚，所以改用 Esri。
- 不把地圖換成 Google：嵌入式 Google 地圖要申請 API key 並綁信用卡，key 外流有被盜用計費的風險。改用免費的「在 Google 地圖開啟」連結。

## 已知事項

- 未公布店家的餐食不標地圖：D2 義大利餐、德國豬腳；D3 BBQ；D6 煌府（查無公開資料）。
- 行程表 D2/D3 住宿為 Oakwood 或 PARKROYAL Monash 擇一，依需求只標 Oakwood（202 Normanby Rd, Southbank）。
- 匯率預設 1 AUD ≈ 22.6 TWD（依手冊的台幣換算反推），小抄可修改，採買價格會跟著更新。

- **月份不影響航班時間**：墨爾本夏令時間從 10 月第一個星期日開始（2026 年為 10/4），10、11 月時差都是 +3 小時，所以時間不隨月份切換。10/1～10/3 出發則是 +2 小時。航空公司 10 月底換冬季班表，時刻可能調整，以旅行社為準。

- **以 11/10 出發推算的休市衝突**：D2＝11/11 星期三，女王市場白天休市；D5＝11/14 星期六，Market Lane Collins St 店公休。網頁會自動顯示警告。

### 兩份資料比對後的處理（2026-10-19）

- **D2 順序**：手冊把女王市場排到 17:15，但依使用者決定**維持原 PDF 順序**（教堂 → 市場 → 花園）；時間依手冊的 11:50 抵達時間推估。市場一般下午 3～4 點收攤，卡片上有提醒。
- **航班時差不一致**：去程用 +3 小時（夏令時間）算，回程用 +2 小時算（用 +3 小時算應是 04:40 抵達）。網頁照手冊寫，並註明以旅行社正式行程為準。
- **Market Lane 女王市場店**：手冊寫 Queen St／Therry St 轉角，但 Therry St 舊店已關閉，現址 462 Queen St（Mercat Cross 建築）。
- **Market Lane Collins St 店**：8 Collins St，官網寫平日 7:00–17:00、**週末公休**。
- **The AFL Store**：查不到墨爾本市區門市資料，改推 Rebel 旗艦店（Emporium Melbourne 4 樓）。
- **ST. ALi 總店**（12-18 Yarra Pl, South Melbourne）：手冊建議 D3 午餐前後順路，但不在正式時間表內，卡片標「視時間」。
- Chadstone 各店樓層未查證，卡片註明以商場地圖為準。
- **美麗諾羊毛衛生衣（代買，2026-11-09 新增）**：D4 Chadstone 的 Icebreaker（品牌官網資料 Shop B-306，舊資料寫 Shop 324）與 Macpac（Lower Ground）、D5 市區 Kathmandu（門市資料不夠新，出發前查官網）。三家都是紐西蘭品牌；價格 AUD 70–120 為網路零售參考價。
- **Chemist Warehouse**（2026-10-19 依使用者要求新增，不在兩份原始資料內）：
  - D4 Chadstone 店、D5 Melbourne Central 店（LG 50, 300 Lonsdale St）的地址來自澳洲政府 healthdirect 醫療服務名錄；Bourke St 345 號 London Stores 店只有店家目錄資料，只寫在備註裡，沒有標在地圖上。
  - 價格是參考價：Blackmores 魚油 400 顆 AUD 48.99（官網，未標日期）、Bio Island 兒童 DHA AUD 26.99（官網 2025/1）、Lucas 木瓜霜 75g AUD 13.83（比價網 2026/8 最低價）。Swisse 查不到可靠的澳洲價格，所以沒列。
- 字體：使用裝置預設黑體（iPhone／Mac 蘋方、Android 思源黑體、Windows 微軟正黑體），不載入網路字型。
- 部分「附近景點」座標為概略位置。
