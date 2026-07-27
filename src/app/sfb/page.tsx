import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suspense Fallback Debugger | Jared Muñoz",
  description:
    "Suspense Fallback Debugger, una herramienta de Jared Muñoz, Design Engineer y Fullstack Developer.",
};

export default function SuspenseFallbackDebuggerPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-4 p-6 text-foreground">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold leading-tight">
          Suspense Fallback Debugger
        </h1>
      </header>
      {/* TODO: contar qué es y qué resuelve, con link al repo o a la demo. */}
      <p className="max-w-prose text-foreground/80">Pendiente de escribir.</p>
    </article>
  );
}
