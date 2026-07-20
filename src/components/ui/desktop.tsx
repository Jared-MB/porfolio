import { DesktopIcon as DI, DesktopIconText as DIT } from "@dayos/core";
import { cn } from "@/lib/utils";

/** El aspecto de los íconos del escritorio; dayos solo aporta el comportamiento. */

export function DesktopIcon({
  className,
  ...props
}: React.ComponentProps<typeof DI>) {
  return (
    <DI
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md p-1 hover:bg-current/10 focus-visible:bg-current/10",
        className,
      )}
      {...props}
    />
  );
}

export function DesktopIconText({
  className,
  ...props
}: React.ComponentProps<typeof DIT>) {
  return <DIT className={cn("select-none text-sm", className)} {...props} />;
}
