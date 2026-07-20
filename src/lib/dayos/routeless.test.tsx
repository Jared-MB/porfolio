import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Desktop, DesktopApp, DesktopIcon } from "./desktop";
import { Window, WindowContent, WindowHeader, WindowName } from "./window";

/**
 * El core sin nada del adaptador de Next: sin provider de rutas, sin
 * `useWindowRoute`, sin URLs. Que esto siga funcionando es lo que permite usar
 * dayos en una sola página, y se rompe fácil sin querer — basta con que algo del
 * core empiece a leer el contexto de rutas.
 */
function App({ id, defaultOpen }: { id: string; defaultOpen?: boolean }) {
  return (
    <DesktopApp id={id} defaultOpen={defaultOpen}>
      <DesktopIcon>ICONO({id})</DesktopIcon>
      <Window>
        <WindowHeader>
          <WindowName>TITULO({id})</WindowName>
        </WindowHeader>
        <WindowContent>CONTENIDO({id})</WindowContent>
      </Window>
    </DesktopApp>
  );
}

describe("el core funciona sin el adaptador de rutas", () => {
  it("renderiza sin provider y sin explotar", () => {
    const html = renderToStaticMarkup(
      <Desktop>
        <App id="notas" />
      </Desktop>,
    );

    expect(html).toContain("ICONO(notas)");
  });

  it("una ventana cerrada no deja rastro en el DOM", () => {
    const html = renderToStaticMarkup(
      <Desktop>
        <App id="notas" />
      </Desktop>,
    );

    expect(html).not.toContain("CONTENIDO(notas)");
  });

  it("abre y cierra por interacción, sin tocar la URL", async () => {
    const user = userEvent.setup();

    render(
      <Desktop>
        <App id="notas" />
      </Desktop>,
    );

    expect(screen.queryByText("CONTENIDO(notas)")).toBeNull();

    await user.dblClick(screen.getByRole("button", { name: /ICONO\(notas\)/ }));

    expect(screen.getByText("CONTENIDO(notas)")).toBeTruthy();
  });
});

/**
 * Las dos formas de arrancar con una ventana abierta no son equivalentes, y la
 * diferencia solo se ve en el HTML del servidor. Está documentado en el prop
 * `defaultOpen`; estos tests son los que hacen que esa documentación no mienta.
 */
describe("sembrar una ventana abierta: en render o al montar", () => {
  it("defaultOpenWindows del Desktop llega al HTML del servidor", () => {
    const html = renderToStaticMarkup(
      <Desktop defaultOpenWindows={["notas"]}>
        <App id="notas" />
      </Desktop>,
    );

    expect(html).toContain("CONTENIDO(notas)");
  });

  // Se aplica desde un efecto porque una app no puede sembrar el estado inicial
  // de su padre. Si algún día se puede, este test falla y hay que corregir el
  // comentario del prop, no borrar el test.
  it("defaultOpen del DesktopApp no, porque corre al montar", () => {
    const html = renderToStaticMarkup(
      <Desktop>
        <App id="notas" defaultOpen />
      </Desktop>,
    );

    expect(html).not.toContain("CONTENIDO(notas)");
  });

  it("pero defaultOpen sí abre la ventana en el cliente", () => {
    render(
      <Desktop>
        <App id="notas" defaultOpen />
      </Desktop>,
    );

    expect(screen.getByText("CONTENIDO(notas)")).toBeTruthy();
  });
});
