/**
 * PDF.js worker initialization for pdfjs-dist
 * Centralized worker setup to avoid conflicts
 */

let workerInitialized = false;

export async function initializePDFWorker() {
  if (workerInitialized || typeof window === 'undefined') {
    return;
  }

  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source only if not already set
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
      workerInitialized = true;
      console.log('PDF.js worker initialized:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    }
  } catch (error) {
    console.error('Failed to initialize PDF.js worker:', error);
  }
}

export async function getPDFLib() {
  await initializePDFWorker();
  return import('pdfjs-dist');
}