import React from 'react';
import { Info, X, ShieldCheck } from 'lucide-react';

interface AboutProps {
  onClose: () => void;
}

export default function About({ onClose }: AboutProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Bionic Flow
              </h2>

              <p className="text-xs text-slate-500 mt-0.5">
                Radiology Report Validator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close About"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* What it is */}
          <section>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              What it is
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed">
              A prototype application that validates a generated radiology
              report against the original dictation, treating the dictation
              as the source of truth.
            </p>
          </section>

          {/* What it checks */}
          <section>
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              What it checks
            </h3>

            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong className="text-slate-800">Laterality</strong> —
                  left/right mismatches
                </span>
              </li>

              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong className="text-slate-800">Measurements</strong> —
                  incorrect values or units
                </span>
              </li>

              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong className="text-slate-800">Negation</strong> —
                  findings incorrectly added or removed
                </span>
              </li>

              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong className="text-slate-800">Findings</strong> —
                  changes to dictated observations
                </span>
              </li>

              <li className="flex gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong className="text-slate-800">Impression</strong> —
                  inconsistencies between findings and impression
                </span>
              </li>
            </ul>
          </section>

          {/* How it works */}
          <section>
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              How it works
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                Dictation
              </span>

              <span className="text-slate-400">→</span>

              <span className="px-3 py-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
                Generate Report
              </span>

              <span className="text-slate-400">→</span>

              <span className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                Validate
              </span>

              <span className="text-slate-400">→</span>

              <span className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                Review & Sign Off
              </span>
            </div>
          </section>

          {/* Validation approach */}
          <section>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Validation approach
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed">
              The application currently operates in{' '}
              <strong className="text-slate-800">
                Mock Mode (No API)
              </strong>{' '}
              using deterministic validation rules and predefined test cases.
            </p>
          </section>

          {/* Limitations */}
          <section className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <h3 className="text-sm font-bold text-amber-900 mb-2">
              Current limitations
            </h3>

            <p className="text-sm text-amber-800 leading-relaxed">
              This is a prototype demonstration and not a clinical-grade
              medical validation system. It may not detect every possible
              discrepancy and should not be used as a substitute for
              professional review or clinical decision-making.
            </p>
          </section>

          {/* Purpose */}
          <section>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Purpose
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed">
              Demonstrate a human-in-the-loop workflow for detecting potential
              discrepancies in radiology reports.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span>Prototype</span>
          </div>

          <span className="text-xs font-medium text-slate-400">
            v1.0.0
          </span>
        </div>
      </div>
    </div>
  );
}