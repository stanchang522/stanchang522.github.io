// 由 tools/build_climate.py 產生，請勿手動修改。各地點歷年 10、11 月平均（°C、%、km/h）
window.CLIMO = {
 "source": "Open-Meteo Historical Weather API（ERA5）",
 "years": "2016–2025",
 "locs": {
  "mel": {
   "name": "墨爾本市區",
   "ll": [
    -37.8136,
    144.9631
   ],
   "10": {
    "max": 19.3,
    "min": 9.1,
    "rainPct": 40,
    "hot30Pct": 1,
    "days": 310
   },
   "11": {
    "max": 21.5,
    "min": 11.3,
    "rainPct": 40,
    "hot30Pct": 10,
    "days": 300
   }
  },
  "pi": {
   "name": "菲利普島（企鵝歸巢）",
   "ll": [
    -38.5108,
    145.15
   ],
   "10": {
    "max": 17.1,
    "min": 11.1,
    "rainPct": 46,
    "hot30Pct": 1,
    "days": 310,
    "evening": {
     "temp": 13.9,
     "apparent": 10.7,
     "wind": 20.4
    }
   },
   "11": {
    "max": 18.8,
    "min": 12.7,
    "rainPct": 41,
    "hot30Pct": 3,
    "days": 300,
    "evening": {
     "temp": 15.6,
     "apparent": 13.1,
     "wind": 19.6
    }
   }
  },
  "dandenong": {
   "name": "丹頓農山（Belgrave）",
   "ll": [
    -37.9093,
    145.3555
   ],
   "10": {
    "max": 17.9,
    "min": 8.3,
    "rainPct": 48,
    "hot30Pct": 0,
    "days": 310
   },
   "11": {
    "max": 20.2,
    "min": 10.1,
    "rainPct": 49,
    "hot30Pct": 5,
    "days": 300
   }
  },
  "ballarat": {
   "name": "巴拉瑞特",
   "ll": [
    -37.5622,
    143.8503
   ],
   "10": {
    "max": 16.2,
    "min": 6.6,
    "rainPct": 43,
    "hot30Pct": 0,
    "days": 310
   },
   "11": {
    "max": 19.0,
    "min": 8.5,
    "rainPct": 41,
    "hot30Pct": 2,
    "days": 300
   }
  }
 }
};
