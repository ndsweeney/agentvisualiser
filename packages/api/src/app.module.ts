import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { RbacGuard } from './guards/rbac.guard';
import { BlueprintsService } from './services/blueprints.service';
import { BlueprintsController } from './routes/blueprints.controller';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

@Module({
  imports: [],
  controllers: [
    BlueprintsController,
  ],
  providers: [
    BlueprintsService,
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}