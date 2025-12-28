export interface Company {
  id: string;
  gemiNumber: string;
  vatNumber?: string;
  name: string;
  distinctiveTitle?: string;
  status?: string;
  legalForm?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}
