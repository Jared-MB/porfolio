import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AreWePlaying? | Jared Muñoz",
  description:
    "A friendlier front for the ABE league schedule: pick your university once and the page answers the only question you came with, in one word.",
};

/** Prosa e inline code comparten estilo acá para no repetirlo en cada sección. */
const code = "rounded bg-amber-100/60 px-1 font-mono text-[0.85em]";

/** El campo tal como llega de la API, y el nombre con el que sale del script. */
const FIELDS = [
  { from: "PartidoID", to: "matchId" },
  { from: "EquipoLocal", to: "localTeam" },
  { from: "EquipoVisita", to: "visitingTeam" },
  { from: "SedeNombre", to: "location" },
  { from: "EnVivo", to: "live" },
];

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

export default function AreWePlayingPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8 p-6 text-foreground">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold leading-tight">AreWePlaying?</h1>
        <P>
          The schedule of the ABE college basketball league, for the people who
          only ever wanted one thing from it: to know whether their university
          is playing today. Open source, non-profit, and not affiliated with the
          league — it reads public endpoints and puts a better interface in
          front of them.
        </P>
      </header>

      <Section title="The question the page answers first">
        <P>
          The official way to find out was to open a page, find the tournament,
          find the current match day, and read a table until your team appeared
          in it. Four steps to answer a yes-or-no question. So the app answers
          it first and shows the table second: you choose your university once,
          and if it plays today the header prints{" "}
          <code className={code}>YES!!</code> at the same size as the title,
          fires confetti, and scrolls the page to your match. If it doesn&apos;t
          play, the header prints nothing, which is the answer as well.
        </P>
        <P>
          Everything below that is the schedule you would have gone looking for
          anyway: match days, teams, venues, scores, and your team&apos;s card
          outlined so you can pick it out without reading the rest.
        </P>
      </Section>

      <Section title="Remembering a university without an account">
        <P>
          Personalizing a page usually means an account, and an account for a
          basketball schedule is an absurd price. The selected university lives
          in a Zustand store persisted to{" "}
          <code className={code}>localStorage</code> under{" "}
          <code className={code}>are-we-playing:university</code> — no login, no
          session, no server that knows who you are. Come back next week and the
          app already knows which team you meant.
        </P>
        <P>
          The confetti gets the same treatment, and it is the more interesting
          half. A celebration that replays on every re-render stops being a
          celebration, so a persisted flag records that it already fired.
          Changing university resets the flag, since the new team is a question
          that hasn&apos;t been answered yet. The call also passes{" "}
          <code className={code}>disableForReducedMotion</code>, so the answer
          still arrives for anyone who would rather not have it animated.
        </P>
      </Section>

      <Section title="Translating the API at build time">
        <P>
          The upstream endpoints answer with JSON that contains JSON: a{" "}
          <code className={code}>data</code> field holding a stringified array,
          with Spanish PascalCase keys and numbers shipped as strings. Consuming
          that shape directly would spread it through every component that ever
          renders a match.
        </P>
        <P>
          Instead, scripts fetch it, parse both layers, and rename every field
          into a typed shape the app actually wants:
        </P>
        <ul className="flex flex-col gap-2">
          {FIELDS.map((field) => (
            <li
              key={field.from}
              className="flex items-center gap-2 rounded-md bg-amber-100/40 px-3 py-2 font-mono text-sm"
            >
              <span className="text-foreground/60">{field.from}</span>
              <span aria-hidden className="text-foreground/40">
                →
              </span>
              <span>{field.to}</span>
            </li>
          ))}
        </ul>
        <P>
          The result is written to JSON files in the repository, and the app
          reads those from disk. That decision buys three things at once: the
          site cannot be taken down by a third party having a bad day, no
          visitor&apos;s request ever waits on someone else&apos;s server, and
          the shape of the data is fixed by a script I control rather than by an
          endpoint that can change without telling me. What it costs is
          freshness — refreshing the schedule is a script run and a deploy — and
          for a league that publishes its calendar in advance, that is the
          cheaper side of the trade.
        </P>
      </Section>

      <Section title="Cache lifetimes">
        <P>
          Every read goes through a use case marked{" "}
          <code className={code}>&quot;use cache&quot;</code>, and each one is
          tagged and given a lifetime that reflects how volatile it really is.
          The list of match days is <code className={code}>max</code>, because a
          calendar published at the start of the tournament does not move. A
          week&apos;s matches are <code className={code}>days</code>. A
          team&apos;s past and upcoming games are{" "}
          <code className={code}>hours</code>, since those two lists trade
          entries every time a game is played.
        </P>
        <P>
          The tags are per-entity —{" "}
          <code className={code}>
            matches-by-week-${"{"}id{"}"}
          </code>
          ,{" "}
          <code className={code}>
            team-position-${"{"}id{"}"}
          </code>{" "}
          — so refreshing one team&apos;s data doesn&apos;t evict the rest of
          the tournament.
        </P>
      </Section>

      <Section title="The URL always names a week">
        <P>
          Landing on the site with no week in the URL is the common case, and
          the obvious way to handle it is on the client: render, work out
          today&apos;s match day, then show it. That is a frame of the wrong
          week, and a URL nobody can share.
        </P>
        <P>
          A proxy intercepts <code className={code}>/</code> instead. If there
          is no <code className={code}>?week</code>, it finds the current match
          day — <code className={code}>findLast</code> over the calendar for the
          last date that isn&apos;t after today — and redirects to it. From then
          on the URL says which week you are looking at, the server renders that
          week directly, and sending someone a link sends them the same page you
          were on.
        </P>
        <P>
          The client keeps the same rule in a{" "}
          <code className={code}>useCurrentWeek</code> hook, because the header
          needs to know which week is current in order to ask whether you play
          today. Same comparison, same parsing of{" "}
          <code className={code}>dd/MM/yyyy</code>, deliberately duplicated on
          both sides rather than passed down through props that would have to
          cross every component in between.
        </P>
      </Section>

      <Section title="Prefetching on hover">
        <P>
          The week selector is eighteen buttons, one per match day. Next would
          happily prefetch every route in view, which for this layout means
          fetching the entire tournament to render a row of buttons.
        </P>
        <P>
          So the links prefetch on hover and not before: a tiny component holds
          one <code className={code}>isHovered</code> boolean and passes it
          straight to <code className={code}>prefetch</code>. Pointing at a week
          is the earliest signal that you want it, and it comes far enough ahead
          of the click that the navigation still feels instant.
        </P>
      </Section>

      <Section title="Teams">
        <P>
          The teams section is a standings table rendered as cards — win rate as
          a bar across the top, record, position — with your own university
          marked in the accent color. Each card links to a page built at build
          time from the team list, with its own metadata: the team&apos;s name
          in the title, its logo as the Open Graph image, so a link pasted into
          a chat unfurls as that team rather than as the site.
        </P>
        <P>
          Card and page share a <code className={code}>ViewTransition</code>{" "}
          named{" "}
          <code className={code}>
            team-${"{"}id{"}"}
          </code>
          , so the team name you clicked is the same element that lands as the
          heading. It is a small thing, but it ties the page you arrive at to
          the card you touched, which a fade between two screens cannot do.
        </P>
        <a
          href="https://github.com/Jared-MB/AreWePlaying"
          target="_blank"
          rel="noreferrer"
          className="w-fit rounded-md bg-amber-100/40 px-3 py-2 font-mono text-sm hover:underline"
        >
          github.com/Jared-MB/AreWePlaying
        </a>
      </Section>
    </article>
  );
}
