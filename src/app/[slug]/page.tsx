import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageBySlug } from '@/lib/actions/pageActions';
import type { Page } from '@/types';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPage(slug: string): Promise<Page | null> {
  try {
    const page = await getPageBySlug(slug);
    
    if (!page || !page.isActive) {
      return null;
    }
    
    return page;
  } catch (error) {
    console.error('Sayfa getirme hatası:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  
  if (!page) {
    return {
      title: 'Sayfa Bulunamadı',
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.content.substring(0, 160),
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.content.substring(0, 160),
      type: 'website',
    },
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  const renderContent = () => {
    switch (page.template) {
      case 'contact':
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-6">{page.title}</h1>
              <div 
                className="prose max-w-none mb-8"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
              {/* İleride contact form component eklenebilir */}
            </div>
          </div>
        );
      
      case 'about':
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-6">{page.title}</h1>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          </div>
        );

      case 'homepage':
        return (
          <div 
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        );

      default:
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold mb-6">{page.title}</h1>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      {renderContent()}
    </div>
  );
} 