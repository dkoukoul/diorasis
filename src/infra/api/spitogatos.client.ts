export interface SpiEntry {
  area: string;
  priceSale: number;
  priceRent?: number;
  changeSale?: number;
  changeRent?: number;
  period: string;
}

export class SpitogatosClient {
  private readonly url = "https://www.spitogatos.gr/en/property-index";

  async getSpiData(): Promise<SpiEntry[]> {
    try {
      const response = await fetch(this.url);
      const html = await response.text();

      // Simple extraction using regex for the demo/script purpose
      // In a production environment, use a proper HTML parser like Cheerio
      
      const entries: SpiEntry[] = [];
      
      // The strategy is to find the area links and then look for the prices near them.
      // Based on the observed structure: Area -> Price Q3 2025 -> Price Q3 2024 -> Change %
      
      // RegEx to find rows in the "House prices for sale" section
      // Example: <a href=".../athens-center">Athens - Center</a> ... 2,439 ... 2,177 ... 12.00%
      
      const saleRegex = /<a[^>]+href="[^"]+for_sale-homes\/([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<div[^>]*>([\d,]+)<\/div>[\s\S]*?<div[^>]*>([\d,]+)<\/div>[\s\S]*?<div[^>]*>([\d\.-]+)%<\/div>/g;
      const rentRegex = /<a[^>]+href="[^"]+to_rent-homes\/([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<div[^>]*>([\d,]+|[\d\.]+[\d,]*)<\/div>[\s\S]*?<div[^>]*>([\d,]+|[\d\.]+[\d,]*)<\/div>[\s\S]*?<div[^>]*>([\d\.-]+)%<\/div>/g;

      const saleMap = new Map<string, Partial<SpiEntry>>();

      let match;
      while ((match = saleRegex.exec(html)) !== null) {
        if (match[2] && match[3] && match[5]) {
          const area = match[2].trim();
          const price = parseFloat(match[3].replace(/,/g, ""));
          const change = parseFloat(match[5]);
          saleMap.set(area, { area, priceSale: price, changeSale: change, period: "2025-Q3" });
        }
      }

      while ((match = rentRegex.exec(html)) !== null) {
        if (match[2] && match[3] && match[5]) {
          const area = match[2].trim();
          const price = parseFloat(match[3].replace(/,/g, ""));
          const change = parseFloat(match[5]);
          
          if (saleMap.has(area)) {
            const entry = saleMap.get(area)!;
            entry.priceRent = price;
            entry.changeRent = change;
          } else {
            saleMap.set(area, { area, priceRent: price, changeRent: change, period: "2025-Q3" });
          }
        }
      }

      return Array.from(saleMap.values()) as SpiEntry[];
    } catch (error) {
      console.error("Error fetching Spitogatos SPI data:", error);
      return [];
    }
  }

  /**
   * Mock data fallback for areas that might be missed by simple regex
   */
  async getMockSpiData(): Promise<SpiEntry[]> {
    return [
      { area: "Athens - Center", priceSale: 2439, priceRent: 11.52, changeSale: 12.0, changeRent: 7.6, period: "2025-Q3" },
      { area: "Athens - North", priceSale: 3323, priceRent: 11.54, changeSale: 6.8, changeRent: 2.1, period: "2025-Q3" },
      { area: "Athens - South", priceSale: 4091, priceRent: 13.1, changeSale: 7.1, changeRent: 2.0, period: "2025-Q3" },
      { area: "Thessaloniki - Municipality", priceSale: 2625, priceRent: 10.42, changeSale: 9.4, changeRent: 7.8, period: "2025-Q3" },
    ];
  }
}
