<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\Exception\AbortMigration;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20210411134700 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE countries (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name VARCHAR(255) NOT NULL, iso_a3 VARCHAR(3) NOT NULL, capital_name VARCHAR(255) NOT NULL, capital_coords_lat DOUBLE PRECISION NOT NULL, capital_coords_lng DOUBLE PRECISION NOT NULL, polygon_type VARCHAR(255) NOT NULL, polygon_coordinates CLOB NOT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_5D66EBAD5E237E06 ON countries (name)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_5D66EBADE7D8D006 ON countries (iso_a3)');
        $countriesGeoData = file_get_contents('migrations/countries_data/countries.geo.json');
        $capitalsGeoData = file_get_contents('migrations/countries_data/capitals.json');

        if ($capitalsGeoData === false || $countriesGeoData === false) {
            throw new AbortMigration();
        }

        $countriesGeoData = json_decode($countriesGeoData, true);
        $capitalsGeoData = json_decode($capitalsGeoData, true);

        foreach ($countriesGeoData["features"] as $element) {
            $name = $element["properties"]["NAME"];
            $iso_a3 = $element["properties"]["ISO_A3"];
            $polygon_type = $element["geometry"]["type"];
            $polygon_coordinates = $element["geometry"]["coordinates"];
            $polygon_coordinates = json_encode($polygon_coordinates);
            $found = false;
            foreach ($capitalsGeoData as $capital) {
                if ($iso_a3 == $capital["iso3"]) {
                    $capital_name = $capital["city"];
                    $capital_coords_lat = $capital["lat"];
                    $capital_coords_lng = $capital["lng"];
                    $found = true;
                    break;
                }
            }
            if (!$found)
                continue;

            $this->addSql("INSERT INTO countries (name, iso_a3, capital_name, capital_coords_lat, capital_coords_lng, polygon_type, polygon_coordinates) VALUES ('$name', '$iso_a3', '$capital_name', '$capital_coords_lat', '$capital_coords_lng', '$polygon_type', '$polygon_coordinates')");
        }
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE countries');
    }
}
