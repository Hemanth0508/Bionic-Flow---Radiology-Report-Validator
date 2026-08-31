import { ExtractedFacts } from '../types';

export function extractDictationFacts(text: string): ExtractedFacts {
  // Only the factual/source portion matters for validation.
  const sourceText = text.split(/impression:/i)[0] || text;
  const lower = sourceText.toLowerCase();

  // -----------------------------
  // Laterality
  // -----------------------------
  let laterality = '—';

  if (/\bbilateral\b|\bboth\b/i.test(lower)) {
    laterality = 'BILATERAL';
  } else if (/\bleft\b/i.test(lower) && /\bright\b/i.test(lower)) {
    laterality = 'BILATERAL (L+R)';
  } else if (/\bleft\b/i.test(lower)) {
    laterality = 'LEFT';
  } else if (/\bright\b/i.test(lower)) {
    laterality = 'RIGHT';
  }

  // -----------------------------
  // Measurements
  // Supports:
  // 14 mm
  // 14 millimetre
  // 2.4 cm
  // 12 by 8 mm
  // 12 x 8 mm
  // -----------------------------
  const measurementRegex =
    /\b\d+(?:\.\d+)?(?:\s*(?:by|x|×)\s*\d+(?:\.\d+)?)?\s*(?:mm|millimetre|millimeter|millimetres|millimeters|cm|centimetre|centimeter|centimetres|centimeters)\b/i;

  const measurementMatch = sourceText.match(measurementRegex);

  const measurement = measurementMatch
    ? measurementMatch[0].trim()
    : '—';

  // -----------------------------
  // Negations
  // -----------------------------
  const negationPatterns = [
    /\bno\s+([a-zA-Z][a-zA-Z\s-]{2,40}?)(?=[.,;]|$)/i,
    /\bwithout\s+([a-zA-Z][a-zA-Z\s-]{2,40}?)(?=[.,;]|$)/i,
    /\bnegative\s+for\s+([a-zA-Z][a-zA-Z\s-]{2,40}?)(?=[.,;]|$)/i,
    /\babsent\s+([a-zA-Z][a-zA-Z\s-]{2,40}?)(?=[.,;]|$)/i,
  ];

  let negation = 'None detected';

  for (const pattern of negationPatterns) {
    const match = sourceText.match(pattern);

    if (match) {
      negation = match[0].trim();
      break;
    }
  }

  // -----------------------------
  // Anatomy
  // -----------------------------
  const anatomyTerms = [
    'left kidney',
    'right kidney',
    'kidney',
    'renal',
    'liver',
    'gallbladder',
    'spleen',
    'pancreas',
    'basal ganglia',
    'ventricles',
    'cerebrum',
    'cerebellum',
    'lungs',
    'pleura',
    'apex',
    'left ventricle',
    'right ventricle',
    'left atrium',
    'right atrium',
    'myocardium',
    'pericardial',
    'aorta',
  ];

  const anatomy =
    anatomyTerms.find((term) => lower.includes(term)) ?? '—';

  // -----------------------------
  // Important findings
  // -----------------------------
  const findingTerms = [
    'haemorrhage',
    'hemorrhage',
    'lesion',
    'effusion',
    'oedema',
    'edema',
    'thickening',
    'infarct',
    'mass',
    'nodule',
    'fracture',
    'dilatation',
    'pneumothorax',
    'abnormal',
  ];

  const findings =
    findingTerms.find((term) => lower.includes(term)) ?? '—';

  return {
    laterality,
    measurement,
    negation,
    anatomy,
    findings,
  };
}