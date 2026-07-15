import { createFileRoute } from "@tanstack/react-router";

const CHECKOUT_URL = "https://checkout.vendepay.com/12ae4dae-df3d-4db0-b597-a00a77c1b6b8";

type CheckoutSearch = Record<string, string | string[] | undefined>;

export const Route = createFileRoute("/checkout")({
  validateSearch: (search) => search as CheckoutSearch,
  head: () => ({
    meta: [
      { title: "Secure Checkout | Task Partners" },
      {
        name: "description",
        content: "Complete your Task Partners order through our secure payment checkout.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const search = Route.useSearch();
  const target = new URL(CHECKOUT_URL);

  Object.entries(search).forEach(([key, rawValue]) => {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    values.forEach((value) => {
      if (value) target.searchParams.append(key, value);
    });
  });

  const checkoutUrl = target.toString();

  return (
    <iframe
      allow="payment"
      className="fixed inset-0 block h-dvh w-screen border-0 bg-white"
      loading="eager"
      referrerPolicy="strict-origin-when-cross-origin"
      src={checkoutUrl}
      title="Secure checkout"
    />
  );
}
