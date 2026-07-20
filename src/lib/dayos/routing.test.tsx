import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoutedApp, TEST_ROUTES, windowMarker } from "@/test/fixtures";
import { setLocation } from "@/test/next-router";
import { RoutedDesktop, WindowRouteProvider } from "./next";

/**
 * Todo acá se mide sobre el HTML del servidor y no sobre un render de cliente.
 * No es un detalle: `useWindowRoute` también abre la ventana desde un efecto, así
 * que en el cliente la ventana correcta terminaría abierta aunque el emparejado
 * en render estuviera roto. Solo el marcado del servidor distingue "se sembró en
 * render" de "se abrió después de montar", que es justo la regresión que estos
 * tests tienen que atrapar.
 */
const serverHtml = (pathname: string, content: React.ReactNode = null) => {
  setLocation(pathname);

  return renderToStaticMarkup(
    <WindowRouteProvider content={content} routes={TEST_ROUTES}>
      <RoutedDesktop>
        {TEST_ROUTES.map((href) => (
          <RoutedApp key={href} href={href} />
        ))}
      </RoutedDesktop>
    </WindowRouteProvider>,
  );
};

const openWindows = (html: string) =>
  TEST_ROUTES.filter((href) => html.includes(windowMarker(href)));

describe("qué ventana abre el servidor para cada URL", () => {
  it("abre exactamente una ventana y es la de la ruta pedida", () => {
    expect(openWindows(serverHtml("/github"))).toEqual(["/github"]);
  });

  // `matchesRoute` exige que el prefijo termine en `/`. Simplificarlo a
  // `startsWith(href)` hace que cualquier ruta sea prefijo de nombres más
  // largos, y de paso convierte a `/` en prefijo de todo el sitio.
  it("el prefijo tiene que cortar en un segmento entero", () => {
    expect(openWindows(serverHtml("/githubbers"))).toEqual([]);
    expect(openWindows(serverHtml("/docsy"))).toEqual([]);
  });

  it("una ventana cubre sus subrutas", () => {
    expect(openWindows(serverHtml("/docs/instalacion"))).toEqual(["/docs"]);
  });

  // Sin ordenar por longitud gana la primera declarada, que acá sería `/docs`.
  it("con dos rutas anidadas gana la más específica", () => {
    expect(openWindows(serverHtml("/docs/api"))).toEqual(["/docs/api"]);
  });

  it("una URL sin ventana no abre ninguna", () => {
    expect(openWindows(serverHtml("/no-existe"))).toEqual([]);
  });
});

describe("contenido de la página en el HTML del servidor", () => {
  const content = <p>CONTENIDO_DE_LA_PAGINA</p>;

  it("lo entrega adentro de la ventana de su ruta", () => {
    const html = serverHtml("/github", content);
    const marker = windowMarker("/github");

    expect(html).toContain("CONTENIDO_DE_LA_PAGINA");
    // Adentro de la ventana, no suelto en el escritorio: el marcador de la
    // ventana tiene que aparecer antes que el contenido.
    expect(html.indexOf(marker)).toBeLessThan(
      html.indexOf("CONTENIDO_DE_LA_PAGINA"),
    );
  });

  it("no lo duplica", () => {
    const html = serverHtml("/github", content);
    const veces = html.split("CONTENIDO_DE_LA_PAGINA").length - 1;

    expect(veces).toBe(1);
  });

  // Es lo que hace que cada URL sea indexable por separado: si el contenido
  // saliera sin ventana que lo reclame, no habría nada que indexar.
  it("lo descarta cuando ninguna ventana reclama la ruta", () => {
    expect(serverHtml("/no-existe", content)).not.toContain(
      "CONTENIDO_DE_LA_PAGINA",
    );
  });
});
