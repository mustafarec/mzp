'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">
          Bir hata oluştu
        </h2>
        <p className="text-muted-foreground mb-6">
          Beklenmedik bir hata meydana geldi. Lütfen tekrar deneyin.
        </p>
        <Button onClick={reset} variant="default">
          Tekrar Dene
        </Button>
      </div>
    </div>
  )
} 