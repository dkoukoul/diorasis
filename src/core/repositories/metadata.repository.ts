import type { Organization, DecisionType } from "../entities/metadata";

export interface MetadataRepository {
  getOrganizations(): Promise<Organization[]>;
  getDecisionTypes(): Promise<DecisionType[]>;
  searchOrganizations(query: string): Promise<Organization[]>;
}
