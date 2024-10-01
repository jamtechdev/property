import { Table, Column, Model, Unique, CreatedAt, UpdatedAt, AutoIncrement, PrimaryKey } from 'sequelize-typescript';


@Table
export class Country extends Model<Country> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column
  sortname: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Country