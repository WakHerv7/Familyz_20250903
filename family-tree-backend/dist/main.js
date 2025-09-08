"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const path_1 = require("path");
const express = require("express");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get("PORT") || 3001;
    const apiPrefix = configService.get("API_PREFIX") || "api";
    const apiVersion = configService.get("API_VERSION") || "v1";
    const frontendUrl = configService.get("FRONTEND_URL") || "http://localhost:3000";
    app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.enableCors({
        origin: [frontendUrl, "http://localhost:3000", "http://localhost:3001"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    });
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));
    app.useStaticAssets((0, path_1.join)(__dirname, "..", "uploads"), {
        prefix: "/uploads/",
    });
    app.useStaticAssets((0, path_1.join)(__dirname, "..", "public"), {
        prefix: "/public/",
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle("Family Tree Platform API")
        .setDescription("Comprehensive family tree management platform with hierarchical families, member relationships, and invitation system")
        .setVersion("1.0")
        .addBearerAuth({
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
    }, "JWT-auth")
        .addServer(`http://localhost:${port}`, "Development server")
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("docs", app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    await app.listen(port);
    console.log(`🌳 Family Tree Platform API is running on: http://localhost:${port}`);
    console.log(`📖 API Documentation: http://localhost:${port}/docs`);
    console.log(`🔗 API Base URL: http://localhost:${port}/${apiPrefix}/${apiVersion}`);
    console.log(`🎨 Frontend expected at: ${frontendUrl}`);
}
bootstrap();
//# sourceMappingURL=main.js.map