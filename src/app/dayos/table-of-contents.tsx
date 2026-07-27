"use client";

import { useEffect, useState } from "react";
import { SECTIONS, type SectionId } from "./sections";

/**
 * Lo que scrollea no es la página sino el `WindowContent` de la ventana, así
 * que el observer necesita ese nodo como root: con el viewport, los márgenes se
 * medirían contra la pantalla entera y no contra el pedazo de ella que ocupa la
 * ventana. Si el artículo se renderiza fuera de un escritorio no hay ancestro
 * con scroll propio y `null` — el viewport — es justamente lo correcto.
 */
function scrollParent(node: Element): Element | null {
  for (let el = node.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") return el;
  }
  return null;
}

/**
 * La sección activa es la primera del índice que esté visible, no la última que
 * cruzó el borde: al hacer scroll hacia arriba se entra a una sección por abajo,
 * y quedarse con la que disparó el evento marcaría la de más abajo de las dos.
 *
 * El `rootMargin` recorta el 60% inferior del contenedor para que "visible"
 * quiera decir "arriba del todo", que es donde uno lee. Eso deja un caso que hay
 * que tratar aparte: abajo del todo ya no queda scroll para subir la última
 * sección hasta esa banda, así que sin la excepción nunca se marcaría — y es
 * justo la que el lector tiene delante.
 *
 * Las dos reglas viven en la misma función a propósito. Con un `setActive` por
 * cada fuente, el callback del observer llega después del evento de scroll y
 * pisaría la excepción del final.
 */
function useActiveSection() {
  const [active, setActive] = useState<SectionId | null>(null);

  useEffect(() => {
    const nodes = SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (node) => node !== null,
    );
    if (nodes.length === 0) return;

    const root = scrollParent(nodes[0]);
    const scroller = root ?? document.documentElement;
    const visible = new Set<string>();

    const update = () => {
      const atBottom =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 2;
      if (atBottom) {
        setActive(SECTIONS[SECTIONS.length - 1].id);
        return;
      }
      const first = SECTIONS.find(({ id }) => visible.has(id));
      if (first) setActive(first.id);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        update();
      },
      { root, rootMargin: "0px 0px -60% 0px" },
    );
    for (const node of nodes) observer.observe(node);

    const target = root ?? window;
    target.addEventListener("scroll", update, { passive: true });

    return () => {
      observer.disconnect();
      target.removeEventListener("scroll", update);
    };
  }, []);

  return active;
}

/**
 * En este escritorio la URL dice qué ventana está abierta: DayOS se guarda la
 * última de cada una y la reescribe con `router.replace` al volver a enfocarla.
 * Un `#status` metido ahí adentro se cuela en ese ciclo y Next lo vuelve a pegar
 * sobre una URL que ya lo tenía — `/dayos#status#status` —, una vez por cada
 * viaje de ida y vuelta. Y aparte cada ancla deja una entrada en el historial,
 * que es justo lo que el escritorio evita usando `replace` y no `push`.
 *
 * Así que el click scrollea a mano y no toca la URL. El `href` sigue siendo el
 * ancla igual: antes de hidratar, que es cuando no hay handler, el navegador
 * hace lo suyo, y el enlace se puede copiar.
 */
function scrollToSection(
  event: React.MouseEvent<HTMLAnchorElement>,
  id: SectionId,
) {
  // Los clicks que abren en otra pestaña o ventana siguen siendo del navegador.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const section = document.getElementById(id);
  if (!section) return;

  event.preventDefault();
  section.scrollIntoView();
  // El ancla también movía el foco, y sin eso un lector de pantalla se queda
  // donde estaba mientras la pantalla se va a otro lado.
  section.focus({ preventScroll: true });
}

/** Navegación vertical del artículo. */
export function TableOfContents() {
  const active = useActiveSection();

  return (
    <nav
      aria-label="On this page"
      className="sticky top-0 hidden h-fit w-48 shrink-0 @3xl:block"
    >
      <p className="mb-2 font-semibold text-foreground/50 text-sm uppercase tracking-wide">
        On this page
      </p>
      <ul className="flex flex-col border-foreground/15 border-l">
        {SECTIONS.map(({ id, title }) => (
          <li key={id} className="flex">
            <a
              href={`#${id}`}
              onClick={(event) => scrollToSection(event, id)}
              aria-current={active === id ? "location" : undefined}
              className="-ml-px border-transparent border-l py-1 pl-3 text-foreground/60 text-sm hover:text-foreground aria-[current=location]:border-amber-400 aria-[current=location]:font-medium aria-[current=location]:text-foreground"
            >
              {title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
