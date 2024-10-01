// state.dto.ts
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateStateDto {
  county: string

  county_ascii: string;

  county_full: string;

  county_fips: string;
  stateSortName: string;
  stateName: string;
  population: string;
  lng:number;
  zips: string;
  countryId: number;
  lat: number;
}

export class CreateCountyDto {
  stateId: number;

  countryId: number;

  countyName: string;

  county_fee: number;

}

export class CreateBenefitDto {
  benefits: string;

  requirements: string;

  amounts: string;
}

export class CreateCityDto {
  countryId: number;

  stateId: number;

  city: string;
}

export class UpdateAdminDto {
  email: string;
  password: string;
  image: string;
}