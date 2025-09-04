import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MemberModule } from './member/member.module';
import { FamilyModule } from './family/family.module';
import { InvitationModule } from './invitation/invitation.module';
import { TreeModule } from './tree/tree.module';

// Social Feed modules
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { NotificationModule } from './notification/notification.module';

// File Upload module
import { UploadModule } from './upload/upload.module';

// Export module
import { ExportModule } from './export/export.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot({
      ttl: parseInt(process.env.THROTTLE_TTL || '60') * 1000,
      limit: parseInt(process.env.THROTTLE_LIMIT || '20'),
    }),

    // Core infrastructure
    PrismaModule,

    // Feature modules
    AuthModule,
    UserModule,
    MemberModule,
    FamilyModule,
    InvitationModule,
    TreeModule,

    // Social Feed modules
    PostModule,
    CommentModule,
    NotificationModule,

    // File Upload module
    UploadModule,

    // Export module
    ExportModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
