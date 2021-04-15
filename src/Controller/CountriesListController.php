<?php

namespace App\Controller;

use App\Entity\Countries;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Throwable;

class CountriesListController extends AbstractController
{
    #[Route('/countries/list', name: 'countries_list', methods: ['GET','POST'])]
    public function index(): JsonResponse
    {
        $data = [];
        try {
            $repository = $this->getDoctrine()->getRepository(Countries::class);
            $countries = $repository->findBy([],['name'=>'ASC']);
            foreach ($countries as $country) {
                $name = $country->getName();
                $coords = $country->getCapitalCoordsLat().','.$country->getCapitalCoordsLng();
                $data[] = ["name" => $name, "coords" => $coords];
            }
            $status = 200;
        } catch (Throwable $e) {
            $data = ['message' => $e->getMessage()];
            $status = 500;
        } finally {
            $data = json_encode($data);
        }
        $response = JsonResponse::fromJsonString($data);
        $response->setStatusCode($status);
        return $response;
    }
}
