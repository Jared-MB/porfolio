import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RoutedApp, TEST_ROUTES, windowMarker } from "@/test/fixtures";
import { routerState, setLocation } from "@/test/next-router";
import { RoutedDesktop, WindowRouteProvider } from "./next";

const mount = () =>
  render(
    <WindowRouteProvider content={null} routes={TEST_ROUTES}>
      <RoutedDesktop>
        {TEST_ROUTES.map((href) => (
          <RoutedApp key={href} href={href} />
        ))}
      </RoutedDesktop>
    </WindowRouteProvider>,
  );

const icon = (href: string) =>
  screen.getByRole("button", { name: `ICONO(${href})` });

describe("la URL sigue a la ventana activa", () => {
  it("abrir una ventana lleva la URL a su ruta", async () => {
    const user = userEvent.setup();
    setLocation("/");
    mount();

    await user.dblClick(icon("/github"));

    expect(routerState.replace).toHaveBeenCalledWith("/github");
  });

  it("cerrar la última ventana vuelve al exitHref", async () => {
    const user = userEvent.setup();
    setLocation("/github");
    mount();

    await user.click(screen.getByRole("button", { name: "cerrar /github" }));

    expect(routerState.replace).toHaveBeenCalledWith("/");
  });

  // Volver a una ventana tiene que devolver la URL con la que estaba, no su
  // href pelado: si no, pasear por el escritorio le borra a cada ventana los
  // parámetros que tenía.
  it("volver a una ventana restaura su query", async () => {
    const user = userEvent.setup();
    setLocation("/docs?pagina=2");
    mount();

    await user.dblClick(icon("/github"));
    expect(routerState.replace).toHaveBeenLastCalledWith("/github");

    await user.click(screen.getByText(windowMarker("/docs")));

    expect(routerState.replace).toHaveBeenLastCalledWith("/docs?pagina=2");
  });
});

describe("la carga inicial no navega", () => {
  // El estado inicial ya refleja la URL pedida, así que navegar sería redundante
  // y encima haría un `replace` en cada visita.
  it("cuando la URL abre una ventana", () => {
    setLocation("/github");
    mount();

    expect(routerState.replace).not.toHaveBeenCalled();
  });

  // Sin esta guarda, entrar a una URL sin ventana —un 404, por ejemplo— manda al
  // visitante al escritorio y se come la página que sí quería ver.
  it("cuando la URL no le corresponde a ninguna ventana", () => {
    setLocation("/no-existe");
    mount();

    expect(routerState.replace).not.toHaveBeenCalled();
  });
});
