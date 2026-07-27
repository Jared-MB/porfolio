import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AreWePlaying? | Jared Muñoz",
  description:
    "AreWePlaying?, un proyecto de Jared Muñoz, Design Engineer y Fullstack Developer.",
};

export default function AreWePlayingPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-4 p-6 text-foreground">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold leading-tight">AreWePlaying?</h1>
      </header>
      {/* TODO: contar qué es y qué resuelve, con link al repo o a la demo. */}
      <p className="max-w-prose text-foreground/80">Pendiente de escribir.</p>
    </article>
  );
}
