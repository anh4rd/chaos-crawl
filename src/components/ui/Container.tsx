import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
}

export default function Container({ children }: ContainerProps) {
  return (
    <main
      className="
        mx-auto
        min-h-screen
        max-w-md
        px-6
        py-8
      "
    >
      {children}
    </main>
  );
}