import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasOne,
  HasMany,
} from 'sequelize-typescript';
import { User } from './user.model';
import { County } from '../models/admin/county.model';
import { States } from '../models/admin/state.model';
import { Country } from '../models/admin/country.model';
import { FavoriteProperty } from './favoriteproperty.model';
import SaveProperty from './saveproperty.model';
import Moderator from './moderator.model';
import moderatorRating from './moderator.rating.model';
import Review from './review.model';
import propertyBiding from './property.biding.model';
import { DateTime } from 'aws-sdk/clients/devicefarm';

@Table({ tableName: 'propertyList' })
export class PropertyList extends Model<PropertyList> {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  propertyName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  propertyTitle: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  propertyDescription: string;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: false,
    // get() {
    //   return JSON.parse(this.getDataValue('images'));
    // },
    // set(value: string[]) {
    //   this.setDataValue('images', JSON.stringify(value));
    // },
  })
  images: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  postedBy: number;

  @BelongsTo(() => User, { foreignKey: 'postedBy', targetKey: 'id' })
  user: User;

  @ForeignKey(() => County)
  @Column({
    type: DataType.STRING,
    references: {
      model: 'County',
      key: 'id',
    },
    allowNull: true,
  })
  countyId: string;

  @BelongsTo(() => County)
  county: County;

  @ForeignKey(() => States)
  @Column({
    type: DataType.INTEGER,
    references: {
      model: 'States',
      key: 'id',
    },
    allowNull: true,
  })
  stateId: string;

  @BelongsTo(() => States)
  state: States;

  @ForeignKey(() => Country)
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  countryId: string;
  @BelongsTo(() => Country)
  country: Country;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  latitude: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  longitude: number;

  @Column({
    type: DataType.ENUM(
      'Publish',
      'Hold',
      'Decline',
      'Contract',
      'Posted',
      'Archived',
      'Do_not_list',
      'Sold',
    ),
    allowNull: false,
    defaultValue: 'Posted',
  })
  status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  select_Category: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  listed_in: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  property_Status: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  price_in: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  yearly_tax_rate: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  after_price_label: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  zip: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  neighbour: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  address: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  city: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  size_in_ft: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  lot_size_in_ft: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  rooms: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  bedrooms: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  bathrooms: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  custom_id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  Garages: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  Garage_size: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  Year_built: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  Available_from: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  Basement: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  Extra_details: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  Roofing: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  extra_material: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  hold_duration: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  hold_current_date: String;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  contract_details: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  decline_reason: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  Structure_type: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  Floors_no: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  Energy_class: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  Energy_index: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  owner_notes: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  other_features: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  slug: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  house_number: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  street_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  street_type: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  end_contract: Date;

  @Column({
    type: DataType.ENUM('End_Trash', 'End_publish', 'Extend'),
    allowNull: true,
  })
  contract_action: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  contract_cancel_reason: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  contract_description: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  featured_property: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  featuredAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  posted_on: Date;

  @HasMany(() => FavoriteProperty)
  likedBy: FavoriteProperty;

  @HasMany(() => SaveProperty)
  savedPropertyBy: SaveProperty;

  @HasMany(() => Review)
  reviews: Review;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
  })
  education: string;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
  })
  medical: string;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
  })
  transportation: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  property_sold: boolean;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
  })
  doNotListReason: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  is_deleted_property: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  renew_date: Date;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
  })
  bid_title: string;
  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
  })
  bid_description: string;
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  property_bid_start: any;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  property_bid_end: any;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  })
  is_under_biding: boolean;
  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  min_bid_amount: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  updatedAt: Date;

  // Define the association with Moderator
  @BelongsTo(() => Moderator, { foreignKey: 'countyId', targetKey: 'county' })
  moderator: Moderator;

  // Define the association with ModeratorRatings
  @HasMany(() => moderatorRating, 'moderatorId')
  ratings: moderatorRating[];
  @HasMany(() => propertyBiding)
  users: propertyBiding[];
}

export default PropertyList;
