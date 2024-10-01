/* eslint-disable prettier/prettier */
// create-property-list.dto.ts
import { DateTime } from 'aws-sdk/clients/devicefarm';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsEmpty,
  IsOptional,
} from 'class-validator';

enum PropertyStatus {
  Posted = 'Posted',
  Publish = 'Publish',
  Hold = 'Hold',
  Decline = 'Decline',
  Contract = 'Contract',
  Archived = 'Archived',
  Do_not_list = 'Do_not_list',
  Sold = 'Sold',
}

export class CreatePropertyListDto {
  // dto added
  propertyName: string;

  propertyTitle: string;

  propertyDescription: string;

  images: string;

  postedBy: number;

  countyId: string;

  stateId: string;

  countryId: string;
  latitude: number;
  longitude: number;
  @IsEnum(PropertyStatus)
  status: string;

  select_Category: string;

  listed_in: string;

  property_Status: string;

  price_in: number;

  yearly_tax_rate: string;

  after_price_label: string;

  zip: number;

  neighbour: string;

  address: string;

  city: string;

  size_in_ft: number;

  lot_size_in_ft: number;

  rooms: any;

  bedrooms: number;

  bathrooms: number;

  custom_id: string;

  Garages: number;

  Garage_size: number;

  Year_built: number;
  Available_from: Date;
  Basement: boolean;

  Extra_details: string;

  Roofing: string;

  extra_material: string;

  Structure_type: string;

  Floors_no: number;

  Energy_class: string;

  Energy_index: number;

  owner_notes: string;

  other_features: string;

  slug: string;

  hold_duration: string;

  hold_current_date: string;

  contract_details: string;

  decline_reason: string;
  house_number: string;

  street_name: string;

  street_type: string;
  end_contract: Date;
  contract_action: string;
  contract_cancel_reason: string;
  contract_description: string;
  education: string;
  medical: string;
  transportation: string;
  property_sold: boolean;
  doNotListReason: string;
  is_deleted_property: boolean;
  renew_date: Date;
  bid_title: string;
  bid_description: string;
  property_bid_start: any;
  property_bid_end: any;
  is_under_biding: boolean;
  min_bid_amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateLeadDto {
  propertyTitle: string;
  Description: string;
  image: string;
  userId: number;
  email: string;
  mobile: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  Garages?: number;
  Garage_size?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StartBidingDto {
  property_bid_start: any;
  property_bid_end: any;
  is_under_biding: boolean;
  min_bid_amount: number;
  bid_title: string;
  bid_description: string;
}
