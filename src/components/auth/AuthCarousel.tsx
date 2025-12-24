import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthCarousel = () => {
  const [current, setCurrent] = React.useState(0);

  const images = [
    { src: "/img1.png", alt: "Slide 1" },
    { src: "/img2.png", alt: "Slide 2" },
    { src: "/img3.png", alt: "Slide 3" },
  ];

  const nextSlide = React.useCallback(() => {
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const prevSlide = React.useCallback(() => {
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      nextSlide();
    }, 7000);

    return () => clearInterval(intervalId);
  }, [nextSlide]);

  const onDotClick = (index: number) => {
    setCurrent(index);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-background group">
      {/* Images with True Crossfade Effect */}
      <div className="relative h-full w-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 w-full h-full transition-opacity duration-[2000ms] ease-in-out",
              current === index ? "opacity-100 z-20" : "opacity-0 z-10"
            )}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
              style={{
                backfaceVisibility: "hidden",
                perspective: "1000px",
                transform: "translate3d(0,0,0)" // Force GPU acceleration without movement
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Navigation Controls at Bottom - Only Dots */}
      <div className="absolute bottom-10 left-0 right-0 z-20 flex items-center justify-center">
        {/* Dots */}
        <div className="flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => onDotClick(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                current === index ? "bg-black w-6" : "bg-black/40 hover:bg-black/60"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthCarousel;
