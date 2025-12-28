import type { EconomicIndicator } from "../entities/economic-indicator";

export interface EconomicIndicatorRepository {
  findLatestByName(name: string): Promise<EconomicIndicator | null>;
  getAllLatest(): Promise<EconomicIndicator[]>;
  save(indicator: Omit<EconomicIndicator, "id" | "createdAt" | "updatedAt">): Promise<EconomicIndicator>;
}
