import { DesktopApp, DesktopIcon } from "@/lib/dayos/desktop";
import { useWindowRoute } from "@/lib/dayos/next";
import {
  Window,
  WindowClose,
  WindowContent,
  WindowHeader,
  WindowName,
} from "@/lib/dayos/window";

/**
 * Incluye `/` y `/docs` + `/docs/api` a propósito: son los dos casos donde el
 * emparejado de rutas se puede romper sin que nada más se note.
 */
export const TEST_ROUTES = ["/", "/docs", "/docs/api", "/github"];

/** Marca por ventana, para poder afirmar cuál abrió y no solo que abrió alguna. */
export const windowMarker = (href: string) => `VENTANA(${href})`;

export function RoutedApp({
  href,
  ...props
}: { href: string } & Pick<
  React.ComponentProps<typeof Window>,
  "defaultSize" | "defaultPosition"
>) {
  return (
    <DesktopApp id={href}>
      <RoutedAppShell href={href} {...props} />
    </DesktopApp>
  );
}

function RoutedAppShell({
  href,
  ...props
}: { href: string } & Pick<
  React.ComponentProps<typeof Window>,
  "defaultSize" | "defaultPosition"
>) {
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>ICONO({href})</DesktopIcon>
      <Window {...props}>
        <WindowHeader>
          <WindowName>{windowMarker(href)}</WindowName>
          <WindowClose aria-label={`cerrar ${href}`}>x</WindowClose>
        </WindowHeader>
        <WindowContent>{content}</WindowContent>
      </Window>
    </>
  );
}
