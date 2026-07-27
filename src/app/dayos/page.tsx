import type { Metadata } from "next";
import Image from "next/image";
import { SECTION_TITLES, type SectionId } from "./sections";
import { TableOfContents } from "./table-of-contents";

export const metadata: Metadata = {
  title: "DayOS | Jared Muñoz",
  description:
    "DayOS, a desktop with draggable windows for React: the behavior, none of the look, and a Next adapter that gives every window its own URL.",
};

const PACKAGES = [
  {
    name: "@dayos/core",
    description:
      "The desktop, the icons and the windows. React only: no dependency on Next or on any router.",
  },
  {
    name: "@dayos/next",
    description:
      "Ties every window to a Next route, so the URL says which window is open — and so the server render already has it open.",
  },
];

const USAGE = `<Desktop className="h-dvh">
  <DesktopApp id="notes">
    <DesktopIcon>Notes</DesktopIcon>
    <Window>
      <WindowHeader>
        <WindowName>Notes</WindowName>
      </WindowHeader>
      <WindowContent>Hello</WindowContent>
    </Window>
  </DesktopApp>
</Desktop>`;

/** Prosa e inline code comparten estilo acá para no repetirlo en cada sección. */
const code = "rounded bg-amber-100/60 px-1 font-mono text-[0.85em]";

/**
 * El `scroll-mt` es para el salto del ancla: sin él el título queda pegado al
 * borde de arriba de la ventana. El `tabIndex` es para que el índice pueda
 * mandarle el foco al llegar, como haría el ancla; negativo, así no entra en el
 * recorrido del tabulador.
 */
function Section({
  id,
  children,
}: {
  id: SectionId;
  children: React.ReactNode;
}) {
  return (
    <section id={id} tabIndex={-1} className="flex scroll-mt-6 flex-col gap-3">
      <h2 className="font-semibold text-foreground/50 text-sm uppercase tracking-wide">
        {SECTION_TITLES[id]}
      </h2>
      {children}
    </section>
  );
}

/**
 * Los diagramas son SVG generados en build desde `diagrams/*.mmd` con
 * mermaid-cli (`npm run diagrams`), no mermaid en el cliente: el artículo habla
 * justamente de que la ventana viaja en el HTML del servidor, así que meterle
 * un renderer de diagramas al bundle sería contradecirse.
 *
 * El `width` natural del SVG es también su ancho máximo: a tamaño natural la
 * tipografía del diagrama coincide con la de la prosa, y estirarlo la haría
 * más grande que el texto que lo explica.
 */
function Diagram({
  src,
  alt,
  caption,
  width,
  height,
}: {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-md bg-amber-100/40 p-3">
        {/* biome-ignore lint/performance/noImgElement: es un SVG estático, no hay nada que optimizar */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="mx-auto h-auto w-full"
          style={{ maxWidth: width }}
        />
      </div>
      <figcaption className="text-foreground/60 text-sm">{caption}</figcaption>
    </figure>
  );
}

/**
 * El ancho que decide si cabe la navegación es el de la ventana, no el de la
 * pantalla — la ventana se redimensiona sola — así que la condición es una
 * container query y no un breakpoint.
 */
export default function DayosPage() {
  return (
    <div className="@container">
      <div className="mx-auto flex max-w-3xl gap-16 p-6 @3xl:max-w-5xl">
        <TableOfContents />
        <DayosArticle />
      </div>
    </div>
  );
}

function DayosArticle() {
  return (
    <article className="flex min-w-0 flex-1 flex-col gap-8 text-foreground">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold leading-tight">DayOS</h1>
        <p className="text-foreground/80">
          A desktop with draggable windows for React: icons, windows you can
          move, resize and maximize, and a focus stack. It ships no styles of
          its own and knows nothing about routes.
        </p>
        <p className="text-foreground/60 text-sm">
          This desktop is DayOS. Every icon out there is a{" "}
          <code className={code}>DesktopApp</code>, and this article is the
          window you are reading it in.
        </p>
      </header>

      <Section id="where-it-came-from">
        <p className="text-foreground/80">
          It started as envy.{" "}
          <a
            href="https://posthog.com"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            PostHog&apos;s landing page
          </a>{" "}
          treats its site like an operating system — you open things, they land
          in windows, you move them around — and it is the rare piece of product
          marketing that is genuinely fun to poke at. I wanted to know whether I
          could build that, so I tried.
        </p>
        <Image
          src="/dayos/posthog.avif"
          alt="Posthog landing page"
          className="aspect-640/360 mx-auto"
          width={640}
          height={360}
        />
        <p className="text-foreground/80">
          What I found is that the fun part is also the small part. Making a box
          draggable takes an afternoon; making the desktop survive a server
          render, a resized viewport, an iframe, a maximized window being
          dragged, and a URL you can share took the rest of it. Somewhere in
          there it stopped being a landing page and turned into a library — so I
          split it out, gave it no styles of its own, and published it. This
          portfolio is its first real user.
        </p>
      </Section>

      <Section id="the-idea">
        <p className="text-foreground/80">
          A windowed desktop on the web is usually one of two things: a toy
          locked behind a theme you cannot change, or a window manager welded to
          the one app that owns it. DayOS goes for the third option — the
          behavior, none of the look. It owns which windows are open, which one
          is in front, and where each one sits. The chrome, the icons and the
          wallpaper are markup you write.
        </p>
        <p className="text-foreground/80">
          The only CSS it sets is the CSS that would otherwise break. The
          desktop is <code className={code}>relative</code> +{" "}
          <code className={code}>overflow: hidden</code>, because windows
          position and clip against it. The window is a flex column, and its
          content pane is <code className={code}>flex: 1</code> with{" "}
          <code className={code}>min-height: 0</code> so the body scrolls
          instead of the whole window. Everything else arrives through{" "}
          <code className={code}>className</code>,{" "}
          <code className={code}>style</code>, or a{" "}
          <code className={code}>render</code> prop that swaps out the element a
          component emits while keeping its behavior. Your handlers run before
          the built-in ones and can cancel them with{" "}
          <code className={code}>preventDefault()</code>, so an icon can be a
          link that navigates rather than one that opens.
        </p>
        <Diagram
          src="/dayos/composition.svg"
          width={333}
          height={493}
          alt="A DesktopIcon calls open(id) on the Desktop, which owns openWindows — an array of ids whose last entry is the front window. The Desktop decides whether a Window mounts, by whether the array includes its id, and its z-index, from the index. The Window contains a WindowHeader, which is the drag handle, and a WindowContent, which scrolls."
          caption="Who owns what. The desktop holds the state; an id ties an icon to a window; the window portals into the desktop node once there is one."
        />
      </Section>

      <Section id="packages">
        <ul className="flex flex-col gap-3">
          {PACKAGES.map((pkg) => (
            <li
              key={pkg.name}
              className="flex flex-col gap-1 rounded-md bg-amber-100/40 p-3"
            >
              <a
                href={`https://www.npmjs.com/package/${pkg.name}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono font-medium text-sm hover:underline"
              >
                {pkg.name}
              </a>
              <span className="text-foreground/70 text-sm">
                {pkg.description}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-foreground/80">
          The core stands on its own and is not missing anything: without the
          adapter the desktop works the same, on a single page and without URLs.
          There is a test suite whose whole job is to keep that true by
          accident-proofing it.
        </p>
      </Section>

      <Section id="usage">
        <pre className="overflow-x-auto rounded-md bg-amber-100/40 p-3 font-mono text-xs leading-relaxed">
          {USAGE}
        </pre>
        <p className="text-foreground/80">
          Double click opens the window. Drag the header to move it, the edges
          to resize it.
        </p>
      </Section>

      <Section id="server-render">
        <p className="text-foreground/80">
          The interesting problem was never dragging. It is that a desktop whose
          windows open on the client renders, on the server, as an empty screen.
          The page&apos;s content arrives, finds no window to live in, and gets
          thrown away. What ships is a flash of nothing followed by a window
          popping in.
        </p>
        <p className="text-foreground/80">
          <code className={code}>@dayos/next</code> exists for that one
          sentence. The provider takes every route up front and seeds the open
          window during render, from the pathname — not from an effect. On the
          server that pathname is already known, so the matching window is born
          open and the page&apos;s content lands inside it in the HTML.
          Indexable, and with no empty desktop first.
        </p>
        <p className="text-foreground/80">
          A window that opens before there is a desktop to measure renders in
          place, without the drag library, and takes its geometry from CSS —{" "}
          <code className={code}>calc(50% - …)</code> instead of computed
          pixels, because the server has no viewport. It is picked to land
          exactly where the real frame will put it on mount. Getting that wrong
          is visible: an earlier version drew the server window in the corner
          and it jumped on hydration. So the position math lives in one pure
          function and a test compares both versions of it.
        </p>
        <Diagram
          src="/dayos/server-render.svg"
          width={924}
          height={704}
          alt="A request for /dayos reaches the server render, where usePathname already says /dayos, so openWindows is seeded during render rather than in an effect and the window is born open. The window renders as a StaticWindowFrame — no drag library, geometry in CSS — and the server returns HTML with the window open and the page already inside it, which the browser paints before React runs. On hydration the desktop mounts, the window portals in and react-rnd takes over at the same size and position, so nothing jumps."
          caption="One request, end to end. Everything above the hydrate line already happened before any JavaScript ran."
        />
      </Section>

      <Section id="one-url">
        <p className="text-foreground/80">
          In the adapter a window&apos;s <code className={code}>href</code> is
          its <code className={code}>DesktopApp</code> id: one identity,
          declared once. Focusing a window rewrites the URL with{" "}
          <code className={code}>replace</code> and not{" "}
          <code className={code}>push</code>, because focusing is not navigating
          — otherwise the back button would walk your focus changes instead of
          the pages you visited. Each window also remembers the last full URL it
          had, query and hash included, so returning to it does not wipe its
          params.
        </p>
        <p className="text-foreground/80">
          A segment written <code className={code}>:like-this</code> matches
          anything, and the window is identified by the URL it matched — so{" "}
          <code className={code}>/documents/:file</code> is a single declaration
          that stands for one window per document. Those windows cannot be
          spelled out in advance, so the app asks the desktop which ones are
          open rather than keeping a second copy of that state. An ordinary link
          opens one beside the list; landing on the URL directly puts it in the
          server HTML.
        </p>
        <p className="text-foreground/80">
          Routes are matched a segment at a time, most specific first: more
          segments win, and at the same depth a static segment beats a param. A
          window owns its subroutes, which is why{" "}
          <code className={code}>/docs</code> claims{" "}
          <code className={code}>/docs/api</code>. The root is the exception —
          it matches only itself, or every URL on the site would belong to the
          home window and a 404 would stop being one.
        </p>
        <Diagram
          src="/dayos/url-sync.svg"
          width={371}
          height={655}
          alt="A URL such as /documents/violin.avif is resolved with findRoute, most specific route first. Then a check: did the desktop write this URL itself? If not, the visitor navigated, so openWindow(href) runs and updates openWindows, the focus stack. If it did — the selfNavigatedTo guard — there is nothing to do, because the state is already right. In the other direction, a change of front window makes router.replace, never push, write that window's last full URL back to the URL."
          caption="The sync runs both ways, so the interesting part is the guard: without it, writing the URL would reopen the window that writing it had just closed."
        />
      </Section>

      <Section id="in-use">
        <p className="text-foreground/80">
          A window that loses focus should keep showing its own page. Holding on
          to the React node is not enough: what the router hands over is a
          pointer to the active segment, so re-rendering it paints whatever
          route is current now and every window ends up showing the same thing.
          The fix stores the node together with the router context that was in
          place while it was current, and re-provides it, which makes the node
          resolve back to its own segment. It costs one import from Next&apos;s
          internals — the price of per-window content without parallel routes,
          and a build that breaks loudly rather than silently if that module
          ever moves.
        </p>
        <p className="text-foreground/80">
          Drag a window across an iframe and it sticks to the cursor: the iframe
          swallows the <code className={code}>mousemove</code> and{" "}
          <code className={code}>mouseup</code> the drag listens for on the
          document. DayOS cannot fix that from an inline style, since it is a
          rule about descendants, so it marks the interaction with{" "}
          <code className={code}>data-interacting</code> and the app writes the
          selector. This desktop does exactly that.
        </p>
        <p className="text-foreground/80">
          Dragging a maximized window restores it under the cursor, keeping the
          pointer over the same proportional point of the title bar — and the
          restored size has to be written straight to the DOM node, because the
          drag library reads the element back the instant the handler returns
          and would otherwise compute its bounds from the maximized size.
        </p>
        <p className="text-foreground/80">
          Windows are <code className={code}>role=&quot;dialog&quot;</code> but
          deliberately not modal: several coexist and the rest of the desktop
          stays reachable, so announcing them as modal would be a lie. Icons
          respond to Enter and Space, because double click has no keyboard
          equivalent and without it an icon is simply unreachable. And the
          maximize button carries two accessible names rather than one, since a
          single label can only describe half of a toggle.
        </p>
      </Section>

      <Section id="status">
        <p className="text-foreground/80">
          Both packages are on npm at 0.2.1, MIT licensed, React 19. Main takes
          no direct pushes: every commit needs a green CI check.
        </p>
        <a
          href="https://github.com/Jared-MB/dayos"
          target="_blank"
          rel="noreferrer"
          className="w-fit rounded-md bg-amber-100/40 px-3 py-2 font-mono text-sm hover:underline"
        >
          github.com/Jared-MB/dayos
        </a>
      </Section>
    </article>
  );
}
