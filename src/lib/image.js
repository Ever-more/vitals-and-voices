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
// and ensures photos and PDFs end up in the same format before they reach Gemma.
export async function fileToCompressedBase64(file) {
  const img = await createImageBitmap(file);
  return toCompressedBase64(img, img.width, img.height);
}

// This part of the code is responsible for turning lab report PDFs into images in the application.
// It handles loading pdf.js only when a PDF is picked and drawing the first pages onto canvases,
// and ensures patient-portal PDFs work without adding a second AI, since pdf.js only draws pages and Gemma still reads them.
async function pdfToBase64Images(file, maxPages = 3) {
  const [{ getDocument, GlobalWorkerOptions }, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  GlobalWorkerOptions.workerSrc = workerUrl;

  const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
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

// This part of the code is responsible for choosing how to prepare an uploaded file in the application.
// It handles sending PDFs through pdf.js and photos through the image shrinker, always returning a list of images,
// and ensures the rest of the app never has to care which kind of file the user picked.
export async function fileToImages(file) {
  const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
  if (isPdf) return pdfToBase64Images(file);
  return [await fileToCompressedBase64(file)];
}