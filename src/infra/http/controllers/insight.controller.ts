import type { GetCompanyExtendedInfo } from "../../../core/use-cases/get-company-extended-info";
import { prisma } from "../../db/prisma";

export class InsightController {
  constructor(
    private readonly getCompanyInfo: GetCompanyExtendedInfo
  ) {}

  async getCompanyInsights(vat: string) {
    const company = await this.getCompanyInfo.execute(vat);
    if (!company) return { error: "Company not found" };

    // Get all decisions linked to this company (searching by VAT in subject for now as a heuristic)
    // In a real app, we'd have a better mapping.
    const decisions = await prisma.decision.findMany({
      where: {
        subject: {
          contains: vat,
          mode: 'insensitive'
        }
      },
      orderBy: {
        publishDate: 'desc'
      },
      take: 10
    });

    const totalAmount = decisions.reduce((acc, d) => acc + (d.amount || 0), 0);

    return {
      company,
      stats: {
        relevantDecisionsCount: decisions.length,
        totalAmountInLast10: totalAmount,
      },
      recentDecisions: decisions
    };
  }

  async getEconomicContext() {
    const indicators = await prisma.economicIndicator.findMany({
      orderBy: { timestamp: "desc" },
    });

    // Get unique latest indicators
    const uniqueLatest = new Map<string, any>();
    for (const indicator of indicators) {
      if (!uniqueLatest.has(indicator.name)) {
        uniqueLatest.set(indicator.name, indicator);
      }
    }

    // Get total Diavgeia spending in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDecisions = await prisma.decision.findMany({
      where: {
        publishDate: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        amount: true
      }
    });

    const totalSpending = recentDecisions.reduce((acc, d) => acc + (d.amount || 0), 0);

    return {
      indicators: Array.from(uniqueLatest.values()),
      diorasisMetics: {
        last30DaysTotalSpending: totalSpending,
        decisionCount: recentDecisions.length
      }
    };
  }
}
