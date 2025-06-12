/**
 * PDF işlemleri için yardımcı fonksiyonlar
 * PDF.js kullanarak PDF'leri flipbook formatına çevirir
 */

export interface PDFPageData {
  pageNumber: number;
  imageData: string;
  width: number;
  height: number;
  thumbnail?: string; // Küçük thumbnail için
}

export interface PDFConversionOptions {
  scale?: number;
  quality?: number;
  thumbnailScale?: number;
  onProgress?: (progress: number, pageNumber: number) => void;
  maxPages?: number;
}

export interface PDFMetadata {
  numPages: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * PDF dosyasından metadata bilgilerini çıkarır
 */
export async function extractPDFMetadata(pdfUrl: string): Promise<PDFMetadata> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source consistently
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
    }

    const pdf = await pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    }).promise;

    const metadata = await pdf.getMetadata();
    
    return {
      numPages: pdf.numPages,
      title: (metadata.info as any)?.Title,
      author: (metadata.info as any)?.Author,
      subject: (metadata.info as any)?.Subject,
      creator: (metadata.info as any)?.Creator,
      producer: (metadata.info as any)?.Producer,
      creationDate: (metadata.info as any)?.CreationDate,
      modificationDate: (metadata.info as any)?.ModDate,
    };
  } catch (error) {
    console.error('PDF metadata extraction failed:', error);
    throw new Error('PDF metadata çıkarılamadı');
  }
}

/**
 * PDF sayfalarını yüksek kaliteli görsellere çevirir
 */
export async function convertPDFToImages(
  pdfUrl: string,
  options: PDFConversionOptions = {}
): Promise<PDFPageData[]> {
  const {
    scale = 1.5,
    quality = 0.8,
    thumbnailScale = 0.3,
    onProgress,
    maxPages
  } = options;

  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source consistently
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
    }

    const pdf = await pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    }).promise;

    const numPages = maxPages ? Math.min(pdf.numPages, maxPages) : pdf.numPages;
    const convertedPages: PDFPageData[] = [];

    // Convert each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Main image with high quality
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Canvas 2D context creation failed');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      const imageData = canvas.toDataURL('image/jpeg', quality);

      // Thumbnail image
      let thumbnail: string | undefined;
      if (thumbnailScale > 0) {
        const thumbViewport = page.getViewport({ scale: thumbnailScale });
        const thumbCanvas = document.createElement('canvas');
        const thumbContext = thumbCanvas.getContext('2d');
        
        if (!thumbContext) {
          throw new Error('Thumbnail canvas 2D context creation failed');
        }
        
        thumbCanvas.height = thumbViewport.height;
        thumbCanvas.width = thumbViewport.width;

        await page.render({
          canvasContext: thumbContext,
          viewport: thumbViewport,
        }).promise;

        thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.6);
      }

      convertedPages.push({
        pageNumber: pageNum,
        imageData,
        width: viewport.width,
        height: viewport.height,
        thumbnail,
      });

      // Progress callback
      if (onProgress) {
        const progress = Math.round((pageNum / numPages) * 100);
        onProgress(progress, pageNum);
      }
    }

    return convertedPages;
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error('PDF sayfalara çevrilemedi');
  }
}

/**
 * Sadece belirli sayfa aralığını çevirir (performance için)
 */
export async function convertPDFPageRange(
  pdfUrl: string,
  startPage: number,
  endPage: number,
  options: PDFConversionOptions = {}
): Promise<PDFPageData[]> {
  const { scale = 1.5, quality = 0.8, onProgress } = options;

  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }

    const pdf = await pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    }).promise;

    const actualStartPage = Math.max(1, startPage);
    const actualEndPage = Math.min(pdf.numPages, endPage);
    const convertedPages: PDFPageData[] = [];

    for (let pageNum = actualStartPage; pageNum <= actualEndPage; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Canvas 2D context creation failed');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      convertedPages.push({
        pageNumber: pageNum,
        imageData: canvas.toDataURL('image/jpeg', quality),
        width: viewport.width,
        height: viewport.height,
      });

      if (onProgress) {
        const progress = Math.round(((pageNum - actualStartPage + 1) / (actualEndPage - actualStartPage + 1)) * 100);
        onProgress(progress, pageNum);
      }
    }

    return convertedPages;
  } catch (error) {
    console.error('PDF page range conversion error:', error);
    throw new Error('PDF sayfa aralığı çevrilemedi');
  }
}

/**
 * Tek bir PDF sayfasını çevirir
 */
export async function convertSinglePDFPage(
  pdfUrl: string,
  pageNumber: number,
  scale: number = 1.5,
  quality: number = 0.8
): Promise<PDFPageData> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }

    const pdf = await pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    }).promise;

    if (pageNumber < 1 || pageNumber > pdf.numPages) {
      throw new Error(`Geçersiz sayfa numarası: ${pageNumber}`);
    }

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Canvas 2D context creation failed');
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    return {
      pageNumber,
      imageData: canvas.toDataURL('image/jpeg', quality),
      width: viewport.width,
      height: viewport.height,
    };
  } catch (error) {
    console.error('Single page conversion error:', error);
    throw new Error(`Sayfa ${pageNumber} çevrilemedi`);
  }
}

/**
 * PDF dosyasının thumbnail'ini oluşturur (ilk sayfa)
 */
export async function generatePDFThumbnail(
  pdfUrl: string,
  scale: number = 0.5,
  quality: number = 0.7
): Promise<string> {
  try {
    const firstPage = await convertSinglePDFPage(pdfUrl, 1, scale, quality);
    return firstPage.imageData;
  } catch (error) {
    console.error('PDF thumbnail generation error:', error);
    throw new Error('PDF thumbnail oluşturulamadı');
  }
}

/**
 * Caching için PDF hash oluşturur
 */
export function generatePDFCacheKey(pdfUrl: string, options: PDFConversionOptions = {}): string {
  const optionsStr = JSON.stringify({
    scale: options.scale || 1.5,
    quality: options.quality || 0.8,
    maxPages: options.maxPages,
  });
  
  // Simple hash function
  const hash = btoa(pdfUrl + optionsStr).replace(/[+/=]/g, '');
  return `pdf_cache_${hash}`;
}

/**
 * Browser'da PDF cache işlemleri
 */
export class PDFCache {
  private static instance: PDFCache;
  private cache: Map<string, PDFPageData[]> = new Map();
  private maxCacheSize: number = 10; // Maksimum 10 PDF cache'le

  static getInstance(): PDFCache {
    if (!PDFCache.instance) {
      PDFCache.instance = new PDFCache();
    }
    return PDFCache.instance;
  }

  set(key: string, data: PDFPageData[]): void {
    // Cache size limit kontrolü
    if (this.cache.size >= this.maxCacheSize) {
      // En eski item'ı sil (FIFO)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, data);
  }

  get(key: string): PDFPageData[] | null {
    return this.cache.get(key) || null;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }
}

/**
 * Cache'li PDF conversion
 */
export async function convertPDFWithCache(
  pdfUrl: string,
  options: PDFConversionOptions = {}
): Promise<PDFPageData[]> {
  const cache = PDFCache.getInstance();
  const cacheKey = generatePDFCacheKey(pdfUrl, options);

  // Cache'de var mı kontrol et
  if (cache.has(cacheKey)) {
    console.log('PDF cache hit:', cacheKey);
    return cache.get(cacheKey)!;
  }

  // Cache'de yoksa convert et ve cache'le
  console.log('PDF cache miss, converting:', cacheKey);
  const pages = await convertPDFToImages(pdfUrl, options);
  cache.set(cacheKey, pages);
  
  return pages;
}