import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  HasOne,
} from 'sequelize-typescript';
import { User } from './user.model'; // Assuming you have a User model
import { Allow } from 'class-validator';
import PropertyList from './propertylist.model';
import moderatorRating from './moderator.rating.model';
import CountyPayment from './county.payment.model';
import County from './admin/county.model';


@Table({
  tableName: 'moderators',
})
export class Moderator extends Model<Moderator> {
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  state: string;
  @ForeignKey(() => County)
  @Column({
    type: DataType.STRING,
    references: {
      model: 'County',
      key: 'id',
    },
    allowNull: true,
  })
  county: string;

  @BelongsTo(() => County)
  countyDetails: County;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  fee_to_pay: number;

  @Column({
    type: DataType.ENUM('pending', 'approved'),
    allowNull: true,
    defaultValue: 'pending',
  })
  status: 'pending' | 'approved';

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  noOfSoldProp: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  noOfHoldProp: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  noOfDeclinedProp: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: '',
  })
  email: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_deleted: boolean;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  userId: number;

  @BelongsTo(() => User)
  user: User;
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_active_status: boolean;

  @HasMany(() => PropertyList, 'countyId')
  properties: PropertyList[];

  // Define the association with ModeratorRatings
  @HasMany(() => moderatorRating, 'moderatorId')
  ratings: moderatorRating[];
  // One-to-one association with CountyPayment
  @HasOne(() => CountyPayment)
  countyPayment: CountyPayment;
}

export default Moderator;
