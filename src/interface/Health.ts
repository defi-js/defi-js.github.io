export enum Severity {
  Critical,
  High,
  Medium,
  Low,
}

export interface Threat {
  severity: Severity;
  message: string;
}
