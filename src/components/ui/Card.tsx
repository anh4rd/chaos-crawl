import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-white p-6 backdrop-blur-md shadow-[0_0_1px_#000000] ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
