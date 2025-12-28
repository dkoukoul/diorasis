import type { Organization, DecisionType } from "../../core/entities/metadata";
import type { MetadataRepository } from "../../core/repositories/metadata.repository";
import { DiavgeiaClient } from "../api/diavgeia.client";
import { prisma } from "../db/prisma";

export class DiavgeiaMetadataRepository implements MetadataRepository {
  constructor(private readonly client: DiavgeiaClient) {}

  async getOrganizations(): Promise<Organization[]> {
    const count = await prisma.organization.count();
    
    if (count > 0) {
      const orgs = await prisma.organization.findMany();
      return orgs.map((org: { uid: string; label: string }) => ({ uid: org.uid, label: org.label }));
    }
    
    // Cache miss: fetch from API and save to DB
    const data = (await this.client.getOrganizations()) as any;
    const orgs = data.organizations.map((org: any) => ({
      uid: org.uid,
      label: org.label,
    }));

    // Chunk size for bulk insert
    const chunkSize = 100;
    for (let i = 0; i < orgs.length; i += chunkSize) {
      const chunk = orgs.slice(i, i + chunkSize);
      await prisma.organization.createMany({
        data: chunk,
        skipDuplicates: true,
      });
    }
    
    return orgs;
  }

  async getDecisionTypes(): Promise<DecisionType[]> {
    const count = await prisma.decisionType.count();
    
    if (count > 0) {
      const types = await prisma.decisionType.findMany();
      return types.map((t: { uid: string; label: string; allowedInDecisions: boolean }) => ({ 
        uid: t.uid, 
        label: t.label, 
        allowedInDecisions: t.allowedInDecisions 
      }));
    }

    const data = (await this.client.getDecisionTypes()) as any;
    const types = data.decisionTypes.map((type: any) => ({
      uid: type.uid,
      label: type.label,
      allowedInDecisions: type.allowedInDecisions,
    }));

    await prisma.decisionType.createMany({
      data: types,
      skipDuplicates: true,
    });

    return types;
  }

  async searchOrganizations(query: string): Promise<Organization[]> {
    const normalizedQuery = query.toLowerCase();
    
    // Use DB for search directly for better performance than in-memory filter
    const orgs = await prisma.organization.findMany({
      where: {
        OR: [
          { label: { contains: normalizedQuery, mode: 'insensitive' } },
          { uid: { contains: normalizedQuery } }
        ]
      },
      take: 20
    });

    if (orgs.length === 0) {
      // If DB search yields nothing, maybe the cache is empty
      // Trigger a refresh/fill
      const allOrgs = await this.getOrganizations();
      return allOrgs.filter(org => 
        org.label.toLowerCase().includes(normalizedQuery) || 
        org.uid.includes(normalizedQuery)
      ).slice(0, 20);
    }

    return orgs.map((org: { uid: string; label: string }) => ({ uid: org.uid, label: org.label }));
  }
}
