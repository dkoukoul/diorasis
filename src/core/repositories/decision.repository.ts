import type { Decision, DecisionSearchResult } from "../entities/decision";

export interface SearchParams {
  query?: string;
  organizationId?: string;
  decisionTypeId?: string;
  fromIssueDate?: string;
  toIssueDate?: string;
  order?: "asc" | "desc";
  page?: number;
  size?: number;
}

export interface DecisionRepository {
  search(params: SearchParams): Promise<DecisionSearchResult>;
  getById(ada: string): Promise<Decision | null>;
}
