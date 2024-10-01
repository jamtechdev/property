import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserService } from './services/user/user.service';
import sequelizeConfig from '../config/sequelize.config';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { JwtModule } from '@nestjs/jwt';
import { SmtpModule } from './services/admin/smtp/smtp.module';
import { PropertyListModule } from './property-list/property-list.module';
import PropertyList from 'models/propertylist.model';
import Admin from 'models/admin/admin.model';

import Country from 'models/admin/country.model';
import { AdminService } from './services/admin/admin.service';
import { AdminController } from './controller/admin.controller';
import { States } from 'models/admin/state.model';
import { County } from 'models/admin/county.model';
import { AuthController } from './controller/auth/auth.controller';
import { Benefit } from 'models/admin/benefits.model';
import { UserController } from './controller/user/user.controller';
import { ModeratorService } from './services/moderator/moderator/moderator.service';
import Moderator from 'models/moderator.model';
import { ModeratorController } from './controller/moderator/moderator/moderator.controller';
import { UploadController } from './controller/uploadFiles/upload.controller';
import City from 'models/admin/city.model';
import { FileUploadService } from './services/uploadFiles/upload-file.service';

import { multerConfig } from './services/uploadFiles/multer.config';
import { StripeService } from './services/stripe/stripe.service';
import { PaymentController } from './controller/stripe/stripe.controller';
import { SaveProperty } from 'models/saveproperty.model';
import { BlogPostService } from './services/blog-post/blog-post.service';
import { BlogPostController } from './controller/blog-post/blog-post.controller';
import FavoriteProperty from 'models/favoriteproperty.model';
import Blog from 'models/blog.post.model';

import { UserQueryToSellerController } from './controller/userQueryToSeller/user-query-to-seller/user-query-to-seller.controller';
import userQuerytoseller from 'models/userquerytoseller.model';
import { UserQueryToSellerService } from './services/userQueryToSeller/user-query-to-seller/user-query-to-seller.service';
import { ReminderController } from './controller/reminder/reminder.controller';
import { ReminderService } from './services/reminder/reminder.service';
import Reminder from 'models/reminder.model';
import AutoPublishedProperty from 'models/autopublished.property.model';
import Message from 'models/messages.model';
import { MessagesController } from './controller/messages/messages.controller';
import { MessagesService } from './services/messages/messages.service';
import { ScheduleATourController } from './controller/schedule_a_tour/schedule_a_tour.controller';
import { ScheduleATourService } from './services/schedule_a_tour/schedule_a_tour.service';
import ScheduleATour from 'models/scheduleatour.model';
import BannerImages from 'models/banner.images.model';
import { FileUploadController } from './controller/file-upload/file-upload.controller';
import { S3Service } from './services/file-upload/file-upload.service';
import { MulterModule } from '@nestjs/platform-express';
import { StoreContentService } from './services/store-content/store-content.service';
import { StoreContentController } from './controller/store-content/store-content.controller';
import { TwilioModule } from './twilio/twilio.module';
import Payment from 'models/transaction.model';
import StoreContent from 'models/storecontent.model';
import leaveAReview from 'models/leaveareviews.model';
import { TwilioService } from './twilio/twilio.service';
import TicketSystem from 'models/ticketsystem.model';
import WaitingListModerator from 'models/waitinglistmoderator.model';
import moderatorRating from 'models/moderator.rating.model';
import ViewPropertyUser from 'models/viewpropertyusers.model';
import { BusinessCard } from 'models/business.card.model';
import { PropertyBidingController } from './controller/property-biding/property-biding.controller';
import { PropertyBidingService } from './services/property-biding/property-biding.service';
import CountyPayment from 'models/county.payment.model';
import CountyAuction from 'models/county.auction.model';
import BannerOptions from 'models/banner.options.model';
import Lead from 'models/leads.model';
import propertyBiding from 'models/property.biding.model';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads', // Destination folder where files will be stored temporarily
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot(sequelizeConfig),

    SequelizeModule.forFeature([
      User,

      Role,
      PropertyList,
      Country,
      Admin,
      States,
      County,
      Benefit,
      Moderator,
      City,
      SaveProperty,
      FavoriteProperty,
      Blog,
      userQuerytoseller,
      Reminder,
      AutoPublishedProperty,
      Message,
      ScheduleATour,
      BannerImages,
      Payment,
      StoreContent,
      leaveAReview,
      TicketSystem,
      WaitingListModerator,
      moderatorRating,
      ViewPropertyUser,

      BusinessCard,
      CountyPayment,
      CountyAuction,
      BannerOptions,
      Lead,
      propertyBiding,
    ]),
    AuthModule,
    JwtModule.register({
      secret: '7Sx1c5VNT0O6',
      signOptions: { expiresIn: '7d' },
    }),
    TwilioModule,
    SmtpModule,
    PropertyListModule,

    MulterModule.register(multerConfig),
  ],
  controllers: [
    AppController,
    AdminController,
    UserController,
    ModeratorController,
    UploadController,
    PaymentController,
    BlogPostController,

    UserQueryToSellerController,
    MessagesController,
    ReminderController,
    ScheduleATourController,
    FileUploadController,
    PaymentController,
    StoreContentController,
    PropertyBidingController,
  ],
  providers: [
    AppService,
    UserService,
    AdminService,
    ModeratorService,
    FileUploadService,
    StripeService,
    MessagesService,
    S3Service,
    StripeService,

    {
      provide: 'STRIPE_SECRET_KEY',
      useValue:
        'sk_test_51KAzYQIQIokKycYtQNHIoM2nmaYYJRY2o4fNCk8MSntmvG0UzFIa0kWa3THqaebmwYi8ATXjVY5mm21QWowgJNZn00rp5bFVex',
    },
    BlogPostService,
    UserQueryToSellerService,
    ReminderService,
    ScheduleATourService,
    StoreContentService,
    PropertyBidingService,
  ],
})
export class AppModule {}
