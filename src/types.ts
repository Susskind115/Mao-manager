export type Task = {
  id: string;
  title: string;
  points: number; // points for completing this task
  active: boolean;
  deleted?: boolean; // hidden from UI lists when true
};

export type Reward = {
  id: string;
  name: string;
  cost: number; // points cost
  description?: string;
  active: boolean;
  deleted?: boolean; // hidden from UI lists when true
};

export type CompletionByDate = Record<string, string[]>; // YYYY-MM-DD -> array of completed task ids

export type Redemption = {
  id: string;
  dateTime: string; // ISO string
  rewardId: string;
  rewardName: string;
  cost: number;
};

/**
 * Bounty tasks (one-time, points uncapped, has deadline).
 */
export type BountyTask = {
  id: string;
  title: string;
  points: number; // uncapped points
  deadline: string; // YYYY-MM-DD
  active: boolean;
  deleted?: boolean;
  completedAt?: string; // ISO, set when completed
};

/**
 * Immutable bounty completion record (to preserve history even if bounty task is deleted).
 */
export type BountyCompletion = {
  id: string;
  bountyId: string;
  title: string;
  points: number;
  deadline: string;
  completedAt: string; // ISO
};

export type LevelTier = {
  id: string;
  name: string; // big level name
  span: number; // points required for this big level
  segments: number; // number of sub-levels (>=1). sub span = span / segments
};

export const DAILY_POINTS_CAP = 150;
