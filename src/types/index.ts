import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export interface ProductFeature {
  title: string;
  description: string;
  icon?: string; // Lucide icon name or path to custom SVG
}

export interface ProductSpecificationItem {
  name: string;
  value: string;
}

export interface ProductSpecificationGroup {
  group: string;
  items: ProductSpecificationItem[];
}

export interface ProductImage {
  url: string; // Firebase Storage URL
  alt: string;
  isFeatured?: boolean;
  sortOrder: number;
  dataAiHint?: string; 
}

export interface ProductDocument {
  url: string; // Firebase Storage URL
  name: string;
  type: string; // pdf, doc, etc.
  sizeKb: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  images: string[];
  isActive: boolean;
  isPremium?: boolean;
  sku?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price?: number;
  stock?: number;
}

export interface ProductSpecification {
  name: string;
  value: string;
}

export interface Category {
  id: string;
  name: string;
  displayName?: string; // Kısa görüntüleme adı (önekler temizlenmiş)
  slug: string;
  description?: string;
  parentId?: string | null;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
  createdAt?: any;
  updatedAt?: any;
}

// Zod schema for adding a new product
export const AddProductFormSchema = z.object({
  name: z.string().min(3, "Ürün adı en az 3 karakter olmalıdır."),
  slug: z.string()
    .min(3, "Slug en az 3 karakter olmalıdır.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug sadece küçük harf, rakam ve tire içerebilir ve boşluk içeremez."),
  shortDescription: z.string().max(250, "Kısa açıklama en fazla 250 karakter olabilir.").optional().default(''),
  description: z.string().optional().default(''), // HTML content
  tags: z.string().optional().default(''), // Comma-separated
  categoryId: z.string().min(1, "Kategori ID zorunludur.").default(''), // Will be a select later
  subcategoryId: z.string().optional().default(''),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isPremium: z.boolean().default(false),
  sortOrder: z.coerce.number().int("Sıralama tam sayı olmalıdır.").default(0),
  // Placeholders for complex fields - expecting JSON strings for now
  featuresString: z.string().optional().default('[]'), // Expecting JSON string for ProductFeature[]
  specificationsString: z.string().optional().default('[]'), // Expecting JSON string for ProductSpecificationGroup[]
  imagesString: z.string().optional().default('[]'), // Expecting JSON string for ProductImage[]
  documentsString: z.string().optional().default('[]'), // Expecting JSON string for ProductDocument[]
  relatedProductsString: z.string().optional().default('[]'), // Expecting JSON string for string[]
});

export type AddProductFormData = z.infer<typeof AddProductFormSchema>;

export interface User {
  id: string;
  email: string;
  isAdmin?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Attribute {
  id: string;                    // Firestore Document ID
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];            // For 'select' type
  unit?: string;                 // kg, cm, etc.
  isFilterable: boolean;
  isSortable: boolean;
  isRequired: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ContactFormData = {
  name: string;
  email: string;
  message: string;
  honeypot?: string;
};

export type NewsletterFormData = {
  email: string;
};

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
  template: 'default' | 'homepage' | 'contact' | 'about';
  createdAt: Date;
  updatedAt: Date;
}

export interface Media {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  type: 'image' | 'video' | 'document';
  mimeType: string;
  size: number;
  alt?: string;
  description?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Widget {
  id: string;
  type: 'hero' | 'text' | 'image' | 'gallery' | 'contact' | 'feature' | 'slider';
  title?: string;
  content?: string;
  imageUrl?: string;
  images?: string[];
  settings: Record<string, any>;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface PageWidget {
  id: string;
  pageId: string;
  widgetId: string;
  order: number;
  settings: Record<string, any>;
}

export interface Catalog {
  id: string;
  title: string;
  brand: string;
  description?: string;
  slug: string;
  pdfUrl: string;
  thumbnailUrl?: string;
  fileSize: number; // KB cinsinden
  pageCount?: number;
  isActive: boolean;
  sortOrder: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Zod schema for adding/editing catalogs
export const AddCatalogFormSchema = z.object({
  title: z.string().min(3, "Katalog başlığı en az 3 karakter olmalıdır."),
  brand: z.string().min(2, "Marka adı en az 2 karakter olmalıdır."),
  slug: z.string()
    .min(3, "Slug en az 3 karakter olmalıdır.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug sadece küçük harf, rakam ve tire içerebilir."),
  description: z.string().optional().default(''),
  category: z.string().optional().default(''),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int("Sıralama tam sayı olmalıdır.").default(0),
});

export type AddCatalogFormData = z.infer<typeof AddCatalogFormSchema>;
