import { Module } from '@nestjs/common';
import { CommentController, CommentManagementController } from './comment.controller';
import { CommentService } from './comment.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommentController, CommentManagementController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
