import { Table, Column, Model, Unique, CreatedAt, UpdatedAt, AutoIncrement, PrimaryKey, DataType } from 'sequelize-typescript';

@Table
export class Admin extends Model<Admin> {

  @Unique
  @Column
  email: string;

  @Column
  password: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  image: string;
}
export default Admin;


