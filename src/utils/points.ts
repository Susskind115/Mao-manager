import { BountyCompletion, CompletionByDate, DAILY_POINTS_CAP, Redemption, Task } from "../types";

/**
 * Daily task earned points for a date (with cap).
 * Note: We count based on the task list regardless of active/deleted,
 * so history won't change if you later down-shelf or delete the task.
 */
export function calcEarnedForDate(date: string, tasks: Task[], completions: CompletionByDate): number {
  const completedIds = new Set(completions[date] ?? []);
  let sum = 0;
  for (const t of tasks) {
    if (completedIds.has(t.id)) sum += t.points;
  }
  return Math.min(DAILY_POINTS_CAP, sum);
}

export function calcTotalEarnedDaily(tasks: Task[], completions: CompletionByDate): number {
  const dates = Object.keys(completions);
  let total = 0;
  for (const d of dates) total += calcEarnedForDate(d, tasks, completions);
  return total;
}

export function calcTotalBountyEarned(items: BountyCompletion[]): number {
  return items.reduce((acc, x) => acc + x.points, 0);
}

export function calcTotalEarnedAll(tasks: Task[], completions: CompletionByDate, bountyCompletions: BountyCompletion[]): number {
  return calcTotalEarnedDaily(tasks, completions) + calcTotalBountyEarned(bountyCompletions);
}

export function calcTotalSpent(redemptions: Redemption[]): number {
  return redemptions.reduce((acc, r) => acc + r.cost, 0);
}

/**
 * Balance = total earned (daily + bounty) - total spent.
 */
export function calcBalance(
  tasks: Task[],
  completions: CompletionByDate,
  bountyCompletions: BountyCompletion[],
  redemptions: Redemption[]
): number {
  return calcTotalEarnedAll(tasks, completions, bountyCompletions) - calcTotalSpent(redemptions);
}
