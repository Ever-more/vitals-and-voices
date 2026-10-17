// This part of the code is responsible for shrinking a drawn image in the application.
// It handles scaling any canvas-drawable source to at most 1600px and exporting compressed JPEG base64,
// and ensures every page sent to Gemma stays small enough for the server limit and fast on slow wifi.
function toCompressedBase64(source, width, height, maxSize = 1600, quality = 0.85) {
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality).split(',')[1];
}

// This part of the code is responsible for preparing lab report photos in the application.
// It handles decoding a phone photo or screenshot and shrinking it to one compressed image,
// and ensures photos end up in the same format as scanned PDF pages before they reach Gemma.
export async function fileToCompressedBase64(file) {
  const img = await createImageBitmap(file);
  return toCompressedBase64(img, img.width, img.height);
}

// This part of the code is responsible for removing personal details from report text in the application.
// It handles dropping header lines with names, addresses, phone numbers, birth dates, or ID numbers, keeping only result rows,
// and ensures Gemma only ever sees the test results, protecting patients' private information.
const PERSONAL = /(patient|name:|address|phone|dob|date of birth|sex:|mrn|chart #|ssn|reference number|reference id|street|\brd\b|\bave\b|\bunit \d|\(\d{3}\)|\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b|\b[A-Z][a-z]+,? [A-Z]{2} \d{5}\b)/i;
function redact(text) {
  const out = [];
  let started = false;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || PERSONAL.test(line)) continue;
    if (/\d/.test(line)) {
      out.push(line);
      started = true;
    } else if (started && line.split(/\s+/).length <= 3) {
      out.push(line); // wrapped test-name pieces like "Volume" or "Absolute", only after results begin
    }
  }
  return out.join('\n');
}

// This part of the code is responsible for loading pdf.js only when it is needed in the application.
// It handles importing the library and its worker on demand,
// and ensures people who upload photos never download the PDF reader at all.
async function loadPdf(file) {
  const [{ getDocument, GlobalWorkerOptions }, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  GlobalWorkerOptions.workerSrc = workerUrl;
  return getDocument({ data: await file.arrayBuffer() }).promise;
}

// This part of the code is responsible for reading the text inside digital PDFs in the application.
// It handles rebuilding each table row by grouping words with the same height on the page and ordering them left to right,
// and ensures patient-portal PDFs are sent to Gemma as small, fast text instead of slow images.
async function pdfToText(pdf, maxPages) {
  const lines = [];
  for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const rows = new Map();
    for (const item of content.items) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform[5] / 3) * 3;
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x: item.transform[4], s: item.str.trim() });
    }
    [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([, items]) => lines.push(items.sort((a, b) => a.x - b.x).map((it) => it.s).join('   ')));
  }
  return lines.join('\n');
}

// This part of the code is responsible for turning scanned PDF pages into images in the application.
// It handles drawing each page onto a canvas when the PDF has no real text inside,
// and ensures scanned or photographed PDFs still work, using Gemma's ability to read images.
async function pdfToImages(pdf, maxPages) {
  const images = [];
  for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(2, 1600 / Math.max(base.width, base.height)) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    images.push(toCompressedBase64(canvas, canvas.width, canvas.height));
  }
  return images;
}

// This part of the code is responsible for choosing the fastest way to send an upload to Gemma in the application.
// It handles digital PDFs as redacted text, scanned PDFs as page images, and photos as one shrunk image,
// and ensures the common case (a patient-portal PDF) takes seconds instead of a long image read.
export async function fileToPayload(file, maxPages = 3) {
  const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
  if (!isPdf) return { images: [await fileToCompressedBase64(file)] };

  const pdf = await loadPdf(file);
  const text = redact(await pdfToText(pdf, maxPages));
  if (text.replace(/\s/g, '').length > 150) return { text: text.slice(0, 12000) };
  return { images: await pdfToImages(pdf, maxPages) };
}

// Kept so any older code that still calls fileToImages keeps working.
export async function fileToImages(file) {
  const payload = await fileToPayload(file);
  return payload.images || [];
}