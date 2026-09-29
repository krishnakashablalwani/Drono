"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, Menu, X, ArrowRight } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full px-6 sm:px-8 max-w-[1200px] mx-auto pt-6 pb-4">
      <nav
        aria-label="Main Navigation"
        className="flex items-center justify-between transition-all duration-200"
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <BrandLogo className="w-7 h-7 group-hover:scale-105 transition-transform" size={28} />
          <span className="font-serif-display text-2xl tracking-tight text-foreground">
            Drono
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-7 text-[14px] font-sans-ui">
          <Link
            href="/#overview"
            className="text-[var(--text-secondary)] hover:text-foreground transition-colors"
          >
            Overview
          </Link>
          <Link
            href="/#operational-context"
            className="text-[var(--text-secondary)] hover:text-foreground transition-colors"
          >
            Doctrine
          </Link>
          <Link
            href="/#pipeline"
            className="text-[var(--text-secondary)] hover:text-foreground transition-colors"
          >
            Pipeline
          </Link>
          <Link
            href="/#math-foundations"
            className="text-[var(--text-secondary)] hover:text-foreground transition-colors"
          >
            Math
          </Link>
          <Link
            href="/viewer"
            className="text-[var(--text-secondary)] hover:text-foreground transition-colors"
          >
            3D Viewer
          </Link>
          <Link
            href="/console"
            className="text-[var(--text-secondary)] hover:text-foreground transition-colors"
          >
            Ingest Studio
          </Link>
        </div>

        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Light/Dark Mode"
            className="p-2 rounded-full hover:bg-[var(--color-mist-gray)] text-[var(--text-secondary)] hover:text-foreground transition-all cursor-pointer border border-[var(--border-subtle)]"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>

          {/* Filled Pill CTA */}
          <Link
            href="/console"
            className="hidden sm:inline-flex btn-pill-filled text-sm"
          >
            <span>Launch Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-foreground"
            aria-label="Open mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 neutral-card p-6 flex flex-col gap-4 text-sm font-sans-ui border border-[var(--border-subtle)]">
          <Link
            href="/#overview"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[var(--text-secondary)] hover:text-foreground py-1"
          >
            Overview
          </Link>
          <Link
            href="/#operational-context"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[var(--text-secondary)] hover:text-foreground py-1"
          >
            Doctrine
          </Link>
          <Link
            href="/#pipeline"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[var(--text-secondary)] hover:text-foreground py-1"
          >
            Pipeline
          </Link>
          <Link
            href="/#math-foundations"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[var(--text-secondary)] hover:text-foreground py-1"
          >
            Math
          </Link>
          <Link
            href="/viewer"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[var(--text-secondary)] hover:text-foreground py-1"
          >
            3D Viewer
          </Link>
          <Link
            href="/console"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[var(--text-secondary)] hover:text-foreground py-1"
          >
            Ingest Studio
          </Link>
          <Link
            href="/console"
            onClick={() => setMobileMenuOpen(false)}
            className="btn-pill-filled text-center py-2.5 mt-2"
          >
            Launch Console
          </Link>
        </div>
      )}
    </header>
  );
}
