import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Message from 'models/messages.model';
import User from 'models/user.model';
import { Op } from 'sequelize';
import { CreateMessageDto } from 'src/dto/messages/messages.dto';

@Injectable()
export class MessagesService {
    constructor(
        @InjectModel(Message)
        private messageModel: typeof Message
      ) {}
      async create(createMessageDto: CreateMessageDto): Promise<Message> {
        return this.messageModel.create(createMessageDto);
      }

      async findUserAllChats(userId: number): Promise<Message[]> {
        try {
          const conversations = await this.messageModel.findAll({
            where: {
              [Op.or]: [
                { senderId: userId },
                { receiverId: userId },
              ],
            },
            attributes: ['id', 'senderId', 'receiverId', 'message', 'messageType', 'createdAt', 'updatedAt'],
            include: [
              { model: User, as: 'sender', attributes: ['id', 'firstname' , 'image'] },
              { model: User, as: 'receiver', attributes: ['id', 'firstname' , 'image'] }
            ],
            order: [['updatedAt', 'DESC']],
          });
    
          if (!conversations.length) {
            throw new NotFoundException('No conversations found for the given user.');
          }
    
          // Filter to get only the latest conversation for each distinct pair
          const uniqueConversations = conversations.reduce((acc: Message[], current: Message) => {
            const existing = acc.find(item => 
              (item.senderId === current.senderId && item.receiverId === current.receiverId) ||
              (item.senderId === current.receiverId && item.receiverId === current.senderId)
            );
            if (!existing) {
              acc.push(current);
            }
            return acc;
          }, []);
    
          return uniqueConversations;
        } catch (error) {
          throw new InternalServerErrorException('Failed to retrieve conversations.');
        }
      }


      async findMessagesBetweenUsers(senderId: number, receiverId: number): Promise<Message[]> {
        try {
          const messages = await this.messageModel.findAll({
            where: {
              [Op.or]: [
                { senderId: senderId, receiverId: receiverId },
                { senderId: receiverId, receiverId: senderId },
              ],
            },
            attributes: ['id', 'senderId', 'receiverId', 'message', 'messageType', 'createdAt', 'updatedAt'],
            include: [
                { model: User, as: 'sender', attributes: ['id', 'firstname' , 'image'] },
                { model: User, as: 'receiver', attributes: ['id', 'firstname' , 'image'] }
              ],
            order: [['createdAt', 'ASC']],
          });
    
          if (!messages.length) {
            throw new NotFoundException('No messages found between the given users.');
          }
    
          return messages;
        } catch (error) {
          throw new InternalServerErrorException('Failed to retrieve messages.');
        }
      }


}
