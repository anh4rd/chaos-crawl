import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

export default function Page({ title, children }: Props) {
  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: "32px 20px",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          fontFamily: "Poppins",
          fontSize: 34,
          marginBottom: 30,
        }}
      >
        {title}
      </h1>

      {children}
    </main>
  );
}