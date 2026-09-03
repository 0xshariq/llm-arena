import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { database } from "@/infrastructure/database";

export default async function ProfilePage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/");

  const user = await database().user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) redirect("/");
  const [turns, voteCount, responses] = await Promise.all([
    database().turn.findMany({
      where: { thread: { userId: user.id } },
      select: { category: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    database().vote.count({ where: { userId: user.id } }),
    database().modelResponse.findMany({
      where: { turn: { thread: { userId: user.id } } },
      select: { costUsd: true, status: true },
    }),
  ]);
  const completed = responses.filter((response) => response.status === "COMPLETE").length;
  const cost = responses.reduce((sum, response) => sum + Number(response.costUsd), 0);
  const categories = Object.entries(
    turns.reduce<Record<string, number>>((counts, turn) => {
      counts[turn.category] = (counts[turn.category] ?? 0) + 1;
      return counts;
    }, {}),
  ).sort(([, a], [, b]) => b - a);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-eyebrow">Your arena</p>
        <h1 className="font-display text-3xl tracking-tight">Profile & insights</h1>
        <p className="text-muted-foreground max-w-xl leading-relaxed">
          A private view of your prompts, voting habits, and the quality signals behind
          each comparison.
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-4" aria-label="Usage summary">
        {[
          ["Prompts", turns.length],
          ["Votes", voteCount],
          ["Answers", completed],
          ["Measured cost", `$${cost.toFixed(2)}`],
        ].map(([label, value]) => (
          <article
            key={String(label)}
            className="border-border flex flex-col gap-2 rounded-xl border p-4"
          >
            <span className="text-muted-foreground text-xs">{label}</span>
            <strong className="font-mono text-xl">{value}</strong>
          </article>
        ))}
      </section>
      <section className="border-border flex flex-col gap-4 rounded-xl border p-5">
        <h2 className="font-medium">Prompt categories</h2>
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Run a comparison to start building your profile.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {categories.map(([category, count]) => (
              <li key={category} className="flex items-center justify-between text-sm">
                <span>{category}</span>
                <span className="text-muted-foreground font-mono">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
