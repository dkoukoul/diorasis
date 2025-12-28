import type { DecisionSearchResult } from "../entities/decision";
import type { DecisionRepository, SearchParams } from "../repositories/decision.repository";

export class SearchDecisionsUseCase {
  constructor(private readonly decisionRepository: DecisionRepository) {}

  async execute(params: SearchParams): Promise<DecisionSearchResult> {
    // Here logic like caching, additional filtering, or enriching data can be added.
    // For now, it's a simple delegate to the repository.
    return this.decisionRepository.search(params);
  }
}
