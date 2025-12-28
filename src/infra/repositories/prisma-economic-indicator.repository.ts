import type { EconomicIndicator } from "../../core/entities/economic-indicator";
import type { EconomicIndicatorRepository } from "../../core/repositories/economic-indicator.repository";
import { prisma } from "../db/prisma";

export class PrismaEconomicIndicatorRepository implements EconomicIndicatorRepository {
  async findLatestByName(name: string): Promise<EconomicIndicator | null> {
    const indicator = await prisma.economicIndicator.findFirst({
      where: { name },
      orderBy: { timestamp: "desc" },
    });
    return (indicator as EconomicIndicator) || null;
  }

  async getAllLatest(): Promise<EconomicIndicator[]> {
    // This is a bit tricky with Prisma to get only the latest unique names.
    // For now, we'll get everything and filter in memory or just return all records if small.
    // Let's do a simple group by or just findMany.
    const indicators = await prisma.economicIndicator.findMany({
      orderBy: { timestamp: "desc" },
    });
    
    const uniqueLatest = new Map<string, EconomicIndicator>();
    for (const indicator of indicators) {
      if (!uniqueLatest.has(indicator.name)) {
        uniqueLatest.set(indicator.name, indicator as EconomicIndicator);
      }
    }
    
    return Array.from(uniqueLatest.values());
  }

  async save(data: Omit<EconomicIndicator, "id" | "createdAt" | "updatedAt">): Promise<EconomicIndicator> {
    const indicator = await prisma.economicIndicator.create({
      data: {
        name: data.name,
        value: data.value,
        unit: data.unit,
        period: data.period,
        source: data.source,
        timestamp: data.timestamp,
      },
    });
    return indicator as EconomicIndicator;
  }
}
