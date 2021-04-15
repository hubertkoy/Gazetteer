<?php

namespace App\Entity;

use App\Repository\CountriesRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass=CountriesRepository::class)
 */
class Countries
{
    /**
     * @ORM\Id
     * @ORM\GeneratedValue
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=255, unique=true)
     */
    private $name;

    /**
     * @ORM\Column(type="string", length=3, unique=true)
     */
    private $iso_a3;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $capital_name;

    /**
     * @ORM\Column(type="float")
     */
    private $capital_coords_lat;

    /**
     * @ORM\Column(type="float")
     */
    private $capital_coords_lng;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $polygon_type;

    /**
     * @ORM\Column(type="text")
     */
    private $polygon_coordinates;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getIsoA3(): ?string
    {
        return $this->iso_a3;
    }

    public function setIsoA3(string $iso_a3): self
    {
        $this->iso_a3 = $iso_a3;

        return $this;
    }

    public function getCapitalName(): ?string
    {
        return $this->capital_name;
    }

    public function setCapitalName(string $capital_name): self
    {
        $this->capital_name = $capital_name;

        return $this;
    }

    public function getCapitalCoordsLat(): ?float
    {
        return $this->capital_coords_lat;
    }

    public function setCapitalCoordsLat(float $capital_coords_lat): self
    {
        $this->capital_coords_lat = $capital_coords_lat;

        return $this;
    }

    public function getCapitalCoordsLng(): ?float
    {
        return $this->capital_coords_lng;
    }

    public function setCapitalCoordsLng(float $capital_coords_lng): self
    {
        $this->capital_coords_lng = $capital_coords_lng;

        return $this;
    }

    public function getPolygonType(): ?string
    {
        return $this->polygon_type;
    }

    public function setPolygonType(string $polygon_type): self
    {
        $this->polygon_type = $polygon_type;

        return $this;
    }

    public function getPolygonCoordinates(): ?string
    {
        return $this->polygon_coordinates;
    }

    public function setPolygonCoordinates(string $polygon_coordinates): self
    {
        $this->polygon_coordinates = $polygon_coordinates;

        return $this;
    }
}
