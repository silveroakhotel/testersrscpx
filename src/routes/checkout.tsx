import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

const CHECKOUT_URL = "https://www.checkout-ds24.com/product/716458?aff=hutlike26804&cam=CAMPAIGNKEY";

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

  useEffect(() => {
    const target = new URL(CHECKOUT_URL);
    Object.entries(search).forEach(([key, rawValue]) => {
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      values.forEach((value) => {
        if (value) target.searchParams.append(key, value);
      });
    });
    window.location.replace(target.toString());
  }, [search]);

  return <main className="fixed inset-0 bg-white" />;
}
