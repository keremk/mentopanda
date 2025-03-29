"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ThemedImageProps = {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
};

export function ThemedImage({
  lightSrc,
  darkSrc,
  alt,
  className,
  fill = false,
  width,
  height,
  priority = false,
  sizes,
}: ThemedImageProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use appropriate image based on current theme
  const src = !mounted ? darkSrc : theme === "dark" ? darkSrc : lightSrc;

  return (
    <Image
      src={src}
      alt={alt}
      className={cn("object-cover", className)}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      priority={priority}
      sizes={sizes}
    />
  );
}
