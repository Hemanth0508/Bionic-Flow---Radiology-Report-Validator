import React, { useState, useEffect } from 'react';
import {
  Shield,
  PlusCircle,
  FileSpreadsheet,
  History,
  Settings,
  Info,
  Clock,
  Trash2,
  Sparkles,
  ClipboardPaste,
  Copy,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronDown,
  Brain,
  Activity,
  Layers,
  Heart,
  RotateCcw
} from 'lucide-react';

import {
  StructuredReport,
  ValidationWarning,
  ReportSentence,
  ExtractedFacts
} from './types';

import About from './About';
import { TEST_CASES, TestCase } from './testCases';
import { generateReport } from './services/generator';
import { runValidation } from './services/validator';
import { extractDictationFacts } from './services/extractor';

export default function App() {
  // ============================================================
  // INITIAL CASE
  // ============================================================

  const initialCase =
    TEST_CASES.find(
      (tc) => tc.id === 'case-3'
    ) || TEST_CASES[0];

  // ============================================================
  // STATE
  // ============================================================

  const [selectedCaseId, setSelectedCaseId] =
    useState<string>(
      initialCase?.id || ''
    );

  const [dictation, setDictation] =
    useState<string>(
      initialCase?.dictation || ''
    );

  const [isGenerating, setIsGenerating] =
    useState<boolean>(false);

  const [report, setReport] =
    useState<StructuredReport | null>(null);

  const [warnings, setWarnings] =
    useState<ValidationWarning[]>([]);

  const [isSignedOff, setIsSignedOff] =
    useState<boolean>(false);

  const [showAbout, setShowAbout] =
    useState<boolean>(false);

  // NEW:
  // True when the user has changed the report after
  // the last validation and must explicitly re-run it.
  const [validationPending, setValidationPending] =
    useState<boolean>(false);

  const [extractedFacts, setExtractedFacts] =
    useState<ExtractedFacts>(
      extractDictationFacts(
        initialCase?.dictation || ''
      )
    );

  // ============================================================
  // UPDATE EXTRACTED FACTS
  // ============================================================

  useEffect(() => {
    setExtractedFacts(
      extractDictationFacts(dictation)
    );
  }, [dictation]);

  // ============================================================
  // SELECT TEST CASE
  // ============================================================

  const handleSelectCase = (tc: TestCase) => {
    setSelectedCaseId(tc.id);
    setDictation(tc.dictation);

    // A new case means there is no generated report yet.
    setReport(null);
    setWarnings([]);
    setValidationPending(false);
    setIsSignedOff(false);
  };

  // ============================================================
  // GENERATE REPORT
  // ============================================================

  const handleGenerate = async () => {
    const textToUse = dictation;

    if (
      !textToUse.trim() ||
      isGenerating
    ) {
      return;
    }

    setIsGenerating(true);
    setIsSignedOff(false);
    setValidationPending(false);

    // Clear previous output while generating.
    setReport(null);
    setWarnings([]);

    try {
      const generated =
        await generateReport(textToUse);

      setReport(generated);

      // Initial validation happens automatically
      // after report generation.
      const valWarnings =
        runValidation(
          textToUse,
          generated
        );

      setWarnings(valWarnings);

      // The generated report has just been validated.
      setValidationPending(false);
    } catch (error) {
      console.error(
        'Report generation failed:',
        error
      );

      setReport(null);
      setWarnings([]);
      setValidationPending(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================
  // SOURCE VALUE HELPERS
  // ============================================================

  const getSourceLaterality = (
    warning: ValidationWarning
  ) => {
    const source =
      warning.dictationSnippet.toLowerCase();

    if (source.includes('left')) {
      return 'left';
    }

    if (source.includes('right')) {
      return 'right';
    }

    if (
      extractedFacts.laterality &&
      extractedFacts.laterality !== 'UNKNOWN'
    ) {
      return extractedFacts.laterality.toLowerCase();
    }

    return null;
  };

  const getSourceMeasurement = (
    warning: ValidationWarning
  ) => {
    const match =
      warning.dictationSnippet.match(
        /\d+(?:\.\d+)?\s*(?:mm|millimetre|millimeter|millimetres|millimeters|cm|centimetre|centimeter|centimetres|centimeters)/i
      );

    if (match) {
      return match[0];
    }

    if (
      extractedFacts.measurement &&
      extractedFacts.measurement !== 'UNKNOWN'
    ) {
      return extractedFacts.measurement;
    }

    return null;
  };

  const getNegationTerm = (
    warning: ValidationWarning
  ) => {
    return warning.dictationSnippet
      .replace(
        /^no\s+/i,
        ''
      )
      .replace(
        /^without\s+/i,
        ''
      )
      .trim();
  };

  // ============================================================
  // CORRECT WARNING
  //
  // IMPORTANT:
  // We change the report only.
  // We DO NOT run validation here.
  // User must explicitly click Re-run Validation.
  // ============================================================

  const handleCorrectWarning = (
    id: string
  ) => {
    if (!report) return;

    const warning =
      warnings.find(
        (w) => w.id === id
      );

    if (!warning) return;

    let updatedImpression =
      [...report.impression];

    // ----------------------------------------------------------
    // LATERALITY
    // ----------------------------------------------------------

    if (
      warning.type ===
      'LATERALITY_MISMATCH'
    ) {
      const sourceLaterality =
        getSourceLaterality(warning);

      if (sourceLaterality) {
        updatedImpression =
          updatedImpression.map(
            (sentence) => ({
              ...sentence,
              text: sentence.text
                .replace(
                  /\bleft\b/gi,
                  sourceLaterality
                )
                .replace(
                  /\bright\b/gi,
                  sourceLaterality
                )
            })
          );
      }
    }

    // ----------------------------------------------------------
    // MEASUREMENT
    // ----------------------------------------------------------

    else if (
      warning.type ===
      'MEASUREMENT_MISMATCH'
    ) {
      const sourceMeasurement =
        getSourceMeasurement(warning);

      if (sourceMeasurement) {
        updatedImpression =
          updatedImpression.map(
            (sentence) => ({
              ...sentence,
              text: sentence.text.replace(
                /\b\d+(?:\.\d+)?\s*(?:mm|millimetre|millimeter|millimetres|millimeters|cm|centimetre|centimeter|centimetres|centimeters)\b/gi,
                sourceMeasurement
              )
            })
          );
      }
    }

    // ----------------------------------------------------------
    // NEGATION
    // ----------------------------------------------------------

    else if (
      warning.type ===
      'NEGATION_MISMATCH'
    ) {
      const term =
        getNegationTerm(warning);

      if (term) {
        const escapedTerm =
          term.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          );

        updatedImpression =
          updatedImpression.map(
            (sentence) => {
              let text =
                sentence.text;

              const alreadyNegated =
                new RegExp(
                  `\\b(?:no|without|absent)\\s+${escapedTerm}\\b`,
                  'i'
                );

              if (
                alreadyNegated.test(text)
              ) {
                return {
                  ...sentence,
                  text
                };
              }

              text = text.replace(
                new RegExp(
                  `\\bwith\\s+${escapedTerm}\\b`,
                  'gi'
                ),
                `without ${term}`
              );

              return {
                ...sentence,
                text
              };
            }
          );
      }
    }

    // ----------------------------------------------------------
    // UNSUPPORTED IMPRESSION FINDING
    // ----------------------------------------------------------

    else if (
      warning.type ===
      'UNSUPPORTED_IMPRESSION_FINDING'
    ) {
      const snippet =
        warning.generatedSnippet
          .replace(
            /\s*\(.*?\)\s*$/,
            ''
          )
          .trim();

      if (snippet) {
        const escapedSnippet =
          snippet.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          );

        updatedImpression =
          updatedImpression.map(
            (sentence) => ({
              ...sentence,
              text: sentence.text
                .replace(
                  new RegExp(
                    `\\b${escapedSnippet}\\b`,
                    'gi'
                  ),
                  ''
                )
                .replace(
                  /\s{2,}/g,
                  ' '
                )
                .replace(
                  /\s+\./g,
                  '.'
                )
                .trim()
            })
          );
      }
    }

    const updatedReport: StructuredReport = {
      ...report,
      impression:
        updatedImpression
    };

    setReport(updatedReport);

    // IMPORTANT:
    // Don't mark it as CORRECTED yet.
    // The validator has not confirmed the change.
    setValidationPending(true);
    setIsSignedOff(false);
  };

  // ============================================================
  // DISMISS WARNING
  //
  // Dismiss is a reviewer decision.
  // We don't re-run validation immediately.
  // ============================================================

  const handleDismissWarning = (
    id: string
  ) => {
    setWarnings((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              resolved: true,
              resolution: 'DISMISSED'
            }
          : w
      )
    );

    setValidationPending(true);
    setIsSignedOff(false);
  };

  // ============================================================
  // MANUAL SENTENCE EDIT
  // ============================================================

  const handleSentenceChange = (
    section:
      | 'findings'
      | 'impression',
    id: string,
    val: string
  ) => {
    if (!report) return;

    const updated: StructuredReport = {
      ...report,
      [section]:
        report[section].map(
          (s: ReportSentence) =>
            s.id === id
              ? {
                  ...s,
                  text: val
                }
              : s
        )
    };

    setReport(updated);

    // Manual edits require explicit re-validation.
    setValidationPending(true);
    setIsSignedOff(false);
  };

  // ============================================================
  // RE-RUN VALIDATION
  // ============================================================

  const handleRerunValidation = () => {
    if (!report) return;

    const recheckedWarnings =
      runValidation(
        dictation,
        report
      );

    setWarnings(
      recheckedWarnings
    );

    setValidationPending(false);
    setIsSignedOff(false);
  };

  // ============================================================
  // CLEAR ALL
  // ============================================================

  const handleClearAll = () => {
    setSelectedCaseId(
      'case-custom'
    );

    setDictation('');
    setReport(null);
    setWarnings([]);
    setValidationPending(false);
    setIsSignedOff(false);
  };

  // ============================================================
  // PASTE
  // ============================================================

  const handlePaste = async () => {
    try {
      const text =
        await navigator.clipboard.readText();

      setDictation(text);
      setSelectedCaseId(
        'case-custom'
      );

      setReport(null);
      setWarnings([]);
      setValidationPending(false);
      setIsSignedOff(false);
    } catch {
      // Clipboard permission denied.
    }
  };

  // ============================================================
  // COPY
  // ============================================================

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        dictation
      );
    } catch {
      // Clipboard permission denied.
    }
  };

  // ============================================================
  // COUNTS
  // ============================================================

  const unhandledCount =
    warnings.filter(
      (w) => !w.resolved
    ).length;

  const resolvedCount =
    warnings.filter(
      (w) =>
        w.resolution ===
        'CORRECTED'
    ).length;

  const dismissedCount =
    warnings.filter(
      (w) =>
        w.resolution ===
        'DISMISSED'
    ).length;

  // ============================================================
  // SOURCE BADGES
  // ============================================================

  const renderBadge = (
    source: ReportSentence['source']
  ) => {
    if (source === 'DICTATION') {
      return (
        <span className="text-[10px] font-bold text-[#1d4ed8] bg-[#dbeafe] px-2 py-0.5 rounded tracking-wide shrink-0">
          DICTATION
        </span>
      );
    }

    if (source === 'TEMPLATE') {
      return (
        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded tracking-wide shrink-0">
          TEMPLATE
        </span>
      );
    }

    return (
      <span className="text-[10px] font-bold text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded tracking-wide shrink-0">
        SYSTEM INFERENCE
      </span>
    );
  };

  // ============================================================
  // TEST CASE ICONS
  // ============================================================

  const getCaseIcon = (
    type: TestCase['iconType'],
    isSelected: boolean
  ) => {
    const colorClass =
      isSelected
        ? 'text-blue-600'
        : 'text-slate-500';

    switch (type) {
      case 'brain':
        return (
          <Brain
            className={`w-4 h-4 ${colorClass}`}
          />
        );

      case 'liver':
        return (
          <Activity
            className={`w-4 h-4 ${colorClass}`}
          />
        );

      case 'kidney':
        return (
          <Layers
            className={`w-4 h-4 ${colorClass}`}
          />
        );

      case 'custom':
        return (
          <Heart
            className={`w-4 h-4 ${colorClass}`}
          />
        );
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] text-slate-800 font-sans">

      {/* ======================================================
          SIDEBAR
      ======================================================= */}

      <aside className="w-64 bg-[#030712] text-slate-300 flex flex-col justify-between shrink-0 select-none border-r border-slate-900">

        <div>

          <div className="p-5 flex items-center gap-3">

            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5 fill-current" />
            </div>

            <div>

              <div className="font-bold text-white text-base tracking-tight leading-none">
                Bionic Flow
              </div>

              <div className="text-[11px] text-slate-400 mt-1">
                Radiology Report Validator
              </div>

            </div>

          </div>

          <nav className="px-3 mt-4 space-y-1 text-xs font-medium">

            <button
              onClick={handleClearAll}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-blue-400" />
              <span>New Case</span>
            </button>

            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1e293b] text-white shadow-sm font-semibold"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              <span>Test Cases</span>
            </button>

          {/*  <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>

            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button> */ }

            <button
              onClick={() => setShowAbout(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Info className="w-4 h-4" />
              <span>About</span>
            </button>

          </nav>
        </div>

        <div className="p-4">

          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-center">

            <div className="w-8 h-8 mx-auto mb-2.5 rounded-lg bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
              <Shield className="w-4 h-4" />
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              AI proposes.
              <br />
              Validator verifies.
              <br />
              <span className="text-blue-400 font-semibold">
                You decide.
              </span>
            </p>

          </div>

          <div className="text-[11px] text-slate-600 mt-4 px-1">
            Hemanth_v1.0.0
          </div>

        </div>

      </aside>

      {/* ======================================================
          MAIN
      ======================================================= */}

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        <header className="px-8 py-5 flex items-center justify-between border-b border-slate-200 bg-white/70 backdrop-blur sticky top-0 z-10">

          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            New Case
          </h1>

          <div className="flex items-center gap-4 text-xs font-medium">

            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">

              <Clock className="w-3.5 h-3.5 text-slate-400" />

              <span>
                Generation time:{' '}
                <strong className="text-blue-600 font-mono">
                  {report
                    ? `${(
                        report.generationTimeMs /
                        1000
                      ).toFixed(2)}s`
                    : '—'}
                </strong>
              </span>

            </div>

            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700">

              <span className="text-slate-400 font-normal">
                Mode
              </span>

              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Mock (No API)
              </span>

            </div>

            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-slate-600 hover:text-rose-600 bg-white border border-slate-200 hover:border-rose-200 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>

          </div>

        </header>

        <div className="p-8 space-y-6 max-w-[1550px] w-full mx-auto">

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

            {/* ==================================================
                LEFT
            =================================================== */}

            <div className="xl:col-span-8 space-y-6">

              {/* DICTATION */}

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">

                <div className="flex items-center gap-2">

                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </div>

                  <h2 className="text-sm font-bold text-slate-900">
                    Dictation{' '}
                    <span className="font-normal text-slate-500">
                      (Original Source of Truth)
                    </span>
                  </h2>

                </div>

                <div className="relative">

                  <textarea
                    className="w-full min-h-[140px] p-4 text-sm font-sans text-slate-800 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/40 leading-relaxed resize-y"
                    value={dictation}
                    onChange={(e) => {

                      setDictation(
                        e.target.value
                      );

                      setSelectedCaseId(
                        'case-custom'
                      );

                      setReport(null);
                      setWarnings([]);
                      setValidationPending(
                        false
                      );
                      setIsSignedOff(false);

                    }}
                    placeholder="Enter or paste any radiology dictation here (Cardiac, Chest, Spine, Abdomen, Brain, etc.)..."
                  />

                  <div className="absolute bottom-3 right-3 flex items-center gap-2">

                    <button
                      onClick={handlePaste}
                      className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-600 shadow-xs transition-colors flex items-center gap-1"
                    >
                      <ClipboardPaste className="w-3 h-3" />
                      Paste
                    </button>

                    <button
                      onClick={handleCopy}
                      className="p-1 text-xs bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-600 shadow-xs transition-colors"
                      title="Copy"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>
                    {dictation.length} characters
                  </span>
                </div>

              </div>

              {/* GENERATE */}

              <div className="flex items-center gap-3">

                <button
                  onClick={handleGenerate}
                  disabled={
                    isGenerating ||
                    !dictation.trim()
                  }
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 text-sm transition-all"
                >

                  <Sparkles className="w-4 h-4" />

                  <span>
                    {isGenerating
                      ? 'Generating...'
                      : 'Generate Report'}
                  </span>

                </button>

                <span className="text-xs text-slate-400">
                  Uses deterministic rules (mock mode)
                </span>

              </div>

              {/* GENERATED REPORT */}

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">

                <div className="flex items-center gap-2">

                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </div>

                  <h2 className="text-sm font-bold text-slate-900">
                    Generated Structured Report
                  </h2>

                </div>

                {isGenerating ? (

                  <div className="py-12 text-center text-slate-400 text-sm">

                    <div className="flex flex-col items-center gap-3">

                      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />

                      <span>
                        Generating structured report...
                      </span>

                    </div>

                  </div>

                ) : !report ? (

                  <div className="py-12 text-center text-slate-400 text-sm">

                    <div className="flex flex-col items-center gap-2">

                      <Sparkles className="w-7 h-7 text-slate-300" />

                      <span>
                        Click "Generate Report" to view structured findings and impression.
                      </span>

                    </div>

                  </div>

                ) : (

                  <>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* FINDINGS */}

                      <div className="space-y-3">

                        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wide">

                          <FileSpreadsheet className="w-3.5 h-3.5" />

                          <span>
                            Findings
                          </span>

                        </div>

                        <div className="space-y-2">

                          {report.findings.map(
                            (s) => (

                              <div
                                key={s.id}
                                className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs leading-normal hover:border-slate-300 transition-colors shadow-2xs"
                              >

                                <input
                                  type="text"
                                  value={s.text}
                                  onChange={(e) =>
                                    handleSentenceChange(
                                      'findings',
                                      s.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-transparent border-none focus:outline-none text-slate-800"
                                />

                                {renderBadge(
                                  s.source
                                )}

                              </div>

                            )
                          )}

                        </div>

                      </div>

                      {/* IMPRESSION */}

                      <div className="space-y-3">

                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 uppercase tracking-wide">

                          <Layers className="w-3.5 h-3.5" />

                          <span>
                            Impression
                          </span>

                        </div>

                        <div className="space-y-2">

                          {report.impression.map(
                            (s) => (

                              <div
                                key={s.id}
                                className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs leading-normal hover:border-slate-300 transition-colors shadow-2xs"
                              >

                                <input
                                  type="text"
                                  value={s.text}
                                  onChange={(e) =>
                                    handleSentenceChange(
                                      'impression',
                                      s.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-full bg-transparent border-none focus:outline-none text-slate-800 font-medium"
                                />

                                {renderBadge(
                                  s.source
                                )}

                              </div>

                            )
                          )}

                        </div>

                      </div>

                    </div>

                    {/* SOURCE LEGEND */}

                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">

                      <span className="font-semibold text-slate-700">
                        Source of each sentence:
                      </span>

                      <div className="flex items-center gap-1.5">

                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                          DICTATION
                        </span>

                        <span className="text-[11px] text-slate-500">
                          From Dictation
                        </span>

                      </div>

                      <div className="flex items-center gap-1.5">

                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border px-1.5 py-0.5 rounded">
                          TEMPLATE
                        </span>

                        <span className="text-[11px] text-slate-500">
                          From Template
                        </span>

                      </div>

                      <div className="flex items-center gap-1.5">

                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          SYSTEM INFERENCE
                        </span>

                        <span className="text-[11px] text-slate-500">
                          System Inference
                        </span>

                      </div>

                    </div>

                    {/* EXTRACTED FACTS */}

                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">

                          <div className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
                            ✓
                          </div>

                          <span>
                            Extracted Facts (From Dictation)
                          </span>

                        </div>

                        <ChevronDown className="w-4 h-4 text-slate-400" />

                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">

                        <div className="p-2.5 bg-emerald-50/50 border border-emerald-200/80 rounded-lg">

                          <div className="text-[10px] text-emerald-800 font-medium">
                            Laterality
                          </div>

                          <div className="text-xs font-bold text-emerald-950 mt-0.5 uppercase">
                            {extractedFacts.laterality}
                          </div>

                        </div>

                        <div className="p-2.5 bg-emerald-50/50 border border-emerald-200/80 rounded-lg">

                          <div className="text-[10px] text-emerald-800 font-medium">
                            Measurement
                          </div>

                          <div className="text-xs font-bold text-emerald-950 mt-0.5">
                            {extractedFacts.measurement}
                          </div>

                        </div>

                        <div className="p-2.5 bg-emerald-50/50 border border-emerald-200/80 rounded-lg">

                          <div className="text-[10px] text-emerald-800 font-medium">
                            Negation
                          </div>

                          <div className="text-xs font-bold text-emerald-950 mt-0.5">
                            {extractedFacts.negation}
                          </div>

                        </div>

                        <div className="p-2.5 bg-emerald-50/50 border border-emerald-200/80 rounded-lg">

                          <div className="text-[10px] text-emerald-800 font-medium">
                            Anatomy
                          </div>

                          <div className="text-xs font-bold text-emerald-950 mt-0.5">
                            {extractedFacts.anatomy}
                          </div>

                        </div>

                        <div className="p-2.5 bg-emerald-50/50 border border-emerald-200/80 rounded-lg">

                          <div className="text-[10px] text-emerald-800 font-medium">
                            Findings
                          </div>

                          <div className="text-xs font-bold text-emerald-950 mt-0.5">
                            {extractedFacts.findings}
                          </div>

                        </div>

                      </div>

                    </div>

                  </>

                )}

              </div>

            </div>

            {/* ==================================================
                RIGHT
            =================================================== */}

            <div className="xl:col-span-4 space-y-6">

              {/* TEST CASES */}

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2.5">

                <div className="flex items-center justify-between px-1">

                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Test Cases
                  </h3>

                  <span className="text-[10px] font-semibold text-slate-400">
                    {TEST_CASES.length} Presets
                  </span>

                </div>

                <div className="space-y-2">

                  {TEST_CASES.map(
                    (tc) => {

                      const isSelected =
                        selectedCaseId ===
                        tc.id;

                      return (

                        <button
                          key={tc.id}
                          onClick={() =>
                            handleSelectCase(
                              tc
                            )
                          }
                          className={`w-full p-3 rounded-lg border text-left flex items-start gap-3 transition-all ${
                            isSelected
                              ? 'bg-blue-50/60 border-blue-500 shadow-2xs ring-1 ring-blue-500/20'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >

                          <div className="mt-0.5">
                            {getCaseIcon(
                              tc.iconType,
                              isSelected
                            )}
                          </div>

                          <div className="flex-1 min-w-0">

                            <div
                              className={`text-xs font-bold ${
                                isSelected
                                  ? 'text-blue-950'
                                  : 'text-slate-800'
                              }`}
                            >
                              {tc.title}
                            </div>

                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {tc.subtitle}
                            </div>

                          </div>

                        </button>

                      );
                    }
                  )}

                </div>

              </div>

              {/* VALIDATION */}

              <div className="space-y-3">

                <div className="flex items-center justify-between px-1">

                  <div className="flex items-center gap-2">

                    <div className="w-5 h-5 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
                      3
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      Validation Warnings
                    </h3>

                  </div>

                  {warnings.length > 0 && (
                    <span className="text-xs text-rose-600 font-semibold">
                      {unhandledCount} critical
                    </span>
                  )}

                </div>

                {!report ? (

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2.5 shadow-2xs">

                    <Shield className="w-4 h-4 text-slate-400 shrink-0" />

                    <span>
                      Generate a report to begin validation.
                    </span>

                  </div>

                ) : warnings.length === 0 ? (

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5 shadow-2xs">

                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />

                    <span>
                      All claims verified against dictation facts. No inconsistencies detected.
                    </span>

                  </div>

                ) : (

                  <div className="space-y-3">

                    {warnings.map(
                      (w) => (

                        <div
                          key={w.id}
                          className={`p-4 rounded-xl border text-xs transition-all shadow-2xs ${
                            w.resolved
                              ? 'bg-slate-50 border-slate-200 opacity-60'
                              : 'bg-white border-rose-200'
                          }`}
                        >

                          <div className="flex items-center justify-between mb-2">

                            <span className="font-bold text-slate-900 flex items-center gap-1.5">

                              <AlertCircle className="w-4 h-4 text-rose-600" />

                              {w.title}

                            </span>

                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                w.resolved
                                  ? 'bg-slate-200 text-slate-600'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {w.resolved
                                ? w.resolution
                                : w.badgeText}
                            </span>

                          </div>

                          <div className="space-y-2 mt-3 text-[11px]">

                            <div>

                              <div className="text-slate-400 font-medium mb-1">
                                Dictation (Source of Truth)
                              </div>

                              <div className="p-2 rounded bg-emerald-50 text-emerald-950 font-medium border border-emerald-200/60">
                                {w.dictationSnippet}
                              </div>

                            </div>

                            <div>

                              <div className="text-slate-400 font-medium mb-1">
                                Impression (Generated)
                              </div>

                              <div className="p-2 rounded bg-rose-50 text-rose-950 font-medium border border-rose-200/60">
                                {w.generatedSnippet}
                              </div>

                            </div>

                          </div>

                          {!w.resolved && (

                            <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-100">

                              <button
                                onClick={() =>
                                  handleCorrectWarning(
                                    w.id
                                  )
                                }
                                className="px-3 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-blue-300 font-semibold rounded shadow-2xs text-[11px] transition-colors"
                              >
                                Correct
                              </button>

                              <button
                                onClick={() =>
                                  handleDismissWarning(
                                    w.id
                                  )
                                }
                                className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold rounded shadow-2xs text-[11px] transition-colors"
                              >
                                Dismiss
                              </button>

                            </div>

                          )}

                        </div>

                      )
                    )}

                  </div>

                )}

                {/* =================================================
                    RE-RUN VALIDATION
                ================================================== */}

                {report && (
                  <div className="pt-2">

                    <button
                      onClick={
                        handleRerunValidation
                      }
                      disabled={
                        !validationPending
                      }
                      className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        validationPending
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      }`}
                    >

                      <RotateCcw className="w-3.5 h-3.5" />

                      <span>
                        Re-run Validation
                      </span>

                    </button>

                    {validationPending && (

                      <div className="text-[10px] text-amber-600 text-center mt-1.5">
                        Changes made — re-run validation before sign-off.
                      </div>

                    )}

                  </div>
                )}

                {/* =================================================
                    SIGN OFF
                ================================================== */}

                <div className="pt-2">

                  <button
                    disabled={
                      !report ||
                      unhandledCount > 0 ||
                      validationPending ||
                      isSignedOff
                    }
                    onClick={() =>
                      setIsSignedOff(
                        true
                      )
                    }
                    className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${
                      !report ||
                      unhandledCount > 0 ||
                      validationPending ||
                      isSignedOff
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >

                    {isSignedOff ? (

                      <>
                        <CheckCircle2 className="w-4 h-4" />

                        <span>
                          Report Signed Off ✓
                        </span>
                      </>

                    ) : validationPending ? (

                      <div className="text-center">

                        <div className="flex items-center justify-center gap-1.5">

                          <Lock className="w-3.5 h-3.5" />

                          <span>
                            Sign Off
                          </span>

                        </div>

                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          Re-run validation before sign-off
                        </div>

                      </div>

                    ) : unhandledCount > 0 ? (

                      <div className="text-center">

                        <div className="flex items-center justify-center gap-1.5">

                          <Lock className="w-3.5 h-3.5" />

                          <span>
                            Sign Off
                          </span>

                        </div>

                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          Resolve all critical warnings to enable sign-off
                        </div>

                      </div>

                    ) : !report ? (

                      <div className="text-center">

                        <div className="flex items-center justify-center gap-1.5">

                          <Lock className="w-3.5 h-3.5" />

                          <span>
                            Sign Off
                          </span>

                        </div>

                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          Generate and validate a report first
                        </div>

                      </div>

                    ) : (

                      <>
                        <CheckCircle2 className="w-4 h-4" />

                        <span>
                          Sign Off Report
                        </span>
                      </>

                    )}

                  </button>

                </div>

              </div>

            </div>

          </div>

          {/* ====================================================
              STATUS BAR
          ===================================================== */}

          <div
            className={`rounded-xl border p-4 flex items-center justify-between shadow-xs transition-all ${
              !report ||
              unhandledCount > 0 ||
              validationPending
                ? 'bg-amber-50/60 border-amber-200'
                : 'bg-emerald-50/60 border-emerald-200'
            }`}
          >

            <div className="flex items-center gap-3">

              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  !report ||
                  unhandledCount > 0 ||
                  validationPending
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >

                {unhandledCount > 0 ||
                !report ||
                validationPending ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}

              </div>

              <div>

                <div className="text-xs font-bold text-slate-900">

                  {!report
                    ? 'Report not generated yet.'
                    : validationPending
                    ? 'Validation pending.'
                    : unhandledCount > 0
                    ? 'Report not ready for sign-off.'
                    : 'Report verified and ready for sign-off.'}

                </div>

                <div className="text-[11px] text-slate-500">

                  {!report
                    ? 'Generate the report to run deterministic validation.'
                    : validationPending
                    ? 'Review your changes and re-run validation before sign-off.'
                    : unhandledCount > 0
                    ? 'Please resolve all critical warnings.'
                    : 'All critical facts match the original dictation.'}

                </div>

              </div>

            </div>

            <div className="flex items-center gap-3 text-xs font-medium text-slate-600">

              <span className="text-rose-600 font-bold">
                {unhandledCount} critical
              </span>

              <span>•</span>

              <span className="text-slate-600">
                {resolvedCount} resolved
              </span>

              <span>•</span>

              <span className="text-slate-600">
                {dismissedCount} dismissed
              </span>

            </div>

          </div>

        </div>

      </main>

      {showAbout && (
        <About
          onClose={() => setShowAbout(false)}
        />
      )}


    </div>
  );
}