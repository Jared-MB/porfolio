import type { Metadata } from "next";
import Image from "next/image";
import { Tabs } from "./tabs";

export const metadata: Metadata = {
  title: "Mexican Red Cross | Jared Muñoz",
  description:
    "Two stints at the Systems department of the Mexican Red Cross, Puebla delegation: social service as a Software Developer, and professional practice as Frontend Tech Lead & Software Engineer.",
};

/** Prosa e inline code comparten estilo acá para no repetirlo en cada sección. */
const code = "rounded bg-amber-100/60 px-1 font-mono text-[0.85em]";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-medium text-base text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="max-w-prose text-foreground/80">{children}</p>;
}

export default function RedCrossPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8 p-6 text-foreground">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Image
            src="/cruz-roja.avif"
            alt="Cruz Roja Mexicana"
            width={64}
            height={72}
          />
          <h1 className="font-semibold text-2xl leading-tight text-balance max-w-[14ch]">
            Mexican Red Cross
          </h1>
        </div>
        <P>
          Two stints at the Systems department of the Puebla delegation, about a
          year apart. Both times around the same internal system — the one
          employees use to request vacation, leave and time off — first helping
          keep it alive, then leading the frontend of the rebuild that replaced
          it.
        </P>
      </header>

      <Tabs
        tabs={[
          {
            id: "practice",
            label: "Frontend Tech Lead & Software Engineer",
            period: "January 2026 — July 2026",
            content: <Practice />,
          },
          {
            id: "social-service",
            label: "Software Developer",
            period: "November 2024 — June 2025",
            content: <SocialService />,
          },
        ]}
      />
    </article>
  );
}

function Practice() {
  return (
    <div className="flex flex-col gap-8">
      <P>
        I came back to rebuild what I had spent my social service maintaining.
        The system worked, but it had grown without an architecture: files past
        a thousand lines, names that explained nothing, no real module
        boundaries. Every fix took longer than the last one. So instead of
        patching it again, we rewrote it on modern tooling — and the part I
        owned was the frontend, and the three developers building it.
      </P>

      <Section title="Leading the frontend">
        <P>
          The team split in two, three developers on each side. I led the
          frontend group, which meant picking the stack we would live with:
          TypeScript, React, and{" "}
          <a
            href="https://tanstack.com/start"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            TanStack Start
          </a>{" "}
          as the framework. It gave us first-class TypeScript, rendering from
          the server, and — the part that decided it — no tie to any particular
          hosting provider, which is why Next didn&apos;t make the cut for this
          one.
        </P>
      </Section>

      <Section title="One repository instead of five">
        <P>
          The applications lived in separate repositories, each with its own
          duplicated configuration. We merged them into a single monorepo run by{" "}
          <code className={code}>Turbo</code> and{" "}
          <code className={code}>pnpm workspaces</code>: today it holds five
          applications and four internal packages that would otherwise have been
          nine places to keep in sync.
        </P>
        <P>
          One command now builds, runs the tests, checks the types, lints and
          formats, and starts all five applications — skipping from cache
          whatever didn&apos;t change. The bet was that this project would keep
          growing, and it did.
        </P>
      </Section>

      <Section title="An architecture that outlives its authors">
        <P>
          We organized the code by what it is for, not by what it is built with:
          every module carries the same shape —{" "}
          <code className={code}>components</code>,{" "}
          <code className={code}>hooks</code>,{" "}
          <code className={code}>queries</code>,{" "}
          <code className={code}>services</code>,{" "}
          <code className={code}>utils</code> and{" "}
          <code className={code}>adapters</code> — so reading a folder tells you
          the purpose of the module rather than the framework underneath it, and
          adding a module doesn&apos;t mean inventing a layout for it.
        </P>
        <P>
          Repeating that structure by hand is tedious enough that people stop
          doing it, which is how architectures rot. So we shipped an internal
          CLI that scaffolds a whole module, example code included: the next
          developer follows the convention because it is the path of least
          effort.
        </P>
      </Section>

      <Section title="A design system, not a pile of screens">
        <P>
          Consistency across screens — and across whatever gets built next —
          needed a real component library, so we built one as an internal
          package: 41 components, completely agnostic of the rendering
          framework. Vercel, Linear and Railway were the reference; the useful
          exercise was working out <em>why</em> those interfaces feel the way
          they do, and then earning the same thing in ours.
        </P>
      </Section>

      <Section title="Fifty-seven pages">
        <P>
          The redesign touched every route in the product: 57 pages, some
          reworkings of screens that already existed, many designed from
          scratch. The goal was an interface that is modern, clean, accessible
          and unhurried about the details — the kind of care users notice
          without being able to name it.
        </P>
      </Section>

      <Section title="Deploys that are one command">
        <P>
          Deploying used to mean copying folders across and hoping. Users were
          served the source files themselves: uncompiled, unminified, comments
          and all, paying loading time for nothing.
        </P>
        <P>
          Now there is a build step before production — types checked, comments
          stripped, code minified, so the browser downloads only what it needs
          to run — and the server runs under <code className={code}>pm2</code>,
          where a single <code className={code}>restart</code> ships an update
          in under two seconds of downtime.
        </P>
      </Section>

      <Section title="What the work is for">
        <P>
          This was the last step of my time as a student, so I can&apos;t write
          about it without some nostalgia. What I&apos;m taking from it is a
          conviction that now sits under everything I build: we write software
          for people, and it only earns its place by making their day easier.
          Friction is the measure. Someone who never has to fight the thing they
          use is someone whose engineers did their job; a system that collects
          complaints is telling you the opposite, plainly.
        </P>
        <figure className="flex max-w-prose flex-col gap-2 border-amber-400 border-l-2 pl-4">
          <blockquote className="text-foreground/80 italic">
            &ldquo;What we make testifies who we are. People can sense care and
            can sense carelessness.&rdquo;
          </blockquote>
          <figcaption className="text-foreground/60 text-sm">
            Jony Ive, LoveFrom
          </figcaption>
        </figure>
        <P>
          That is the whole argument for the architecture, the design system and
          the 57 pages above, and the reason I&apos;d rather leave a codebase
          the next developer can love than one that merely works.
        </P>
        <P>
          I owe the Systems team for opening the door a second time, and my own
          team for a rebuild that would have been impossible alone — including
          the people who pulled me out of my comfort zone and changed how I see
          this work.
        </P>
        <P>
          And thank you <strong className="italic">&ldquo;D&ldquo;</strong>, for
          the encouragement day after day, for making me fall in love with what
          I do all over again, and for teaching me that the people you admire
          can admire you back.
        </P>
      </Section>
    </div>
  );
}

function SocialService() {
  return (
    <div className="flex flex-col gap-8">
      <P>
        My first real development job: not an exercise with a grade at the end,
        but software that people at the delegation opened every week to request
        their vacation and their leave. Most of what I did that year was making
        an existing PHP application faster, safer and easier to look at.
      </P>

      <Section title="Sessions and roles">
        <P>
          I moved the application onto token-based authentication with JSON Web
          Tokens, covering every internal API and every view, and added
          role-based authorization on top of it. From then on a request was
          checked before it was answered, and each role could reach only the
          resources that belonged to it.
        </P>
      </Section>

      <Section title="APIs worth consuming">
        <P>
          I wrote and reworked the PHP endpoints the application runs on, and
          standardized their responses so every caller could rely on the same
          shape. Unglamorous work, but it is what made the layers above it
          predictable — and what left room to grow later.
        </P>
      </Section>

      <Section title="Retiring jQuery">
        <P>
          A good part of the frontend logic was jQuery, so I migrated it to
          native browser APIs. The application got lighter and quicker, and it
          also got more durable: standing on the platform instead of on a
          third-party library is what keeps code working years after nobody is
          maintaining it.
        </P>
      </Section>

      <Section title="Email that sends itself">
        <P>
          People had no way of knowing what had happened to a request unless
          they went looking. I built the transactional notification system that
          tells them: a serverless microservice on Cloudflare Workers
          orchestrating delivery through Resend. It scales without anyone
          watching it and costs close to nothing to keep running.
        </P>
      </Section>

      <Section title="Screens people liked using">
        <P>
          I redesigned most of the existing screens toward something simpler and
          more modern. The reward for that one was direct: employees told us
          they liked the details.
        </P>
      </Section>

      <Section title="A tool for reading costs">
        <P>
          The last project was a system for analyzing the delegation&apos;s
          operating costs, built with another developer on Node.js, Next.js,
          TypeScript and Tailwind — tools we already knew well, which is how we
          got almost all of it done in about three weeks. We also wrote the
          technical documentation and the internal tooling around it, on the
          theory that you build for the next developer as much as for the user.
        </P>
        <P>
          It never made it to production. What it did leave behind is a working
          starting point, documented well enough that picking it back up is a
          decision rather than a project.
        </P>
      </Section>

      <Section title="What it actually taught me">
        <P>
          The technical parts were the easy half. The lasting lesson was that
          shipping software is a loop with people in it — build, deploy, listen,
          repeat — and that a project like this one moves at the speed of how
          well the team splits the work and hands it back. That is the habit I
          brought with me when I returned to lead the rebuild.
        </P>
        <P>
          It also settled a smaller question: whether I had picked the right
          place to spend those hours. I hadn&apos;t got that one wrong.
        </P>
      </Section>
    </div>
  );
}
