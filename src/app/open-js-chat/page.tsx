import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "OpenJS Chat | Jared Muñoz",
  description:
    "An open source chat you can adapt: a Next client, a NestJS server over WebSockets, and the chat itself packaged as React hooks that know nothing about either.",
};

/** Prosa e inline code comparten estilo acá para no repetirlo en cada sección. */
const code = "rounded bg-amber-100/60 px-1 font-mono text-[0.85em]";

/** El tipo del URI que recibe el provider: se muestra, no se interpola. */
// biome-ignore lint/suspicious/noTemplateCurlyInString: es un tipo literal citado, no una plantilla sin evaluar
const URI_TYPE = "`${string}/${SocketNamespace}`";

const WORKSPACES = [
  {
    name: "apps/chat",
    description:
      "The Next client. React 19 with the compiler on, Tailwind 4, shadcn/ui, TanStack Query for what is fetched and Zustand for what isn't.",
  },
  {
    name: "apps/server",
    description:
      "NestJS. Two Socket.io gateways, a REST surface for everything that isn't realtime, and PostgreSQL through Drizzle.",
  },
  {
    name: "packages/openjs-chat",
    description:
      "The chat itself: providers and hooks, published for the client to consume like any other dependency. It knows nothing about the app around it.",
  },
];

const USAGE = `<SocketProvider uri={\`\${SERVER_URL}/chat\`}>
  <Conversation />
</SocketProvider>

function Conversation() {
  const { sendMessage } = useChat();

  return (
    <Composer
      onSubmit={(text) =>
        sendMessage({ userId, to, message: text, isGroup: false })
      }
    />
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

export default function OpenJSChatPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8 p-6 text-foreground">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold leading-tight">OpenJS Chat</h1>
        <P>
          An open source chat application, MIT licensed: direct messages, groups
          and contact requests, all over WebSockets. It is a Turborepo monorepo
          with a Next client and a NestJS server, but the piece I actually care
          about is the third workspace, where the chat lives as a package of its
          own.
        </P>
      </header>

      <Section title="Three workspaces">
        <ul className="flex flex-col gap-3">
          {WORKSPACES.map((workspace) => (
            <li
              key={workspace.name}
              className="flex flex-col gap-1 rounded-md bg-amber-100/40 p-3"
            >
              <span className="font-mono font-medium text-sm">
                {workspace.name}
              </span>
              <span className="text-foreground/70 text-sm">
                {workspace.description}
              </span>
            </li>
          ))}
        </ul>
        <P>
          Most chat projects are a single application that happens to contain a
          chat, which is why so few of them can be reused anywhere else. Here
          the split does the work. Everything involved in talking to the server
          — <code className={code}>SocketProvider</code>,{" "}
          <code className={code}>ContactsProvider</code>,{" "}
          <code className={code}>useSocket</code>,{" "}
          <code className={code}>useChat</code>,{" "}
          <code className={code}>useContact</code> — lives in{" "}
          <code className={code}>openjs-chat/react</code>, and the client in
          this repository is one possible interface over it. If you want a
          different one, you write it and keep the package.
        </P>
        <pre className="overflow-x-auto rounded-md bg-amber-100/40 p-3 font-mono text-xs leading-relaxed">
          {USAGE}
        </pre>
      </Section>

      <Section title="Typing the namespace">
        <P>
          The provider takes a URI, and the URI is typed{" "}
          <code className={code}>{URI_TYPE}</code>, so pointing it at a
          namespace that doesn&apos;t exist is a compile error. Each hook then
          checks the namespace it was actually given and throws if it
          doesn&apos;t match: <code className={code}>useChat</code> refuses to
          run outside <code className={code}>/chat</code>,{" "}
          <code className={code}>useContact</code> outside{" "}
          <code className={code}>/contacts</code>.
        </P>
        <P>
          That is a lot of insistence for one string. The reason is that a
          socket connected to the wrong place fails by doing nothing at all: no
          error, no message, just a chat where nobody ever says anything. The
          class of bug worth spending types on is the one that looks like
          working software.
        </P>
      </Section>

      <Section title="How rooms are named">
        <P>
          A direct message room is the two participants&apos; emails, sorted and
          joined. Both sides compute the same name from the same pair without
          asking anyone, so there is no room table, nothing to keep in sync, and
          nothing to look up before the first message. A group room is simply
          the group&apos;s UUID.
        </P>
        <P>
          Which of the two you are in is decided by the target itself: the
          gateway runs <code className={code}>z.string().uuid()</code> over it,
          and a UUID means group while an email means person. That leaves one
          conversation endpoint for both kinds of conversation, and no flag the
          client can get wrong.
        </P>
        <P>
          Membership is checked on the way in — joining a group room asks the
          database whether you belong to it first — and bans are enforced twice,
          at join and at send, because a socket that joined before the ban is
          still holding the room. Both paths call{" "}
          <code className={code}>socket.leave</code>, so the check also holds
          for a connection that was already open when the ban landed.
        </P>
      </Section>

      <Section title="Optimistic messages and the echo back">
        <P>
          Sending renders immediately through{" "}
          <code className={code}>useOptimistic</code>, and the interesting part
          is what happens a moment later: the server echoes the stored message
          back to the whole room, sender included, so the client has to
          recognize its own words coming home. It matches on sender, target and
          text, swaps the optimistic entry for the real one — id, timestamp and
          all — and separately drops anything whose id it already has. Without
          the first rule your message appears twice; without the second it does
          too, for a different reason.
        </P>
      </Section>

      <Section title="Events between the REST side and the gateway">
        <P>
          Contact requests and groups arrive on their own namespace, in a room
          named after the recipient&apos;s user id, so a request lands on
          someone&apos;s screen without anything polling for it.
        </P>
        <P>
          Accepting a request, though, happens over HTTP, and I didn&apos;t want
          the controller reaching into a gateway to push the notification. So it
          emits a domain event, <code className={code}>contacts.add</code> or{" "}
          <code className={code}>group.add</code>, and the gateway listens with{" "}
          <code className={code}>@OnEvent</code> and translates it into a socket
          emit. The controller never learns that realtime exists, and the
          gateway could be taken out without a line of it changing.
        </P>
      </Section>

      <Section title="Sessions">
        <P>
          Passwords are bcrypt, sessions are JWTs issued by Passport, and the
          guard is applied globally with a{" "}
          <code className={code}>@Public()</code> decorator to opt out — so a
          new endpoint is protected by default and unprotecting it is a visible,
          deliberate line of code.
        </P>
        <P>
          On the client the token goes into an{" "}
          <code className={code}>httpOnly</code> cookie set by a server action,
          never into anything JavaScript can read, and every server-side request
          goes through{" "}
          <Link
            href="/kristall"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Kristall
          </Link>
          , my own HTTP client, which is what attaches it. Meanwhile every
          response the API returns is wrapped by one interceptor into the same{" "}
          <code className={code}>{"{ message, status, data }"}</code> envelope,
          so the client has exactly one shape to handle instead of one per
          endpoint.
        </P>
      </Section>

      <Section title="Where it stands">
        <P>
          The client tracks Next closely — Next 16, React 19, the React Compiler
          enabled — because a project whose whole purpose is to be copied should
          be showing people the current way of doing things, not the way that
          was current when it was written.
        </P>
        <P>
          The package&apos;s exports map already reserves a second entry point
          next to <code className={code}>./react</code>: a framework-agnostic
          one, for the people whose chat isn&apos;t a React chat. So far that is
          all it is. The manifest promises it and the implementation is the next
          thing to write.
        </P>
        <a
          href="https://github.com/Jared-MB/open-js-chat"
          target="_blank"
          rel="noreferrer"
          className="w-fit rounded-md bg-amber-100/40 px-3 py-2 font-mono text-sm hover:underline"
        >
          github.com/Jared-MB/open-js-chat
        </a>
      </Section>
    </article>
  );
}
