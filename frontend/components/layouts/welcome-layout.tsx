"use client";

import { type ReactNode } from "react";

interface WelcomeLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
  footer?: ReactNode;
}

/**
 * Welcome Page Layout (Page 1)
 * Left-Center-Right three-column layout per UX Spec 3.1
 *
 * - Left: Product Info, Key benefits, Trust framing
 * - Center: Cartoon Animation, START button
 * - Right: QR Code, Remote Status, Legal
 */
export function WelcomeLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  footer,
}: WelcomeLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-[var(--spacing-4)] md:p-[var(--spacing-8)]">
        <div className="w-full max-w-6xl mx-auto">
          {/* Three Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-6)] md:gap-[var(--spacing-8)] items-center">
            {/* Left Panel - Product Info */}
            <div className="order-2 md:order-1 text-center md:text-left">
              {leftPanel}
            </div>

            {/* Center Panel - Animation + CTA */}
            <div className="order-1 md:order-2 flex flex-col items-center">
              {centerPanel}
            </div>

            {/* Right Panel - Remote + Legal */}
            <div className="order-3 text-center md:text-right">
              {rightPanel}
            </div>
          </div>
        </div>
      </main>

      {/* Optional Footer */}
      {footer && (
        <footer className="py-[var(--spacing-4)] text-center text-xs text-[var(--color-neutral-500)]">
          {footer}
        </footer>
      )}
    </div>
  );
}
