"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showFirstLast?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showFirstLast = true,
}: PaginationProps) {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, -1);
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push(-1, totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages();

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
    >
      <div className="flex flex-row items-center gap-1">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="gap-1 pl-2.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:block">Önceki</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => {
            if (page === -1) {
              return (
                <Button
                  key={`ellipsis-${index}`}
                  variant="ghost"
                  size="sm"
                  disabled
                  className="w-9 h-9 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Daha fazla sayfa</span>
                </Button>
              );
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="w-9 h-9 p-0"
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="gap-1 pr-2.5"
        >
          <span className="hidden sm:block">Sonraki</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}

interface PaginationInfoProps {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  className?: string;
}

export function PaginationInfo({
  currentPage,
  itemsPerPage,
  totalItems,
  className,
}: PaginationInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      <span className="font-medium">{startItem}</span>
      {" - "}
      <span className="font-medium">{endItem}</span>
      {" / "}
      <span className="font-medium">{totalItems}</span>
      {" ürün gösteriliyor"}
    </div>
  );
}

interface ItemsPerPageSelectorProps {
  itemsPerPage: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  options?: number[];
  className?: string;
}

export function ItemsPerPageSelector({
  itemsPerPage,
  onItemsPerPageChange,
  options = [12, 24, 48],
  className,
}: ItemsPerPageSelectorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">Sayfa başına:</span>
      <div className="flex gap-1">
        {options.map((option) => (
          <Button
            key={option}
            variant={itemsPerPage === option ? "default" : "outline"}
            size="sm"
            onClick={() => onItemsPerPageChange(option)}
            className="h-8 px-2"
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}