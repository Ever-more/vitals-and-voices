// This part of the code is responsible for the pro-reviewed health guides in the application.
// It handles each topic's title, reviewers, reference ranges, sections, sources, and matching community,
// and ensures guide content lives in one place where pros can review it, separate from page layout.
export const RESOURCES = {
  prediabetes: {
    tag: 'Blood sugar', tagBg: 'bg-mint', title: 'Prediabetes 101',
    reviewers: ['Reviewed by Maya R., RN', 'Dr. Amara O., Resident'],
    community: 'Type 2 Diabetes',
    ranges: [
      { value: 'Below 5.7%', label: 'Normal A1c', bg: 'bg-mint' },
      { value: '5.7 – 6.4%', label: 'Prediabetes range', bg: 'bg-peach' },
      { value: '6.5% and up', label: 'Diabetes range', bg: 'bg-pink' },
    ],
    sections: [
      { h: 'What it is', p: 'Prediabetes means blood sugar levels are higher than normal but not yet in the diabetes range. It usually has no symptoms, which is why many people only find out from a lab test.' },
      { h: 'What helps', list: ['Moving your body most days, even short walks after meals', 'Filling half your plate with vegetables', 'Regular, good-quality sleep', 'A CDC-recognized lifestyle program. In the Diabetes Prevention Program study, lifestyle change lowered the risk of type 2 diabetes by 58%.'] },
      { h: 'When to talk to your doctor', p: 'Bring your results to your next visit and ask whether to repeat the test and how often to check. A diagnosis is always made by a clinician.' },
    ],
    sources: 'American Diabetes Association Standards of Care; CDC National Diabetes Prevention Program.',
  },
  bp: {
    tag: 'Heart', tagBg: 'bg-pink', title: 'Reading your blood pressure',
    reviewers: ['Reviewed by Dr. Lin C., Physician'],
    community: 'Heart & Blood Pressure',
    ranges: [
      { value: 'Below 120/80', label: 'Normal', bg: 'bg-mint' },
      { value: '120–129 / under 80', label: 'Elevated', bg: 'bg-butter' },
      { value: '130–139 or 80–89', label: 'Stage 1', bg: 'bg-peach' },
      { value: '140+ or 90+', label: 'Stage 2', bg: 'bg-pink' },
    ],
    sections: [
      { h: 'The two numbers', p: 'The top number (systolic) is the pressure when your heart beats. The bottom number (diastolic) is the pressure between beats. Whichever number is in the higher category decides your category.' },
      { h: 'Measuring at home', list: ['Sit quietly for 5 minutes with your back supported and feet flat', 'Rest your arm on a table at heart level', 'Skip caffeine, smoking and exercise for 30 minutes before', 'Take 2 readings a minute apart, morning and evening, for a week'] },
      { h: 'What helps', list: ['Less sodium (check labels on soups, snacks and instant noodles)', 'Moving most days', 'Limiting alcohol and not smoking', 'Eating patterns like DASH, rich in fruits, vegetables and whole grains'] },
      { h: 'When to get help right away', p: 'If a reading is above 180/120, rest and recheck. If it is still that high, contact a doctor right away. With chest pain, shortness of breath, numbness, weakness, vision changes or trouble speaking, call 911.' },
    ],
    sources: 'American Heart Association blood pressure categories; AHA/ACC guidelines.',
  },
  cholesterol: {
    tag: 'Cholesterol', tagBg: 'bg-butter', title: 'LDL, HDL, triglycerides, decoded',
    reviewers: ['Reviewed by Sam K., Pharmacist'],
    community: 'Heart & Blood Pressure',
    ranges: [
      { value: 'LDL under 100', label: 'Optimal', bg: 'bg-mint' },
      { value: 'HDL 60+', label: 'Protective', bg: 'bg-sky' },
      { value: 'Triglycerides under 150', label: 'Normal', bg: 'bg-butter' },
    ],
    sections: [
      { h: 'The three numbers', list: ['LDL is the kind that can build up in artery walls, so lower is better', 'HDL helps carry cholesterol away, so higher is better (under 40 for men or 50 for women is considered low)', 'Triglycerides are blood fats that rise with sugar, refined carbs and alcohol'] },
      { h: 'What helps', list: ['More fiber: oats, beans, fruit and vegetables', 'Swapping fried and processed foods for less saturated fat', 'Moving most days', 'Not smoking'] },
      { h: 'Talking with your doctor', p: 'Your doctor looks at cholesterol together with blood pressure, blood sugar, age and family history to estimate heart risk. One number alone does not tell the story.' },
    ],
    sources: 'NHLBI / NCEP ATP III cholesterol guidelines; American Heart Association.',
  },
  metabolic: {
    tag: 'Metabolic health', tagBg: 'bg-lavender', title: 'How your numbers connect',
    reviewers: ['Reviewed by Dr. Amara O., Resident'],
    community: 'Type 2 Diabetes',
    sections: [
      { h: 'Five signals doctors look at together', list: ['Waist above 40 inches (men) or 35 inches (women)', 'Triglycerides 150 or higher', 'HDL below 40 (men) or 50 (women)', 'Blood pressure 130/85 or higher', 'Fasting glucose 100 or higher'] },
      { h: 'Why it matters', p: 'Three or more of these together is a pattern called metabolic syndrome, which raises the risk of diabetes, heart disease and stroke. Only a clinician can diagnose it.' },
      { h: 'About BMI', p: 'BMI is a rough screening number from height and weight. It does not measure muscle, fitness or health on its own, so doctors look at it alongside other numbers.' },
      { h: 'The good news', p: 'These signals tend to move together, so one habit, like a short walk after meals, can improve several at once.' },
    ],
    sources: 'NCEP ATP III / AHA-NHLBI metabolic syndrome criteria; CDC.',
  },
  visit: {
    tag: 'Any condition', tagBg: 'bg-sky', title: 'Preparing for a doctor visit',
    reviewers: ['Reviewed by Dr. Amara O., Resident'],
    community: 'Rare Disease Circle',
    sections: [
      { h: 'Before you go', list: ['Bring your latest lab results, or have them open in your patient portal', 'List every medicine and supplement you take', 'Write down your top 3 questions, most important first', 'Note when symptoms started and what makes them better or worse'] },
      { h: 'During the visit', list: ['Ask what each result means for you specifically', 'Ask whether any test should be repeated, and when', 'It is okay to say "Can you explain that more simply?"', 'Bring someone along to take notes if you can'] },
      { h: 'After', p: 'Check your patient portal for the visit summary and message your care team if anything is unclear.' },
    ],
    sources: 'AHRQ "Questions to Ask Your Doctor"; general clinical guidance.',
  },
};

export const LANGUAGES = [
  { id: 'simple', label: 'Simpler English' },
  { id: 'es', label: 'Español' },
  { id: 'pt', label: 'Português' },
  { id: 'am', label: 'አማርኛ (Amharic)' },
];