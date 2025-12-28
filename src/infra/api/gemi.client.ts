export interface GemiCompany {
  gemi_number: string;
  vat_number: string;
  name: string;
  distinctive_title: string;
  status: string;
  legal_form: string;
  address: string;
  prefecture: string;
  municipality: string;
}

export class GemiClient {
  private readonly baseUrl = "https://opendata-api.businessportal.gr/api/opendata/v1";
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMI_API_KEY || "";
  }

  async searchCompany(query: string) {
    const url = new URL(`${this.baseUrl}/search-businesses`);
    url.searchParams.append("name", query);

    const response = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`GEMI API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getCompanyByVat(vat: string) {
    const url = new URL(`${this.baseUrl}/search-businesses`);
    url.searchParams.append("vat", vat);

    const response = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`GEMI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data && data.results && data.results.length > 0 ? data.results[0] : null;
  }

  async getCompanyByGemi(gemi: string) {
    const url = new URL(`${this.baseUrl}/search-businesses`);
    url.searchParams.append("gemi_number", gemi);

    const response = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`GEMI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data && data.results && data.results.length > 0 ? data.results[0] : null;
  }
}
