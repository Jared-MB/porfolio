import { vi } from "vitest";

/**
 * Router de Next para tests. Navega de verdad sobre `window.location` en vez de
 * solo registrar la llamada: `dayos/next` decide si navegar comparando el
 * destino contra la URL actual, así que un `replace` que no mueve la URL deja
 * pasar tests que en el navegador fallan.
 */
const listeners = new Set<() => void>();

let pathname = "/";

function navigate(url: string) {
  window.history.replaceState(null, "", url);
  // `usePathname` no incluye query ni hash; esos solo viven en `location`.
  pathname = url.split(/[?#]/)[0];
  for (const notify of listeners) notify();
}

export const routerState = {
  get pathname() {
    return pathname;
  },
  replace: vi.fn(navigate),
  push: vi.fn(navigate),
};

/**
 * Identidad estable, como la del router de Next. Devolver un objeto nuevo por
 * render hace que los efectos que lo tienen de dependencia corran siempre, y
 * `RoutedDesktop` entra en un bucle de actualizaciones que en la app no existe.
 */
export const router = {
  replace: (url: string) => routerState.replace(url),
  push: (url: string) => routerState.push(url),
};

export const subscribePathname = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getPathname = () => pathname;

/** Coloca al visitante en una URL antes de montar, como si hubiera llegado ahí. */
export function setLocation(url: string) {
  navigate(url);
  routerState.replace.mockClear();
  routerState.push.mockClear();
}

export function resetRouter() {
  listeners.clear();
  setLocation("/");
}
