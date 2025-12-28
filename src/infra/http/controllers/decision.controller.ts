import { SearchDecisionsUseCase } from "../../../core/use-cases/search-decisions";
import type { SearchParams } from "../../../core/repositories/decision.repository";

export class DecisionController {
  constructor(private readonly searchDecisionsUseCase: SearchDecisionsUseCase) {}

  async searchDecisions(query: { 
    q?: string; 
    page?: string; 
    size?: string;
    org?: string;
    type?: string;
    from?: string;
    to?: string;
    order?: "asc" | "desc";
  }) {
    const params: SearchParams = {
      query: query.q,
      organizationId: query.org,
      decisionTypeId: query.type,
      fromIssueDate: query.from,
      toIssueDate: query.to,
      order: query.order,
      page: query.page ? parseInt(query.page) : 0,
      size: query.size ? parseInt(query.size) : 10,
    };

    return await this.searchDecisionsUseCase.execute(params);
  }
}
