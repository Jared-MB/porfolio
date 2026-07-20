"use client";

// Interno de Next y no parte de su API pública: es el precio de conservar el
// contenido por ventana sin rutas paralelas. Si una actualización de Next mueve
// este módulo, esto deja de compilar y hay que revisarlo.
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Desktop,
  type DesktopProps,
  useDesktop,
  useOptionalDesktopApp,
} from "./desktop";

/**
 * Contenido de la ruta actual, para que la ventana que le corresponde lo pueda
 * renderizar adentro en vez de que quede suelto en el escritorio.
 */
const RouteContentContext = createContext<React.ReactNode>(null);

type WindowRoutesContextType = {
  /**
   * Rutas declaradas por el escritorio. El href de cada ventana es también su
   * id de app: son la misma identidad, y tenerla una sola vez evita declarar
   * el mismo string en el layout y en el componente.
   */
  routes: readonly string[];
  openWindows: string[];
  setOpenWindows: (openWindows: string[]) => void;
};

const WindowRoutesContext = createContext<WindowRoutesContextType | null>(null);

const useWindowRoutes = () => {
  const context = useContext(WindowRoutesContext);

  if (!context)
    throw new Error("dayos routing must be used within a WindowRouteProvider");

  return context;
};

/** Una ventana también es dueña de sus subrutas: `/docs` cubre `/docs/api`. */
const matchesRoute = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/**
 * Gana el match más largo: con `/docs` y `/docs/api` declarados, entrar a
 * `/docs/api` abre la ventana específica y no la que la contiene.
 */
const findRoute = (routes: readonly string[], pathname: string) =>
  [...routes]
    .sort((a, b) => b.length - a.length)
    .find((href) => matchesRoute(pathname, href));

const currentUrl = () =>
  window.location.pathname + window.location.search + window.location.hash;

export function WindowRouteProvider({
  content,
  routes,
  children,
}: {
  /** El `children` del layout, o sea lo que devuelve la página actual. */
  content: React.ReactNode;
  /**
   * Todas las rutas del escritorio, declaradas de antemano. Antes cada ventana
   * registraba la suya desde un efecto, y por eso el servidor no llegaba a
   * saber cuál le tocaba a la URL pedida.
   */
  routes: readonly string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Sembrar el estado acá y no en un efecto es todo el punto del módulo: en el
  // servidor `usePathname` ya sabe qué ruta se pidió, así que la ventana que le
  // toca nace abierta y su contenido entra al HTML. Mientras esto vivía en un
  // efecto, el HTML salía siempre con el escritorio vacío y el contenido de la
  // página se descartaba: no había ventana que lo reclamara.
  const [openWindows, setOpenWindows] = useState<string[]>(() => {
    const match = findRoute(routes, pathname);
    return match ? [match] : [];
  });

  const value = useMemo(
    () => ({ routes, openWindows, setOpenWindows }),
    [routes, openWindows],
  );

  return (
    <WindowRoutesContext value={value}>
      <RouteContentContext value={content}>{children}</RouteContentContext>
    </WindowRoutesContext>
  );
}

export type RoutedDesktopProps = Omit<
  DesktopProps,
  "openWindows" | "defaultOpenWindows" | "onOpenWindowsChange"
> & {
  /** A dónde va la URL cuando no queda ninguna ventana abierta. */
  exitHref?: string;
};

/**
 * `Desktop` con su estado de ventanas delegado al provider, que es quien lo
 * sembró desde la URL. Además es el único dueño de la sincronización inversa
 * (ventana al frente → URL): antes cada ventana corría esa misma sincronización,
 * así que con N apps enrutadas salían N `replace` por cada cambio de foco.
 */
export function RoutedDesktop({
  exitHref = "/",
  ...props
}: RoutedDesktopProps) {
  const { routes, openWindows, setOpenWindows } = useWindowRoutes();
  const router = useRouter();
  const pathname = usePathname();

  const activeWindowId = openWindows.at(-1);

  // No toda app está enrutada: una que abre un link externo tiene id generado y
  // no le corresponde ninguna URL.
  const activeHref =
    activeWindowId && routes.includes(activeWindowId)
      ? activeWindowId
      : undefined;

  // Última URL real de cada ventana, con query y hash. Guardar solo el `href`
  // haría que volver a una ventana le borre los parámetros que tenía.
  const lastUrlByWindow = useRef(new Map<string, string>());

  useEffect(() => {
    if (!activeHref) return;
    if (!matchesRoute(pathname, activeHref)) return;

    lastUrlByWindow.current.set(activeHref, currentUrl());
  }, [activeHref, pathname]);

  // Mientras nadie haya tocado el estado inicial manda la URL con la que se
  // cargó la página. Si no matcheó ninguna ruta —un 404, por ejemplo— navegar a
  // `exitHref` sacaría al visitante de una página que sí quería ver.
  const initialWindows = useRef(openWindows);

  // La URL sigue a la ventana activa. `replace` y no `push` porque enfocar una
  // ventana no es navegar: llenaría el historial y el botón atrás recorrería
  // cada foco en vez de las páginas visitadas.
  useEffect(() => {
    if (openWindows === initialWindows.current) return;

    const target = activeWindowId
      ? (lastUrlByWindow.current.get(activeWindowId) ?? activeHref ?? exitHref)
      : exitHref;

    if (target !== currentUrl()) router.replace(target);
  }, [openWindows, activeWindowId, activeHref, exitHref, router]);

  return (
    <Desktop
      {...props}
      openWindows={openWindows}
      onOpenWindowsChange={setOpenWindows}
    />
  );
}

/**
 * Adaptador opcional: dayos no sabe de rutas, así que este módulo es la única
 * pieza que habla con Next. Las apps que no lo usan siguen funcionando igual,
 * sin URLs.
 *
 * El href sale del id del `DesktopApp` que lo contiene, que es la ruta misma.
 */
export function useWindowRoute() {
  const app = useOptionalDesktopApp();
  const href = app?.id;

  const { openWindow } = useDesktop();
  const pathname = usePathname();

  // Entrar a la ruta abre la ventana; es lo que hace compartible el link. No
  // cierra al salir a propósito: enfocar otra ventana cambia la URL y no tiene
  // por qué cerrar esta. Depende de la comparación y no de las ventanas abiertas
  // para que cerrarla no dispare el efecto de nuevo y la reabra.
  const isCurrentRoute = href ? matchesRoute(pathname, href) : false;

  useEffect(() => {
    if (isCurrentRoute && href) openWindow(href);
  }, [isCurrentRoute, href, openWindow]);

  const routeContent = useContext(RouteContentContext);

  // Guardar el nodo no alcanza para conservar el contenido: lo que entrega el
  // router no es el contenido sino un puntero al segmento activo, así que al
  // re-renderizarlo pinta la ruta actual y todas las ventanas terminan mostrando
  // lo mismo. Junto al nodo guardamos el contexto del router que había cuando
  // esta era la ruta activa, y al re-proveerlo el nodo vuelve a resolver a su
  // propio segmento en vez de al de ahora.
  const layoutRouter = useContext(LayoutRouterContext);

  const [snapshot, setSnapshot] = useState(() =>
    isCurrentRoute ? { node: routeContent, layoutRouter } : null,
  );

  // Ajuste durante el render y no en un efecto: la ventana ya nace abierta
  // cuando la URL le corresponde, así que el contenido tiene que estar listo en
  // el mismo render y no un frame después.
  if (isCurrentRoute && snapshot?.node !== routeContent) {
    setSnapshot({ node: routeContent, layoutRouter });
  }

  if (!href) {
    throw new Error(
      "useWindowRoute must be used within a DesktopApp with an explicit id",
    );
  }

  // Mientras es la ruta actual va en vivo, así navegar dentro de la ventana
  // sigue funcionando; congelado solo cuando el foco se fue a otra ventana.
  if (isCurrentRoute) return routeContent;
  if (!snapshot) return null;

  return (
    <LayoutRouterContext value={snapshot.layoutRouter}>
      {snapshot.node}
    </LayoutRouterContext>
  );
}
