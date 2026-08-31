# Bionic Flow

### Radiology Reporting Validator — Prototype

Bionic Flow is a prototype radiology reporting assistant designed to transform dictated clinical findings into a structured report and validate the generated content against the original dictation before sign-off.

The core principle is simple:

> **The original dictation is the Source of Truth.**

The system is designed to make potentially important inconsistencies visible before a report is signed off.

---

## Overview

Radiology reports contain small details that can have significant clinical meaning.

A generated impression may look reasonable while accidentally changing:

- Laterality
- Measurements
- Negations
- Anatomy
- Findings

For example:

```text
Dictation:
There is a 14 millimetre lesion in the left kidney.
No hydronephrosis.

Generated Impression:
Right renal lesion measuring 14 centimetres with hydronephrosis.
```

Although the generated sentence sounds plausible, it contains multiple contradictions with the original dictation.
Bionic Flow treats the dictation as the authoritative source and validates the generated report against it.

## Core Workflow

```text
              DICTATION
           Source of Truth
                   │
                   ▼
            Fact Extraction
                   │
                   ▼
          Structured Generation
                   │
                   ▼
              VALIDATION
                   │
          ┌────────┴────────┐
          │                 │
       Consistent      Inconsistency
          │                 │
          ▼                 ▼
      Sign Off       Correct / Dismiss
                            │
                            ▼
                     Re-run Validation
                            │
                            ▼
                         Sign Off
```

The intended workflow is:

1. Enter or select a dictation.
2. Generate a structured report.
3. Extract important facts from the dictation.
4. Compare generated content against those facts.
5. Surface validation warnings when inconsistencies are detected.
6. Correct or dismiss warnings.
7. Re-run validation after changes.
8. Enable sign-off only when the report has passed the validation workflow.

## Key Product Principle

### Dictation = Source of Truth

The generated report is not treated as authoritative.
Instead, Bionic Flow extracts relevant facts from the original dictation and uses those facts when validating the generated report.

This makes the workflow:

```text
Original Dictation
       ↓
Extract Facts
       ↓
Generate Report
       ↓
Compare Generated Content
       ↓
Flag Inconsistencies
```

This is particularly important for generated medical content where a sentence can be grammatically correct and clinically plausible while still contradicting the original source.

## What Bionic Flow Extracts

The prototype currently extracts the following fact categories:

### Laterality
Examples:
- Left
- Right

Used to detect situations such as:
- **Dictation:** left kidney
- **Generated:** right kidney

### Measurement
Examples:
- 14 millimetre
- 12 by 8 millimetre
- 2.4 centimetre

Used to detect measurement inconsistencies between the source dictation and generated impression.

### Negation
Examples:
- No hydronephrosis
- No midline shift
- No biliary dilatation

Negation is important because changing a negative finding into a positive finding can materially alter the meaning of a report.

### Anatomy
Examples include:
- left kidney
- right kidney
- basal ganglia
- liver

The prototype uses extracted anatomical information when constructing and validating the structured report.

### Findings
Examples:
- lesion
- haemorrhage

These represent the primary clinical findings identified by the extractor.

## Validation

The validator currently checks several important inconsistency types.

### 1. Laterality Mismatch
Detects conflicts such as:
- **Dictation:** Left kidney
- **Generated:** Right kidney

### 2. Measurement Mismatch
Detects conflicts such as:
- **Dictation:** 36 millimetre
- **Generated:** 14 centimetres

### 3. Negation Mismatch
Detects conflicts where a finding that is explicitly negated in the dictation is represented as present in the generated report.
Example:
- **Dictation:** No hydronephrosis.
- **Generated:** Hydronephrosis.

### 4. Unsupported Impression Finding
Detects an impression finding that is not supported by the extracted information from the original dictation.

## Validation Workflow

Warnings are designed to require an explicit review action.
When an inconsistency is found, the UI shows:
- Warning type
- Severity
- Dictation/source value
- Generated value
- Available correction action
- Dismiss action

The workflow intentionally separates editing from validation.

```text
Warning
   ↓
Correct / Dismiss
   ↓
Validation Pending
   ↓
Re-run Validation
   ↓
Validation Result
```

### Why re-run validation?
A report should not automatically be considered safe simply because a user clicked "Correct" or "Dismiss".
After a report is changed, validation becomes pending.
The user must explicitly re-run validation against the updated report.
This provides a clear checkpoint before sign-off.

## Sign-Off Safety

Sign-off is intentionally gated by the validation state.
The intended behavior is:

```text
Unresolved Critical Warning
        ↓
    Sign Off Locked
```
and:

```text
Report Changed
        ↓
 Validation Pending
        ↓
    Sign Off Locked
```

After validation is successfully re-run and there are no unresolved critical warnings:

```text
Validation Passed
        ↓
    Sign Off Enabled
```

This creates an explicit:
**Generate → Review → Validate → Sign Off** workflow.

## Test Cases

The prototype includes four predefined test cases.

### Case 1 — CT Brain
#### Purpose
Demonstrates a standard brain CT dictation containing an acute haemorrhage.
Example findings include:
- Left basal ganglia haemorrhage
- Measurement of 12 × 8 millimetres
- Mild surrounding oedema
- No midline shift
- Normal ventricles

This case demonstrates normal structured report generation and extraction.

### Case 2 — CT Abdomen
#### Purpose
Demonstrates abdominal imaging with multiple findings.
Example findings include:
- Post cholecystectomy status
- Liver lesion
- Segment six location
- 2.4 centimetre measurement
- No biliary dilatation
- Normal kidneys

This case tests extraction beyond a single finding.

### Case 3 — Inconsistency / All Types
#### Purpose
Demonstrates deliberate inconsistencies between the source dictation and the impression.
The original test case contains conflicts involving:
- Laterality
- Measurement
- Negation

Example:
- **Dictation:** There is a 14 millimetre lesion in the left kidney. No hydronephrosis.
- **Impression:** Right renal lesion measuring 14 centimetres with hydronephrosis.

This is the primary validation demonstration. The expected behavior is for Bionic Flow to identify the contradictions rather than silently accepting the generated impression.

### Case 4 — Custom Dictation / Any Anatomy
#### Purpose
Allows the user to edit the dictation or enter custom content.
The default example uses a transthoracic echocardiogram containing:
- Left ventricular findings
- Localized apical wall thickening
- 15 millimetre measurement
- No pericardial effusion
- Right atrium and right ventricle findings
- Estimated ejection fraction

Custom dictation demonstrates that the system is not restricted to returning a fixed result for the predefined cases. Changing the dictation changes the extracted facts and generated content.

## Example Validation Scenario

Consider the following:

**Dictation:**
> There is a 36 millimetre lesion in the right kidney. Hydronephrosis.

**Impression:**
> Right renal lesion measuring 14 centimetres with hydronephrosis.

The system extracts:
- **Laterality:** RIGHT
- **Measurement:** 36 millimetre
- **Negation:** None detected
- **Anatomy:** right kidney
- **Finding:** lesion

The validator then identifies:
> **Measurement Mismatch**
> - **Dictation:** 36 millimetre
> - **Generated:** 14 centimetres

The laterality and hydronephrosis information are consistent, so they do not generate unnecessary warnings. This demonstrates that validation is based on the current dictation rather than blindly returning a fixed set of warnings.

## Source Attribution

Each generated sentence is attributed to its source.
The prototype supports:
- `DICTATION`
- `TEMPLATE`
- `SYSTEM INFERENCE`

This allows the user to distinguish:
- Information directly stated in the dictation
- Template-derived content
- Information generated through system inference

This is especially useful when reviewing generated impressions.

## Technical Architecture

The application is implemented as a frontend prototype using React and TypeScript.

High-level structure:

```text
src/
├── services/
│   ├── extractor.ts
│   ├── generator.ts
│   └── validator.ts
│
├── About.tsx
├── App.tsx
├── index.css
├── main.tsx
├── testCases.ts
└── types.ts
```

### extractor.ts
Responsible for extracting structured facts from the dictation.
The extracted information includes:
- Laterality
- Measurement
- Negation
- Anatomy
- Findings

### generator.ts
Responsible for generating the structured report from the current dictation and extracted information.
The current prototype uses deterministic rules rather than a production AI/LLM backend.

### validator.ts
Responsible for comparing the generated report against the extracted facts and producing validation warnings.
The validator identifies supported inconsistency types such as:
- `LATERALITY_MISMATCH`
- `MEASUREMENT_MISMATCH`
- `NEGATION_MISMATCH`
- `UNSUPPORTED_IMPRESSION_FINDING`

### types.ts
Contains the TypeScript data structures used throughout the application.
Examples include:
- `ReportSentence`
- `StructuredReport`
- `ValidationWarning`
- `ExtractedFacts`
- `TestCase`

### App.tsx
Controls the main user interface and workflow, including:
- Test-case selection
- Dictation editing
- Report generation
- Validation
- Warning resolution
- Re-validation
- Sign-off state

## Technology Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React icons

The application is designed as a lightweight frontend prototype.

## Running Locally

### Requirements
Node.js and npm should be installed.

### Install dependencies
```bash
npm install
```

### Start the development server
```bash
npm run dev
```

Vite will provide the local development URL.

## Prototype Mode

The current implementation intentionally uses:
- **Deterministic rules (mock mode)**

This allows the workflow to be demonstrated without requiring:
- An external LLM API
- API credentials
- A medical AI model
- A backend inference service

The goal of this prototype is to demonstrate the product workflow and validation concept, rather than claim production-grade clinical AI performance.

## Current Limitations

This is a prototype and is not intended for clinical use.
Current limitations include:
- Report generation currently uses deterministic/mock rules.
- Fact extraction is intentionally lightweight.
- Validation only covers the inconsistency categories implemented in the prototype.
- The system does not replace radiologist review.
- There is no PACS integration.
- There is no RIS integration.
- There is no EHR integration.
- There is no production database or backend persistence layer.
- There is no production-grade medical language model.
- The prototype has not undergone clinical validation.
- The system should not be used to make clinical decisions.

These limitations are intentional boundaries of the prototype rather than claims about production capability.

## Future Production Improvements

A production version could extend the prototype with:

### AI / NLP
- Clinical-grade medical language models
- More robust entity extraction
- Context-aware negation detection
- Better measurement normalization
- More comprehensive anatomical terminology
- Synonym handling

### Validation
- More clinical consistency checks
- Cross-sentence reasoning
- Temporal consistency
- Comparison of findings across report sections
- Confidence scoring
- More granular warning severity

### Integrations
- PACS
- RIS
- EHR
- Hospital authentication systems

### Persistence
- Report history
- Audit trails
- User/session management
- Database-backed storage

### Safety
- Clinical validation
- Human-in-the-loop workflows
- Audit logging
- Model monitoring
- Privacy and security controls
- Appropriate regulatory compliance

## Design Philosophy

Bionic Flow is built around a simple principle:

> **Generation should assist the clinician, not silently replace verification.**

A fluent generated report is not necessarily a correct report.
The prototype therefore focuses on making the transition from:

```text
Dictation
    ↓
Generated Report
```

more controlled:

```text
Dictation
    ↓
Extract Facts
    ↓
Generate
    ↓
Validate
    ↓
Review
    ↓
Re-validate
    ↓
Sign Off
```

The objective is not merely to generate a report.
The objective is to make important discrepancies visible before sign-off.

## Project Status

**Status: Prototype / Demonstration**

The current version demonstrates the complete core workflow:
- [x] Dictation input
- [x] Preset test cases
- [x] Custom dictation
- [x] Fact extraction
- [x] Structured report generation
- [x] Source attribution
- [x] Validation warnings
- [x] Laterality validation
- [x] Measurement validation
- [x] Negation validation
- [x] Unsupported finding validation
- [x] Correct / Dismiss workflow
- [x] Re-run validation
- [x] Sign-off gating

The implementation is intentionally focused on demonstrating the core reporting and validation workflow rather than production deployment.

---

## Disclaimer

Bionic Flow is a software prototype created to demonstrate a radiology reporting and validation workflow.
It is not a medical device, diagnostic system, or substitute for qualified clinical judgment.
Generated content must be reviewed by an appropriately qualified professional before being used for any real clinical purpose.
