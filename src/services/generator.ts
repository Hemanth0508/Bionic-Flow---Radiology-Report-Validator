import { StructuredReport, ReportSentence } from '../types';
import { extractDictationFacts } from './extractor';

function createSentence(
  id: string,
  text: string,
  source: ReportSentence['source']
): ReportSentence {
  return { id, text, source };
}

export async function generateReport(
  dictation: string
): Promise<StructuredReport> {
  const start = performance.now();

  // Anything after "Impression:" is treated as the candidate
  // impression that needs to be validated.
  const impressionMatch = dictation.match(
    /impression:\s*(.+)$/is
  );

  const sourceText = impressionMatch
    ? dictation.slice(0, impressionMatch.index).trim()
    : dictation.trim();

  const suppliedImpression = impressionMatch?.[1]?.trim();

  const facts = extractDictationFacts(sourceText);

  // ============================================================
  // FINDINGS
  // ============================================================

  const findings: ReportSentence[] = [];

  const sentences = sourceText
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  sentences.forEach((sentence, index) => {
    findings.push(
      createSentence(
        `finding-${index + 1}`,
        sentence.endsWith('.') ? sentence : `${sentence}.`,
        'DICTATION'
      )
    );
  });

  // ============================================================
  // IMPRESSION
  // ============================================================

  const impression: ReportSentence[] = [];

  /*
   * If the user supplied an Impression section, preserve it as
   * the candidate impression.
   *
   * The validator will independently compare this against the
   * original dictation facts.
   */
  if (suppliedImpression) {
    impression.push(
      createSentence(
        'impression-1',
        suppliedImpression.endsWith('.')
          ? suppliedImpression
          : `${suppliedImpression}.`,
        'SYSTEM INFERENCE'
      )
    );
  } else {
    /*
     * No supplied impression:
     * generate one dynamically from the dictation.
     */

    const positiveFindings: string[] = [];

    // Brain haemorrhage
    if (/\bhaemorrhage\b|\bhemorrhage\b/i.test(sourceText)) {
      positiveFindings.push('haemorrhage');
    }

    // Oedema
    if (/\boedema\b|\bedema\b/i.test(sourceText)) {
      positiveFindings.push('oedema');
    }

    // Lesion
    if (/\blesion\b/i.test(sourceText)) {
      positiveFindings.push('lesion');
    }

    // Effusion
    if (/\beffusion\b/i.test(sourceText)) {
      positiveFindings.push('effusion');
    }

    // Thickening
    if (/\bthickening\b/i.test(sourceText)) {
      positiveFindings.push('thickening');
    }

    // Fracture
    if (/\bfracture\b/i.test(sourceText)) {
      positiveFindings.push('fracture');
    }

    // Pneumothorax
    if (/\bpneumothorax\b/i.test(sourceText)) {
      positiveFindings.push('pneumothorax');
    }

    // Dilatation
    if (/\bdilatation\b/i.test(sourceText)) {
      positiveFindings.push('dilatation');
    }

    let impressionText = '';

    // ------------------------------------------------------------
    // HAEMORRHAGE
    // ------------------------------------------------------------

    if (positiveFindings.includes('haemorrhage')) {
      const side =
        facts.laterality !== '—'
          ? capitalize(facts.laterality)
          : '';

      const anatomy =
        facts.anatomy !== '—'
          ? facts.anatomy
          : '';

      impressionText =
        `${side} ${anatomy} haemorrhage`
          .replace(/\s+/g, ' ')
          .trim();

      if (facts.measurement !== '—') {
        impressionText += ` measuring ${facts.measurement}`;
      }

      if (positiveFindings.includes('oedema')) {
        impressionText += ' with mild surrounding oedema';
      }
    }

    // ------------------------------------------------------------
    // LESION
    // ------------------------------------------------------------

    else if (positiveFindings.includes('lesion')) {
      if (/kidney|renal/i.test(facts.anatomy)) {
        const side =
          facts.laterality !== '—'
            ? capitalize(facts.laterality)
            : '';

        impressionText = `${side} renal lesion`.trim();

        if (facts.measurement !== '—') {
          impressionText += ` measuring ${facts.measurement}`;
        }
      } else {
        const side =
          facts.laterality !== '—'
            ? `${capitalize(facts.laterality)} `
            : '';

        impressionText =
          `${side}lesion`.trim();

        if (facts.measurement !== '—') {
          impressionText += ` measuring ${facts.measurement}`;
        }
      }
    }

    // ------------------------------------------------------------
    // OTHER FINDINGS
    // ------------------------------------------------------------

    else if (positiveFindings.length > 0) {
      impressionText = positiveFindings
        .map((finding) => capitalize(finding))
        .join(', ');
    }

    // ------------------------------------------------------------
    // ADD GENERATED IMPRESSION
    // ------------------------------------------------------------

    if (impressionText) {
      impression.push(
        createSentence(
          'impression-1',
          `${impressionText}.`,
          'SYSTEM INFERENCE'
        )
      );
    }

    // ------------------------------------------------------------
    // PRESERVE NEGATIVE FINDINGS
    // ------------------------------------------------------------

    if (facts.negation !== 'None detected') {
      impression.push(
        createSentence(
          'impression-2',
          facts.negation.endsWith('.')
            ? facts.negation
            : `${facts.negation}.`,
          'DICTATION'
        )
      );
    }
  }

  // Fallback if nothing could be confidently generated.
  if (impression.length === 0) {
    impression.push(
      createSentence(
        'impression-1',
        'No definitive impression generated from the available facts.',
        'TEMPLATE'
      )
    );
  }

  const generationTimeMs = Math.max(
    100,
    Math.round(performance.now() - start)
  );

  return {
    findings,
    impression,
    generationTimeMs,
  };
}

function capitalize(value: string): string {
  if (!value) return value;

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1).toLowerCase()
  );
}