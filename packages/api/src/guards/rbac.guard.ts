import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { User } from '../types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = this.getUserFromRequest(request);

    return requiredRoles.some((role) => user.role === role);
  }

  private getUserFromRequest(request: any): User {
    // In development, read role from header for testing
    const devRole = request.headers['x-dev-role'] || 'Creator';
    const userEmail = request.headers['x-dev-user'] || 'dev@agentfactory.com';

    return {
      id: `user-${userEmail.split('@')[0]}`,
      email: userEmail,
      role: devRole as 'Creator' | 'Operator' | 'Auditor',
    };
  }
}