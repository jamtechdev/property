import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../services/user/user.service';
import { User } from '../../models/user.model';
import { AdminService } from 'src/services/admin/admin.service';
import Admin from 'models/admin/admin.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly adminService: AdminService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: '7Sx1c5VNT0O6',
    });
  }

  async validate(payload: any): Promise<Admin | User> {
    const admin = await this.adminService.findById(payload.sub);
    if (admin) {
      return admin;
    }
    const user = await this.userService.findById(payload.sub);
    if (user) {
      return user;
    }
    throw new UnauthorizedException();
  }
}
