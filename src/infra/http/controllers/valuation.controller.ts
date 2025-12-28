import { prisma } from "../../db/prisma";

export class ValuationController {
  private readonly regionMap: Record<string, string> = {
    "ATHENS": "ΑΘΗΝΑ",
    "THESSALONIKI": "ΘΕΣΣΑΛΟΝΙΚΗ",
    "CRETE": "ΚΡΗΤΗ",
    "PATRA": "ΠΑΤΡΑ",
    "PIRAEUS": "ΠΕΙΡΑΙΑΣ",
    "ΑΘΗΝΑ": "ΑΘΗΝΑ",
    "ΘΕΣΣΑΛΟΝΙΚΗ": "ΘΕΣΣΑΛΟΝΙΚΗ",
    "ΚΡΗΤΗ": "ΚΡΗΤΗ",
    "ΠΑΤΡΑ": "ΠΑΤΡΑ",
    "ΠΕΙΡΑΙΑΣ": "ΠΕΙΡΑΙΑΣ",
  };

  private readonly bogRegionMap: Record<string, string> = {
    "ΑΘΗΝΑ": "ATHENS",
    "ΘΕΣΣΑΛΟΝΙΚΗ": "THESSALONIKI",
    "ΚΡΗΤΗ": "CRETE",
    "ΠΑΤΡΑ": "PATRA",
    "ΠΕΙΡΑΙΑΣ": "PIRAEUS",
  };

  private readonly objectiveValues: Record<string, number> = {
    "ΑΘΗΝΑ": 2500,
    "ΘΕΣΣΑΛΟΝΙΚΗ": 2000,
    "ΚΡΗΤΗ": 1800,
    "ΠΑΤΡΑ": 1500,
    "ΠΕΙΡΑΙΑΣ": 2200,
  };

  async estimateValuation(query: { region: string; age: string; size: string }) {
    const normalizedRegion = this.regionMap[query.region.toUpperCase()] || query.region.toUpperCase();
    const bogRegion = this.bogRegionMap[normalizedRegion] || normalizedRegion;
    const age = Math.max(0, parseInt(query.age) || 0);
    const size = Math.max(1, parseFloat(query.size) || 100); // Default to 100sqm if 0

    // 1. Get BoG Trend (Prioritize regional residential index)
    const bogIndicator = await prisma.economicIndicator.findFirst({
      where: {
        category: "real-estate:residential:price",
        metadata: {
          path: ["region"],
          equals: bogRegion
        }
      },
      orderBy: { timestamp: "desc" }
    }) || await prisma.economicIndicator.findFirst({
      where: { name: "Apartment Price Index (Urban Areas)" },
      orderBy: { timestamp: "desc" }
    });

    const marketTrend = bogIndicator ? bogIndicator.value : 100;
    
    // 2. Commercial Yield Analysis (If we wanted to extend to commercial, but let's stick to Residential for now)
    // However, we can use Retail/Office rent indices to show general market sentiment.
    const rentTrend = await prisma.economicIndicator.findFirst({
      where: { category: "real-estate:commercial:rent" },
      orderBy: { timestamp: "desc" }
    });

    // 2. Get Objective Value
    const baseObjectiveValue = this.objectiveValues[normalizedRegion] || 1200;
    // Apply age correction
    const ageCorrection = Math.max(0.7, 1 - Math.max(0, age - 5) * 0.01);
    const correctedObjectiveValue = baseObjectiveValue * ageCorrection * size;

    // 3. Neighborhood Health (Diavgeia Infrastructure)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 365);

    const publicWorks = await prisma.decision.findMany({
      where: {
        region: normalizedRegion,
        decisionTypeId: "Δ.1",
        publishDate: { gte: thirtyDaysAgo }
      }
    });

    const infrastructureScore = Math.min(100, publicWorks.length * 15);

    // 4. Synthesize Final Estimate
    const marketPremium = (marketTrend / 100);
    const infraBonus = 1 + (infrastructureScore / 500);
    const estimatedValue = correctedObjectiveValue * marketPremium * infraBonus;

    const result = {
      region: normalizedRegion,
      inputs: { age, size },
      valuation: {
        estimatedMarketValue: Math.round(estimatedValue),
        objectiveValue: Math.round(correctedObjectiveValue),
        currency: "EUR",
        pricePerSqm: Math.round(estimatedValue / size)
      },
      marketContext: {
        priceIndex: marketTrend,
        rentIndex: rentTrend?.value || null,
        period: bogIndicator?.period || "N/A"
      },
      analysis: {
        infrastructureScore: infrastructureScore,
        nearbyPublicWorks: publicWorks.length,
        growthIndication: marketTrend > 110 ? "HIGH" : marketTrend > 100 ? "STABLE" : "RECOVERY",
        description: `Property in ${normalizedRegion} valued at ${Math.round(estimatedValue / size)}€/sqm. Based on Bank of Greece ${bogIndicator?.period || 'current'} data, the regional price index is ${marketTrend}. Infrastructure health is ${infrastructureScore}/100 based on ${publicWorks.length} active development decisions in Diavgeia.`
      }
    };

    // Log the valuation for future analytics
    await prisma.propertyValuation.create({
      data: {
        region: normalizedRegion,
        estimatedValue,
        marketTrend,
        objectiveValue: correctedObjectiveValue,
        infrastructureScore,
      }
    });

    return result;
  }
}
