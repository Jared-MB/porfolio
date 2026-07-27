"use client";

import { useRef, useState } from "react";

export type Tab = {
  id: string;
  /** El puesto. */
  label: string;
  /** Las fechas, debajo del puesto en la pestaña. */
  period: string;
  content: React.ReactNode;
};

/**
 * Los paneles se renderizan todos y los inactivos se esconden con `hidden` en
 * vez de desmontarse: así el contenido de las dos estancias viaja en el HTML
 * del servidor —queda indexable y buscable con Ctrl+F— y cambiar de pestaña no
 * vuelve a montar nada.
 *
 * Activación automática: mover la selección con las flechas también cambia el
 * panel. Es lo que recomienda el patrón APG cuando los paneles ya están ahí y
 * mostrarlos no cuesta nada, y evita el paso extra de tener que confirmar.
 */
export function Tabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const select = (id: string) => {
    setActive(id);
    buttons.current.get(id)?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const index = tabs.findIndex((tab) => tab.id === active);
    // Las flechas dan la vuelta: es una lista cerrada, no una que se acaba.
    if (event.key === "ArrowRight") select(tabs[(index + 1) % tabs.length].id);
    else if (event.key === "ArrowLeft")
      select(tabs[(index - 1 + tabs.length) % tabs.length].id);
    else if (event.key === "Home") select(tabs[0].id);
    else if (event.key === "End") select(tabs[tabs.length - 1].id);
    else return;

    // Solo si la tecla era nuestra: Tab, Enter y las demás siguen siendo del
    // navegador, y las flechas de arriba y abajo tienen que poder scrollear.
    event.preventDefault();
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Stints at the Mexican Red Cross"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-6 border-foreground/15 border-b"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={tab.id === active}
            aria-controls={`panel-${tab.id}`}
            // Roving tabindex: el tabulador entra a la pestaña activa y sale de
            // la lista, en vez de recorrer una por una.
            tabIndex={tab.id === active ? 0 : -1}
            onClick={() => setActive(tab.id)}
            ref={(node) => {
              if (node) buttons.current.set(tab.id, node);
              else buttons.current.delete(tab.id);
            }}
            className="-mb-px flex flex-col items-start gap-0.5 border-transparent border-b-2 pb-3 text-left text-foreground/60 hover:text-foreground aria-selected:border-amber-400 aria-selected:text-foreground"
          >
            <span className="font-medium text-sm">{tab.label}</span>
            <span className="text-current/70 text-xs">{tab.period}</span>
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== active}
          // Un panel que no tiene nada enfocable adentro tiene que ser
          // enfocable él, o desde la pestaña el tabulador se salta el texto
          // entero y con el teclado no hay forma de scrollearlo. Es lo que pide
          // el patrón APG, y por eso la regla se suprime en vez de obedecerse.
          // biome-ignore lint/a11y/noNoninteractiveTabindex: el tabpanel es el destino del foco al salir de la pestaña
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
