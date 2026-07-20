"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  mergeProps,
  type RenderProp,
  renderSlot,
  useControllableState,
} from "./utils";

type DesktopContextType = {
  /**
   * Nodo del escritorio. Es `null` durante el primer render y se puebla al
   * montar, por eso es estado y no una ref: los consumidores necesitan
   * re-renderizar cuando aparece (p. ej. para portalear dentro de él).
   */
  desktopEl: HTMLDivElement | null;
  /** Ventanas abiertas en orden de apilado; la última es la que está al frente. */
  openWindows: string[];
  activeWindowId?: string;
  openWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  /** Hay un arrastre o resize en curso en alguna ventana. */
  isInteracting: boolean;
  setInteracting: (interacting: boolean) => void;
};

const DesktopContext = createContext<DesktopContextType | null>(null);

export const useDesktop = () => {
  const context = useContext(DesktopContext);

  if (!context)
    throw new Error("useDesktop must be used within a DesktopProvider");

  return context;
};

const moveToFront = (windows: string[], id: string) => [
  ...windows.filter((w) => w !== id),
  id,
];

/**
 * Registro de ids solo para avisar de duplicados en desarrollo. Va en un
 * contexto aparte y no en `DesktopContext` para no meter ruido en la API que ve
 * quien usa `useDesktop`.
 */
const AppRegistryContext = createContext<((id: string) => () => void) | null>(
  null,
);

export type DesktopProps = Omit<React.ComponentProps<"div">, "children"> & {
  children?: React.ReactNode;
  /** Atajo para pintar un fondo; equivale a `style.backgroundImage`. */
  wallpaper?: string;
  /** Ventanas abiertas cuando el escritorio se maneja desde afuera. */
  openWindows?: string[];
  defaultOpenWindows?: string[];
  onOpenWindowsChange?: (openWindows: string[]) => void;
  render?: RenderProp<React.ComponentProps<"div">>;
};

/**
 * dayos no impone layout: el escritorio es un único contenedor posicionado y
 * la grilla (o el flujo libre, o un dock) la decide quien lo usa vía
 * `className`. Lo único estructural es `relative` + `overflow-hidden`, que las
 * ventanas necesitan para posicionarse y recortarse contra él.
 */
export function Desktop({
  children,
  wallpaper,
  style,
  openWindows: openWindowsProp,
  defaultOpenWindows,
  onOpenWindowsChange,
  render,
  ref,
  ...props
}: DesktopProps) {
  const [desktopEl, setDesktopEl] = useState<HTMLDivElement | null>(null);
  const [isInteracting, setInteracting] = useState(false);

  const [openWindows, setOpenWindows] = useControllableState<string[]>({
    value: openWindowsProp,
    defaultValue: defaultOpenWindows ?? [],
    onChange: onOpenWindowsChange,
  });

  const openWindow = useCallback(
    (id: string) => setOpenWindows((prev) => moveToFront(prev, id)),
    [setOpenWindows],
  );

  const closeWindow = useCallback(
    (id: string) =>
      setOpenWindows((prev) =>
        prev.includes(id) ? prev.filter((w) => w !== id) : prev,
      ),
    [setOpenWindows],
  );

  const focusWindow = useCallback(
    (id: string) =>
      setOpenWindows((prev) =>
        // Devolver la misma referencia hace que React descarte la actualización,
        // así clickear la ventana que ya está al frente no re-renderiza nada.
        prev.at(-1) === id || !prev.includes(id) ? prev : moveToFront(prev, id),
      ),
    [setOpenWindows],
  );

  const value = useMemo(
    () => ({
      desktopEl,
      openWindows,
      activeWindowId: openWindows.at(-1),
      openWindow,
      closeWindow,
      focusWindow,
      isInteracting,
      setInteracting,
    }),
    [
      desktopEl,
      openWindows,
      openWindow,
      closeWindow,
      focusWindow,
      isInteracting,
    ],
  );

  // Cuántos `DesktopApp` montados declaran cada id. Es un contador y no un Set
  // porque en desarrollo StrictMode monta, desmonta y vuelve a montar: con un
  // Set el segundo montaje se vería como duplicado y avisaría de más.
  const appCounts = useRef(new Map<string, number>());

  const registerApp = useCallback((id: string) => {
    const counts = appCounts.current;
    const count = (counts.get(id) ?? 0) + 1;
    counts.set(id, count);

    if (count > 1) {
      console.error(
        `dayos: duplicate DesktopApp id ${JSON.stringify(id)}. An id identifies ` +
          `one window, so both apps share it and render the same window twice, ` +
          `stacked exactly on top of each other. Give each app its own id.`,
      );
    }

    return () => {
      const current = counts.get(id) ?? 0;
      if (current > 1) counts.set(id, current - 1);
      else counts.delete(id);
    };
  }, []);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setDesktopEl(node);
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const elementProps = mergeProps(
    {
      ref: setRefs,
      // Los únicos estilos que dayos impone, y solo porque son estructurales:
      // las ventanas se posicionan contra el escritorio y se recortan contra él.
      // Tamaño, grilla y fondo son decisión de quien lo usa.
      style: {
        position: "relative",
        overflow: "hidden",
        ...(wallpaper
          ? {
              backgroundImage: `url(${wallpaper})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : null),
      } satisfies React.CSSProperties,
      // Hay un arrastre o resize en curso. Un iframe se come el `mousemove` y el
      // `mouseup` que el arrastre escucha en el `document`: apenas el cursor lo
      // cruza, la ventana se traba o queda enganchada porque el `mouseup` nunca
      // llegó. Neutralizarlos mientras dura la interacción lo arregla, pero es
      // una regla sobre descendientes y eso no se puede escribir en un `style`
      // inline, así que la escribe el consumidor:
      //
      //   [&[data-interacting]_iframe]:pointer-events-none
      "data-interacting": isInteracting ? "" : undefined,
      children,
    },
    { ...props, style },
  );

  return (
    <DesktopContext value={value}>
      <AppRegistryContext value={registerApp}>
        {renderSlot(render, elementProps, (finalProps) => (
          <div {...(finalProps as React.ComponentProps<"div">)} />
        ))}
      </AppRegistryContext>
    </DesktopContext>
  );
}

type DesktopAppContextType = {
  id: string;
  isWindowOpen: boolean;
  open: () => void;
  close: () => void;
  focus: () => void;
};

const DesktopAppContext = createContext<DesktopAppContextType | null>(null);

export type DesktopAppProps = {
  children: React.ReactNode;
  id?: string;
  /**
   * Abre la ventana al montar. No la vuelve a tocar después.
   *
   * Corre en un efecto, así que la ventana no existe en el HTML del servidor:
   * una app puede sembrarse a sí misma pero no el estado inicial del escritorio,
   * que es de su padre. Para que una ventana venga abierta desde el servidor hay
   * que declararla en `defaultOpenWindows` del `Desktop`.
   */
  defaultOpen?: boolean;
  /** Estado controlado: mantiene la ventana sincronizada con este valor. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function DesktopApp({
  children,
  id: desktopAppId,
  defaultOpen = false,
  open,
  onOpenChange,
}: DesktopAppProps) {
  const hookId = useId();
  const id = desktopAppId ?? hookId;

  const { openWindows, openWindow, closeWindow, focusWindow } = useDesktop();
  const isWindowOpen = openWindows.includes(id);

  // Dos apps con el mismo id comparten estado de ventana y ninguna falla: las
  // dos abren, las dos portalean y las dos caen en la misma posición, así que se
  // ve como una sola ventana con contenido equivocado. El aviso convierte eso en
  // algo diagnosticable. Solo en desarrollo, donde hay alguien para leerlo.
  const registerApp = useContext(AppRegistryContext);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    return registerApp?.(id);
  }, [id, registerApp]);

  const hasAppliedDefault = useRef(false);

  useEffect(() => {
    if (hasAppliedDefault.current) return;
    hasAppliedDefault.current = true;
    if (defaultOpen) openWindow(id);
  }, [defaultOpen, id, openWindow]);

  // Modo controlado: el prop manda sobre el estado del escritorio, así cerrar
  // desde afuera sí cierra (a diferencia de `defaultOpen`, que solo siembra).
  useEffect(() => {
    if (open === undefined) return;
    if (open && !isWindowOpen) openWindow(id);
    if (!open && isWindowOpen) closeWindow(id);
  }, [open, isWindowOpen, id, openWindow, closeWindow]);

  // Notifica venga de donde venga el cambio (botón, ruta, atajo, otra ventana),
  // por eso observa el estado y no envuelve a `open`/`close`.
  const wasWindowOpen = useRef(isWindowOpen);

  useEffect(() => {
    if (wasWindowOpen.current === isWindowOpen) return;
    wasWindowOpen.current = isWindowOpen;
    onOpenChange?.(isWindowOpen);
  }, [isWindowOpen, onOpenChange]);

  const value = useMemo(
    () => ({
      id,
      isWindowOpen,
      open: () => openWindow(id),
      close: () => closeWindow(id),
      focus: () => focusWindow(id),
    }),
    [id, isWindowOpen, openWindow, closeWindow, focusWindow],
  );

  return <DesktopAppContext value={value}>{children}</DesktopAppContext>;
}

export function useDesktopApp() {
  const context = useContext(DesktopAppContext);

  if (!context)
    throw new Error("useDesktopApp must be used within a DesktopAppProvider");

  return context;
}

/** Variante que no explota fuera del provider, para adapters opcionales. */
export function useOptionalDesktopApp() {
  return useContext(DesktopAppContext);
}

export type DesktopIconProps = React.ComponentProps<"button"> & {
  render?: RenderProp<React.ComponentProps<"button">>;
};

export function DesktopIcon({
  render,
  children,
  onDoubleClick,
  onKeyDown,
  ...props
}: DesktopIconProps) {
  const { open } = useDesktopApp();

  const elementProps = mergeProps({ type: "button", children }, props);

  // Componemos en vez de pisar: los handlers del consumidor corren primero y
  // pueden cancelar la apertura con `preventDefault()`.
  const handleDoubleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onDoubleClick?.(event);
    if (!event.defaultPrevented) open();
  };

  // El doble click no existe para el teclado: sin esto el ícono es inalcanzable
  // salvo que lleve un `render` navegable que abra la ventana por ruta.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    open();
  };

  const withHandlers = mergeProps(elementProps, {
    onDoubleClick: handleDoubleClick,
    onKeyDown: handleKeyDown,
  });

  return renderSlot(render, withHandlers, (finalProps) => (
    <button {...(finalProps as React.ComponentProps<"button">)} />
  ));
}

export type DesktopIconTextProps = React.ComponentProps<"span"> & {
  render?: RenderProp<React.ComponentProps<"span">>;
};

export function DesktopIconText({
  render,
  children,
  ...props
}: DesktopIconTextProps) {
  const elementProps = mergeProps({ children }, props);

  return renderSlot(render, elementProps, (finalProps) => (
    <span {...(finalProps as React.ComponentProps<"span">)} />
  ));
}
