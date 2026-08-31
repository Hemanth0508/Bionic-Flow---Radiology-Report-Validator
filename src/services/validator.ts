import { StructuredReport, ValidationWarning } from '../types';

type Measurement = {
  raw: string;
  value: number;
  unit: 'mm' | 'cm';
};

function extractMeasurement(text: string): Measurement | null {
  const match = text.match(
    /\b(\d+(?:\.\d+)?)\s*(mm|millimetre|millimeter|millimetres|millimeters|cm|centimetre|centimeter|centimetres|centimeters)\b/i
  );

  if (!match) return null;

  const unitText = match[2].toLowerCase();

  return {
    raw: match[0],
    value: Number(match[1]),
    unit: unitText.startsWith('cm') ||
      unitText.startsWith('cent')
      ? 'cm'
      : 'mm',
  };
}

function normaliseMeasurement(measurement: Measurement): number {
  return measurement.unit === 'cm'
    ? measurement.value * 10
    : measurement.value;
}

function hasWord(text: string, word: string): boolean {
  return new RegExp(
    `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
    'i'
  ).test(text);
}

function isNegated(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return new RegExp(
    `\\b(no|without|negative for|absent)\\s+(?:\\w+\\s+){0,3}${escaped}\\b`,
    'i'
  ).test(text);
}

function addWarning(
  warnings: ValidationWarning[],
  warning: Omit<ValidationWarning, 'resolved'>
) {
  warnings.push({
    ...warning,
    resolved: false,
  });
}

export function runValidation(
  dictation: string,
  report: StructuredReport
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // ------------------------------------------------------------
  // SOURCE OF TRUTH
  // ------------------------------------------------------------

  const impressionMarker = dictation.search(/impression:/i);

  const sourceText =
    impressionMarker >= 0
      ? dictation.slice(0, impressionMarker).trim()
      : dictation.trim();

  const sourceLower = sourceText.toLowerCase();

  const impressionText = report.impression
    .map((sentence) => sentence.text)
    .join(' ');

  const impressionLower = impressionText.toLowerCase();

  // ------------------------------------------------------------
  // 1. LATERALITY
  // ------------------------------------------------------------

  const sourceLeft = hasWord(sourceLower, 'left');
  const sourceRight = hasWord(sourceLower, 'right');

  const impressionLeft = hasWord(impressionLower, 'left');
  const impressionRight = hasWord(impressionLower, 'right');

  if (
    sourceLeft &&
    !sourceRight &&
    impressionRight &&
    !impressionLeft
  ) {
    addWarning(warnings, {
      id: 'laterality-mismatch',
      type: 'LATERALITY_MISMATCH',
      title: 'Laterality Mismatch',
      badgeText: 'CRITICAL',
      dictationSnippet: 'LEFT',
      generatedSnippet: 'RIGHT',
      suggestedFix: 'Change RIGHT to LEFT.',
    });
  }

  if (
    sourceRight &&
    !sourceLeft &&
    impressionLeft &&
    !impressionRight
  ) {
    addWarning(warnings, {
      id: 'laterality-mismatch',
      type: 'LATERALITY_MISMATCH',
      title: 'Laterality Mismatch',
      badgeText: 'CRITICAL',
      dictationSnippet: 'RIGHT',
      generatedSnippet: 'LEFT',
      suggestedFix: 'Change LEFT to RIGHT.',
    });
  }

  // ------------------------------------------------------------
  // 2. MEASUREMENT
  // ------------------------------------------------------------

  const sourceMeasurement = extractMeasurement(sourceText);
  const impressionMeasurement = extractMeasurement(impressionText);

  if (sourceMeasurement && impressionMeasurement) {
    const sourceMm = normaliseMeasurement(sourceMeasurement);
    const impressionMm = normaliseMeasurement(impressionMeasurement);

    if (sourceMm !== impressionMm) {
      addWarning(warnings, {
        id: 'measurement-mismatch',
        type: 'MEASUREMENT_MISMATCH',
        title: 'Measurement Mismatch',
        badgeText: 'CRITICAL',
        dictationSnippet: sourceMeasurement.raw,
        generatedSnippet: impressionMeasurement.raw,
        suggestedFix: `Use ${sourceMeasurement.raw}.`,
      });
    }
  }

  // ------------------------------------------------------------
  // 3. NEGATION
  // ------------------------------------------------------------

  const protectedTerms = [
    'hydronephrosis',
    'midline shift',
    'biliary dilatation',
    'pericardial effusion',
    'pleural effusion',
    'pneumothorax',
    'fracture',
    'acute intracranial haemorrhage',
    'acute intracranial hemorrhage',
  ];

  for (const term of protectedTerms) {
    const sourceNegative = isNegated(sourceLower, term);
    const impressionNegative = isNegated(
      impressionLower,
      term
    );

    const sourcePositive =
      hasWord(sourceLower, term) && !sourceNegative;

    const impressionPositive =
      hasWord(impressionLower, term) && !impressionNegative;

    if (sourceNegative && impressionPositive) {
      addWarning(warnings, {
        id: `negation-${term.replace(/\s+/g, '-')}`,
        type: 'NEGATION_MISMATCH',
        title: 'Negation Mismatch',
        badgeText: 'CRITICAL',
        dictationSnippet: `No ${term}`,
        generatedSnippet: term,
        suggestedFix: `Preserve the negative finding: "No ${term}".`,
      });
    }

    if (sourcePositive && impressionNegative) {
      addWarning(warnings, {
        id: `negation-${term.replace(/\s+/g, '-')}`,
        type: 'NEGATION_MISMATCH',
        title: 'Negation Mismatch',
        badgeText: 'CRITICAL',
        dictationSnippet: term,
        generatedSnippet: `No ${term}`,
        suggestedFix: `Preserve the positive finding: ${term}.`,
      });
    }
  }

  // ------------------------------------------------------------
  // 4. UNSUPPORTED IMPRESSION FINDINGS
  // ------------------------------------------------------------

  const importantFindings = [
    'haemorrhage',
    'hemorrhage',
    'oedema',
    'edema',
    'lesion',
    'effusion',
    'thickening',
    'infarct',
    'mass',
    'nodule',
    'fracture',
    'pneumothorax',
    'dilatation',
  ];

  for (const finding of importantFindings) {
    const inSource = hasWord(sourceLower, finding);
    const inImpression = hasWord(impressionLower, finding);

    if (inImpression && !inSource) {
      addWarning(warnings, {
        id: `unsupported-${finding}`,
        type: 'UNSUPPORTED_IMPRESSION_FINDING',
        title: 'Unsupported Impression Finding',
        badgeText: 'CRITICAL',
        dictationSnippet: 'Not present in dictation',
        generatedSnippet: finding,
        suggestedFix:
          'Remove the unsupported finding or verify it against the dictation.',
      });
    }
  }


    // ------------------------------------------------------------
    // 5. IMPORTANT FINDINGS MISSING FROM IMPRESSION
    // ------------------------------------------------------------

  for (const finding of importantFindings) {
    const inSource = hasWord(sourceLower, finding);
    const inImpression = hasWord(impressionLower, finding);

    if (inSource && !inImpression && !isNegated(sourceLower, finding)) {
      addWarning(warnings, {
        id: `missing-impression-${finding}`,
        type: 'MISSING_IMPRESSION_FINDING',
        title: 'Important Finding Missing from Impression',
        badgeText: 'WARNING',
        dictationSnippet: finding,
        generatedSnippet: 'Not mentioned in impression',
        suggestedFix:
          `Consider mentioning "${finding}" in the impression.`,
      });
    }
  }

  return warnings;
}