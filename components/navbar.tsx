"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/5 dark:bg-black/20 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center
                          shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow duration-300">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            OmniMind
          </span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/auth/login"
            className="px-5 py-2 text-sm font-semibold rounded-full
                       bg-gradient-to-r from-violet-600 to-fuchsia-600
                       hover:from-violet-500 hover:to-fuchsia-500
                       text-white shadow-lg shadow-violet-500/25
                       hover:shadow-violet-500/40
                       transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
