import type { MetadataRepository } from "../repositories/metadata.repository";
import type { Organization, DecisionType } from "../entities/metadata";

export class GetMetadataUseCase {
  constructor(private readonly metadataRepository: MetadataRepository) {}

  async getDecisionTypes(): Promise<DecisionType[]> {
    return this.metadataRepository.getDecisionTypes();
  }

  async searchOrganizations(query: string): Promise<Organization[]> {
    if (!query || query.length < 2) return [];
    return this.metadataRepository.searchOrganizations(query);
  }
}
