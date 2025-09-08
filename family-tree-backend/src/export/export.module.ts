import { Module } from "@nestjs/common";
import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";
import { PrismaModule } from "../prisma/prisma.module";
import { TreeDataService } from "@/common/services/treeData.service";

@Module({
  imports: [PrismaModule],
  controllers: [ExportController],
  providers: [ExportService, TreeDataService],
  exports: [ExportService, TreeDataService],
})
export class ExportModule {}
