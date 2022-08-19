(function () {
  "use strict";

  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q');

  if(query) {
    document.querySelector('.search .q').value = query;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}, usa`)
      .then(res => res.json())
      .then(places => places[0])
      .then(place => fetchWeather({coords: {latitude: place.lat, longitude: place.lon}}))
      .catch(generalError);
  } else {
    navigator.geolocation.getCurrentPosition(fetchWeather, generalError);
  }

  function chartWeather(data) {
    Chart.defaults.datasets.line.pointRadius = 0;
    Chart.defaults.datasets.line.tension = 0.1;
    
    const chart = new Chart(
      document.getElementById('weatherChart'),
      {
        type: 'line',
        data: {
          labels: data.time,
          datasets: [
            {
              label: 'Temperature',
              data: data.temperature,
              backgroundColor: 'rgb(192, 0, 0)',
              borderColor: 'rgba(192, 0, 0, 0.8)',
              yAxisID: 'temp'
            },
            {
              label: 'Chance of Precip',
              data: data.pop,
              backgroundColor: 'rgba(0, 0, 192, 0.4)',
              borderColor: 'rgba(0, 0, 192, 0.6)',
              fill: 'start'
            },
            {
              label: 'Humidity',
              data: data.relativeHumidity,
              backgroundColor: 'rgba(0, 0, 192, 0.2)',
              borderColor: 'rgba(0, 0, 192, 0.3)'
            },
            {
              label: 'Cloud Cover',
              data: data.cloudAmount,
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderColor: 'rgba(0, 0, 0, 0.05)',
              fill: 'start'
            },
            {
              label: 'Wind Speed',
              data: data.windSpeed,
              backgroundColor: 'rgba(255, 128, 128, 0.3)',
              borderColor: 'rgba(255, 128, 128, 0.3)',
              yAxisID: 'wind'
            },
            {
              label: 'Wind Gusts',
              data: data.windGust,
              backgroundColor: 'rgba(255, 128, 128, 0.2)',
              borderColor: 'rgba(255, 128, 128, 0.1)',
              fill: 'stack',
              yAxisID: 'wind'
            }
          ]
        },
        options: {
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              labels: {
                pointStyle: 'rect',
                usePointStyle: true
              }
            },
            title: {
              display: true,
              text: data.location['city-state'] || data.location['areaDescription']
            },
            tooltip: {
              callbacks: {
                afterTitle: x => data.weather[x[0].dataIndex]
              }
            }
          },
          scales: {
            x: {
              type: 'time',
              ticks: {
                align: 'start'
              },
              grid: {
                color: 'rgba(0,0,0,0.3)',
                lineWidth: 3
              },
              time: {
                minUnit: 'day',
                displayFormats: {
                  hour: 'ccc h a',
                  day: 'cccc'
                }
              }
            },
            y: {
              min: 0,
              max: 100,
              ticks: {
                callback: v => v + '%'
              }
            },
            temp: {
              position: 'right',
              ticks: {
                callback: v => v + '°',
                color: 'rgb(192, 0, 0)'
              },
              grace: 0.5,
              grid: {
                display: false
              }
            },
            wind: {
              position: 'right',
              grid: {
                display: false
              },
              ticks: {
                color: 'rgba(255, 128, 128, 0.6)'
              },
              min: 0,
              suggestedMax: 30
            }
          }
        }
      }
    )
  }

  function fetchWeather(position) {
    fetch(`https://forecast.weather.gov/MapClick.php?lat=${position.coords.latitude}&lon=${position.coords.longitude}&FcstType=digitalJSON`)
      .then(res => res.json())
      .then(formatWeather)
      .then(chartWeather)
      .catch(generalError);
  }

  function formatWeather(data) {
    let formattedData = {
      cloudAmount: [],
      pop: [],
      relativeHumidity: [],
      temperature: [],
      unixtime: [],
      weather: [],
      windGust: [],
      windSpeed: []
    }

    Object.values(data['PeriodNameList']).forEach(period => {
      Object.keys(formattedData).forEach(key => {
        if(data[period])
          formattedData[key].push(...data[period][key]);
      });
    });

    formattedData.location = data.location;
    formattedData.time = formattedData.unixtime.map(t => parseInt(t) * 1000);

    return formattedData;
  }

  function generalError(e) {
    console.error(e);
  }
})();