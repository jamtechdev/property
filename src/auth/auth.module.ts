import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthController } from '../controller/auth/auth.controller';
import { UserService } from '../services/user/user.service';
import { User } from '../../models/user.model';
import { Role } from '../../models/role.model';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy'; // Import JwtStrategy
import Admin from 'models/admin/admin.model';
import { AdminService } from 'src/services/admin/admin.service';
import { AdminController } from 'src/controller/admin.controller';
import PropertyList from 'models/propertylist.model';
import Country from 'models/admin/country.model';
import ViewPropertyUser from 'models/viewpropertyusers.model';
import BusinessCard from 'models/business.card.model';
import CountyPayment from 'models/county.payment.model';
import County from 'models/admin/county.model';
import States from 'models/admin/state.model';
import Benefit from 'models/admin/benefits.model';
import City from 'models/admin/city.model';
import moderatorRating from 'models/moderator.rating.model';
import Moderator from 'models/moderator.model';
import { TwilioService } from 'src/twilio/twilio.service';
import { TwilioModule } from 'nestjs-twilio';
import propertyBiding from 'models/property.biding.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      Role,
      Admin,
      PropertyList,
      BusinessCard,
      ViewPropertyUser,
      CountyPayment,
      County,
      Country,
      States,
      Benefit,
      City,
      moderatorRating,
      Moderator,
      propertyBiding,
    ]),
    PassportModule,
    JwtModule.register({
      secret: '7Sx1c5VNT0O6',
      signOptions: { expiresIn: '7d' },
    }),
    TwilioModule.forRoot({
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
    }),
  ],
  controllers: [AuthController],
  providers: [UserService, AdminService, JwtStrategy, TwilioService],
  exports: [TwilioService],
})
export class AuthModule {}
