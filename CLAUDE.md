# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ZiraatX** is a modern Next.js 15 e-commerce application for Marmara Ziraat, specializing in agricultural and garden products. Built with TypeScript, Firebase, and Tailwind CSS, featuring a complete admin CMS and AI-powered garden advisor.

## Development Commands

```bash
# Development
npm run dev          # Start development server on port 3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
```

**Important**: Always run `npm run lint` and `npm run typecheck` after making code changes to ensure code quality.

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15.2.3 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Styling**: Tailwind CSS with custom agricultural theme
- **UI Components**: Shadcn/ui + Radix UI
- **Forms**: React Hook Form + Zod validation
- **Email**: Resend service

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Complete admin CMS (products, categories, media)
│   ├── products/          # Product catalog with filtering
│   ├── catalogs/          # PDF flipbook viewer
│   ├── contact/           # Contact form with honeypot protection
│   └── api/               # API routes (AI chat, PDF proxy)
├── components/
│   ├── admin/             # Admin panel components
│   ├── forms/             # Form components with validation
│   ├── layout/            # Header, footer, navigation
│   ├── product/           # Product display components
│   └── ui/                # Shadcn/ui reusable components
├── lib/
│   ├── actions/           # Server actions for data operations
│   ├── firebase.ts        # Firebase singleton configuration
│   └── utils.ts           # Utility functions
├── types/                 # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

## Key Development Patterns

### Component Architecture
- **Server Components by default** - Use client components only when interactivity is needed
- **Server Actions** - Use for form submissions and data mutations instead of API routes
- **Firebase Singleton Pattern** - All Firebase services use singleton pattern for consistency
- **Type-first approach** - Define TypeScript types before implementation

### Firebase Integration
```typescript
// Import Firebase services using singleton pattern
import { db, auth, storage } from '@/lib/firebase';

// Server actions use Firebase Admin SDK
import { getFirestore } from 'firebase-admin/firestore';
```

### Form Handling
- All forms use **React Hook Form + Zod validation**
- Contact forms include **honeypot spam protection**
- Server actions handle form submissions

### Styling System
- **Tailwind CSS** with custom agricultural color palette
- **Primary colors**: Dark green (#1E5631), Forest green (#3D8361)
- **Typography**: Belleza (headlines) + Alegreya (body text)
- **Apple.com-inspired design** with clean layouts and subtle animations
- **Mobile-first responsive design**

## Important Features

### Admin Panel
- Complete CMS for products, categories, pages, and media
- Bulk Excel import for products
- PDF catalog management with flipbook viewer
- Analytics dashboard with charts
- Image optimization and management

### Public Features  
- Product catalog with advanced filtering and search
- PDF catalog viewer with zoom/pan functionality
- AI Garden Advisor chatbot for product recommendations
- Newsletter signup and contact forms
- Turkish localization throughout

### PDF Handling
- Uses **pdfjs-dist** and **react-pdf** for PDF rendering
- Custom proxy server for Firebase Storage PDF access
- Advanced viewer with zoom, pan, and flip animations

## Code Conventions

### File Naming
- Use kebab-case for files and folders
- Special Next.js files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- Server actions: `actions/[feature].ts`
- Types: `types/[feature].ts`

### Component Patterns
```typescript
// Server Component (default)
export default function ProductPage() {
  return <div>Server rendered content</div>;
}

// Client Component (when needed)
'use client';
export default function InteractiveComponent() {
  return <div>Client rendered content</div>;
}
```

### Server Actions
```typescript
'use server';
export async function createProduct(formData: FormData) {
  // Server-side logic with Firebase Admin
}
```

### Environment Variables
Required Firebase configuration:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`  
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_STORAGE_BUCKET` (hardcoded: ziraatx.firebasestorage.app)

## Turkish Localization

- All user-facing content is in Turkish
- Use Turkish naming conventions for UI elements
- Admin panel supports Turkish content management
- Error messages and validation in Turkish

## Security & Performance

### Security
- Firebase Security Rules for data access
- Zod schema validation for all forms
- Honeypot spam protection on contact forms
- Environment variable protection
- Type-safe API routes

### Performance
- Next.js Image optimization
- Lazy loading for components and images
- Code splitting with dynamic imports
- Firebase Storage CDN for assets
- Bundle size monitoring with webpack-bundle-analyzer