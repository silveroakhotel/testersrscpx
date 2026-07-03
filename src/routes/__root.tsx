import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
      { name: "theme-color", content: "#ff0050" },
      { title: "TikTok Rewards" },
      { name: "description", content: "Claim your TikTok reward and get paid instantly via Cash App, PayPal, Venmo, Zelle, or bank transfer." },
      { name: "author", content: "TikTok Rewards" },
      { property: "og:title", content: "TikTok Rewards" },
      { property: "og:description", content: "Claim your TikTok reward and get paid instantly via Cash App, PayPal, Venmo, Zelle, or bank transfer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TikTok Rewards" },
      { name: "twitter:description", content: "Claim your TikTok reward and get paid instantly via Cash App, PayPal, Venmo, Zelle, or bank transfer." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/50f61344-3ad8-4d2a-af27-67e4acf82467/id-preview-0d81ab1f--218b5110-e9e7-4f0e-8e0a-6b9b4e3bde16.lovable.app-1782166830293.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/50f61344-3ad8-4d2a-af27-67e4acf82467/id-preview-0d81ab1f--218b5110-e9e7-4f0e-8e0a-6b9b4e3bde16.lovable.app-1782166830293.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "/assets/css2.css" },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "stylesheet", href: "/assets/index-B8NbOjFt.css" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en-US">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    const w = window as unknown as { __pixFetchPatched?: boolean };
    if (!w.__pixFetchPatched) {
      w.__pixFetchPatched = true;
      const origFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        try {
          const urlStr =
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.toString()
                : (input as Request).url;
          if (urlStr.includes("/functions/v1/create-pix-payment")) {
            const body =
              init?.body ?? (input instanceof Request ? await input.text() : "{}");
            return origFetch("/api/public/create-pix-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: body as BodyInit,
            });
          }
          if (urlStr.includes("/functions/v1/check-pix-status")) {
            const body =
              init?.body ?? (input instanceof Request ? await input.text() : "{}");
            return origFetch("/api/public/check-pix-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: body as BodyInit,
            });
          }
        } catch (e) {
          console.error("[pix-intercept]", e);
        }
        return origFetch(input as RequestInfo, init);
      };
    }

    if (!document.getElementById("redeem-patch-script")) {
      const patch = document.createElement("script");
      patch.id = "redeem-patch-script";
      patch.src = "/redeem-patch.js?v=5";
      document.body.appendChild(patch);
    }

    if (document.getElementById("cloned-app-script")) return;
    const script = document.createElement("script");
    script.id = "cloned-app-script";
    script.type = "module";
    script.src = "/assets/index-BhN0l3GJ.js";
    document.body.appendChild(script);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div id="cloned-root" />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
