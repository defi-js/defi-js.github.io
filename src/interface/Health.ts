export enum Severity {
  Critical,
  High,
  Medium,
  Low,
  Info,
}

export interface Threat {
  severity: Severity;
  message: string;
  data: any;
}
