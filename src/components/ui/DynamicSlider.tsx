"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Carousel from '@/components/ui/Carousel';
import { getSlidersByPosition } from '@/lib/actions/sliderActions';
import type { SliderWidget, SliderImage } from '@/types';
import { ExternalLink } from 'lucide-react';

interface DynamicSliderProps {
  position: SliderWidget['position'];
  className?: string;
  fallback?: React.ReactNode;
  showTitle?: boolean;
}

interface SliderItemProps {
  image: SliderImage;
  settings: SliderWidget['settings'];
}

function SliderItem({ image, settings }: SliderItemProps) {
  const content = (
    <div 
      className="relative w-full overflow-hidden rounded-lg bg-gray-100"
      style={{
        height: settings.height?.desktop || '500px'
      }}
    >
      <Image
        src={image.url}
        alt={image.alt}
        fill
        className="object-cover transition-transform duration-300 hover:scale-105"
        priority
      />
      
      {/* Overlay with content */}
      {(image.title || image.description || image.linkUrl) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
            {image.title && (
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">
                {image.title}
              </h3>
            )}
            {image.description && (
              <p className="text-sm sm:text-base mb-4 line-clamp-2 opacity-90">
                {image.description}
              </p>
            )}
            {image.linkUrl && image.linkText && (
              <Button asChild variant="secondary" size="sm">
                <Link href={image.linkUrl}>
                  {image.linkText}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // If image has a link but no link text, make the whole image clickable
  if (image.linkUrl && !image.linkText) {
    return (
      <Link href={image.linkUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export default function DynamicSlider({ 
  position, 
  className = "", 
  fallback = null,
  showTitle = false
}: DynamicSliderProps) {
  const [sliders, setSliders] = useState<SliderWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadSliders();
  }, [position]);

  const loadSliders = async () => {
    try {
      setLoading(true);
      setError(false);
      
      const result = await getSlidersByPosition(position);
      if (result.success) {
        setSliders(result.sliders);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error('Slider loading error:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 rounded-lg h-64 sm:h-80 lg:h-96"></div>
      </div>
    );
  }

  // Show error or fallback
  if (error || sliders.length === 0) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  // Render sliders
  return (
    <div className={className}>
      {sliders.map((slider) => {
        if (slider.images.length === 0) return null;

        // Sort images by order
        const sortedImages = [...slider.images].sort((a, b) => a.order - b.order);

        return (
          <div key={slider.id} className="space-y-4">
            {/* Title */}
            {showTitle && slider.displayName && (
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {slider.displayName}
                </h2>
              </div>
            )}
            
            {/* Slider */}
            <div className="relative">
              <Carousel
                autoPlay={slider.settings.autoplay}
                autoPlayInterval={slider.settings.autoplayInterval}
                showDots={slider.settings.showDots}
                showArrows={slider.settings.showArrows}
                itemsPerView={slider.settings.itemsPerView}
                className="slider-dynamic"
              >
                {sortedImages.map((image) => (
                  <SliderItem
                    key={image.id}
                    image={image}
                    settings={slider.settings}
                  />
                ))}
              </Carousel>
            </div>
          </div>
        );
      })}
      
      {/* Responsive height styles */}
      <style jsx>{`
        .slider-dynamic .similar-product-container,
        .slider-dynamic [className*="aspect-"] {
          height: ${sliders[0]?.settings.height?.mobile || '250px'};
        }
        
        @media (min-width: 768px) {
          .slider-dynamic .similar-product-container,
          .slider-dynamic [className*="aspect-"] {
            height: ${sliders[0]?.settings.height?.tablet || '350px'};
          }
        }
        
        @media (min-width: 1024px) {
          .slider-dynamic .similar-product-container,
          .slider-dynamic [className*="aspect-"] {
            height: ${sliders[0]?.settings.height?.desktop || '500px'};
          }
        }
      `}</style>
    </div>
  );
}