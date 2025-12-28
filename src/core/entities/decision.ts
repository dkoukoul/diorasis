export interface Decision {
  ada: string;
  protocolNumber: string;
  subject: string;
  publishDate: string;
  submissionTimestamp: string;
  decisionTypeId: string;
  organizationId: string;
  unitIds: string[];
  signerIds: string[];
  status: string;
  url: string;
  documentUrl: string;
  amount?: number;
}

export interface DecisionSearchResult {
  decisions: Decision[];
  totalMetadata: {
    total: number;
    page: number;
    size: number;
  };
}
