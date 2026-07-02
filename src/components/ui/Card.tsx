import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div
      className={`rounded-3xl border-4 border-pink-500 bg-black/70 p-6 backdrop-blur-md shadow-[0_0_25px_#ff1493] ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
