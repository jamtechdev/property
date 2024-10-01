// county.model.ts
import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
  HasOne,
  AllowNull,
} from 'sequelize-typescript';
import { States } from './state.model';
import { Country } from './country.model';
import Moderator from 'models/moderator.model';

@Table
export class County extends Model<County> {
  @ForeignKey(() => States)
  @Column
  stateId: number;

  @BelongsTo(() => States)
  state: States;

  @ForeignKey(() => Country)
  @Column({
    type:DataType.NUMBER,
    allowNull:true
  })
  countryId: number;

  @BelongsTo(() => Country)
  country: Country;

  @Column
  countyName: string;


  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  county_fee: number;
}

export default County;
