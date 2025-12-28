import type { SearchParams } from "../../core/repositories/decision.repository";

export class DiavgeiaClient {
  private readonly baseUrl = "https://diavgeia.gov.gr/opendata";

  async search(params: SearchParams) {
    const url = new URL(`${this.baseUrl}/search.json`);
    
    if (params.query) url.searchParams.append("q", params.query);
    if (params.organizationId) url.searchParams.append("org", params.organizationId);
    if (params.decisionTypeId) url.searchParams.append("type", params.decisionTypeId);
    if (params.fromIssueDate) url.searchParams.append("fromIssueDate", params.fromIssueDate);
    if (params.toIssueDate) url.searchParams.append("toIssueDate", params.toIssueDate);
    if (params.order) url.searchParams.append("order", params.order);
    if (params.page !== undefined) url.searchParams.append("page", params.page.toString());
    if (params.size !== undefined) url.searchParams.append("size", params.size.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Diavgeia API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getDecisionByAda(ada: string) {
    const response = await fetch(`${this.baseUrl}/decisions/${ada}.json`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Diavgeia API error: ${response.statusText}`);
    }
    return response.json();
  }

  async getOrganizations() {
    const response = await fetch(`${this.baseUrl}/organizations.json`);
    if (!response.ok) throw new Error("Failed to fetch organizations");
    return response.json();
  }

  async getDecisionTypes() {
    const response = await fetch(`${this.baseUrl}/types.json`);
    if (!response.ok) throw new Error("Failed to fetch decision types");
    return response.json();
  }
}
