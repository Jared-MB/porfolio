"use client";

import { type ClassValue, clsx } from "clsx";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useRef,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";

/**
 * Vendorizado a propósito y no importado de la app: dayos tiene que poder
 * moverse a un paquete aparte sin arrastrar el `~/lib/utils` de quien lo use.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Props = Record<string, unknown>;

/** Prop de composición: reemplaza el elemento que renderiza el componente. */
export type RenderProp<P> = React.ReactElement<P>;

const isEventHandlerKey = (key: string) =>
  key.length > 2 && key.startsWith("on") && key[2] === key[2]?.toUpperCase();

/**
 * Une los props internos del componente con los que trae el consumidor.
 * Los handlers se componen (primero los internos), `className` se mergea con
 * `cn` y `style` se combina; el resto lo gana el consumidor.
 */
export function mergeProps(base: Props, overrides: Props | undefined): Props {
  if (!overrides) return base;

  const merged: Props = { ...base };

  for (const key of Object.keys(overrides)) {
    const ours = base[key];
    const theirs = overrides[key];

    if (theirs === undefined) continue;

    if (key === "className") {
      merged[key] = cn(ours as ClassValue, theirs as ClassValue);
      continue;
    }

    if (key === "style") {
      merged[key] = { ...(ours as object), ...(theirs as object) };
      continue;
    }

    if (isEventHandlerKey(key) && typeof ours === "function") {
      merged[key] = (...args: unknown[]) => {
        (ours as (...a: unknown[]) => void)(...args);
        (theirs as (...a: unknown[]) => void)(...args);
      };
      continue;
    }

    merged[key] = theirs;
  }

  return merged;
}

/**
 * Renderiza `render` en lugar del elemento por defecto, conservando el
 * comportamiento que aporta dayos. Si no hay `render`, cae al elemento propio.
 */
export function renderSlot(
  render: React.ReactElement | undefined,
  props: Props,
  fallback: (finalProps: Props) => React.ReactElement,
): React.ReactElement {
  if (isValidElement(render)) {
    return cloneElement(render, mergeProps(props, render.props as Props));
  }

  return fallback(props);
}

/**
 * Estado que funciona controlado o no según reciba `value`. Permite manejar el
 * escritorio desde afuera (persistencia, dock, atajos) sin duplicar la lógica.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);

  const isControlled = value !== undefined;
  const state = isControlled ? value : uncontrolled;

  // Se escribe en render para que `setState` pueda leer el valor de este mismo
  // ciclo: dos llamadas seguidas en el mismo handler tienen que encadenarse.
  const stateRef = useRef(state);
  stateRef.current = state;

  const setState = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(stateRef.current)
          : next;

      if (Object.is(resolved, stateRef.current)) return;

      stateRef.current = resolved;
      if (!isControlled) setUncontrolled(resolved);
      onChange?.(resolved);
    },
    [isControlled, onChange],
  );

  return [state, setState] as const;
}
