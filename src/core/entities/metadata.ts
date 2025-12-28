export interface Organization {
  uid: string;
  label: string;
}

export interface DecisionType {
  uid: string;
  label: string;
  allowedInDecisions: boolean;
}
