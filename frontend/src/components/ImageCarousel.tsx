import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

type Props = {
  images: string[];
  initialIndex: number;
  onClose: () => void;
};

export default function ImageCarousel({
  images,
  initialIndex,
  onClose,
}: Props) {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;
    api.scrollTo(initialIndex, true);
  }, [api, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-bg/95 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Header area for Close Button */}
      <div className="flex w-full items-center justify-end p-4">
        <button
          onClick={onClose}
          className="z-50 rounded-full bg-surface/50 p-2 text-ink transition-colors hover:bg-surface"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Carousel Area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* Left Arrow */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              api?.scrollPrev();
            }}
            className="absolute left-4 z-50 rounded-full bg-surface/50 p-3 text-ink transition-colors hover:bg-surface"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <Carousel
          setApi={setApi}
          opts={{ startIndex: initialIndex, loop: true }}
          className="w-full max-w-5xl"
        >
          <CarouselContent>
            {images.map((url, index) => (
              <CarouselItem
                key={index}
                className="flex items-center justify-center"
              >
                <img
                  src={url}
                  alt={`Attachment ${index + 1}`}
                  className="max-h-[80vh] w-auto max-w-full rounded border border-border/50 object-contain shadow-2xl select-none"
                  draggable={false}
                  onClick={(e) => e.stopPropagation()}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Right Arrow */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              api?.scrollNext();
            }}
            className="absolute right-4 z-50 rounded-full bg-surface/50 p-3 text-ink transition-colors hover:bg-surface"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
}
