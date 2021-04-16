<?php

namespace App\Controller;

use App\Entity\Countries;
use DateTime;
use DateTimeZone;
use Error;
use Exception;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpClient\CurlHttpClient;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Contracts\HttpClient\Exception\ClientExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\DecodingExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\RedirectionExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\ServerExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;

class CountryInfoController extends AbstractController
{
    #[Route('/country/info', name: 'country_info', methods: ['GET', 'POST'])]
    public function index(): JsonResponse
    {
        $data = [];
        $openCageDataApiKey = $_ENV['OPEN_CAGE_DATA_API_KEY'];
        $openWeatherMapApiKey = $_ENV['OPEN_WEATHER_MAP_API_KEY'];
        $openExchangeRatesApiKey = $_ENV['OPEN_EXCHANGE_RATES_API_KEY'];
        try {
            $request = Request::createFromGlobals();
            $coords = $request->request->get('coords');
            //$coords = "54,-2";
            $client = new CurlHttpClient(['verify_peer' => false]);
            $url = "https://api.opencagedata.com/geocode/v1/json?q=$coords&key=$openCageDataApiKey";
            $response = $client->request('GET', $url);
            $content = $response->toArray();
            //dd($content);
            $content = $content["results"][0];
            $data["currency"]["symbol"] = $content["annotations"]["currency"]["symbol"];
            $data["currency"]["name"] = $content["annotations"]["currency"]["name"];
            $data["currency"]["iso_code"] = $content["annotations"]["currency"]["iso_code"];
            $data["info"]["country_flag"] = $content["annotations"]["flag"];
            $data["info"]["country_code"] = $content["components"]["country_code"];
            $data["info"]["country_iso3"] = $content["components"]["ISO_3166-1_alpha-3"];
            $data["info"]["timezone"] = $content["annotations"]["timezone"]["name"];

            #geonames country info
            $geoNamesUrl = "https://secure.geonames.org/countryInfoJSON?formatted=true&lang=en&country={$data["info"]["country_code"]}&username=hubertkoy&style=full";
            $response = $client->request('GET', $geoNamesUrl);
            $content = $response->toArray();
            $content = $content["geonames"][0];
            $data["bounds"]["northeast"] = [$content["north"], $content["east"]];
            $data["bounds"]["southwest"] = [$content["south"], $content["west"]];
            $data["info"]["area"] = $content["areaInSqKm"];
            $data["info"]["population"] = $content["population"];
            $data["info"]["continent"] = $content["continentName"];

            $repository = $this->getDoctrine()->getRepository(Countries::class);
            $country = $repository->findOneBy(['iso_a3' => $data["info"]["country_iso3"]]);
            $data["info"]["country_name"] = $country->getName();
            $data["info"]["capital_name"] = $country->getCapitalName();
            $data["info"]["capital_coords"] = ["lat" => $country->getCapitalCoordsLat(), "lng" => $country->getCapitalCoordsLng()];
            $data["bounds"]["polygon_type"] = $country->getPolygonType();
            $data["bounds"]["polygon_coordinates"] = $country->getPolygonCoordinates();

            $coordsArray = explode(',', $coords);
            $weatherInfoUrl = "https://api.openweathermap.org/data/2.5/onecall?lat=$coordsArray[0]&lon=$coords[1]&units=metric&exclude=minutely,hourly,alerts&lang=en&appid=$openWeatherMapApiKey";
            # Weather Info
            $response = $client->request('GET', $weatherInfoUrl);
            $content = $response->toArray();

            function currentTimeDate($timestamp, $timezone): string
            {
                $dt = new DateTime();
                $dt->setTimezone(new DateTimeZone($timezone));
                $dt->setTimestamp($timestamp);
                return $dt->format("g:ia, D j");
            }

            function dateToString($timestamp): string
            {
                return date("D, j", $timestamp);
            }

            $data["weather"]["current"] = $content["current"];
            $data["weather"]["daily"] = $content["daily"];
            $data["weather"]["current"]["dt"] = currentTimeDate($content["current"]["dt"], $data["info"]["timezone"]);
            $data["weather"]["current"]["weather"][0]["description"] = ucfirst($data["weather"]["current"]["weather"][0]["description"]);

            for ($i = 0; $i < count($content["daily"]); $i++) {
                $data["weather"]["daily"][$i]["dt"] = dateToString($content["daily"][$i]["dt"]);
            }

            #exchange rate
            $exchangeRatesUrl = "https://openexchangerates.org/api/latest.json?app_id=$openExchangeRatesApiKey";
            $response = $client->request('GET', $exchangeRatesUrl);
            $content = $response->toArray();
            $currency_iso_code = $data["currency"]["iso_code"];
            $data["currency"]["exchange_rate"] = $content["rates"][$currency_iso_code];

            #wiki nearby places
            # create wiki coords url with | to match wiki api for coordinates (lat|lon)
            $wikiCoords = str_replace(",", "|", $coords);
            $wikiApiUrl = "https://en.wikipedia.org/w/api.php?action=query&prop=coordinates%7Cpageimages%7Cdescription%7Cinfo&inprop=url&pithumbsize=144&generator=geosearch&ggsradius=10000&ggslimit=31&colimit=31&ggscoord=$wikiCoords&format=json";
            $response = $client->request('GET', $wikiApiUrl);
            $content = $response->toArray();
            $n = 0;
            $j = 0;
            foreach ($content["query"]["pages"] as $poi) {
                if ($n === 0 && $j === 0) {
                    $j++;
                    continue;
                }
                $data["pois"][$n] = $poi;
                $n++;
            }


            #get wiki country description
            $wikiCountryDesc = "https://en.wikipedia.org/api/rest_v1/page/summary/{$data["info"]["country_name"]}?redirect=false";
            $response = $client->request('GET', $wikiCountryDesc);
            $content = $response->toArray();
            $data["info"]["country_desc"] = $content["extract_html"];
            $data["info"]["country_wiki_url"] = $content["content_urls"]["desktop"]["page"];

            $status = 200;
        } catch (ClientExceptionInterface) {
            $data = ['message' => 'Service temporary unavailable'];
            $status = 400;
        } catch (Error | DecodingExceptionInterface | RedirectionExceptionInterface | ServerExceptionInterface | TransportExceptionInterface | Exception $e) {
            $data = ['message' => $e->getMessage()];
            $status = $e->getCode();
        } finally {
            $data = json_encode($data);
        }

        $response = JsonResponse::fromJsonString($data);
        $response->setStatusCode($status);
        return $response;
    }
}
