"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportModule = void 0;
const common_1 = require("@nestjs/common");
const import_controller_1 = require("./import.controller");
const import_service_1 = require("./import.service");
const template_service_1 = require("./template.service");
const file_type_detector_service_1 = require("./parsers/file-type-detector.service");
const excel_parser_service_1 = require("./parsers/excel-parser.service");
const json_parser_service_1 = require("./parsers/json-parser.service");
const data_validator_service_1 = require("./validators/data-validator.service");
const prisma_module_1 = require("../prisma/prisma.module");
let ImportModule = class ImportModule {
};
exports.ImportModule = ImportModule;
exports.ImportModule = ImportModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [import_controller_1.ImportController],
        providers: [
            import_service_1.ImportService,
            template_service_1.TemplateService,
            file_type_detector_service_1.FileTypeDetectorService,
            excel_parser_service_1.ExcelParserService,
            json_parser_service_1.JsonParserService,
            data_validator_service_1.DataValidatorService,
        ],
        exports: [import_service_1.ImportService],
    })
], ImportModule);
//# sourceMappingURL=import.module.js.map