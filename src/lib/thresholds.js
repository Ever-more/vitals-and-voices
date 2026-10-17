// This part of the code is responsible for the medical reference ranges in the application.
// It handles classifying each number into a guideline category with plain, deterministic rules,
// and ensures the cutoffs patients see come from published guidelines (ADA, AHA/ACC, CDC, NCEP), never from an AI that could invent them.

const band = (to, status, label) => ({ to, status, label });

// This part of the code is responsible for matching a number to its range in the application.
// It handles walking an ordered list of bands where each band covers values below its "to" limit,
// and ensures every metric follows the same simple, testable rule.
export function classify(value, bands) {
  return bands.find((b) => value < b.to) ?? bands[bands.length - 1];
}

// This part of the code is responsible for defining every metric the app understands.
// It handles each metric's name, unit, plain-language meaning, scale, and guideline bands (waist and HDL depend on sex),
// and ensures adding or correcting a metric only ever happens in this one place.
export function getMetricDefs(sex) {
  const waistLimit = sex === 'male' ? 40 : 35;
  const hdlLow = sex === 'male' ? 40 : 50;
  return {
    a1c: {
      name: 'A1c', unit: '%', min: 4, max: 10,
      what: 'Your average blood sugar over the last ~3 months.',
      bands: [band(5.7, 'good', 'Normal'), band(6.5, 'watch', 'Prediabetes range'), band(Infinity, 'high', 'Diabetes range')],
    },
    glucose: {
      name: 'Fasting glucose', unit: 'mg/dL', min: 50, max: 220,
      what: 'Your blood sugar after 8+ hours without food.',
      bands: [band(70, 'watch', 'Low'), band(100, 'good', 'Normal'), band(126, 'watch', 'Prediabetes range'), band(Infinity, 'high', 'Diabetes range')],
    },
    systolic: {
      name: 'Systolic (top number)', unit: 'mmHg', min: 90, max: 200,
      what: 'Pressure in your arteries when your heart beats.',
      bands: [band(120, 'good', 'Normal'), band(130, 'watch', 'Elevated'), band(140, 'high', 'Stage 1'), band(181, 'high', 'Stage 2'), band(Infinity, 'urgent', 'Severe')],
    },
    diastolic: {
      name: 'Diastolic (bottom number)', unit: 'mmHg', min: 50, max: 130,
      what: 'Pressure in your arteries between heartbeats.',
      bands: [band(80, 'good', 'Normal'), band(90, 'high', 'Stage 1'), band(121, 'high', 'Stage 2'), band(Infinity, 'urgent', 'Severe')],
    },
    ldl: {
      name: 'LDL cholesterol', unit: 'mg/dL', min: 50, max: 220,
      what: '"Bad" cholesterol that can build up in artery walls.',
      bands: [band(100, 'good', 'Optimal'), band(130, 'good', 'Near optimal'), band(160, 'watch', 'Borderline high'), band(190, 'high', 'High'), band(Infinity, 'high', 'Very high')],
    },
    hdl: {
      name: 'HDL cholesterol', unit: 'mg/dL', min: 20, max: 90,
      what: '"Good" cholesterol that helps clear other cholesterol. Higher is better.',
      bands: [band(hdlLow, 'watch', 'Low'), band(60, 'good', 'OK'), band(Infinity, 'good', 'Protective')],
    },
    tg: {
      name: 'Triglycerides', unit: 'mg/dL', min: 50, max: 550,
      what: 'A blood fat often raised by sugar, refined carbs, and alcohol.',
      bands: [band(150, 'good', 'Normal'), band(200, 'watch', 'Borderline high'), band(500, 'high', 'High'), band(Infinity, 'high', 'Very high')],
    },
    waist: {
      name: 'Waist size', unit: 'in', min: 24, max: 56,
      what: 'Belly fat is linked to blood sugar and heart risk.',
      bands: [band(waistLimit + 0.01, 'good', 'Below risk threshold'), band(Infinity, 'watch', 'Above risk threshold')],
    },
    bmi: {
      name: 'BMI', unit: '', min: 15, max: 45,
      what: 'A rough screening estimate from height and weight. It does not measure health on its own.',
      bands: [band(18.5, 'watch', 'Below typical'), band(25, 'good', 'Typical'), band(30, 'watch', 'Above typical'), band(Infinity, 'watch', 'Well above typical')],
    },
  };
}

const num = (v) => {
  const n = Number(v);
  return v !== '' && Number.isFinite(n) && n > 0 ? n : null;
};

// This part of the code is responsible for computing BMI in the application.
// It handles converting feet, inches, and pounds into the standard BMI formula,
// and ensures US users can enter numbers the way they actually know them.
export function computeBMI(ft, inch, lb) {
  const f = num(ft), l = num(lb), i = num(inch) ?? 0;
  if (!f || !l) return null;
  const totalIn = f * 12 + i;
  return Math.round(((703 * l) / (totalIn * totalIn)) * 10) / 10;
}

// This part of the code is responsible for the combined blood pressure category in the application.
// It handles the AHA rule that whichever number is higher decides the category,
// and ensures a normal top number with a high bottom number is never reported as fine.
export function bpCategory(sys, dia) {
  if (sys == null || dia == null) return null;
  if (sys > 180 || dia > 120) return { status: 'urgent', label: 'Severe (crisis range)' };
  if (sys >= 140 || dia >= 90) return { status: 'high', label: 'High blood pressure, stage 2' };
  if (sys >= 130 || dia >= 80) return { status: 'high', label: 'High blood pressure, stage 1' };
  if (sys >= 120) return { status: 'watch', label: 'Elevated' };
  return { status: 'good', label: 'Normal' };
}

// This part of the code is responsible for turning form inputs into results in the application.
// It handles parsing every field and classifying each number that was entered,
// and ensures every screen works from one consistent source of truth.
export function computeResults(inputs) {
  const values = {
    a1c: num(inputs.a1c), glucose: num(inputs.glucose),
    systolic: num(inputs.systolic), diastolic: num(inputs.diastolic),
    ldl: num(inputs.ldl), hdl: num(inputs.hdl), tg: num(inputs.tg),
    waist: num(inputs.waist),
    bmi: computeBMI(inputs.heightFt, inputs.heightIn, inputs.weightLb),
  };
  const defs = getMetricDefs(inputs.sex);
  const metrics = Object.keys(defs)
    .filter((key) => values[key] != null)
    .map((key) => {
      const def = defs[key];
      const b = classify(values[key], def.bands);
      return { key, ...def, value: values[key], label: b.label, status: b.status };
    });
  const bp = bpCategory(values.systolic, values.diastolic);
  return { values, metrics, bp, urgent: bp?.status === 'urgent', hasAny: metrics.length > 0 };
}

export const EMPTY = {
  a1c: '', glucose: '', systolic: '', diastolic: '', ldl: '', hdl: '', tg: '',
  heightFt: '', heightIn: '', weightLb: '', waist: '', sex: '',
};

// A realistic sample profile so judges can see the full experience in one click.
export const SAMPLE = {
  a1c: '5.9', glucose: '108', systolic: '134', diastolic: '86', ldl: '142', hdl: '38', tg: '180',
  heightFt: '5', heightIn: '9', weightLb: '205', waist: '39', sex: 'male',
};
