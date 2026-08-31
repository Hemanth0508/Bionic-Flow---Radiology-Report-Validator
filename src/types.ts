export type SourceAttribution =
  | 'DICTATION'
  | 'TEMPLATE'
  | 'SYSTEM INFERENCE';

export interface ReportSentence {
  id: string;
  text: string;
  source: SourceAttribution;
}

export interface StructuredReport {
  findings: ReportSentence[];
  impression: ReportSentence[];
  generationTimeMs: number;
}

export type WarningType =
  | 'LATERALITY_MISMATCH'
  | 'MEASUREMENT_MISMATCH'
  | 'NEGATION_MISMATCH'
  | 'UNSUPPORTED_IMPRESSION_FINDING'
  | 'MISSING_IMPRESSION_FINDING';

export interface ValidationWarning {
  id: string;
  type: WarningType;
  title: string;
  badgeText: string;
  dictationSnippet: string;
  generatedSnippet: string;
  suggestedFix?: string;
  resolved: boolean;
  resolution?: 'CORRECTED' | 'DISMISSED';
}

export interface ExtractedFacts {
  laterality: string;
  measurement: string;
  negation: string;
  anatomy: string;
  findings: string;
}

export interface TestCase {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'brain' | 'liver' | 'kidney' | 'custom';
  dictation: string;
}