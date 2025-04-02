"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { BarChart3, Brain, LineChart, FileText } from "lucide-react";
import { ProgressBar } from "./progress-bar";
import { ThemedImage } from "@/components/themed-image";

const AUTOPLAY_DELAY = 5000; // 5 seconds per feature
const PROGRESS_INTERVAL = 50; // Update progress every 50ms

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
    description: "Lots of pre-built lessons to get you started.",
    icon: <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    image:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//catalog.png",
    imageLight:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//catalog-light.png",
  },
  {
    id: 2,
    title: "Build your unique characters",
    description: "Create your own characters and use them in your lessons.",
    icon: <Brain className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    image:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//characters.png",
    imageLight:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//characters-light.png",
  },
  {
    id: 3,
    title: "Customize your lessons",
    description: "Add your own lessons and use them.",
    icon: <LineChart className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    image:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//edit-trainings.png",
    imageLight:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//edit-trainings-light.png",
  },
  {
    id: 4,
    title: "Manage your enrollments",
    description: "Enroll yourself or your students and track their progress.",
    icon: <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    image:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//enrollments.png",
    imageLight:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing//enrollments-light.png",
  },
  {
    id: 5,
    title: "Simulate conversations",
    description:
      "Use SOTA AI models to simulate conversations and get feedback.",
    icon: <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    image:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing/simulation.png",
    imageLight:
      "https://bansnvpaqqmnoildskpz.supabase.co/storage/v1/object/public/landing/simulation-light.png",
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

  // Handle auto-advance
  const goToNextFeature = useCallback(() => {
    setIsTransitioning(true);
    setIsAutoAdvancing(true);
    setProgress(0);

    setActiveFeature((prev) => {
      const nextIndex = prev === features.length - 1 ? 0 : prev + 1;
      requestAnimationFrame(() => {
        centerFeature(nextIndex);
      });
      return nextIndex;
    });

    setTimeout(() => {
      setIsTransitioning(false);
      setIsAutoAdvancing(false);
    }, 300);
  }, [centerFeature]);

  // Progress timer effect
  useEffect(() => {
    if (isTransitioning) return;

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += (PROGRESS_INTERVAL / AUTOPLAY_DELAY) * 100;

      if (currentProgress >= 100) {
        clearInterval(interval);
        goToNextFeature();
      } else {
        setProgress(currentProgress);
      }
    }, PROGRESS_INTERVAL);

    return () => clearInterval(interval);
  }, [isTransitioning, goToNextFeature]);

  const handleFeatureHover = (index: number) => {
    if (index !== activeFeature) {
      setActiveFeature(index);
      setProgress(0);
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

  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="text-brand font-medium mb-4">FEATURES</div>
          <h2 className="text-4xl font-bold mb-16">
            User Flows and Navigational Structures
          </h2>

          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Image section - shown on top for mobile */}
            <div className="relative w-full aspect-[16/10] max-w-4xl mx-auto image-container-enhanced mb-8">
              <div className="image-inner">
                {features.map((feature, index) => (
                  <ThemedImage
                    key={feature.id}
                    darkSrc={feature.image}
                    lightSrc={feature.imageLight || feature.image}
                    alt={feature.title}
                    fill
                    className={`transition-opacity duration-300 rounded-2xl ${
                      index === activeFeature ? "opacity-100" : "opacity-0"
                    }`}
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
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
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          {feature.icon}
                        </div>
                        <ProgressBar
                          progress={
                            index === activeFeature && !isTransitioning
                              ? progress
                              : 0
                          }
                          isActive={index === activeFeature}
                        />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 truncate">
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
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      {feature.icon}
                    </div>
                    <ProgressBar
                      progress={
                        index === activeFeature && !isTransitioning
                          ? progress
                          : 0
                      }
                      isActive={index === activeFeature}
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="relative w-full aspect-[16/10] max-w-4xl mx-auto image-container-enhanced">
              <div className="image-inner">
                {features.map((feature, index) => (
                  <ThemedImage
                    key={feature.id}
                    darkSrc={feature.image}
                    lightSrc={feature.imageLight || feature.image}
                    alt={feature.title}
                    fill
                    className={`transition-opacity duration-300 rounded-2xl ${
                      index === activeFeature ? "opacity-100" : "opacity-0"
                    }`}
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
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
