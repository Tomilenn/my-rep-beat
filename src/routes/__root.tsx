import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { WorkoutProvider } from "@/context/WorkoutContext";
import { BottomNav } from "@/components/BottomNav";
import { RestTimer } from "@/components/RestTimer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no",
      },
      { title: "Calistenia" },
      {
        name: "description",
        content:
          "PWA de calistenia para registrar series, repeticiones y RPE con cronómetro de descanso y seguimiento de volumen semanal.",
      },
      { name: "theme-color", content: "#00BFFF" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "CalistenIA" },
      { property: "og:title", content: "Calistenia" },
      {
        property: "og:description",
        content:
          "Registra series, reps y RPE con cronómetro inteligente. Visualiza tu sobrecarga progresiva.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Calistenia" },
      { name: "description", content: "Apex Calisthenics is a PWA for high-performance calisthenics training and technical tracking." },
      { property: "og:description", content: "Apex Calisthenics is a PWA for high-performance calisthenics training and technical tracking." },
      { name: "twitter:description", content: "Apex Calisthenics is a PWA for high-performance calisthenics training and technical tracking." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3924e8f1-e2fd-41d2-a69c-69ef829c99d9/id-preview-84a74a07--df7dc987-7c4c-4e10-85ee-fbce8ecee364.lovable.app-1777577823950.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3924e8f1-e2fd-41d2-a69c-69ef829c99d9/id-preview-84a74a07--df7dc987-7c4c-4e10-85ee-fbce8ecee364.lovable.app-1777577823950.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const isClient = typeof window !== "undefined";

  return (
    <>
      {isClient ? (
        <WorkoutProvider>
          <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-32">
            <Outlet />
            <RestTimer />
            <BottomNav />
          </div>
        </WorkoutProvider>
      ) : (
        <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-32">
          <Outlet />
        </div>
      )}
    </>
  );
}
