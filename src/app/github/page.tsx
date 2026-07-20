import {
  BookMarked,
  GitFork,
  Link as LinkIcon,
  MapPin,
  Star,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GitHub | Jared Muñoz",
  description:
    "Repositorios destacados y perfil de GitHub de Jared Muñoz, Design Engineer y Fullstack Developer.",
};

const USERNAME = "Jared-MB";

// GraphQL (única vía para los pinned) exige token siempre. La REST anónima
// alcanza para el resto, pero con token sube de 60 a 5000 req/h.
const TOKEN = process.env.GITHUB_TOKEN;

const authHeaders: HeadersInit = TOKEN
  ? { Authorization: `Bearer ${TOKEN}` }
  : {};

// El perfil no cambia seguido: se revalida cada hora y el escritorio no pega a
// la API en cada visita.
const REVALIDATE = 3600;

// Colores oficiales de cada lenguaje (los mismos que usa GitHub, de linguist).
// Son hex arbitrarios, así que el dot los toma por `style` y no por clase de
// Tailwind. Los que no estén acá caen a un gris neutro.
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  CSS: "#663399",
  HTML: "#e34c26",
  Astro: "#ff5a03",
  MDX: "#fcb32c",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Shell: "#89e051",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  SCSS: "#c6538c",
  Sass: "#a53b70",
  Less: "#1d365d",
  Dockerfile: "#384d54",
  Makefile: "#427819",
  Lua: "#000080",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  Scala: "#c22d40",
  Nix: "#7e7eff",
  Solidity: "#AA6746",
  GraphQL: "#e10098",
  Markdown: "#083fa1",
  "Jupyter Notebook": "#DA5B0B",
};

const FALLBACK_LANGUAGE_COLOR = "#d4d4d8"; // zinc-300

type GithubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
};

// Forma normalizada que consume la UI, venga de GraphQL o de REST.
type Repo = {
  id: string;
  name: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  languages: string[];
};

async function getUser(): Promise<GithubUser | null> {
  const res = await fetch(`https://api.github.com/users/${USERNAME}`, {
    headers: authHeaders,
    next: { revalidate: REVALIDATE },
  });

  return res.ok ? res.json() : null;
}

// Los pinned solo viven en GraphQL, que además exige token. Sin token, `null`
// para que el caller caiga al fallback REST.
async function getPinnedRepos(): Promise<Repo[] | null> {
  if (!TOKEN) return null;

  const query = `
    {
      user(login: "${USERNAME}") {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              id
              name
              url
              description
              stargazerCount
              forkCount
              languages(first: 6, orderBy: { field: SIZE, direction: DESC }) {
                nodes { name }
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    next: { revalidate: REVALIDATE },
  });

  if (!res.ok) return null;

  const json = await res.json();
  const nodes = json?.data?.user?.pinnedItems?.nodes;
  if (!Array.isArray(nodes) || nodes.length === 0) return null;

  return nodes.map(
    (node): Repo => ({
      id: node.id,
      name: node.name,
      url: node.url,
      description: node.description,
      stars: node.stargazerCount,
      forks: node.forkCount,
      languages: (node.languages?.nodes ?? []).map(
        (lang: { name: string }) => lang.name,
      ),
    }),
  );
}

type RestRepo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  languages_url: string;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
};

// Fallback sin token: los repos propios más estrellados, con sus lenguajes
// pedidos aparte (la REST no los trae en el listado).
async function getTopRepos(): Promise<Repo[]> {
  const res = await fetch(
    `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`,
    { headers: authHeaders, next: { revalidate: REVALIDATE } },
  );

  if (!res.ok) return [];

  const repos: RestRepo[] = await res.json();

  const top = repos
    .filter((repo) => !repo.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6);

  return Promise.all(
    top.map(async (repo): Promise<Repo> => {
      const langRes = await fetch(repo.languages_url, {
        headers: authHeaders,
        next: { revalidate: REVALIDATE },
      });
      // El objeto viene {lenguaje: bytes} ya ordenado de mayor a menor.
      const languages = langRes.ok ? Object.keys(await langRes.json()) : [];

      return {
        id: String(repo.id),
        name: repo.name,
        url: repo.html_url,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        languages,
      };
    }),
  );
}

async function getProfile() {
  const user = await getUser();
  if (!user) return null;

  const repos = (await getPinnedRepos()) ?? (await getTopRepos());
  return { user, repos };
}

export default async function Github() {
  const data = await getProfile();

  if (!data) {
    return (
      <div className="grid h-full place-content-center p-6 text-center text-foreground/70">
        <p>No se pudo cargar el perfil de GitHub ahora mismo.</p>
        <a
          href={`https://github.com/${USERNAME}`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 underline"
        >
          Abrir en github.com
        </a>
      </div>
    );
  }

  const { user, repos } = data;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 text-foreground">
      <header className="flex flex-col gap-4 @sm:flex-row sm:items-start">
        {/* biome-ignore lint/performance/noImgElement: evita configurar remotePatterns de next/image para un solo avatar */}
        <img
          src={user.avatar_url}
          alt={user.name ?? user.login}
          className="size-24 rounded-full border border-border"
        />
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-2xl font-semibold leading-tight">
              {user.name ?? user.login}
            </h1>
            <a
              href={user.html_url}
              target="_blank"
              rel="noreferrer"
              className="text-foreground/60 hover:underline"
            >
              @{user.login}
            </a>
          </div>

          {user.bio && <p className="text-foreground/80">{user.bio}</p>}

          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground/70">
            {user.location && (
              <li className="flex items-center gap-1">
                <MapPin className="size-4" /> {user.location}
              </li>
            )}
            {user.blog && (
              <li className="flex items-center gap-1">
                <LinkIcon className="size-4" />
                <a
                  href={
                    user.blog.startsWith("http")
                      ? user.blog
                      : `https://${user.blog}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {user.blog.replace(/^https?:\/\//, "")}
                </a>
              </li>
            )}
          </ul>

          <dl className="flex gap-4 text-sm">
            <div className="flex gap-1">
              <dt className="font-semibold">{user.public_repos}</dt>
              <dd className="text-foreground/60">repos</dd>
            </div>
            <div className="flex gap-1">
              <dt className="font-semibold">{user.followers}</dt>
              <dd className="text-foreground/60">followers</dd>
            </div>
            <div className="flex gap-1">
              <dt className="font-semibold">{user.following}</dt>
              <dd className="text-foreground/60">following</dd>
            </div>
          </dl>
        </div>
      </header>

      {repos.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/50">
            Repositorios destacados
          </h2>
          <ul className="grid gap-3 @lg:grid-cols-2 grid-cols-1">
            {repos.map((repo) => (
              <li key={repo.id} className="shadow-xs">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-full flex-col gap-2 rounded-md bg-amber-100/40 p-3 transition-colors hover:bg-amber-100/70"
                >
                  <span className="font-medium flex gap-1 items-center">
                    <BookMarked className="size-4" />
                    {repo.name}
                  </span>
                  {repo.description && (
                    <span className="line-clamp-2 text-sm text-foreground/70">
                      {repo.description}
                    </span>
                  )}

                  {repo.languages.length > 0 && (
                    <ul className="flex flex-wrap gap-3">
                      {repo.languages.map((lang) => (
                        <li
                          key={lang}
                          className="rounded-full py-0.5 text-xs text-foreground/70 flex items-center gap-1"
                        >
                          <div
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor:
                                LANGUAGE_COLORS[lang] ??
                                FALLBACK_LANGUAGE_COLOR,
                            }}
                          />
                          {lang}
                        </li>
                      ))}
                    </ul>
                  )}

                  <span className="mt-auto flex items-center gap-3 text-xs text-foreground/60">
                    <span className="flex items-center gap-1">
                      <Star className="size-3" /> {repo.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="size-3" /> {repo.forks}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
