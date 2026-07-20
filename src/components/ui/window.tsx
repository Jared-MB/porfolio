import {
  Window as W,
  WindowActions as WA,
  WindowClose as WC,
  WindowContent as WCo,
  WindowExpand as WE,
  WindowHeader as WH,
  WindowAction,
  WindowName as WN,
} from "@dayos/core";
import { cn } from "@/lib/utils";

/**
 * El aspecto de las ventanas vive acá y no en dayos, que no pinta nada. Cada
 * componente mergea el `className` que le llegue en vez de descartarlo, así una
 * ventana puntual puede seguir ajustando lo suyo.
 */

export function Window({
  className,
  ...props
}: React.ComponentProps<typeof W>) {
  return (
    <W
      className={cn("rounded-md bg-amber-50 shadow-md", className)}
      {...props}
    />
  );
}

export function WindowHeader({
  className,
  ...props
}: React.ComponentProps<typeof WH>) {
  return (
    <WH
      className={cn(
        "flex cursor-move items-center justify-between rounded-t-md border-b-border bg-amber-50 p-2",
        // Antes era `isMaximized && "rounded-none"` adentro de dayos; ahora el
        // estado viaja como data-attr y el estilo lo resuelve CSS.
        "data-maximized:rounded-none",
        className,
      )}
      {...props}
    />
  );
}

export function WindowName({
  className,
  ...props
}: React.ComponentProps<typeof WN>) {
  return (
    <WN
      className={cn("font-medium text-foreground/70 text-sm", className)}
      {...props}
    />
  );
}

export function WindowActions({
  className,
  ...props
}: React.ComponentProps<typeof WA>) {
  return <WA className={cn("flex items-center gap-2", className)} {...props} />;
}

export function WindowContent({
  className,
  ...props
}: React.ComponentProps<typeof WCo>) {
  return <WCo className={cn("p-2", className)} {...props} />;
}

const actionClassName = "rounded-md p-1 hover:bg-amber-100/80";

export function WindowExpand({
  className,
  ...props
}: React.ComponentProps<typeof WE>) {
  return <WE className={cn(actionClassName, className)} {...props} />;
}

export function WindowClose({
  className,
  ...props
}: React.ComponentProps<typeof WC>) {
  return <WC className={cn(actionClassName, className)} {...props} />;
}

export { WindowAction };
