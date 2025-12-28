import type { Decision, DecisionSearchResult } from "../../core/entities/decision";
import type { DecisionRepository, SearchParams } from "../../core/repositories/decision.repository";
import { DiavgeiaClient } from "../api/diavgeia.client";
import { prisma } from "../db/prisma";

export class DiavgeiaDecisionRepository implements DecisionRepository {
  constructor(private readonly client: DiavgeiaClient) {}

  async search(params: SearchParams): Promise<DecisionSearchResult> {
    const rawData = (await this.client.search(params)) as any;
    
    // Log search asynchronously (don't wait for it to finish to return results)
    prisma.searchLog.create({
      data: {
        query: params.query,
        orgId: params.organizationId,
        typeId: params.decisionTypeId,
        from: params.fromIssueDate,
        to: params.toIssueDate,
      }
    }).catch((err: any) => console.error("Failed to log search:", err));

    return {
      decisions: rawData.decisions.map((d: any) => this.mapToEntity(d)),
      totalMetadata: {
        total: rawData.info.total,
        page: rawData.info.page,
        size: rawData.info.actualSize,
      }
    };
  }

  async getById(ada: string): Promise<Decision | null> {
    const rawData = (await this.client.getDecisionByAda(ada)) as any;
    if (!rawData) return null;
    return this.mapToEntity(rawData);
  }

  private mapToEntity(data: any): Decision {
    // Note: Diavgeia returns nested data sometimes.
    // In search.json, fields are slightly different from individual decision.json
    return {
      ada: data.ada,
      protocolNumber: data.protocolNumber || data.metadata?.protocolNumber,
      subject: data.subject || data.metadata?.subject,
      publishDate: data.publishDate || data.metadata?.publishDate,
      submissionTimestamp: data.submissionTimestamp?.toString(),
      decisionTypeId: data.decisionTypeId || data.metadata?.decisionTypeId,
      organizationId: data.organizationId || data.metadata?.organizationId,
      unitIds: data.unitIds || data.metadata?.unitIds || [],
      signerIds: data.signerIds || data.metadata?.signerIds || [],
      status: data.status,
      url: data.url,
      documentUrl: data.documentUrl,
      amount: data.extraFieldValues?.amount || data.metadata?.extraFieldValues?.amount,
    };
  }
}
