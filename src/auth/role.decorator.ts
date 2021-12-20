import { SetMetadata } from "@nestjs/common";
import { UserRole } from "src/users/entities/user.entity";
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);