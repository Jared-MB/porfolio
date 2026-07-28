import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suspense Fallback Debugger | Jared Muñoz",
  description:
    "A dev-only React package that lists every Suspense boundary on the page and lets you freeze any of them into its fallback, and that leaves about 368 bytes behind in production.",
};

/** Prosa e inline code comparten estilo acá para no repetirlo en cada sección. */
const code = "rounded bg-amber-100/60 px-1 font-mono text-[0.85em]";

const ENTRY_POINTS = [
  {
    name: "suspense-fallback-debugger",
    description:
      "The Suspense component. Same props as React's, plus a name and a className. In production it is React's, unchanged.",
  },
  {
    name: ".../dev",
    description:
      "DevTools, the floating panel that lists the boundaries currently on screen. Outside development it renders nothing.",
  },
  {
    name: ".../context",
    description:
      "SuspenseContext, for hooks that need to assert they are running inside a boundary.",
  },
  {
    name: ".../dropdown-menu",
    description:
      "The menu primitives, so your own dev tools can render inside the same panel instead of next to it.",
  },
];

const USAGE = `import { Suspense } from "suspense-fallback-debugger";
import { DevTools } from "suspense-fallback-debugger/dev";

export default function Page() {
  return (
    <>
      <Suspense fallback={<StatsSkeleton />} name="user-stats">
        <UserStats />
      </Suspense>

      <DevTools />
    </>
  );
}`;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold text-foreground/50 text-sm uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="max-w-prose text-foreground/80">{children}</p>;
}

export default function SuspenseFallbackDebuggerPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8 p-6 text-foreground">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold leading-tight">
          Suspense Fallback Debugger
        </h1>
        <P>
          A development tool for React, published on npm and MIT licensed. You
          import <code className={code}>Suspense</code> from the package instead
          of from React, and a panel appears in the corner listing every
          boundary rendered on the page. Hover an entry and the boundary is
          outlined; click it and it shows its fallback and keeps showing it.
        </P>
      </header>

      <Section title="Why it exists">
        <P>
          A loading state is the part of an interface you write once and then
          almost never look at. It only appears when the data is slow, and on a
          development machine the data is never slow — so the skeleton that
          shipped is often the skeleton nobody ever rendered.
        </P>
        <P>
          The usual ways of checking are all detours: throttle the network in
          the browser, comment the component out, or put a{" "}
          <code className={code}>sleep</code> in the fetch and remember to take
          it out afterwards. Each one changes the code or the environment to
          look at something the app can already draw. Selecting the boundary
          from a menu skips all of that, and it makes the fallback stay on
          screen long enough to notice that it is two pixels taller than the
          content it replaces.
        </P>
      </Section>

      <Section title="Four entry points">
        <ul className="flex flex-col gap-3">
          {ENTRY_POINTS.map((entry) => (
            <li
              key={entry.name}
              className="flex flex-col gap-1 rounded-md bg-amber-100/40 p-3"
            >
              <span className="font-mono font-medium text-sm">
                {entry.name}
              </span>
              <span className="text-foreground/70 text-sm">
                {entry.description}
              </span>
            </li>
          ))}
        </ul>
        <pre className="overflow-x-auto rounded-md bg-amber-100/40 p-3 font-mono text-xs leading-relaxed">
          {USAGE}
        </pre>
        <P>
          Adopting it is one import line per file. The component takes the props
          React&apos;s takes and passes them through, so a codebase already
          using <code className={code}>Suspense</code> migrates by changing
          where the symbol comes from and nothing else. That constraint is the
          whole design: a debugging tool people have to restructure their code
          for is a tool they will try once.
        </P>
      </Section>

      <Section title="What the panel is reading">
        <P>
          Every boundary registers itself in a Zustand store on mount and
          removes itself on unmount, so the list is what is on screen right now
          rather than what the codebase contains. Hovering an entry writes one
          id to the store, and the matching boundary reads it back and outlines
          itself; that is the whole highlight mechanism, and it works the same
          way for a boundary three routes deep as for one in the layout.
        </P>
        <P>
          The forced ones are a <code className={code}>Set</code> rather than a
          single id, so several fallbacks can be held open at once — which is
          the case that matters, since a page that streams in four pieces is a
          page whose loading state is all four skeletons together. Clicking an
          entry toggles it. If a boundary has no{" "}
          <code className={code}>fallback</code> at all, forcing it draws a
          dashed orange placeholder saying so, which is how you find the
          boundaries that were added for streaming and never given anything to
          show.
        </P>
      </Section>

      <Section title="Naming a boundary">
        <P>
          Identity defaults to <code className={code}>useId</code>, which is
          stable across renders but says nothing to a reader: a menu of
          generated ids tells you that six boundaries exist, not which part of
          the page each one covers. So the component takes a{" "}
          <code className={code}>name</code>, and on a page with fifteen
          boundaries the named ones are the ones you can act on.
        </P>
        <P>
          The name is also forwarded to React&apos;s own boundary through its{" "}
          <code className={code}>name</code> prop, so the same string identifies
          it in React&apos;s tooling as in this one. Registering a name that is
          already taken throws, rather than quietly producing two rows that
          highlight the same element or one row that highlights the wrong one.
          The list is capped at twenty-five entries, on the grounds that a menu
          longer than that has stopped being a menu.
        </P>
      </Section>

      <Section title="The context that catches a missing boundary">
        <P>
          Some APIs require a Suspense boundary and do not say so until you
          build. <code className={code}>useSearchParams</code> in Next is the
          common one: it works all through development and then fails the
          production build, pointing at a component whose relationship to the
          missing boundary you now have to reconstruct.
        </P>
        <P>
          The wrapper renders a context provider inside the boundary, which
          gives a custom hook a way to ask the question directly. Read{" "}
          <code className={code}>SuspenseContext</code> at the top of the hook,
          throw when it is empty and the environment is development, and the
          hook now fails the moment it renders in the wrong place, with a
          message naming itself. The check compiles away in production, where
          the answer was settled long before.
        </P>
        <P>
          This only works for boundaries that came from the package, since a
          React <code className={code}>Suspense</code> provides no such context.
          It is a real condition attached to the feature and worth knowing
          before adopting it: the assertion is only as complete as the imports
          are consistent.
        </P>
      </Section>

      <Section title="Getting out of the production bundle">
        <P>
          A tool that only runs in development still has to be imported by code
          that ships, so the question is what it leaves behind. Version 1
          answered that badly: about 23 kB, because the choice between the real
          boundary and the instrumented one was made partly at runtime. A{" "}
          <code className={code}>forceRender</code> prop let the docs site turn
          the debugger on in production, and a bundler cannot remove a branch
          whose condition is a value it will only know later. Everything behind
          it — the store, the tooltip, the menu — had to ship along.
        </P>
        <P>
          Version 2 removed the prop and made the condition a literal:{" "}
          <code className={code}>
            process.env.NODE_ENV === &quot;development&quot;
          </code>
          , inline, with the instrumented component in a module of its own. The
          bundler substitutes the string, the branch is unreachable, and the
          entire development path drops out with its dependencies. The release
          notes put the result at roughly 368 bytes for all three components.
        </P>
        <P>
          The escape hatch did not disappear, it moved: it lives behind an{" "}
          <code className={code}>internal</code> entry point, exported under
          names like <code className={code}>always_render_Suspense</code> and
          marked both internal and deprecated. The documentation site imports
          it, because a demo of a development tool has to run the development
          tool in production. Naming it that way is a fence rather than a lock,
          but it keeps the capability out of the path every other application
          takes.
        </P>
      </Section>

      <Section title="What a forced fallback is not">
        <P>
          Selecting a boundary swaps its children for its fallback. It does not
          make the boundary suspend: no promise is thrown, nothing re-fetches,
          and the transition you would see on a real slow request is not the
          transition you are looking at. What it is good for is the fallback
          itself — its size, its shape, whether it holds the layout still — and
          that is most of what goes wrong with loading states.
        </P>
        <P>
          The instrumented version also wraps its children in an element, which
          is what the outline is drawn on, and an extra wrapper can change a
          grid or a flex layout. That is why the component accepts a{" "}
          <code className={code}>className</code>: when the wrapper matters, you
          give it the child&apos;s classes so development matches production.
          Needing it is uncommon, but it is a real seam and the package
          documents it as one.
        </P>
      </Section>

      <Section title="Where it stands">
        <P>
          Version 2.0.0 on npm, MIT licensed, with a peer range of React 19.2.3
          and up — it starts there because the internals use{" "}
          <code className={code}>useEffectEvent</code> and the{" "}
          <code className={code}>name</code> prop on Suspense, both of which
          arrived in that release. The repository is a Turborepo monorepo:
          package, shared UI, and a Next 16 documentation site written in MDX
          that doubles as the live demo, with releases cut through changesets.
        </P>
        <div className="flex flex-col gap-2">
          <a
            href="https://github.com/Jared-MB/suspense-fallback-debugger"
            target="_blank"
            rel="noreferrer"
            className="w-fit rounded-md bg-amber-100/40 px-3 py-2 font-mono text-sm hover:underline"
          >
            github.com/Jared-MB/suspense-fallback-debugger
          </a>
          <a
            href="https://www.npmjs.com/package/suspense-fallback-debugger"
            target="_blank"
            rel="noreferrer"
            className="w-fit rounded-md bg-amber-100/40 px-3 py-2 font-mono text-sm hover:underline"
          >
            npmjs.com/package/suspense-fallback-debugger
          </a>
        </div>
      </Section>
    </article>
  );
}
