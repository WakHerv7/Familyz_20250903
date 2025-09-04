"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const invitation_service_1 = require("./invitation.service");
const invitation_controller_1 = require("./invitation.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let InvitationModule = class InvitationModule {
};
exports.InvitationModule = InvitationModule;
exports.InvitationModule = InvitationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('INVITATION_JWT_SECRET'),
                    signOptions: {
                        expiresIn: configService.get('INVITATION_EXPIRES_IN') || '7d',
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [invitation_controller_1.InvitationController],
        providers: [invitation_service_1.InvitationService],
        exports: [invitation_service_1.InvitationService],
    })
], InvitationModule);
//# sourceMappingURL=invitation.module.js.map