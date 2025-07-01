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
 * PDF Cache Entry interface for IndexedDB storage
 */
interface PDFCacheEntry {
  key: string;
  data: PDFPageData[];
  timestamp: number;
  sessionId: string;
  size: number;
  compressed: boolean;
}

/**
 * Compressed PDF Cache Entry for storage optimization
 */
interface CompressedPDFCacheEntry {
  key: string;
  compressedData: string; // Base64 compressed JSON
  timestamp: number;
  sessionId: string;
  originalSize: number;
  compressedSize: number;
}

/**
 * Simple compression utilities for PDF cache data
 */
class CompressionUtils {
  /**
   * Compress PDF page data using JSON + base64 compression
   */
  static compressData(data: PDFPageData[]): string {
    try {
      const jsonString = JSON.stringify(data);
      
      // Simple RLE-like compression for base64 image data
      const compressed = jsonString.replace(
        /"imageData":"data:image\/[^;]+;base64,([^"]+)"/g,
        (match, base64Data) => {
          // For large base64 strings, we could implement more compression
          // For now, just return as-is but mark for potential optimization
          return match;
        }
      );
      
      // Convert to base64 for storage
      return btoa(compressed);
    } catch (error) {
      throw new Error('Compression failed');
    }
  }

  /**
   * Decompress PDF page data
   */
  static decompressData(compressedData: string): PDFPageData[] {
    try {
      const jsonString = atob(compressedData);
      return JSON.parse(jsonString) as PDFPageData[];
    } catch (error) {
      throw new Error('Decompression failed');
    }
  }

  /**
   * Calculate compression ratio
   */
  static getCompressionRatio(original: string, compressed: string): number {
    return compressed.length / original.length;
  }
}

/**
 * Browser'da PDF cache işlemleri - Hybrid Memory + IndexedDB
 */
export class PDFCache {
  private static instance: PDFCache;
  private cache: Map<string, PDFPageData[]> = new Map();
  private maxMemoryCacheSize: number = 10; // Memory cache limit
  private maxIndexedDBCacheSize: number = 50; // IndexedDB cache limit
  private dbName = 'PDFCache';
  private storeName = 'pdfs';
  private sessionId: string;
  private db: IDBDatabase | null = null;
  private indexedDBSupported: boolean = true;
  private compressionEnabled: boolean = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeIndexedDB();
  }

  static getInstance(): PDFCache {
    if (!PDFCache.instance) {
      PDFCache.instance = new PDFCache();
    }
    return PDFCache.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeIndexedDB(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.indexedDBSupported = false;
      return;
    }

    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, 1);
        
        request.onerror = () => {
          this.indexedDBSupported = false;
          resolve();
        };
        
        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.cleanupExpiredSessions();
          resolve();
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
            store.createIndex('sessionId', 'sessionId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      });
    } catch (error) {
      this.indexedDBSupported = false;
    }
  }

  private async cleanupExpiredSessions(): Promise<void> {
    if (!this.db || !this.indexedDBSupported) return;

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const entries: PDFCacheEntry[] = request.result;
        const currentTime = Date.now();
        const sessionExpiry = 6 * 60 * 60 * 1000; // 6 hours
        
        entries.forEach(entry => {
          if (currentTime - entry.timestamp > sessionExpiry) {
            store.delete(entry.key);
          }
        });
      };
    } catch (error) {
      // Silently fail cleanup
    }
  }

  private async setIndexedDB(key: string, data: PDFPageData[]): Promise<void> {
    if (!this.db || !this.indexedDBSupported) return;

    try {
      // Check cache size and cleanup if needed
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        if (countRequest.result >= this.maxIndexedDBCacheSize) {
          // Remove oldest entries
          const index = store.index('timestamp');
          const cursorRequest = index.openCursor();
          let deletedCount = 0;
          const toDelete = countRequest.result - this.maxIndexedDBCacheSize + 1;
          
          cursorRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor && deletedCount < toDelete) {
              store.delete(cursor.primaryKey);
              deletedCount++;
              cursor.continue();
            }
          };
        }
      };

      // Try compression if enabled
      let entry: PDFCacheEntry;
      const originalSize = JSON.stringify(data).length;

      if (this.compressionEnabled && originalSize > 50000) { // Only compress large data
        try {
          const compressedData = CompressionUtils.compressData(data);
          const compressedSize = compressedData.length;
          
          // Only use compression if it actually reduces size
          if (compressedSize < originalSize * 0.8) {
            entry = {
              key,
              data: [], // Store empty array, actual data in compressedData
              timestamp: Date.now(),
              sessionId: this.sessionId,
              size: compressedSize,
              compressed: true
            };
            
            // Store the compressed data as a special property
            (entry as any).compressedData = compressedData;
          } else {
            // Compression didn't help, store normally
            entry = {
              key,
              data,
              timestamp: Date.now(),
              sessionId: this.sessionId,
              size: originalSize,
              compressed: false
            };
          }
        } catch (compressionError) {
          // Fallback to uncompressed storage
          entry = {
            key,
            data,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            size: originalSize,
            compressed: false
          };
        }
      } else {
        // Small data or compression disabled
        entry = {
          key,
          data,
          timestamp: Date.now(),
          sessionId: this.sessionId,
          size: originalSize,
          compressed: false
        };
      }

      store.put(entry);
    } catch (error) {
      // Silently fail IndexedDB operations
    }
  }

  private async getIndexedDB(key: string): Promise<PDFPageData[] | null> {
    if (!this.db || !this.indexedDBSupported) return null;

    try {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);
        
        request.onsuccess = () => {
          const entry: PDFCacheEntry = request.result;
          if (entry) {
            try {
              // Check if data is compressed
              if (entry.compressed && (entry as any).compressedData) {
                // Decompress the data
                const decompressedData = CompressionUtils.decompressData((entry as any).compressedData);
                resolve(decompressedData);
              } else {
                // Return uncompressed data
                resolve(entry.data);
              }
            } catch (decompressionError) {
              // If decompression fails, try to return raw data
              resolve(entry.data || null);
            }
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => {
          resolve(null);
        };
      });
    } catch (error) {
      return null;
    }
  }

  private async hasIndexedDB(key: string): Promise<boolean> {
    if (!this.db || !this.indexedDBSupported) return false;

    try {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(!!request.result);
        };
        
        request.onerror = () => {
          resolve(false);
        };
      });
    } catch (error) {
      return false;
    }
  }

  // Public API - Backward compatible
  set(key: string, data: PDFPageData[]): void {
    // Memory cache with FIFO
    if (this.cache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, data);
    
    // Async IndexedDB storage (non-blocking)
    this.setIndexedDB(key, data);
  }

  get(key: string): PDFPageData[] | null {
    return this.cache.get(key) || null;
  }

  async getAsync(key: string): Promise<PDFPageData[] | null> {
    // Try memory cache first (fastest)
    const memoryResult = this.cache.get(key);
    if (memoryResult) {
      return memoryResult;
    }

    // Try IndexedDB (persistent)
    const indexedDBResult = await this.getIndexedDB(key);
    if (indexedDBResult) {
      // Load back to memory cache for faster subsequent access
      this.cache.set(key, indexedDBResult);
      return indexedDBResult;
    }

    return null;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  async hasAsync(key: string): Promise<boolean> {
    if (this.cache.has(key)) {
      return true;
    }
    return await this.hasIndexedDB(key);
  }

  clear(): void {
    this.cache.clear();
    this.clearIndexedDB();
  }

  private async clearIndexedDB(): Promise<void> {
    if (!this.db || !this.indexedDBSupported) return;

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      store.clear();
    } catch (error) {
      // Silently fail
    }
  }

  getSize(): number {
    return this.cache.size;
  }

  async getTotalSize(): Promise<{ memory: number; indexedDB: number }> {
    let indexedDBSize = 0;
    
    if (this.db && this.indexedDBSupported) {
      try {
        indexedDBSize = await new Promise((resolve) => {
          const transaction = this.db!.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.count();
          
          request.onsuccess = () => {
            resolve(request.result);
          };
          
          request.onerror = () => {
            resolve(0);
          };
        });
      } catch (error) {
        indexedDBSize = 0;
      }
    }

    return {
      memory: this.cache.size,
      indexedDB: indexedDBSize
    };
  }
}

/**
 * Cache'li PDF conversion - Enhanced with IndexedDB persistent caching
 */
export async function convertPDFWithCache(
  pdfUrl: string,
  options: PDFConversionOptions = {}
): Promise<PDFPageData[]> {
  const cache = PDFCache.getInstance();
  const cacheKey = generatePDFCacheKey(pdfUrl, options);

  try {
    // Try async cache first (includes both memory and IndexedDB)
    const cachedResult = await cache.getAsync(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Cache'de yoksa convert et ve cache'le
    const pages = await convertPDFToImages(pdfUrl, options);
    cache.set(cacheKey, pages);
    
    return pages;
  } catch (error) {
    // Fallback to memory-only cache on any error
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    // Last resort: convert without caching
    return await convertPDFToImages(pdfUrl, options);
  }
}

/**
 * Legacy sync version for backward compatibility
 * @deprecated Use convertPDFWithCache instead for better persistence
 */
export function convertPDFWithCacheSync(
  pdfUrl: string,
  options: PDFConversionOptions = {}
): Promise<PDFPageData[]> {
  const cache = PDFCache.getInstance();
  const cacheKey = generatePDFCacheKey(pdfUrl, options);

  // Only check memory cache for sync version
  if (cache.has(cacheKey)) {
    return Promise.resolve(cache.get(cacheKey)!);
  }

  // Convert and cache
  return convertPDFToImages(pdfUrl, options).then(pages => {
    cache.set(cacheKey, pages);
    return pages;
  });
}

/**
 * Preload PDF to cache without returning data
 * Useful for background loading
 */
export async function preloadPDFToCache(
  pdfUrl: string,
  options: PDFConversionOptions = {}
): Promise<boolean> {
  try {
    const cache = PDFCache.getInstance();
    const cacheKey = generatePDFCacheKey(pdfUrl, options);
    
    // Check if already cached
    if (await cache.hasAsync(cacheKey)) {
      return true;
    }

    // Convert and cache in background
    const pages = await convertPDFToImages(pdfUrl, options);
    cache.set(cacheKey, pages);
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get cache statistics
 */
export async function getPDFCacheStats(): Promise<{
  memory: number;
  indexedDB: number;
  total: number;
}> {
  const cache = PDFCache.getInstance();
  const sizes = await cache.getTotalSize();
  
  return {
    memory: sizes.memory,
    indexedDB: sizes.indexedDB,
    total: sizes.memory + sizes.indexedDB
  };
}