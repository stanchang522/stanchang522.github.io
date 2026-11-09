"""
從 Open-Meteo 歷史資料 API 抓各地點歷年 10、11 月的實際天氣，算出平均值，
輸出成 data/climate.js 給 index.html 使用。

用法（在 claude_travel 資料夾執行）：
    python3 tools/build_climate.py

資料來源：Open-Meteo Historical Weather API（ERA5 再分析資料，免費、不需要 API key）
https://open-meteo.com/en/docs/historical-weather-api
"""
import json, os, sys, time, urllib.request, urllib.parse, urllib.error
from statistics import mean

YEARS = range(2016, 2026)          # 2016–2025，共 10 年
MONTHS = (10, 11)
EVENING_HOURS = ('20:00', '21:00')  # 企鵝歸巢時段
TZ = 'Australia/Melbourne'

LOCS = {
    'mel':       {'name': '墨爾本市區',           'll': (-37.8136, 144.9631)},
    'pi':        {'name': '菲利普島（企鵝歸巢）', 'll': (-38.5108, 145.1500), 'evening': True},
    'dandenong': {'name': '丹頓農山（Belgrave）', 'll': (-37.9093, 145.3555)},
    'ballarat':  {'name': '巴拉瑞特',             'll': (-37.5622, 143.8503)},
}

API = 'https://archive-api.open-meteo.com/v1/archive?'
UA = {'User-Agent': 'MelbourneTripPage/1.0 (personal travel page)'}


def get(params):
    url = API + urllib.parse.urlencode(params)
    for n in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            wait = 15 * (n + 1)
            print(f'  429，等 {wait} 秒'); time.sleep(wait)
    raise RuntimeError('重試仍失敗')


def r1(x):
    return round(x, 1)


out = {'source': 'Open-Meteo Historical Weather API（ERA5）', 'years': f'{YEARS[0]}–{YEARS[-1]}', 'locs': {}}

for key, loc in LOCS.items():
    lat, lon = loc['ll']
    by_month = {m: {'tmax': [], 'tmin': [], 'rain': [], 'hot': [], 'eve_t': [], 'eve_app': [], 'eve_wind': []} for m in MONTHS}
    for y in YEARS:
        params = {'latitude': lat, 'longitude': lon, 'timezone': TZ,
                  'start_date': f'{y}-10-01', 'end_date': f'{y}-11-30',
                  'daily': 'temperature_2m_max,temperature_2m_min,precipitation_sum'}
        if loc.get('evening'):
            params['hourly'] = 'temperature_2m,apparent_temperature,wind_speed_10m'
        d = get(params)
        dd = d['daily']
        for t, tmax, tmin, pr in zip(dd['time'], dd['temperature_2m_max'], dd['temperature_2m_min'], dd['precipitation_sum']):
            if tmax is None or tmin is None:
                continue
            m = int(t[5:7]); b = by_month[m]
            b['tmax'].append(tmax); b['tmin'].append(tmin)
            b['rain'].append(1 if (pr or 0) >= 1 else 0)
            b['hot'].append(1 if tmax >= 30 else 0)
        if loc.get('evening'):
            h = d['hourly']
            for t, temp, app, wind in zip(h['time'], h['temperature_2m'], h['apparent_temperature'], h['wind_speed_10m']):
                if t[11:16] in EVENING_HOURS and temp is not None:
                    b = by_month[int(t[5:7])]
                    b['eve_t'].append(temp); b['eve_app'].append(app); b['eve_wind'].append(wind)
        print(f'{key} {y} OK')
        time.sleep(0.5)

    res = {'name': loc['name'], 'll': list(loc['ll'])}
    for m, b in by_month.items():
        r = {'max': r1(mean(b['tmax'])), 'min': r1(mean(b['tmin'])),
             'rainPct': round(100 * mean(b['rain'])), 'hot30Pct': round(100 * mean(b['hot'])), 'days': len(b['tmax'])}
        if b['eve_t']:
            r['evening'] = {'temp': r1(mean(b['eve_t'])), 'apparent': r1(mean(b['eve_app'])), 'wind': r1(mean(b['eve_wind']))}
        res[str(m)] = r
    out['locs'][key] = res

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(root, 'data'), exist_ok=True)
path = os.path.join(root, 'data', 'climate.js')
with open(path, 'w', encoding='utf-8') as f:
    f.write('// 由 tools/build_climate.py 產生，請勿手動修改。各地點歷年 10、11 月平均（°C、%、km/h）\n')
    f.write('window.CLIMO = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
print('寫入', path)
print(json.dumps(out, ensure_ascii=False, indent=1))
