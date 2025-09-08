import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: [
        // Only log errors and warnings, remove 'query' and 'info'
        "warn",
        "error",
        // Uncomment these if you want to see them:
        // 'query',  // SQL queries (very verbose)
        // 'info',   // General information
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log("🔌 Connected to PostgreSQL database");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log("🔌 Disconnected from PostgreSQL database");
  }

  /**
   * Transaction helper for complex operations
   */
  async transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }
}
