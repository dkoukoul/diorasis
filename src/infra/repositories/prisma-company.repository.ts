import type { Company } from "../../core/entities/company";
import type { CompanyRepository } from "../../core/repositories/company.repository";
import { prisma } from "../db/prisma";

export class PrismaCompanyRepository implements CompanyRepository {
  async findById(id: string): Promise<Company | null> {
    const company = await prisma.company.findUnique({ where: { id } });
    return (company as Company) || null;
  }

  async findByVat(vat: string): Promise<Company | null> {
    const company = await prisma.company.findUnique({ where: { vatNumber: vat } });
    return (company as Company) || null;
  }

  async findByGemi(gemi: string): Promise<Company | null> {
    const company = await prisma.company.findUnique({ where: { gemiNumber: gemi } });
    return (company as Company) || null;
  }

  async save(data: Omit<Company, "id" | "createdAt" | "updatedAt">): Promise<Company> {
    const company = await prisma.company.create({
      data: {
        gemiNumber: data.gemiNumber,
        vatNumber: data.vatNumber,
        name: data.name,
        distinctiveTitle: data.distinctiveTitle,
        status: data.status,
        legalForm: data.legalForm,
        address: data.address,
      },
    });
    return company as Company;
  }

  async update(id: string, data: Partial<Company>): Promise<Company> {
    const company = await prisma.company.update({
      where: { id },
      data,
    });
    return company as Company;
  }
}
