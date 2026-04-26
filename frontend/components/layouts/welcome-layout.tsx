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
 * - Right: Donation QR, Legal
 */
export function WelcomeLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  footer,
}: WelcomeLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col">

      {/* Animated petal background */}
      <div className="mc-bg" aria-hidden="true">
        <div className="mc-glow g1" />
        <div className="mc-glow g2" />
        <div className="mc-glow g3" />
        <div className="mc-petals">
          <svg className="mc-petal" style={{left:"3%",  width:"14px", animationDuration:"14s", animationDelay:"0s"}}   viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFB8A8"/></svg>
          <svg className="mc-petal" style={{left:"8%",  width:"18px", animationDuration:"16s", animationDelay:"2s"}}   viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#E86A55"/></svg>
          <svg className="mc-petal" style={{left:"13%", width:"12px", animationDuration:"13s", animationDelay:"4s"}}   viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFB8A8"/></svg>
          <svg className="mc-petal" style={{left:"18%", width:"16px", animationDuration:"15s", animationDelay:"6s"}}   viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFD4A8"/></svg>
          <svg className="mc-petal" style={{left:"23%", width:"20px", animationDuration:"18s", animationDelay:"1s"}}   viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#E89A55"/></svg>
          <svg className="mc-petal" style={{left:"28%", width:"14px", animationDuration:"14s", animationDelay:"3s"}}   viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFA8C8"/></svg>
          <svg className="mc-petal" style={{left:"33%", width:"18px", animationDuration:"16s", animationDelay:"5s"}}   viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#D85A88"/></svg>
          <svg className="mc-petal" style={{left:"38%", width:"12px", animationDuration:"13s", animationDelay:"7s"}}   viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFB8A8"/></svg>
          <svg className="mc-petal" style={{left:"43%", width:"16px", animationDuration:"17s", animationDelay:"0.5s"}} viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFD4A8"/></svg>
          <svg className="mc-petal" style={{left:"48%", width:"20px", animationDuration:"19s", animationDelay:"2.5s"}} viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#E89A55"/></svg>
          <svg className="mc-petal" style={{left:"53%", width:"14px", animationDuration:"15s", animationDelay:"4.5s"}} viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFA8C8"/></svg>
          <svg className="mc-petal" style={{left:"58%", width:"18px", animationDuration:"16s", animationDelay:"6.5s"}} viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#E86A55"/></svg>
          <svg className="mc-petal" style={{left:"63%", width:"12px", animationDuration:"13s", animationDelay:"1.5s"}} viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFB8A8"/></svg>
          <svg className="mc-petal" style={{left:"68%", width:"16px", animationDuration:"17s", animationDelay:"8s"}}   viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#D85A88"/></svg>
          <svg className="mc-petal" style={{left:"73%", width:"20px", animationDuration:"20s", animationDelay:"9s"}}   viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#E86A55"/></svg>
          <svg className="mc-petal" style={{left:"78%", width:"14px", animationDuration:"14s", animationDelay:"10s"}}  viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFA8C8"/></svg>
          <svg className="mc-petal" style={{left:"83%", width:"18px", animationDuration:"16s", animationDelay:"11s"}}  viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFD4A8"/></svg>
          <svg className="mc-petal" style={{left:"88%", width:"12px", animationDuration:"13s", animationDelay:"12s"}}  viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#D85A88"/></svg>
          <svg className="mc-petal" style={{left:"93%", width:"16px", animationDuration:"15s", animationDelay:"3.5s"}} viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFB8A8"/></svg>
          <svg className="mc-petal" style={{left:"97%", width:"14px", animationDuration:"14s", animationDelay:"5.5s"}} viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#E89A55"/></svg>
          <svg className="mc-petal" style={{left:"6%",  width:"18px", animationDuration:"18s", animationDelay:"7.5s"}} viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFA8C8"/></svg>
          <svg className="mc-petal" style={{left:"21%", width:"14px", animationDuration:"14s", animationDelay:"9.5s"}} viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#E86A55"/></svg>
          <svg className="mc-petal" style={{left:"36%", width:"16px", animationDuration:"17s", animationDelay:"11.5s"}} viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFD4A8"/></svg>
          <svg className="mc-petal" style={{left:"51%", width:"12px", animationDuration:"13s", animationDelay:"13s"}}  viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#D85A88"/></svg>
          <svg className="mc-petal" style={{left:"66%", width:"18px", animationDuration:"19s", animationDelay:"14s"}}  viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFB8A8"/></svg>
          <svg className="mc-petal" style={{left:"81%", width:"14px", animationDuration:"14s", animationDelay:"15s"}}  viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#E86A55"/></svg>
          <svg className="mc-petal" style={{left:"11%", width:"20px", animationDuration:"20s", animationDelay:"16s"}}  viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#E89A55"/></svg>
          <svg className="mc-petal" style={{left:"46%", width:"14px", animationDuration:"14s", animationDelay:"17s"}}  viewBox="0 0 20 24"><path d="M 10 1 Q 19 8 16 18 Q 10 23 4 18 Q 1 8 10 1 Z" fill="#FFA8C8"/></svg>
        </div>
        <div className="mc-dim" />
      </div>

      {/* Main Content */}
      <main className="relative z-[1] flex-1 flex items-center justify-center p-[var(--spacing-4)] md:p-[var(--spacing-8)]">
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

            {/* Right Panel - Donation QR + Legal */}
            <div className="order-3 text-center md:text-right">
              {rightPanel}
            </div>
          </div>
        </div>
      </main>

      {/* Optional Footer */}
      {footer && (
        <footer className="relative z-[1] py-[var(--spacing-4)] text-center text-xs text-[var(--color-neutral-500)]">
          {footer}
        </footer>
      )}
    </div>
  );
}
