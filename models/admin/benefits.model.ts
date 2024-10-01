import {
  Table,
  Column,
  Model,
  Unique,
  CreatedAt,
  UpdatedAt,
  AutoIncrement,
  PrimaryKey,
} from 'sequelize-typescript';

@Table
export class Benefit extends Model<Benefit> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  benefits: string;

  @Column
  requirements: string;

  @Column
  amounts: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Benefit;
