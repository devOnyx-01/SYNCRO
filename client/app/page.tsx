/**
 * Home page — server component.
 *
 * Responsibilities (server only):
 *   - Auth guard: unauthenticated users receive empty initial data; the client
 *     layer (AppClient / useAuth) handles the redirect to /auth/login.
 *   - Initial data fetch: subscriptions, email accounts, and payments are
 *     fetched server-side so the first paint is hydrated.
 *   - No UI logic, no state, no event handlers.
 *
 * All orchestration (view switching, modals, bulk actions, undo/redo, etc.)
 * lives in AppClient → AppContent (client/components/app/app-client.tsx).
 */

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppClient } from "@/components/app/app-client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { ConsolidationSuggestion } from "@/lib/types";
import type { Subscription as DBSubscription } from "@/lib/supabase/subscriptions";

const FLAGGABLE_CATEGORIES = ["ai_tools", "entertainment", "productivity", "design", "music"];

const BUNDLE_SUGGESTIONS: Record<string, string> = {
  ai_tools: "one AI subscription",
  entertainment: "a streaming bundle",
  productivity: "a single productivity suite",
  design: "one design tool",
  music: "one music service",
};

function buildConsolidationSuggestions(
  subscriptions: DBSubscription[]
): ConsolidationSuggestion[] {
  const byCategory: Record<string, DBSubscription[]> = {};

  for (const sub of subscriptions) {
    const category = sub.category;
    if (!category || !FLAGGABLE_CATEGORIES.includes(category)) continue;
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(sub);
  }

  return Object.entries(byCategory)
    .filter(([, group]) => group.length >= 2)
    .map(([category, group]) => {
      const monthlyCost = group.reduce((sum, s) => sum + s.price, 0);
      const cheapest = Math.min(...group.map((s) => s.price));
      const savings = (monthlyCost - cheapest).toFixed(2);

      return {
        id: `consolidation_${category}`,
        category: category.replace("_", " "),
        services: group.map((s) => s.name),
        suggestedBundle: BUNDLE_SUGGESTIONS[category] ?? "a single plan",
        savings: `$${savings}`,
      };
    });
}

async function getInitialData() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Not authenticated — return empty data; AppClient handles auth redirect.
      return {
        subscriptions: [],
        emailAccounts: [],
        payments: [],
        priceChanges: [],
        consolidationSuggestions: [] as ConsolidationSuggestion[],
      };
    }

    const [subscriptionsResult, emailAccountsResult, paymentsResult] =
      await Promise.all([
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("date_added", { ascending: false }),
        supabase
          .from("email_accounts")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

    const subscriptions = (subscriptionsResult.data ?? []) as DBSubscription[];

    return {
      subscriptions,
      emailAccounts: emailAccountsResult.data ?? [],
      payments: paymentsResult.data ?? [],
      // Price changes are still loaded separately.
      priceChanges: [],
      consolidationSuggestions: buildConsolidationSuggestions(subscriptions),
    };
  } catch (error) {
    console.error("Error fetching initial data:", error);
    return {
      subscriptions: [],
      emailAccounts: [],
      payments: [],
      priceChanges: [],
      consolidationSuggestions: [] as ConsolidationSuggestion[],
    };
  }
}

export default async function HomePage() {
  const initialData = await getInitialData();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9F6F2] dark:bg-[#1E2A35] flex items-center justify-center">
          <LoadingSpinner size="lg" darkMode={false} />
        </div>
      }
    >
      <AppClient
        initialSubscriptions={initialData.subscriptions}
        initialEmailAccounts={initialData.emailAccounts}
        initialPayments={initialData.payments}
        initialPriceChanges={initialData.priceChanges}
        initialConsolidationSuggestions={initialData.consolidationSuggestions}
      />
    </Suspense>
  );
}
