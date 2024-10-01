// state.model.ts
import { Table, Column, Model, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Country } from './country.model';

@Table({
  tableName: 'States',  // Explicitly specify the table name with a capital letter
  // Disable pluralization, so the table name is used as specified
})
export class States extends Model<States> {
  @Column
  county: string;

  @Column
  county_ascii: string;

  @Column
  county_full: string;

  @Column
  county_fips: string;

  @Column
  stateSortName: string;

  @Column
  stateName: string;

  @Column
  lat: number;

  @Column
  lng:number;

  @Column
  population: string;
  @Column
  zips: string;

  @ForeignKey(() => Country)
  @Column
  countryId: number;

  @BelongsTo(() => Country)
  country: Country;

}

export default States