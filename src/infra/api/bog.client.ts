export interface EconomicIndicator {
  name: string;
  category: string;
  value: number;
  unit: string;
  period: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class BogClient {
  private readonly baseUrl = "https://opendata.bankofgreece.gr";

  /**
   * Fetches economic indicators.
   * Real implementation would parse the RSS feeds and XLS files:
   * RSS: https://opendata.bankofgreece.gr/DatasetDetailsRss.ashx?i={ID}
   * IDs: 4 (Apartment Prices), 5 (Regional), 6 (Retail Price), 7 (Retail Rent), 8 (Office Price), 9 (Office Rent)
   */
  async getIndicators(): Promise<EconomicIndicator[]> {
    const common: EconomicIndicator[] = [
      {
        name: "CPI Inflation",
        category: "macro",
        value: 3.2,
        unit: "%",
        period: "2025-11",
        timestamp: new Date()
      },
      {
        name: "GDP Growth Rate",
        category: "macro",
        value: 2.1,
        unit: "%",
        period: "2025-Q3",
        timestamp: new Date()
      },
    ];

    const realEstate: EconomicIndicator[] = [
      {
        name: "Apartment Price Index (Athens)",
        category: "real-estate:residential:price",
        value: 125.4,
        unit: "Index (2007=100)",
        period: "2025-Q3",
        timestamp: new Date(),
        metadata: { region: "ATHENS", subType: "APARTMENT" }
      },
      {
        name: "Apartment Price Index (Thessaloniki)",
        category: "real-estate:residential:price",
        value: 118.2,
        unit: "Index (2007=100)",
        period: "2025-Q3",
        timestamp: new Date(),
        metadata: { region: "THESSALONIKI", subType: "APARTMENT" }
      },
      {
        name: "Apartment Price Index (Other Cities)",
        category: "real-estate:residential:price",
        value: 112.5,
        unit: "Index (2007=100)",
        period: "2025-Q3",
        timestamp: new Date(),
        metadata: { region: "OTHER_CITIES", subType: "APARTMENT" }
      },
      {
        name: "Apartment Price Index (Urban Areas)",
        category: "real-estate:residential:price",
        value: 122.1,
        unit: "Index (2007=100)",
        period: "2025-Q3",
        timestamp: new Date(),
        metadata: { region: "URBAN_AREAS", subType: "APARTMENT" }
      },
      {
        name: "Retail Price Index",
        category: "real-estate:commercial:price",
        value: 105.8,
        unit: "Index (2010=100)",
        period: "2024-H2",
        timestamp: new Date(),
        metadata: { sector: "RETAIL" }
      },
      {
        name: "Retail Rent Index",
        category: "real-estate:commercial:rent",
        value: 98.2,
        unit: "Index (2010=100)",
        period: "2024-H2",
        timestamp: new Date(),
        metadata: { sector: "RETAIL" }
      },
      {
        name: "Office Price Index",
        category: "real-estate:commercial:price",
        value: 108.4,
        unit: "Index (2010=100)",
        period: "2024-H2",
        timestamp: new Date(),
        metadata: { sector: "OFFICE" }
      },
      {
        name: "Office Rent Index",
        category: "real-estate:commercial:rent",
        value: 102.1,
        unit: "Index (2010=100)",
        period: "2024-H2",
        timestamp: new Date(),
        metadata: { sector: "OFFICE" }
      }
    ];

    return [...common, ...realEstate];
  }

  async getIndicatorByName(name: string): Promise<EconomicIndicator | null> {
    const indicators = await this.getIndicators();
    return indicators.find(i => i.name.toLowerCase() === name.toLowerCase()) || null;
  }
}
