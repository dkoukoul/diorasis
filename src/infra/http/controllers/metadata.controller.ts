import { GetMetadataUseCase } from "../../../core/use-cases/get-metadata";

export class MetadataController {
  constructor(private readonly getMetadataUseCase: GetMetadataUseCase) {}

  async getDecisionTypes() {
    return await this.getMetadataUseCase.getDecisionTypes();
  }

  async searchOrganizations(query: { q?: string }) {
    return await this.getMetadataUseCase.searchOrganizations(query.q || "");
  }
}
