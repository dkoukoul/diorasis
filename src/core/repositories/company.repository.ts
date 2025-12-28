import type { Company } from "../entities/company";

export interface CompanyRepository {
  findById(id: string): Promise<Company | null>;
  findByVat(vat: string): Promise<Company | null>;
  findByGemi(gemi: string): Promise<Company | null>;
  save(company: Omit<Company, "id" | "createdAt" | "updatedAt">): Promise<Company>;
  update(id: string, company: Partial<Company>): Promise<Company>;
}
