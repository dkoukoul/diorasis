import type { CompanyRepository } from "../repositories/company.repository";
import type { GemiClient } from "../../infra/api/gemi.client";
import type { Company } from "../entities/company";

export class GetCompanyExtendedInfo {
  constructor(
    private readonly companyRepo: CompanyRepository,
    private readonly gemiClient: GemiClient
  ) {}

  async execute(vat: string): Promise<Company | null> {
    // Check DB
    const existing = await this.companyRepo.findByVat(vat);
    if (existing) {
      // Logic for freshness could go here
      return existing;
    }

    // Fetch from GEMI
    console.log(`Fetching company info for VAT ${vat} from GEMI...`);
    const gemiData = await this.gemiClient.getCompanyByVat(vat);
    if (!gemiData) return null;

    // Save to DB
    const saved = await this.companyRepo.save({
      gemiNumber: gemiData.gemi_number,
      vatNumber: gemiData.vat_number,
      name: gemiData.name,
      distinctiveTitle: gemiData.distinctive_title,
      status: gemiData.status,
      legalForm: gemiData.legal_form,
      address: gemiData.address,
    });

    return saved;
  }
}
