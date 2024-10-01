import {
  Table,
  Column,
  Model,
  Unique,
  CreatedAt,
  UpdatedAt,
  AutoIncrement,
  PrimaryKey,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Country } from '../admin/country.model';
import State from './state.model';

@Table
export class City extends Model<City> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;
  @ForeignKey(() => Country)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  countryId: number;
  @BelongsTo(() => Country)
  country: Country;

  @ForeignKey(() => State)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  stateId: number;
  @BelongsTo(() => State)
  state: State;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  city: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default City;
