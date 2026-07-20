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
import { createPortal } from "react-dom";
import { Rnd, type RndDragEvent } from "react-rnd";
import { useDesktop, useDesktopApp } from "./desktop";
import { cn, mergeProps, type RenderProp, renderSlot } from "./utils";

const DEFAULT_CASCADE_OFFSET = 32;
const DEFAULT_SIZE_RATIO = 0.7;

type Rect = { x: number; y: number; width: number; height: number };

/**
 * Dónde va una ventana recién abierta, en px. Es la única cuenta de posición
 * inicial que hay: `StaticWindowFrame` la expresa en CSS porque el servidor no
 * conoce el viewport, y si las dos versiones se separan la ventana salta al
 * hidratar. Vive suelta y pura para poder compararlas en un test.
 */
export function windowRect({
  desktopWidth,
  desktopHeight,
  defaultSize,
  defaultPosition,
  cascadeStep = 0,
  cascadeOffset = DEFAULT_CASCADE_OFFSET,
}: {
  desktopWidth: number;
  desktopHeight: number;
  defaultSize?: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  cascadeStep?: number;
  cascadeOffset?: number;
}): Rect {
  const width = Math.min(
    defaultSize?.width ?? desktopWidth * DEFAULT_SIZE_RATIO,
    desktopWidth,
  );
  const height = Math.min(
    defaultSize?.height ?? desktopHeight * DEFAULT_SIZE_RATIO,
    desktopHeight,
  );

  if (defaultPosition) return { width, height, ...defaultPosition };

  const maxX = Math.max(0, desktopWidth - width);
  const maxY = Math.max(0, desktopHeight - height);

  // El módulo evita que la enésima ventana termine fuera de pantalla: la
  // cascada envuelve y vuelve a empezar arriba a la izquierda.
  const step = cascadeStep * cascadeOffset;
  const cascadeX = maxX > 0 ? step % maxX : 0;
  const cascadeY = maxY > 0 ? step % maxY : 0;

  return {
    width,
    height,
    x: Math.min((desktopWidth - width) / 2 + cascadeX, maxX),
    y: Math.min((desktopHeight - height) / 2 + cascadeY, maxY),
  };
}

/**
 * Lo comparten los dos marcos: si se separan, la ventana del servidor y la real
 * maquetan distinto y el reemplazo al hidratar se ve como un salto.
 */
const WINDOW_BODY_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

type WindowFrameContextType = {
  isMaximized: boolean;
  toggleMaximize: () => void;
  /** Id del `WindowName`, para colgar el nombre accesible del diálogo. */
  titleId: string;
};

const WindowFrameContext = createContext<WindowFrameContextType | null>(null);

const useWindowFrame = () => {
  const context = useContext(WindowFrameContext);

  if (!context) throw new Error("useWindowFrame must be used within a Window");

  return context;
};

export type WindowProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Tamaño inicial en px. Por defecto, 70% del escritorio. */
  defaultSize?: { width: number; height: number };
  /** Posición inicial en px. Por defecto, centrada con cascada por ventana. */
  defaultPosition?: { x: number; y: number };
  minWidth?: number;
  minHeight?: number;
  cascadeOffset?: number;
  /**
   * Conserva la ventana montada al cerrarla. Sin esto, cerrar desmonta el
   * subárbol y se pierde todo su estado (scroll, formularios, reproducción).
   */
  keepMounted?: boolean;
  closeOnEscape?: boolean;
  /**
   * Selector de elementos que no inician un arrastre. Por defecto los controles
   * del header: sin esto, apretar "restaurar" arranca un drag y la ventana
   * termina enganchada al cursor en vez de volver a su posición guardada.
   */
  dragCancel?: string;
};

export function Window({ keepMounted = false, ...props }: WindowProps) {
  const { desktopEl } = useDesktop();
  const { isWindowOpen } = useDesktopApp();

  // Con `keepMounted` la ventana se monta recién la primera vez que se abre:
  // montar todas de entrada pagaría el render de apps que quizá nunca se usen.
  const [hasBeenOpen, setHasBeenOpen] = useState(isWindowOpen);

  useEffect(() => {
    if (isWindowOpen) setHasBeenOpen(true);
  }, [isWindowOpen]);

  const shouldMount = keepMounted ? hasBeenOpen : isWindowOpen;

  if (!shouldMount) return null;

  // Sin escritorio montado —el render del servidor y el de hidratación, donde
  // `desktopEl` es null en ambos— la ventana va en su lugar del árbol y sin
  // `Rnd`: los portales no existen en el servidor, y renderizar acá es lo que
  // mete la ventana abierta en el HTML. El navegador pinta ese marcado mucho
  // antes de que React corra, así que su geometría la resuelve CSS.
  if (!desktopEl) return <StaticWindowFrame {...props} />;

  return createPortal(
    <WindowFrame {...props} desktopEl={desktopEl} hidden={!isWindowOpen} />,
    desktopEl,
  );
}

/**
 * La ventana antes de que haya escritorio que medir: mismo marcado accesible,
 * sin arrastre ni resize. Su razón de ser es que el HTML del servidor traiga la
 * ventana abierta con su contenido adentro.
 *
 * La geometría sale de CSS y no de px calculados porque el servidor no conoce el
 * viewport, y está elegida para caer exactamente donde `Rnd` va a colocar la
 * ventana al montar: centrada, del mismo tamaño. Si las dos no coincidieran, el
 * reemplazo se vería como un salto —que es justo lo que pasaba cuando este marco
 * salía en la esquina.
 */
function StaticWindowFrame({
  children,
  className,
  style,
  defaultSize,
  defaultPosition,
}: Omit<WindowProps, "keepMounted">) {
  const titleId = useId();

  const frame = useMemo(
    () => ({ isMaximized: false, toggleMaximize: () => {}, titleId }),
    [titleId],
  );

  // `calc(50% - mitad)` centra un tamaño en px contra un contenedor porcentual,
  // que es exactamente la cuenta que hace `WindowFrame` con `clientWidth`.
  // Redondeado porque el float crudo sale como `15.000000000000002%` en el DOM.
  const margin = `${Number((((1 - DEFAULT_SIZE_RATIO) / 2) * 100).toFixed(4))}%`;

  const geometry: React.CSSProperties = defaultSize
    ? {
        width: defaultSize.width,
        height: defaultSize.height,
        left: defaultPosition
          ? defaultPosition.x
          : `calc(50% - ${defaultSize.width / 2}px)`,
        top: defaultPosition
          ? defaultPosition.y
          : `calc(50% - ${defaultSize.height / 2}px)`,
      }
    : {
        width: `${DEFAULT_SIZE_RATIO * 100}%`,
        height: `${DEFAULT_SIZE_RATIO * 100}%`,
        left: defaultPosition ? defaultPosition.x : margin,
        top: defaultPosition ? defaultPosition.y : margin,
      };

  return (
    <div
      data-window=""
      className={className}
      style={{
        position: "absolute",
        // El clamp que `WindowFrame` hace contra el escritorio, en CSS: sin esto
        // un `defaultSize` en px se desborda en viewports chicos.
        maxWidth: "100%",
        maxHeight: "100%",
        zIndex: 1,
        ...geometry,
        ...style,
      }}
    >
      <section
        role="dialog"
        aria-labelledby={titleId}
        aria-modal={false}
        tabIndex={-1}
        // Estructural: el header y el contenido son una columna, y de ahí sale
        // el `flex-1` que hace scrollear al contenido y no a la ventana entera.
        style={WINDOW_BODY_STYLE}
      >
        <WindowFrameContext value={frame}>{children}</WindowFrameContext>
      </section>
    </div>
  );
}

function WindowFrame({
  children,
  desktopEl,
  className,
  style,
  defaultSize,
  defaultPosition,
  minWidth = 240,
  minHeight = 120,
  cascadeOffset = DEFAULT_CASCADE_OFFSET,
  closeOnEscape = true,
  dragCancel = "button, a, input, select, textarea",
  hidden,
}: Omit<WindowProps, "keepMounted"> & {
  desktopEl: HTMLDivElement;
  hidden: boolean;
}) {
  const { openWindows, focusWindow, setInteracting } = useDesktop();
  const { id, close } = useDesktopApp();
  const titleId = useId();

  // Se monta recién al abrir, así que la posición inicial se calcula una sola
  // vez con las medidas reales del escritorio. `Rnd` ignora `default` después
  // del montaje, por eso no hace falta seguir el resize de la ventana acá.
  const [defaultRect] = useState<Rect>(() =>
    windowRect({
      desktopWidth: desktopEl.clientWidth,
      desktopHeight: desktopEl.clientHeight,
      defaultSize,
      defaultPosition,
      cascadeStep: Math.max(0, openWindows.indexOf(id)),
      cascadeOffset,
    }),
  );

  const rndRef = useRef<Rnd>(null);
  // Guarda la geometría previa a maximizar; `null` significa "no maximizada".
  const [restoreRect, setRestoreRect] = useState<Rect | null>(null);

  const isMaximized = restoreRect !== null;

  const toggleMaximize = useCallback(() => {
    const rnd = rndRef.current;
    if (!rnd) return;

    if (restoreRect) {
      // Se re-clampa al restaurar: el escritorio pudo achicarse mientras la
      // ventana estaba maximizada y la geometría guardada ya no entraría.
      const width = Math.min(restoreRect.width, desktopEl.clientWidth);
      const height = Math.min(restoreRect.height, desktopEl.clientHeight);

      rnd.updateSize({ width, height });
      rnd.updatePosition({
        x: Math.min(Math.max(0, restoreRect.x), desktopEl.clientWidth - width),
        y: Math.min(
          Math.max(0, restoreRect.y),
          desktopEl.clientHeight - height,
        ),
      });
      setRestoreRect(null);
      return;
    }

    const self = rnd.getSelfElement();
    if (!self) return;

    const { x, y } = rnd.getDraggablePosition();
    setRestoreRect({
      x,
      y,
      width: self.offsetWidth,
      height: self.offsetHeight,
    });

    rnd.updatePosition({ x: 0, y: 0 });
    rnd.updateSize({
      width: desktopEl.clientWidth,
      height: desktopEl.clientHeight,
    });
  }, [restoreRect, desktopEl]);

  // El observer no debe re-suscribirse cada vez que cambia el estado de
  // maximizado, así que lo lee de una ref.
  const isMaximizedRef = useRef(isMaximized);
  isMaximizedRef.current = isMaximized;

  // `bounds="parent"` solo actúa mientras se arrastra: sin esto, achicar el
  // viewport deja ventanas más grandes que el escritorio o fuera de vista.
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const rnd = rndRef.current;
      const self = rnd?.getSelfElement();
      if (!rnd || !self) return;

      const maxWidth = desktopEl.clientWidth;
      const maxHeight = desktopEl.clientHeight;

      if (isMaximizedRef.current) {
        rnd.updatePosition({ x: 0, y: 0 });
        rnd.updateSize({ width: maxWidth, height: maxHeight });
        return;
      }

      const width = Math.min(self.offsetWidth, maxWidth);
      const height = Math.min(self.offsetHeight, maxHeight);
      const { x, y } = rnd.getDraggablePosition();

      rnd.updateSize({ width, height });
      rnd.updatePosition({
        x: Math.min(Math.max(0, x), maxWidth - width),
        y: Math.min(Math.max(0, y), maxHeight - height),
      });
    });

    observer.observe(desktopEl);

    return () => observer.disconnect();
  }, [desktopEl]);

  // Arrastrar una ventana maximizada la restaura y la engancha al cursor,
  // manteniéndolo sobre el mismo punto proporcional de la barra de título.
  const restoreOnDrag = useCallback(
    (event: RndDragEvent) => {
      const rnd = rndRef.current;
      if (!restoreRect || !rnd) return;

      const self = rnd.getSelfElement();
      if (!self?.offsetWidth) return;

      const selfRect = self.getBoundingClientRect();
      const pointerX =
        "touches" in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
      const grabX = pointerX - selfRect.left;

      const { x, y } = rnd.getDraggablePosition();
      const width = Math.min(restoreRect.width, desktopEl.clientWidth);
      const height = Math.min(restoreRect.height, desktopEl.clientHeight);
      const maxX = desktopEl.clientWidth - width;
      const nextX = x + grabX * (1 - width / self.offsetWidth);

      // `updateSize` es un setState asíncrono, pero react-rnd calcula los
      // bounds del arrastre leyendo `offsetWidth` del DOM apenas retorna este
      // handler. Sin escribir la medida directo al nodo, los bounds saldrían
      // con el tamaño maximizado y la ventana quedaría inmóvil.
      self.style.width = `${width}px`;
      self.style.height = `${height}px`;
      rnd.updateSize({ width, height });
      rnd.updatePosition({ x: Math.min(Math.max(0, nextX), maxX), y });

      setRestoreRect(null);
    },
    [restoreRect, desktopEl],
  );

  const frame = useMemo(
    () => ({ isMaximized, toggleMaximize, titleId }),
    [isMaximized, toggleMaximize, titleId],
  );

  return (
    <Rnd
      ref={rndRef}
      bounds="parent"
      className={className}
      default={defaultRect}
      minWidth={minWidth}
      minHeight={minHeight}
      style={{
        zIndex: Math.max(0, openWindows.indexOf(id)) + 1,
        ...(hidden ? { display: "none" } : null),
        ...style,
      }}
      dragHandleClassName="window-drag-handle"
      cancel={dragCancel}
      onResizeStart={() => {
        focusWindow(id);
        setInteracting(true);
      }}
      onResizeStop={() => setInteracting(false)}
      onDragStart={(event) => {
        focusWindow(id);
        setInteracting(true);
        restoreOnDrag(event);
      }}
      onDragStop={() => setInteracting(false)}
    >
      <section
        role="dialog"
        aria-labelledby={titleId}
        // No es modal: conviven varias ventanas y el resto del escritorio sigue
        // siendo alcanzable, así que anunciarla como modal mentiría.
        aria-modal={false}
        tabIndex={-1}
        data-maximized={isMaximized ? "" : undefined}
        style={WINDOW_BODY_STYLE}
        onFocusCapture={() => focusWindow(id)}
        onMouseDown={() => focusWindow(id)}
        onKeyDown={(event) => {
          if (!closeOnEscape || event.key !== "Escape") return;
          if (event.defaultPrevented) return;

          event.stopPropagation();
          close();
        }}
      >
        <WindowFrameContext value={frame}>{children}</WindowFrameContext>
      </section>
    </Rnd>
  );
}

export type WindowHeaderProps = React.ComponentProps<"header"> & {
  render?: RenderProp<React.ComponentProps<"header">>;
};

export function WindowHeader({
  render,
  className,
  children,
  ...props
}: WindowHeaderProps) {
  const { isMaximized } = useWindowFrame();

  const elementProps = mergeProps(
    {
      // No es estilo: es el selector con el que `Rnd` reconoce por dónde se
      // arrastra la ventana. Por eso sigue siendo una clase y no un data-attr.
      className: cn("window-drag-handle", className),
      "data-maximized": isMaximized ? "" : undefined,
      children,
    },
    props,
  );

  return renderSlot(render, elementProps, (finalProps) => (
    <header {...(finalProps as React.ComponentProps<"header">)} />
  ));
}

export type WindowContentProps = React.ComponentProps<"div"> & {
  render?: RenderProp<React.ComponentProps<"div">>;
};

export function WindowContent({
  render,
  children,
  ...props
}: WindowContentProps) {
  const elementProps = mergeProps(
    {
      // `flex: 1` con `minHeight: 0` y no `height: 100%`: dentro de la columna
      // flex, el 100% mide contra el alto total e ignora el header, así que se
      // desbordaba. Estructural, por eso lo pone dayos y no el consumidor.
      style: { flex: "1 1 0%", minHeight: 0, overflow: "auto" },
      children,
    },
    props,
  );

  return renderSlot(render, elementProps, (finalProps) => (
    <div {...(finalProps as React.ComponentProps<"div">)} />
  ));
}

export type WindowNameProps = React.ComponentProps<"h2"> & {
  render?: RenderProp<React.ComponentProps<"h2">>;
};

export function WindowName({ render, children, ...props }: WindowNameProps) {
  const { titleId } = useWindowFrame();

  const elementProps = mergeProps({ id: titleId, children }, props);

  return renderSlot(render, elementProps, (finalProps) => (
    <h2 {...(finalProps as React.ComponentProps<"h2">)} />
  ));
}

export type WindowActionsProps = React.ComponentProps<"div"> & {
  render?: RenderProp<React.ComponentProps<"div">>;
};

export function WindowActions({
  render,
  children,
  ...props
}: WindowActionsProps) {
  const elementProps = mergeProps({ children }, props);

  return renderSlot(render, elementProps, (finalProps) => (
    <div {...(finalProps as React.ComponentProps<"div">)} />
  ));
}

export type WindowActionProps = React.ComponentProps<"button"> & {
  render?: RenderProp<React.ComponentProps<"button">>;
};

export function WindowAction({
  render,
  children,
  ...props
}: WindowActionProps) {
  const elementProps = mergeProps({ type: "button", children }, props);

  return renderSlot(render, elementProps, (finalProps) => (
    <button {...(finalProps as React.ComponentProps<"button">)} />
  ));
}

export type WindowExpandProps = Omit<WindowActionProps, "aria-pressed"> & {
  /**
   * El botón hace dos cosas según el estado, así que su nombre accesible son dos
   * strings y no uno: un `aria-label` suelto solo puede describir una mitad.
   */
  maximizeLabel?: string;
  restoreLabel?: string;
};

export function WindowExpand({
  onClick,
  // En inglés porque son defaults de librería, no de una app. Van como props y
  // no en un contexto de idioma: quien quiera fijarlos una sola vez ya puede
  // envolver el componente, que es como se configura todo lo demás acá.
  maximizeLabel = "Maximize window",
  restoreLabel = "Restore window",
  ...props
}: WindowExpandProps) {
  const { isMaximized, toggleMaximize } = useWindowFrame();

  return (
    <WindowAction
      aria-pressed={isMaximized}
      aria-label={isMaximized ? restoreLabel : maximizeLabel}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggleMaximize();
      }}
      {...props}
    />
  );
}

export function WindowClose({ onClick, ...props }: WindowActionProps) {
  // Pasa por `close` de la app y no por `closeWindow` del escritorio para que el
  // cierre también llegue a quien controle la ventana desde afuera.
  const { close } = useDesktopApp();

  return (
    <WindowAction
      // Se pisa con un `aria-label` propio: `props` va último a propósito.
      aria-label="Close window"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) close();
      }}
      {...props}
    />
  );
}
