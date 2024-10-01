import {
  Controller,
  Post,
  Body,
  NotFoundException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from '../../services/user/user.service';
import {
  CreateUserDto,
  LoginUserDto,
  ResetPasswordDto,
} from '../../dto/user/create-user.dto';
import { User } from '../../../models/user.model';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  async signup(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ user: User; access_token: string }> {
    try {
      return this.userService.create(createUserDto);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException('Email address is already in use');
      }
      throw error;
    }
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginUserDto,
  ): Promise<{ user: User; access_token: string }> {
    try {
      const { email, password } = loginUserDto;
      const result = await this.userService.login(email, password);
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    try {
      await this.userService.sendResetLink(email);
      return { message: 'Reset link sent successfully' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { email, newPassword, confirmPassword } = resetPasswordDto;
    if (newPassword !== confirmPassword) {
      throw new NotFoundException('Password must match');
    }
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { message: 'Password reset successfully' };
  }
  @Post('google-login-signup')
  async googleSignup(
    @Body() createUserDto: CreateUserDto,
  ): Promise<{ user: User; access_token: string }> {
    try {
      return this.userService.googleLoginOrSignup(createUserDto);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ConflictException('Email address is already in use');
      }
      throw error;
    }
  }
}
