$(window).on('load', function () {
    if ($('#preloader').length) {
        $('#preloader').delay(100).fadeOut('slow', function () {
            $(this).remove();
        });
    }
});

let map = L.map('map').setView([50, -2], 5);

let geoJsonLayer;
let userLocationMarker;
let markers = new L.FeatureGroup();
let userLoc;
let userCountry;

/*numberWithCommas = (num) => {
    return num.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}*/

L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
}).addTo(map);

$.ajax({
    url: "/countries/list",
    type: "POST",
    dataType: "json",
    success: data => {
        $('#countriesList').append(`<option value="" selected disabled hidden>Select a country</option>`);
        for (let i = 0; i < data.length; i++) {
            $('#countriesList').append(`<option value="${data[i]["coords"]}">${data[i]["name"]}</option>`);
        }
    }
});

function getCountryInfo(coords) {
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }

    if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
    }

    // remove pois markers from map before adding new ones
    markers.eachLayer(layer => {
        map.removeLayer(layer)
    });

    $.ajax({
        url: "./country/info",
        type: 'POST',
        dataType: "json",
        data: {
            coords: coords
        },
        success: data => {
            let borderLines = [{
                "type": data["bounds"]["polygon_type"],
                "coordinates": JSON.parse(data["bounds"]["polygon_coordinates"])
            }];

            const polyLinesStyle = {
                "color": "green",
                "weight": 2,
                "opacity": 0.55
            }

            geoJsonLayer = L.geoJSON(borderLines, {style: polyLinesStyle});
            geoJsonLayer.addTo(map);
            if (userLoc) {
                $(`#countriesList option:contains(${data["info"]["country_name"]})`).attr('selected', 'selected');
            }

            const corner1 = L.latLng(data["bounds"]["northeast"]);
            const corner2 = L.latLng(data["bounds"]["southwest"]);
            const bounds = L.latLngBounds(corner1, corner2);
            map.fitBounds(bounds);

            // update country info
            $("#infoContinent").html(data["info"]["continent"]);
            $('#infoCountry').html(data["info"]["country_name"]);
            $('#infoCapital').html(data["info"]["capital_name"]);
            $('#infoFlag').html(data["info"]["country_flag"]);
            $('#infoCurrency').html(`${data["currency"]["name"]} (${data["currency"]["iso_code"]})`);
            $('#infoExRate').html(`${data["currency"]["exchange_rate"]} ${data["currency"]["iso_code"]} / 1 USD`);
            $('#infoArea').html(data["info"]["area"]);
            $('#infoPopulation').html(data["info"]["population"]);
            $('#wikiDescription').html(data["info"]["country_desc"]).append(`<a href="${data["info"]["country_wiki_url"]}" class="stretched-link">[Open in Wikipedia]</a>`);

            /// weather info update
            $('#currentTime').html(data["weather"]["current"]["dt"]);
            $('#currentLocation').html(`${data["info"]["capital_name"]}, ${(data["info"]["country_code"]).toUpperCase()}`);
            $('#currentTemp').html(data["weather"]["current"]["temp"]);
            $('#currentFeelsLike').html(data["weather"]["current"]["feels_like"]);
            $('#currentMain').html(data["weather"]["current"]["weather"][0]["main"]);
            $('#currentDescription').html(data["weather"]["current"]["weather"][0]["description"]);
            $('#currentWind').html(`${data["weather"]["current"]["wind_speed"]}m/s`);
            $('#currentPressure').html(`${data["weather"]["current"]["pressure"]} hPa`);
            $('#currentHumidity').html(`Humidity: ${data["weather"]["current"]["humidity"]}%`);
            $('#currentUvi').html(`UV: ${data["weather"]["current"]["uvi"]}`);
            $('#currentDP').html(`Dew point: ${data["weather"]["current"]["dew_point"]}°C`);
            $('#currentVisibility').html(`Visibility: ${data["weather"]["current"]["visibility"] / 1000} km`);
            $('#weatherForecast').html("");
            for (let i = 0; i < data["weather"]["daily"].length; i++) {
                $('#weatherForecast').append(`
                <li class="list-group-item">
                    <div class="row">
                        <div class="col-4 text-end"><img class="weatherIcon" src="https://openweathermap.org/img/wn/${data["weather"]["daily"][i]["weather"][0]["icon"]}@2x.png" alt=""> ${data["weather"]["daily"][i]["dt"]}</div>
                        <div class="col-4 text-end">${data["weather"]["daily"][i]["temp"]["min"]} / ${data["weather"]["daily"][i]["temp"]["max"]} °C</div>
                        <div class="col-4 text-start">${data["weather"]["daily"][i]["weather"][0]["description"]}</div>
                    </div>
                </li>`);
            }

            // add news
            $('#newsContent').html("");
            for (let i = 0; i < data["news"].length; i++) {
                let active = i === 0 ? " active" : "";
                $('#newsContent').append(`
                        <div class="carousel-item${active}">
                            <img src="${data["news"][i]["urlToImage"]}" class="d-block w-100" alt="...">
                            <div class="mt-2 text-center">
                                <h5>${data["news"][i]["title"]}</h5>
                                <p>${data["news"][i]["description"]}</p>
                                <a href="${data["news"][i]["url"]}" target="_blank"><i class="fa fa-link"></i> Link</a>
                            </div>
                        </div>`);
            }

            // covid statistics
            $('#covidCases').html(data["covid"]["cases"]);
            $('#covidTodayCases').html(data["covid"]["todayCases"]);
            $('#covidDeaths').html(data["covid"]["deaths"]);
            $('#covidTodayDeaths').html(data["covid"]["todayDeaths"]);
            $('#covidRecovered').html(data["covid"]["recovered"]);
            $('#covidTodayRecovered').html(data["covid"]["todayRecovered"]);
            $('#covidActive').html(data["covid"]["active"]);
            $('#covidCritical').html(data["covid"]["critical"]);
            $('#covidTests').html(data["covid"]["tests"]);

            let cityMarkerIcon = L.ExtraMarkers.icon({
                prefix: 'fa',
                icon: 'fa-city',
                markerColor: 'blue'
            });

            let capitalMarkerIcon = L.ExtraMarkers.icon({
                prefix: 'fa',
                icon: 'fa-star',
                markerColor: 'yellow'
            });

            const capitalMarker = L.marker([data["cities"][0]["lat"], data["cities"][0]["lng"]], {icon: capitalMarkerIcon}).bindPopup(`<b>Capital City</b><br>${data["cities"][0]["name"]}<br><a href="https://${data["cities"][0]["wikipedia"]}">${data["cities"][0]["wikipedia"]}</a>`);
            markers.addLayer(capitalMarker);
            capitalMarker.openPopup();

            //add cities markers
            for (let i = 1; i < data["cities"].length; i++) {
                let cityLat = data["cities"][i]["lat"];
                let cityLng = data["cities"][i]["lng"];
                let cityName = data["cities"][i]["name"];
                let cityWikiLink = data["cities"][i]["wikipedia"];
                let cityMarker = L.marker([cityLat, cityLng], {icon: cityMarkerIcon}).bindPopup(`${cityName}<br><a href="https://${cityWikiLink}">${cityWikiLink}</a>`);
                markers.addLayer(cityMarker);
            }
            markers.addTo(map);
        }
    }).done(() => {
        userLoc = false;
    })
}

// listener for country select menu
$('#countriesList').on('change', () => {
    let coords = $('#countriesList').val();
    getCountryInfo(coords);
});

// geolocation listener
let userLocation;

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(setCoords);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function setCoords(position) {
    userLoc = true;
    userLocation = [position.coords.latitude, position.coords.longitude];
    getCountryInfo(position.coords.latitude + ',' + position.coords.longitude);
}

L.easyButton('fa fa-crosshairs', () => {
    getCountryInfo(userLocation[0] + ',' + userLocation[1]);
}).addTo(map);

getLocation(setCoords);