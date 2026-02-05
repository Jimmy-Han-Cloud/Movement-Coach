"use client";

import { useEffect, useRef } from "react";
import type { TrackedPoints } from "@/modules/pose-validation";

interface SkeletonCanvasProps {
  trackedPoints: TrackedPoints | null;
  inTarget: boolean;
  holdAchieved: boolean;
  elbowParticipating: boolean;
  participating: boolean;
  width: number;
  height: number;
}

const BONE_CONNECTIONS: [keyof TrackedPoints, keyof TrackedPoints][] = [
  ["head", "left_shoulder"],
  ["head", "right_shoulder"],
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["right_shoulder", "right_elbow"],
  ["left_elbow", "left_hand"],
  ["right_elbow", "right_hand"],
];

function feedbackColor(props: SkeletonCanvasProps): string {
  if (props.holdAchieved) return "#22c55e"; // green — hold complete
  if (props.inTarget) return "#3b82f6"; // blue — in position
  if (props.participating) return "#f59e0b"; // amber — moving
  return "#ef4444"; // red — not participating
}

function jointColor(
  point: keyof TrackedPoints,
  elbowParticipating: boolean,
): string {
  if (
    (point === "left_elbow" || point === "right_elbow") &&
    !elbowParticipating
  ) {
    return "#ef4444"; // red — elbow not participating
  }
  return "#ffffff";
}

export function SkeletonCanvas(props: SkeletonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, props.width, props.height);

    if (!props.trackedPoints) return;

    const pts = props.trackedPoints;
    const w = props.width;
    const h = props.height;

    // Draw bones
    const boneColor = feedbackColor(props);
    ctx.strokeStyle = boneColor;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    for (const [from, to] of BONE_CONNECTIONS) {
      const a = pts[from];
      const b = pts[to];
      ctx.beginPath();
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
      ctx.stroke();
    }

    // Draw joints
    const jointKeys = Object.keys(pts) as (keyof TrackedPoints)[];
    for (const key of jointKeys) {
      const p = pts[key];
      ctx.fillStyle = jointColor(key, props.elbowParticipating);
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [props]);

  return (
    <canvas
      ref={canvasRef}
      width={props.width}
      height={props.height}
      className="absolute top-0 left-0 pointer-events-none"
    />
  );
}
