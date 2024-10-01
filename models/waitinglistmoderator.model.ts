import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model'; // Assuming you have a User model
import { Allow } from 'class-validator';
import County from './admin/county.model';


@Table({
  tableName: 'WaitingListModerators',
})
export class WaitingListModerator extends Model<WaitingListModerator> {
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  state: string;
  @ForeignKey(() => County)
  @Column({
    type: DataType.STRING,
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  userId: number;

  @BelongsTo(() => User)
  user: User;
}

export default WaitingListModerator;
