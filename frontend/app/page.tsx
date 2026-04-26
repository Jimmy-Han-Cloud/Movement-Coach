"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WelcomeLayout } from "@/components/layouts";
import { ProductInfo, DemoAnimation, RemotePanel } from "@/components/welcome";
import { Button } from "@/components/ui";

/**
 * Page 1 — Welcome
 * Per UX Specification v1.0 Section 3
 *
 * Layout: Left–Center–Right
 * - Left: Product Info, Key benefits, Trust framing
 * - Center: Cartoon Animation (demo), START button
 * - Right: Donation QR, Legal (collapsed)
 */
export default function WelcomePage() {
  const router = useRouter();
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);

  const handleStart = useCallback(() => {
    router.push("/avatar");
  }, [router]);

  // Keyboard mapping: Enter/Space → START
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleStart]);

  // TODO: Implement remote connection via WebSocket
  // For now, this is a placeholder

  return (
    <WelcomeLayout
      leftPanel={<ProductInfo />}
      centerPanel={
        <div className="flex flex-col items-center gap-[var(--spacing-6)]">
          {/* Demo Animation */}
          <DemoAnimation />

          {/* START Button - Primary CTA */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleStart}
            className="min-w-[200px] text-xl font-semibold shadow-[var(--shadow-glow)] hover:shadow-[0_0_30px_rgb(59_130_246/0.6)]"
          >
            START
          </Button>
        </div>
      }
      rightPanel={
        <RemotePanel
          isConnected={isRemoteConnected}
          pairingCode="MC-1234"
        />
      }
    />
  );
}
