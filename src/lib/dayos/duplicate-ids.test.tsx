import { render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Desktop, DesktopApp, DesktopIcon } from "./desktop";
import { Window, WindowContent } from "./window";

function App({ id }: { id: string }) {
  return (
    <DesktopApp id={id}>
      <DesktopIcon>ICONO({id})</DesktopIcon>
      <Window>
        <WindowContent>CONTENIDO({id})</WindowContent>
      </Window>
    </DesktopApp>
  );
}

const duplicateWarnings = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls.filter(([first]) =>
    String(first).includes("duplicate DesktopApp id"),
  );

const spyOnConsoleError = () =>
  vi.spyOn(console, "error").mockImplementation(() => {});

afterEach(() => vi.restoreAllMocks());

/**
 * Un id duplicado no rompe nada visible: las dos apps comparten el estado de
 * ventana y abren en la misma posición, así que se ve como una ventana sola que
 * muestra el contenido equivocado. Sin el aviso es un rato largo de depurar.
 */
describe("aviso de ids duplicados", () => {
  it("avisa cuando dos apps declaran el mismo id", () => {
    const error = spyOnConsoleError();

    render(
      <Desktop>
        <App id="notas" />
        <App id="notas" />
      </Desktop>,
    );

    expect(duplicateWarnings(error)).toHaveLength(1);
    expect(String(duplicateWarnings(error)[0]?.[0])).toContain('"notas"');
  });

  it("no avisa con ids distintos", () => {
    const error = spyOnConsoleError();

    render(
      <Desktop>
        <App id="notas" />
        <App id="fotos" />
      </Desktop>,
    );

    expect(duplicateWarnings(error)).toHaveLength(0);
  });

  // El registro cuenta montajes en vez de guardar un Set justamente por esto:
  // StrictMode monta, desmulta y vuelve a montar cada app en desarrollo, y con
  // un Set el segundo montaje se leería como un duplicado.
  it("no avisa por el doble montaje de StrictMode", () => {
    const error = spyOnConsoleError();

    render(
      <StrictMode>
        <Desktop>
          <App id="notas" />
        </Desktop>
      </StrictMode>,
    );

    expect(duplicateWarnings(error)).toHaveLength(0);
  });

  it("libera el id al desmontar, así remontar no avisa", () => {
    const error = spyOnConsoleError();

    const { unmount } = render(
      <Desktop>
        <App id="notas" />
      </Desktop>,
    );

    unmount();

    render(
      <Desktop>
        <App id="notas" />
      </Desktop>,
    );

    expect(duplicateWarnings(error)).toHaveLength(0);
  });
});
