import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User, UserRole } from 'src/users/entities/user.entity';

import { ROLES_KEY } from './role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(
        context: ExecutionContext,
    ) {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const { user }: { user: User } = context.switchToHttp().getRequest();

        return requiredRoles.some((role) => user.roles?.includes(role));
    }
}