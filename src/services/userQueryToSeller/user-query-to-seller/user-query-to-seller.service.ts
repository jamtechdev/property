import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import userQuerytoseller from 'models/userquerytoseller.model';

import { CreateUserToSellerDto } from 'src/dto/userQueryToSeller/userQueryToSeller.dto';

@Injectable()
export class UserQueryToSellerService {
    constructor (
        @InjectModel(userQuerytoseller)
        private readonly userQueryToSellerModel: typeof userQuerytoseller,
    ){}


    async create(createUserToSellerDto: CreateUserToSellerDto): Promise<userQuerytoseller> {
        return this.userQueryToSellerModel.create(createUserToSellerDto);
      }



}
