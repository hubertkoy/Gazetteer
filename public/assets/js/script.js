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
let userLocMarker;
let capitalMarker;

numberWithCommas = (num) => {
    return num.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}

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
            const corner1 = L.latLng(data["bounds"]["northeast"]);
            const corner2 = L.latLng(data["bounds"]["southwest"]);
            const bounds = L.latLngBounds(corner1, corner2);
            map.flyToBounds(bounds);


            // update country info
            $("#infoContinent").html(data["info"]["continent"]);
            $('#infoCountry').html(data["info"]["country_name"]);
            $('#infoCapital').html(data["info"]["capital_name"]);
            $('#infoFlag').html(data["info"]["country_flag"]);
            $('#infoCurrency').html(`${data["currency"]["name"]} (${data["currency"]["iso_code"]})`);
            $('#infoExRate').html(`${data["currency"]["exchange_rate"]} ${data["currency"]["iso_code"]} / 1 USD`);
            $('#infoArea').html(numberWithCommas(data["info"]["area"]));
            $('#infoPopulation').html(numberWithCommas(data["info"]["population"]));
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
                    <img class="weatherIcon" src="https://openweathermap.org/img/wn/${data["weather"]["daily"][i]["weather"][0]["icon"]}@2x.png" alt="">
                    ${data["weather"]["daily"][i]["dt"]} ${data["weather"]["daily"][i]["temp"]["map"]} / ${data["weather"]["daily"][i]["temp"]["min"]} °C ${data["weather"]["daily"][i]["weather"][0]["description"]}
                </li>`);
            }

            // add poi makers to the map
            $('#POIsContent').html("");
            for (let i = 0; i < data["pois"].length; i++) {
                let poiLat = data["pois"][i]["coordinates"][0]["lat"];
                let poiLng = data["pois"][i]["coordinates"][0]["lon"];

                $('#POIsContent').append(`
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <span class="fw-bold">#${i + 1}</span>
                        <div class="ms-2 me-auto">
                        <div class="fw-bold">${data["pois"][i]["title"]}</div>
                            <div>${"description" in data["pois"][i] ? data["pois"][i]["description"] : ""}</div>
                            <div><a href="${data["pois"][i]["fullurl"]}" class="link-dark" target="_blank">Go to wiki</a>  <button class="btn float-end" onclick="map.flyTo(L.latLng(${poiLat},${poiLng}), 17)">Show on map</button> </div>
                        </div>
                    </li>               
                `);

                let markerIcon = L.ExtraMarkers.icon({
                    icon: 'fa-number',
                    markerColor: 'blue',
                    shape: 'square',
                    number: i + 1
                })
                let poiMarker = L.marker([poiLat, poiLng], {icon: markerIcon}).bindTooltip(data["pois"][i]["title"]);
                markers.addLayer(poiMarker);
            }
            if (!userLoc) {
                let markerIcon = L.ExtraMarkers.icon({
                    prefix: 'fa',
                    icon: 'fa-map-marker-alt',
                    markerColor: 'yellow'
                })
                capitalMarker = L.marker(coords.split(','), {icon: markerIcon});
                capitalMarker.addTo(map);
                capitalMarker.bindPopup(`Here is capital ${data["info"]["capital_name"]}`).openPopup();
                markers.addLayer(capitalMarker);
            }
            markers.addTo(map);
        }
    }).done(() => userLoc = false)
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
    // place marker in user geolocation
    userLocationMarker = L.circle(userLocation, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.3,
        radius: 100
    });
    userLocationMarker.addTo(map);

    let markerIcon = L.ExtraMarkers.icon({
        prefix: 'fa',
        icon: 'fa-map-marker-alt',
        markerColor: 'red'
    })
    userLocMarker = L.marker([userLocation[0], userLocation[1]], {icon: markerIcon});
    userLocMarker.addTo(map);
    userLocMarker.bindPopup("You are here").openPopup();
}

L.easyButton('fa fa-crosshairs', () => {
    map.flyTo(userLocation, 14)
}).addTo(map);

getLocation(setCoords);