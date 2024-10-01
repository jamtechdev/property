import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';
import { PropertyList } from './propertylist.model';

@Table({ tableName: 'saveproperty' })
export class SaveProperty extends Model<SaveProperty> {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => PropertyList)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    references: {
      model: 'propertyList',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  propertyId: number;

  @BelongsTo(() => PropertyList)
  property: PropertyList;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  updatedAt: Date;
}

export default SaveProperty;
