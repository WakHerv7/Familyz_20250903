"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const config_1 = require("@nestjs/config");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
const upload_controller_1 = require("./upload.controller");
const upload_service_1 = require("./upload.service");
const prisma_module_1 = require("../prisma/prisma.module");
let UploadModule = class UploadModule {
};
exports.UploadModule = UploadModule;
exports.UploadModule = UploadModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            platform_express_1.MulterModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    storage: (0, multer_1.diskStorage)({
                        destination: './uploads',
                        filename: (req, file, callback) => {
                            const uniqueSuffix = (0, uuid_1.v4)();
                            const ext = (0, path_1.extname)(file.originalname);
                            const filename = `${uniqueSuffix}${ext}`;
                            callback(null, filename);
                        },
                    }),
                    fileFilter: (req, file, callback) => {
                        const allowedMimes = [
                            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
                            'application/pdf', 'application/msword',
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            'text/plain',
                            'video/mp4', 'video/webm', 'video/quicktime',
                            'audio/mp3', 'audio/wav', 'audio/mpeg'
                        ];
                        if (allowedMimes.includes(file.mimetype)) {
                            callback(null, true);
                        }
                        else {
                            callback(new Error(`File type ${file.mimetype} is not allowed`), false);
                        }
                    },
                    limits: {
                        fileSize: 10 * 1024 * 1024,
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [upload_controller_1.UploadController],
        providers: [upload_service_1.UploadService],
        exports: [upload_service_1.UploadService],
    })
], UploadModule);
//# sourceMappingURL=upload.module.js.map