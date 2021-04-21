# Gazetteer
### Technologies:
- HTML
- CSS
- Bootstrap
- JS
- JQ / Ajax
- leaflet
- php framework Symfony
- sqlite

### Apis:
- Wikipedia,
- Geonames,
- OpenCage,
- OpenWeather,
- OpenExchangeRates,
- newsapi.org,
- disease.sh

### Information to provide:
- Country info
- Wiki info
- Weather of capital selected country
- Currency exchange rate
- POIs (cities)
- Current news
- Covid-19 statistics

### Map integration:
- select country and display borders
- marker on map to the country capital
- markers of cities as POIs points on map
- modals with info+wiki info/weather/covid-statistics/news/exchange rate

### Controversies:
- SQLite:
  file coutries.geo.json its taking 23MB. Process of decoding of that file require < 2x23MB per request of RAM (as a return on json_decode() php has 23MB in input string and 23MB data in returned array + metadata of this array). In standard www server allocate 8MB of RAM per request. Usage sqlite decrease usage of server memory and increase performance by using indexes (O(log2(N)) instead of O(N)).