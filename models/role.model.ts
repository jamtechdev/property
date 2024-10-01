import { Table, Column, Model, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table
export class Role extends Model<Role> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  role_name: string;
}

export default Role;
