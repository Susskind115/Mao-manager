import { BountyCompletion, BountyTask, CompletionByDate, LevelTier, Redemption, Reward, Task } from "../types";

const KEY_TASKS = "tm_tasks_v1";
const KEY_REWARDS = "tm_rewards_v1";
const KEY_COMPLETIONS = "tm_completions_v1";
const KEY_REDEMPTIONS = "tm_redemptions_v1";
const KEY_BOUNTIES = "tm_bounties_v1";
const KEY_BOUNTY_COMPLETIONS = "tm_bounty_completions_v1";
const KEY_LEVELS = "tm_levels_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadTasks(): Task[] {
  return safeParse<Task[]>(localStorage.getItem(KEY_TASKS), []);
}
export function saveTasks(tasks: Task[]) {
  localStorage.setItem(KEY_TASKS, JSON.stringify(tasks));
}

export function loadRewards(): Reward[] {
  return safeParse<Reward[]>(localStorage.getItem(KEY_REWARDS), []);
}
export function saveRewards(rewards: Reward[]) {
  localStorage.setItem(KEY_REWARDS, JSON.stringify(rewards));
}

export function loadCompletions(): CompletionByDate {
  return safeParse<CompletionByDate>(localStorage.getItem(KEY_COMPLETIONS), {});
}
export function saveCompletions(map: CompletionByDate) {
  localStorage.setItem(KEY_COMPLETIONS, JSON.stringify(map));
}

export function loadRedemptions(): Redemption[] {
  return safeParse<Redemption[]>(localStorage.getItem(KEY_REDEMPTIONS), []);
}
export function saveRedemptions(items: Redemption[]) {
  localStorage.setItem(KEY_REDEMPTIONS, JSON.stringify(items));
}

export function loadBounties(): BountyTask[] {
  return safeParse<BountyTask[]>(localStorage.getItem(KEY_BOUNTIES), []);
}
export function saveBounties(items: BountyTask[]) {
  localStorage.setItem(KEY_BOUNTIES, JSON.stringify(items));
}

export function loadBountyCompletions(): BountyCompletion[] {
  return safeParse<BountyCompletion[]>(localStorage.getItem(KEY_BOUNTY_COMPLETIONS), []);
}
export function saveBountyCompletions(items: BountyCompletion[]) {
  localStorage.setItem(KEY_BOUNTY_COMPLETIONS, JSON.stringify(items));
}

export function loadLevels(): LevelTier[] {
  return safeParse<LevelTier[]>(localStorage.getItem(KEY_LEVELS), []);
}
export function saveLevels(items: LevelTier[]) {
  localStorage.setItem(KEY_LEVELS, JSON.stringify(items));
}

/**
 * One-time bootstrap defaults for first run.
 */
export function ensureDefaults() {
  const tasks = loadTasks();
  const rewards = loadRewards();
  const levels = loadLevels();

  if (tasks.length === 0) {
    const defaultTasks: Task[] = [
      { id: "t_read", title: "阅读 30 分钟", points: 20, active: true },
      { id: "t_workout", title: "运动 20 分钟", points: 25, active: true },
      { id: "t_deepwork", title: "深度工作 60 分钟", points: 40, active: true },
      { id: "t_plan", title: "写下今天的 3 个优先事项", points: 15, active: true },
      { id: "t_sleep", title: "23:30 前上床", points: 50, active: true }
    ];
    saveTasks(defaultTasks);
  }

  if (rewards.length === 0) {
    const defaultRewards: Reward[] = [
      { id: "r_coffee", name: "一杯咖啡/奶茶", cost: 80, description: "给自己一个小奖励", active: true },
      { id: "r_game", name: "游戏/追剧 60 分钟", cost: 120, description: "注意别超时", active: true },
      { id: "r_outing", name: "周末小出行", cost: 300, description: "攒分兑换更大的奖励", active: true }
    ];
    saveRewards(defaultRewards);
  }

  // Default levels (user can edit later)
  if (levels.length === 0) {
    const defaultLevels: LevelTier[] = [
      { id: "lv_bronze", name: "青铜", span: 500, segments: 5 },
      { id: "lv_silver", name: "白银", span: 1000, segments: 5 },
      { id: "lv_gold", name: "黄金", span: 2000, segments: 5 },
      { id: "lv_platinum", name: "铂金", span: 4000, segments: 4 }
    ];
    saveLevels(defaultLevels);
  }
}
