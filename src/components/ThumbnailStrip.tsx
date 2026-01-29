import { useState, useEffect, useRef, useCallback } from 'react';

interface ThumbnailStripProps {
  imageIds: string[];
  currentIndex: number;
  onSelect: (index: number) => void;
  thumbnails: Map<string, string>;
  seriesBoundaries?: number[]; // Indices where new series start
}

export function ThumbnailStrip({
  imageIds,
  currentIndex,
  onSelect,
  thumbnails,
  seriesBoundaries = [],
}: ThumbnailStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  // Calculate visible range for lazy loading
  const updateVisibleRange = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const itemWidth = 72; // 64px thumbnail + 8px gap

    const start = Math.max(0, Math.floor(scrollLeft / itemWidth) - 5);
    const end = Math.min(
      imageIds.length,
      Math.ceil((scrollLeft + containerWidth) / itemWidth) + 5
    );

    setVisibleRange({ start, end });
  }, [imageIds.length]);

  // Scroll current thumbnail into view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const itemWidth = 72;
    const currentPosition = currentIndex * itemWidth;
    const containerWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;

    // Scroll if current item is out of view
    if (currentPosition < scrollLeft) {
      container.scrollTo({ left: currentPosition - 20, behavior: 'smooth' });
    } else if (currentPosition > scrollLeft + containerWidth - itemWidth) {
      container.scrollTo({
        left: currentPosition - containerWidth + itemWidth + 20,
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateVisibleRange();

    const handleScroll = () => {
      updateVisibleRange();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [updateVisibleRange]);

  // Handle mouse wheel for horizontal scrolling
  const handleWheel = (e: React.WheelEvent) => {
    const container = containerRef.current;
    if (!container) return;

    // Horizontal scroll with wheel
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    }
  };

  if (imageIds.length <= 1) {
    return null;
  }

  return (
    <div className="bg-dicom-darker border-t border-gray-700 py-2">
      <div
        ref={containerRef}
        className="flex gap-2 px-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600"
        onWheel={handleWheel}
        style={{ scrollbarWidth: 'thin' }}
      >
        {imageIds.map((imageId, index) => {
          const isVisible = index >= visibleRange.start && index <= visibleRange.end;
          const isSeriesStart = seriesBoundaries.includes(index) && index !== 0;
          const thumbnailUrl = thumbnails.get(imageId);

          return (
            <div key={imageId} className="flex items-center">
              {/* Series separator */}
              {isSeriesStart && (
                <div className="w-px h-12 bg-dicom-accent mx-1" title="New series" />
              )}

              <button
                onClick={() => onSelect(index)}
                className={`
                  relative flex-shrink-0 w-16 h-16 rounded overflow-hidden
                  transition-all duration-150
                  ${index === currentIndex
                    ? 'ring-2 ring-dicom-accent ring-offset-2 ring-offset-dicom-darker'
                    : 'hover:ring-1 hover:ring-gray-500'
                  }
                `}
                title={`Image ${index + 1}`}
              >
                {isVisible ? (
                  thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <span className="text-xs text-gray-500">{index + 1}</span>
                    </div>
                  )
                ) : (
                  <div className="w-full h-full bg-gray-800" />
                )}

                {/* Index badge */}
                <div className="absolute bottom-0 right-0 px-1 bg-black/70 text-xs text-gray-300">
                  {index + 1}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Navigation hint */}
      <div className="flex justify-center mt-1">
        <span className="text-xs text-gray-500">
          {currentIndex + 1} of {imageIds.length}
        </span>
      </div>
    </div>
  );
}

// Standalone thumbnail component for lazy loading
interface ThumbnailItemProps {
  index: number;
  imageId: string;
  isSelected: boolean;
  thumbnailUrl?: string;
  onClick: () => void;
}

export function ThumbnailItem({
  index,
  isSelected,
  thumbnailUrl,
  onClick,
}: ThumbnailItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex-shrink-0 w-16 h-16 rounded overflow-hidden
        transition-all duration-150
        ${isSelected
          ? 'ring-2 ring-dicom-accent ring-offset-2 ring-offset-dicom-darker'
          : 'hover:ring-1 hover:ring-gray-500'
        }
      `}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={`Thumbnail ${index + 1}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <span className="text-xs text-gray-500">{index + 1}</span>
        </div>
      )}

      <div className="absolute bottom-0 right-0 px-1 bg-black/70 text-xs text-gray-300">
        {index + 1}
      </div>
    </button>
  );
}
