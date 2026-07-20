import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoutedApp, TEST_ROUTES } from "@/test/fixtures";
import { setLocation } from "@/test/next-router";
import { RoutedDesktop, WindowRouteProvider } from "./next";
import { windowRect } from "./window";

/**
 * El marco que sirve el servidor no usa `Rnd` —no hay viewport que medir— así que
 * expresa su geometría en CSS, mientras que la ventana real la recibe en px de
 * `windowRect`. Si las dos se separan, el usuario ve la ventana saltar al
 * hidratar. Estos tests resuelven el CSS a px y lo comparan contra la función.
 *
 * La comparación no se hace montando la ventana y leyendo su `transform`: jsdom
 * no calcula layout, así que react-rnd ajusta la posición contra rects en cero y
 * el valor que quedaría en el DOM no es el que da el navegador.
 */
const DESKTOP = { width: 1000, height: 800 };

/** Resuelve las formas CSS que emite el marco estático contra un contenedor. */
const resolveCss = (value: string, container: number) => {
  const percent = value.match(/^([\d.]+)%$/);
  if (percent) return (Number(percent[1]) / 100) * container;

  const calc = value.match(/^calc\(([\d.]+)% - ([\d.]+)px\)$/);
  if (calc) return (Number(calc[1]) / 100) * container - Number(calc[2]);

  return Number.parseFloat(value);
};

const tree = (props?: { defaultSize?: { width: number; height: number } }) => {
  setLocation("/github");

  return (
    <WindowRouteProvider content={null} routes={TEST_ROUTES}>
      <RoutedDesktop>
        <RoutedApp href="/github" {...props} />
      </RoutedDesktop>
    </WindowRouteProvider>
  );
};

/** Geometría del marco estático, ya resuelta a px contra el escritorio. */
function staticGeometry(props?: {
  defaultSize?: { width: number; height: number };
}) {
  const html = renderToStaticMarkup(tree(props));
  // Se ancla en `data-window` y no en las clases: dayos no emite ninguna, y la
  // que traiga el consumidor no es asunto de este test.
  const style = html.match(/data-window=""[^>]*?style="([^"]*)"/);

  if (!style) throw new Error("no se encontró el marco estático en el HTML");

  const declarations = Object.fromEntries(
    style[1].split(";").map((decl) => decl.split(/:(.*)/).slice(0, 2)),
  ) as Record<string, string>;

  return {
    width: resolveCss(declarations.width, DESKTOP.width),
    height: resolveCss(declarations.height, DESKTOP.height),
    x: resolveCss(declarations.left, DESKTOP.width),
    y: resolveCss(declarations.top, DESKTOP.height),
  };
}

describe("el marco del servidor cae donde la ventana real va a quedar", () => {
  const rect = (defaultSize?: { width: number; height: number }) =>
    windowRect({
      desktopWidth: DESKTOP.width,
      desktopHeight: DESKTOP.height,
      defaultSize,
    });

  it("con el tamaño por defecto", () => {
    expect(staticGeometry()).toEqual(rect());
  });

  it("con un defaultSize en px", () => {
    const defaultSize = { width: 760, height: 540 };

    expect(staticGeometry({ defaultSize })).toEqual(rect(defaultSize));
  });

  // Ancla el valor además de la coincidencia: sin esto, dos implementaciones
  // igual de rotas seguirían pasando el test.
  it("y esa posición es el centro del escritorio", () => {
    expect(staticGeometry()).toEqual({
      width: DESKTOP.width * 0.7,
      height: DESKTOP.height * 0.7,
      x: (DESKTOP.width - DESKTOP.width * 0.7) / 2,
      y: (DESKTOP.height - DESKTOP.height * 0.7) / 2,
    });
  });
});
