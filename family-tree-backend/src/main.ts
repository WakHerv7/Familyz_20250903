import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import * as express from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get("PORT") || 3001;
  const apiPrefix = configService.get("API_PREFIX") || "api";
  const apiVersion = configService.get("API_VERSION") || "v1";
  const frontendUrl =
    configService.get("FRONTEND_URL") || "http://localhost:3000";

  // Global prefix for all routes
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // Global validation pipe with transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // CORS configuration for frontend
  app.enableCors({
    origin: [frontendUrl, "http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Configure body parser limits for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Static file serving for uploads
  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads/",
  });

  // Static file serving for exports
  app.useStaticAssets(join(__dirname, "..", "public"), {
    prefix: "/public/",
  });

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle("Family Tree Platform API")
    .setDescription(
      "Comprehensive family tree management platform with hierarchical families, member relationships, and invitation system"
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth"
    )
    .addServer(`http://localhost:${port}`, "Development server")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);

  console.log(
    `🌳 Family Tree Platform API is running on: http://localhost:${port}`
  );
  console.log(`📖 API Documentation: http://localhost:${port}/docs`);
  console.log(
    `🔗 API Base URL: http://localhost:${port}/${apiPrefix}/${apiVersion}`
  );
  console.log(`🎨 Frontend expected at: ${frontendUrl}`);
}

bootstrap();
