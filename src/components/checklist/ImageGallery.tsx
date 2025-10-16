import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma imagem disponível
      </div>
    );
  }

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((imageUrl, index) => (
          <Card
            key={index}
            className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
            onClick={() => setSelectedIndex(index)}
          >
            <img
              src={imageUrl}
              alt={`Imagem ${index + 1}`}
              className="w-full h-32 object-cover"
            />
          </Card>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <img
              src={selectedIndex !== null ? images[selectedIndex] : ''}
              alt={`Imagem ${(selectedIndex ?? 0) + 1}`}
              className="w-full h-auto max-h-[80vh] object-contain"
            />

            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            {selectedIndex !== null && selectedIndex > 0 && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            {selectedIndex !== null && selectedIndex < images.length - 1 && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            {selectedIndex !== null && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                {selectedIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
