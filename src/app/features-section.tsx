"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { BookOpen, Mic, WandSparkles, Palette, Users } from "lucide-react";
import { ProgressBar } from "./progress-bar";
import { ThemedImage } from "@/components/themed-image";

const AUTOPLAY_DELAY = 5000; // 5 seconds per feature
const PROGRESS_INTERVAL = 100; // Update progress every 100ms (reduced from 50ms)

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  imageLight: string;
}

export const features: Feature[] = [
  {
    id: 1,
    title: "Pre-built Lessons",
    description:
      "Jump right in with ready-made lessons designed to teach essential communication skills.",
    icon: <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    image:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//trainings.png",
    imageLight:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//trainings-light.png",
  },
  {
    id: 2,
    title: "Simulate conversations",
    description:
      "Practice live with AI using voice or text, and receive personal coaching after every session",
    icon: <Mic className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    image:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing/roleplay.png",
    imageLight:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing/roleplay-light.png",
  },
  {
    id: 3,
    title: "Build Custom Trainings",
    description:
      "Create your own roleplay scenarios and characters with AI-assisted guidance — no prompt skills required.",
    icon: <WandSparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    image:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//edit.png",
    imageLight:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//edit-light.png",
  },
  {
    id: 4,
    title: "Bring Trainings to Life",
    description:
      "Generate unique cover images and realistic characters to make your training sessions more engaging.",
    icon: <Palette className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    image:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//images.png",
    imageLight:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//images-light.png",
  },
  {
    id: 5,
    title: "Team Management & Insights",
    description:
      "Invite your team, assign trainings, and track their individual progress over time.",
    icon: <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    image:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//manage.png",
    imageLight:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//manage-light.png",
  },
];

// Add this CSS to create the fade effect on sides
const fadeAwayStyle = {
  maskImage:
    "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
  WebkitMaskImage:
    "linear-gradient(to right, transparent, black 20%, black 80%, transparent)",
};

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [completedFeatures, setCompletedFeatures] = useState<Set<number>>(
    new Set()
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Scroll to center the active feature
  const centerFeature = useCallback(
    (index: number) => {
      if (!scrollContainerRef.current) return;
      const itemWidth = window.innerWidth * 0.33;

      // If going from last to first, first scroll to the end then to the beginning
      if (index === 0 && activeFeature === features.length - 1) {
        scrollContainerRef.current.scrollTo({
          left: 0,
          behavior: "instant", // Instant scroll to prevent visual glitch
        });
      }

      const scrollPosition = index * itemWidth;
      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    },
    [activeFeature]
  );

  // Handle auto-advance - stable reference to prevent timer recreation
  const goToNextFeatureRef = useRef<(() => void) | null>(null);

  goToNextFeatureRef.current = () => {
    setIsTransitioning(true);
    setIsAutoAdvancing(true);
    setProgress(0);

    // Mark current feature as completed
    setCompletedFeatures((prev) => new Set(prev).add(activeFeature));

    setActiveFeature((prev) => {
      const nextIndex = prev === features.length - 1 ? 0 : prev + 1;

      // If we're going back to the first feature (completing a cycle), reset all completed features
      if (nextIndex === 0) {
        setCompletedFeatures(new Set());
      }

      requestAnimationFrame(() => {
        centerFeature(nextIndex);
      });
      return nextIndex;
    });

    setTimeout(() => {
      setIsTransitioning(false);
      setIsAutoAdvancing(false);
    }, 300);
  };

  const goToNextFeature = useCallback(() => {
    goToNextFeatureRef.current?.();
  }, []);

  // Progress timer effect - optimized to prevent memory leaks
  useEffect(() => {
    if (isTransitioning) return;

    let currentProgress = 0;
    let animationFrameId: number | null = null;

    const interval = setInterval(() => {
      currentProgress += (PROGRESS_INTERVAL / AUTOPLAY_DELAY) * 100;

      if (currentProgress >= 100) {
        clearInterval(interval);
        // Use requestAnimationFrame to ensure goToNextFeature runs at the right time
        animationFrameId = requestAnimationFrame(() => {
          goToNextFeature();
        });
      } else {
        setProgress(currentProgress);
      }
    }, PROGRESS_INTERVAL);

    return () => {
      clearInterval(interval);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isTransitioning, goToNextFeature]); // goToNextFeature is now stable

  const handleFeatureHover = (index: number) => {
    if (index !== activeFeature) {
      setActiveFeature(index);
      setProgress(0);
      // Reset completed features when manually switching
      setCompletedFeatures(new Set());
    }
  };

  const handleDragStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    setIsDragging(true);
    const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
    setStartX(pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return;
    e.preventDefault();
    const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
    const x = pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollContainerRef.current)
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Handle manual scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isTransitioning || isAutoAdvancing)
      return;

    const itemWidth = window.innerWidth * 0.33;
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const newIndex = Math.round(scrollLeft / itemWidth);

    if (
      newIndex !== activeFeature &&
      newIndex >= 0 &&
      newIndex < features.length
    ) {
      setActiveFeature(newIndex);
      setProgress(0);
      // Reset completed features when manually scrolling
      setCompletedFeatures(new Set());
      centerFeature(newIndex);
    }
  }, [activeFeature, isTransitioning, isAutoAdvancing, centerFeature]);

  // Add scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Calculate progress for each feature
  const getFeatureProgress = (index: number) => {
    if (completedFeatures.has(index)) {
      return 100; // Feature is completed, show full progress
    }
    if (index === activeFeature && !isTransitioning) {
      return progress; // Current active feature shows current progress
    }
    return 0; // Not started or not active
  };

  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="text-brand font-medium mb-4">FEATURES</div>
          <h2 className="text-4xl font-bold mb-16">
            Create, Practice, and Perfect Communication Skills
          </h2>

          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Image section - shown on top for mobile */}
            <div className="relative w-full aspect-17/11 max-w-4xl mx-auto image-container-enhanced mb-8">
              <div className="image-inner">
                {features.map((feature, index) => (
                  <ThemedImage
                    key={feature.id}
                    darkSrc={feature.image}
                    lightSrc={feature.imageLight || feature.image}
                    alt={feature.title}
                    fill
                    className={`transition-opacity duration-300 ${
                      index === activeFeature ? "opacity-100" : "opacity-0"
                    }`}
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
                    quality={90}
                  />
                ))}
              </div>
            </div>

            {/* Horizontal scrolling features list for mobile */}
            <div
              className="relative overflow-hidden px-4"
              style={fadeAwayStyle}
            >
              <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                style={{
                  paddingLeft: "calc(33vw)",
                  paddingRight: "calc(33vw)",
                }}
                onMouseDown={handleDragStart}
                onMouseLeave={handleDragEnd}
                onMouseUp={handleDragEnd}
                onMouseMove={handleDragMove}
                onTouchStart={handleDragStart}
                onTouchEnd={handleDragEnd}
                onTouchMove={handleDragMove}
              >
                {features.map((feature, index) => (
                  <div
                    key={feature.id}
                    className="flex-none w-[33vw] snap-center"
                  >
                    <div className="text-center px-2">
                      <div className="relative">
                        <div className="w-12 h-12 bg-linear-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          {feature.icon}
                        </div>
                        <ProgressBar
                          progress={getFeatureProgress(index)}
                          isActive={index === activeFeature}
                        />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 truncate mt-4">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Layout - unchanged */}
          <div className="hidden md:block">
            <div className="grid grid-cols-5 gap-8 mb-16">
              {features.map((feature, index) => (
                <div
                  key={feature.id}
                  className="text-center"
                  onMouseEnter={() => handleFeatureHover(index)}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-linear-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      {feature.icon}
                    </div>
                    <ProgressBar
                      progress={getFeatureProgress(index)}
                      isActive={index === activeFeature}
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 mt-4">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="relative w-full aspect-17/11 max-w-4xl mx-auto image-container-enhanced">
              <div className="image-inner">
                {features.map((feature, index) => (
                  <ThemedImage
                    key={feature.id}
                    darkSrc={feature.image}
                    lightSrc={feature.imageLight || feature.image}
                    alt={feature.title}
                    fill
                    className={`transition-opacity duration-300 ${
                      index === activeFeature ? "opacity-100" : "opacity-0"
                    }`}
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
                    quality={90}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
