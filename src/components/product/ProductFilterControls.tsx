"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface ProductFilterControlsProps {
  onSearch: (term: string) => void;
  onCategoryFilter: (categoryId: string) => void;
  onPriceSort: (order: 'asc' | 'desc') => void;
  onClear: () => void;
  categories?: { id: string; name: string; displayName?: string; }[];
}

export default function ProductFilterControls({
  onSearch,
  onCategoryFilter,
  onPriceSort,
  onClear,
  categories = []
}: ProductFilterControlsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategoryFilter(categoryId);
  };

  const handleSortChange = (order: string) => {
    setSortOrder(order);
    if (order === 'asc' || order === 'desc') {
      onPriceSort(order);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortOrder('');
    onClear();
  };

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border space-y-4 overflow-x-auto">
      <div className="flex flex-col lg:flex-row gap-4 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-48 min-w-0">
              <SelectValue placeholder="Kategori seç" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.displayName || category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-40 min-w-0">
              <SelectValue placeholder="Fiyat sırala" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Düşükten Yükseğe</SelectItem>
              <SelectItem value="desc">Yüksekten Düşüğe</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleClear} size="sm" className="flex-shrink-0" title="Filtreleri temizle">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
