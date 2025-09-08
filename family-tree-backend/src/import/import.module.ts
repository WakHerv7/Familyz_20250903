import { Module } from "@nestjs/common";
import { ImportController } from "./import.controller";
import { ImportService } from "./import.service";
import { TemplateService } from "./template.service";
import { FileTypeDetectorService } from "./parsers/file-type-detector.service";
import { ExcelParserService } from "./parsers/excel-parser.service";
import { JsonParserService } from "./parsers/json-parser.service";
import { DataValidatorService } from "./validators/data-validator.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ImportController],
  providers: [
    ImportService,
    TemplateService,
    FileTypeDetectorService,
    ExcelParserService,
    JsonParserService,
    DataValidatorService,
  ],
  exports: [ImportService],
})
export class ImportModule {}
