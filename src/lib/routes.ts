/**
 * Rutas del escritorio, en un módulo propio y sin `"use client"` a propósito:
 * el layout es un server component y los componentes de app son de cliente, así
 * que colgar el href de cada componente (`Home.href`) no funciona — cruzando
 * ese borde el server recibe una referencia serializable, no la función, y la
 * propiedad llega `undefined`.
 *
 * El href de cada ventana es también su id de app: son la misma identidad.
 */
export const ROUTES = {
  home: "/",
  cv: "/cv.pdf",
  github: "/github",
  documents: "/documents",
  file: "/documents/:file",
} as const;

/** Lo que el provider necesita para saber qué ventana abrir en cada URL. */
export const DESKTOP_ROUTES = Object.values(ROUTES);
