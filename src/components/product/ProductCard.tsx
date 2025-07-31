import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { ShoppingCart } from 'lucide-react'; // Shopping cart icon removed

interface ProductCardProps {
  product: Product;
  onProductClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const featuredImage = product.images?.[0];
  // Category name would ideally be fetched/joined if categoryId is just an ID.
  // For now, we'll assume product.category (if it existed as a string) or product.categoryId.
  // This needs to be resolved by fetching category data.
  // As a placeholder, we can show categoryId or a loading state for category name.

  const handleClick = () => {
    if (onProductClick) {
      onProductClick();
    }
    
    const currentPath = window.location.pathname;
    if (currentPath === '/products') {
      sessionStorage.setItem('productsScrollPosition_/products', window.scrollY.toString());
    }
  };

  return (
    <Card className="overflow-hidden h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        {featuredImage && (
          <Link href={`/${product.slug}`} onClick={handleClick}>
            <div className="aspect-[4/3] relative w-full overflow-hidden">
              <Image
                src={featuredImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        {/* Assuming category name needs to be fetched based on categoryId. Placeholder for now. */}
        {/* <Badge variant="secondary" className="mb-2">{product.category || product.categoryId}</Badge> */}
         <Badge variant="secondary" className="mb-2">{product.categoryId}</Badge> {/* TODO: Fetch category name */}
        <CardTitle className="text-lg mb-1 leading-tight">
          <Link
            href={`/${product.slug}`}
            className="hover:text-primary transition-colors"
            onClick={handleClick}
          >
            {product.name}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground mb-2 h-10 overflow-hidden line-clamp-2">
          {product.description.substring(0, 100)}...
        </p>
        {/* Price removed */}
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button asChild variant="default" className="w-full">
          <Link href={`/${product.slug}`} onClick={handleClick}>Detaylar</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
