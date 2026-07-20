import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { RoutedDesktop, WindowRouteProvider } from "@dayos/next";
import { CV } from "@/components/cv";
import { Documents } from "@/components/documents";
import { Github } from "@/components/github";
import { Home } from "@/components/home";
import { Linkedin } from "@/components/linkedin";
import { DESKTOP_ROUTES } from "@/lib/routes";

const manropeSans = Manrope({
  variable: "--font-manrope-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jared Muñoz | Portfolio",
  description: "Jared Muñoz, Design Engineer and DX, Fullstack Developer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manropeSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <WindowRouteProvider content={children} routes={DESKTOP_ROUTES}>
          {/*
            El tamaño del escritorio es de la app: dayos solo garantiza que las
            ventanas se posicionen y se recorten contra él.

            La regla de los iframes sí es funcional. Mientras se arrastra o se
            redimensiona una ventana, un iframe se come el `mousemove` y el
            `mouseup` que el arrastre escucha en el `document`, y la ventana
            queda enganchada al cursor. dayos marca la interacción con
            `data-interacting` porque una regla sobre descendientes no entra en
            un `style` inline; neutralizarlos es responsabilidad de acá.
          */}
          <RoutedDesktop className="grid h-dvh max-h-dvh w-full grid-cols-2 grid-rows-2 bg-background p-4 text-foreground [&[data-interacting]_iframe]:pointer-events-none">
            <div className="grid grid-cols-2 w-fit h-fit gap-4">
              <Home title="about-me.txt" />
              <CV />
              <Github />
              <Linkedin />
            </div>
            <div></div>
            <div></div>
            <div className="ml-auto mt-auto">
              <Documents />
            </div>
          </RoutedDesktop>
        </WindowRouteProvider>
      </body>
    </html>
  );
}
