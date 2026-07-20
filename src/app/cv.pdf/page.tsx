import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CV | Jared Muñoz",
  description:
    "Currículum de Jared Muñoz, Design Engineer y Fullstack Developer.",
};

export default function CV() {
  return (
    <iframe
      className="w-full h-full"
      src="https://jared-mb.kristall.app/Jared_Munoz_FullStack-Developer.pdf"
      title="Jared Muñoz CV"
    />
  );
}
