/**
 * El índice del artículo y sus títulos son una sola lista: `Section` toma su
 * título de acá en vez de recibirlo, así que una sección no puede terminar
 * llamándose distinto en la navegación que en el cuerpo, ni quedar afuera del
 * índice por olvido.
 */
export const SECTIONS = [
  { id: "where-it-came-from", title: "Where it came from" },
  { id: "the-idea", title: "The idea" },
  { id: "packages", title: "Packages" },
  { id: "usage", title: "Usage" },
  { id: "server-render", title: "The window that exists before React does" },
  { id: "one-url", title: "One window, one URL" },
  { id: "in-use", title: "The parts that only show up in use" },
  { id: "status", title: "Status" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

export const SECTION_TITLES = Object.fromEntries(
  SECTIONS.map(({ id, title }) => [id, title]),
) as Record<SectionId, string>;
