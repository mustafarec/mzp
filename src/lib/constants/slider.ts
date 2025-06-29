import type { SliderSettings } from '@/types';

// Default slider settings
export const DEFAULT_SLIDER_SETTINGS: SliderSettings = {
  autoplay: true,
  autoplayInterval: 5000,
  showDots: true,
  showArrows: true,
  loop: true,
  pauseOnHover: true,
  itemsPerView: {
    mobile: 1,
    tablet: 1,
    desktop: 1
  },
  height: {
    mobile: '250px',
    tablet: '350px',
    desktop: '500px'
  },
  transition: 'slide',
  speed: 500
};