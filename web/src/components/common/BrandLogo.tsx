"use client";

import React from "react";
import Image from "next/image";

interface BrandLogoProps {
  className?: string;
  size?: number;
  variant?: "adaptive" | "color" | "light" | "dark";
  alt?: string;
}

/**
 * BrandLogo Component
 * - Renders transparent PNG logo.
 * - 'adaptive' (default): Automatically displays black outline in Light Mode and white outline in Dark Mode.
 * - 'color': Displays tactical periwinkle/cyan gradient mark.
 * - 'light' / 'dark': Fixed light or dark mode asset.
 * - Drop-in replacement: Simply replace `/public/logo-light.png`, `/public/logo-dark.png`, or `/public/logo-color.png`.
 */
export function BrandLogo({
  className = "w-7 h-7",
  size = 28,
  variant = "adaptive",
  alt = "Drono Logo",
}: BrandLogoProps) {
  if (variant === "color") {
    return (
      <span className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <Image
          src="/logo-color.png"
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-contain"
          priority
        />
      </span>
    );
  }

  if (variant === "light") {
    return (
      <span className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <Image
          src="/logo-light.png"
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-contain"
          priority
        />
      </span>
    );
  }

  if (variant === "dark") {
    return (
      <span className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        <Image
          src="/logo-dark.png"
          alt={alt}
          width={size}
          height={size}
          className="w-full h-full object-contain"
          priority
        />
      </span>
    );
  }

  return (
    <span className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Light Mode Logo (Black on transparent background) */}
      <Image
        src="/logo-light.png"
        alt={alt}
        width={size}
        height={size}
        className="w-full h-full object-contain brand-logo-light dark:hidden"
        priority
      />
      {/* Dark Mode Logo (White on transparent background) */}
      <Image
        src="/logo-dark.png"
        alt={alt}
        width={size}
        height={size}
        className="w-full h-full object-contain brand-logo-dark hidden dark:block"
        priority
      />
    </span>
  );
}
