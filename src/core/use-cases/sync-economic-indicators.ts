import type { EconomicIndicatorRepository } from "../repositories/economic-indicator.repository";
import type { BogClient } from "../../infra/api/bog.client";

export class SyncEconomicIndicators {
  constructor(
    private readonly indicatorRepo: EconomicIndicatorRepository,
    private readonly bogClient: BogClient
  ) {}

  async execute() {
    console.log("Syncing economic indicators from Bank of Greece...");
    const indicators = await this.bogClient.getIndicators();
    
    for (const indicator of indicators) {
      await this.indicatorRepo.save({
        name: indicator.name,
        value: indicator.value,
        unit: indicator.unit,
        period: indicator.period,
        source: "Bank of Greece",
        timestamp: indicator.timestamp,
      });
    }
    
    console.log(`Synced ${indicators.length} indicators.`);
  }
}
