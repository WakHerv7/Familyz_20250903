"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const throttler_2 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const member_module_1 = require("./member/member.module");
const family_module_1 = require("./family/family.module");
const invitation_module_1 = require("./invitation/invitation.module");
const tree_module_1 = require("./tree/tree.module");
const post_module_1 = require("./post/post.module");
const comment_module_1 = require("./comment/comment.module");
const notification_module_1 = require("./notification/notification.module");
const upload_module_1 = require("./upload/upload.module");
const export_module_1 = require("./export/export.module");
const import_module_1 = require("./import/import.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ".env",
            }),
            throttler_1.ThrottlerModule.forRoot({
                ttl: parseInt(process.env.THROTTLE_TTL || "60") * 1000,
                limit: parseInt(process.env.THROTTLE_LIMIT || "20"),
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            member_module_1.MemberModule,
            family_module_1.FamilyModule,
            invitation_module_1.InvitationModule,
            tree_module_1.TreeModule,
            post_module_1.PostModule,
            comment_module_1.CommentModule,
            notification_module_1.NotificationModule,
            upload_module_1.UploadModule,
            export_module_1.ExportModule,
            import_module_1.ImportModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_2.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map