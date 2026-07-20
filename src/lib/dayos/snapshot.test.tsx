import { render, screen, within } from "@testing-library/react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useContext } from "react";
import { describe, expect, it } from "vitest";
import { RoutedApp, TEST_ROUTES, windowMarker } from "@/test/fixtures";
import { setLocation } from "@/test/next-router";
import { RoutedDesktop, WindowRouteProvider } from "./next";

/**
 * Cada ventana tiene que seguir mostrando el contenido de su ruta cuando el foco
 * se va a otra. Lo que entrega el router de Next no es contenido sino un puntero
 * al segmento activo, así que guardar el nodo no alcanza: al re-renderizarlo
 * pinta la ruta de ahora y todas las ventanas terminan mostrando lo mismo. Por
 * eso `useWindowRoute` guarda también el contexto del router que había cuando la
 * ruta era la activa, y lo vuelve a proveer alrededor del nodo congelado.
 *
 * Acá el contexto lo provee el test, no Next. Eso no reproduce un segmento real
 * —el nodo es un elemento común y no un puntero—, pero sí verifica lo único que
 * `dayos` controla: que el subárbol congelado vea el contexto de su momento y no
 * el de la ruta actual.
 */
const routerFor = (segmento: string) =>
  ({ tree: segmento }) as unknown as React.ContextType<
    typeof LayoutRouterContext
  >;

/** Delata qué contexto de router ve el subárbol donde esté montado. */
function SegmentProbe() {
  const context = useContext(LayoutRouterContext);

  return (
    <span>
      SEGMENTO({(context as unknown as { tree?: string })?.tree ?? "ninguno"})
    </span>
  );
}

const pageFor = (href: string) => (
  <>
    <p>CONTENIDO({href})</p>
    <SegmentProbe />
  </>
);

const tree = (href: string) => (
  <LayoutRouterContext value={routerFor(href)}>
    <WindowRouteProvider content={pageFor(href)} routes={TEST_ROUTES}>
      <RoutedDesktop>
        {TEST_ROUTES.map((route) => (
          <RoutedApp key={route} href={route} />
        ))}
      </RoutedDesktop>
    </WindowRouteProvider>
  </LayoutRouterContext>
);

/** El diálogo de una ventana, para poder afirmar sobre cada una por separado. */
const windowFor = (href: string) => {
  const dialog = screen
    .getByText(windowMarker(href))
    .closest('[role="dialog"]');

  if (!dialog) throw new Error(`la ventana ${href} no está abierta`);

  return within(dialog as HTMLElement);
};

/** Navega como lo hace Next: cambia la URL y el `children` del layout a la vez. */
const navigate = (rerender: (ui: React.ReactNode) => void, href: string) => {
  setLocation(href);
  rerender(tree(href));
};

describe("el contenido de cada ventana sobrevive al cambio de foco", () => {
  it("la ventana que perdió el foco conserva su contenido", () => {
    setLocation("/docs");
    const { rerender } = render(tree("/docs"));

    expect(windowFor("/docs").getByText("CONTENIDO(/docs)")).toBeTruthy();

    navigate(rerender, "/github");

    // La de github muestra lo suyo y la de docs sigue con lo suyo: sin el
    // congelado, las dos mostrarían el contenido de github.
    expect(windowFor("/github").getByText("CONTENIDO(/github)")).toBeTruthy();
    expect(windowFor("/docs").getByText("CONTENIDO(/docs)")).toBeTruthy();
    expect(windowFor("/docs").queryByText("CONTENIDO(/github)")).toBeNull();
  });

  // Es la razón de ser de guardar el contexto junto al nodo. Si el subárbol
  // congelado se renderizara sin re-proveerlo, leería el router de la ruta
  // actual y el nodo resolvería al segmento equivocado.
  it("y también el contexto de router que tenía en ese momento", () => {
    setLocation("/docs");
    const { rerender } = render(tree("/docs"));

    navigate(rerender, "/github");

    expect(windowFor("/docs").getByText("SEGMENTO(/docs)")).toBeTruthy();
    expect(windowFor("/github").getByText("SEGMENTO(/github)")).toBeTruthy();
  });

  // El congelado tiene que ser reversible y simétrico: volver descongela la que
  // estaba quieta y congela la que se deja. Si el snapshot se quedara pegado,
  // esto mostraría la ventana de docs con contenido viejo.
  it("volver a una ventana la descongela y congela la otra", () => {
    setLocation("/docs");
    const { rerender } = render(tree("/docs"));

    navigate(rerender, "/github");
    navigate(rerender, "/docs");

    expect(windowFor("/docs").getByText("CONTENIDO(/docs)")).toBeTruthy();
    expect(windowFor("/docs").getByText("SEGMENTO(/docs)")).toBeTruthy();
    expect(windowFor("/github").getByText("CONTENIDO(/github)")).toBeTruthy();
    expect(windowFor("/github").getByText("SEGMENTO(/github)")).toBeTruthy();
  });
});

describe("mientras la ventana es la ruta actual su contenido va en vivo", () => {
  // Congelar de más rompería navegar adentro de una ventana: el contenido
  // quedaría clavado en la primera vista que mostró.
  it("navegar dentro de la ventana actualiza lo que muestra", () => {
    setLocation("/docs");
    const { rerender } = render(tree("/docs"));

    navigate(rerender, "/docs/api");

    expect(
      windowFor("/docs/api").getByText("CONTENIDO(/docs/api)"),
    ).toBeTruthy();
  });
});
