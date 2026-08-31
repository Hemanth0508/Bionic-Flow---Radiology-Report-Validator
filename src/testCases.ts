import type { TestCase } from './types';

export const TEST_CASES: TestCase[] = [
  {
    id: 'case-1',
    title: 'Case 1 – CT Brain',
    subtitle: 'Left basal ganglia haemorrhage',
    iconType: 'brain',
    dictation:
      'CT brain. There is a 12 by 8 millimetre acute haemorrhage in the left basal ganglia with mild surrounding oedema. No midline shift. The ventricles are normal.',
  },

  {
    id: 'case-2',
    title: 'Case 2 – CT Abdomen',
    subtitle: 'Liver lesion in segment six',
    iconType: 'liver',
    dictation:
      'Contrast CT abdomen. Post cholecystectomy status. Liver shows a 2.4 centimetre hypodense lesion in segment six. No biliary dilatation. Both kidneys are normal. Rest of the abdomen is unremarkable.',
  },

  {
    id: 'case-3',
    title: 'Case 3 – Inconsistency (All Types)',
    subtitle: 'Laterality, measurement, negation',
    iconType: 'kidney',
    dictation:
      'There is a 14 millimetre lesion in the left kidney. No hydronephrosis. Impression: Right renal lesion measuring 14 centimetres with hydronephrosis.',
  },

  {
    id: 'case-custom',
    title: 'Case 4 – Custom Dictation / Any Anatomy',
    subtitle: 'Echocardiogram, chest X-ray, cardiac CT, etc.',
    iconType: 'custom',
    dictation:
      'Transthoracic echocardiogram. Left ventricle demonstrates normal cavity size with a 15 millimetre localized wall thickening in the apex. No pericardial effusion. Right atrium and right ventricle are normal in size. Ejection fraction estimated at 60%.',
  },
];