import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import Moderator from './moderator.model';
import User from './user.model';
@Table({ tableName: 'TicketSystems' })
export class TicketSystem extends Model<TicketSystem> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;
  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
  })
  description: string;
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  images: string;

  @Column({
    type: DataType.ENUM('pending', 'approved', 'cancel'),
    allowNull: true,
    defaultValue: 'pending',
  })
  status: 'pending' | 'approved' | 'cancel';

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  admin_feedback: string;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: false,
  })
  property_url: string;

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

  @ForeignKey(() => Moderator)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  moderatorId: number;

  @BelongsTo(() => Moderator)
  moderator: Moderator;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  userId: number;
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: true,
  })
  is_paid: boolean;

  @BelongsTo(() => User)
  user: User;
}
export default TicketSystem;
