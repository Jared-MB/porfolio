import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom no lo implementa y `Window` lo usa para reclampar contra el escritorio.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  const { router, subscribePathname, getPathname } = await import(
    "./next-router"
  );

  return {
    // Reactivo como el de Next: navegar tiene que re-renderizar a quien lea el
    // pathname, si no la sincronización URL ↔ ventana se prueba a medias.
    usePathname: () =>
      useSyncExternalStore(subscribePathname, getPathname, getPathname),
    useRouter: () => router,
  };
});

afterEach(async () => {
  cleanup();
  const { resetRouter } = await import("./next-router");
  resetRouter();
});
