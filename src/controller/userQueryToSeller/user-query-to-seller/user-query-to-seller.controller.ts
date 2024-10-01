import { Body, Controller, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CreateUserToSellerDto } from 'src/dto/userQueryToSeller/userQueryToSeller.dto';
import { UserQueryToSellerService } from 'src/services/userQueryToSeller/user-query-to-seller/user-query-to-seller.service';
import { AuthGuard } from '@nestjs/passport';
@Controller('user-query-to-seller')
export class UserQueryToSellerController {
    constructor(private readonly userQueryToSellerService: UserQueryToSellerService) { }
 
    // @UseGuards(AuthGuard('jwt'))
    // async create(@Body() createUserToSellerDto: CreateUserToSellerDto) {
    //     try {
    //         const queryToSeller = await this.userQueryToSellerService.create(createUserToSellerDto);
    //         return queryToSeller;

    //     } catch (error) {
    //         throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    //     }
    // }


    @Post('add_query')
    async create(@Body() createUserToSellerDto: CreateUserToSellerDto) {
      return this.userQueryToSellerService.create(createUserToSellerDto);
    }
}
