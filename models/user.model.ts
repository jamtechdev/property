import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  HasOne,
  HasMany,
} from 'sequelize-typescript';
import { Role } from './role.model';
import { Moderator } from './moderator.model';
import { PropertyList } from './propertylist.model';
import moderatorRating from './moderator.rating.model';
import BannerOptions from './banner.options.model';
import propertyBiding from './property.biding.model';

@Table({ tableName: 'Users' })
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  username: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  mobile: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  firstname: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  lastname: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  Position: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  Language: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  company_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  tax_no: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  address: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  about_me: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  social_media: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  latitude: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
  })
  longitude: number;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  roleId: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  city: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  state: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  country: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  password: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_moderator: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  is_active: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  image: string;

  @HasOne(() => Moderator)
  moderators: Moderator;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: DataType.NOW,
  })
  lastLoginTime: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  slug: string;

  @HasMany(() => PropertyList)
  Properties: PropertyList[];

  @HasOne(() => BannerOptions)
  option: BannerOptions;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: DataType.NOW,
  })
  updatedAt: Date;
  @HasMany(() => propertyBiding)
  users: propertyBiding[];
}
export default User;
