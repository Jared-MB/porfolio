import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentos | Jared Muñoz",
  // Todavía es un placeholder: indexarlo solo suma una página vacía al sitio.
  // Sacar el `robots` cuando tenga contenido de verdad.
  robots: { index: false, follow: true },
};

export default function Documents() {
  return <div>page</div>;
}
