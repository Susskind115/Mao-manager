import { LevelTier } from "../types";

export type LevelStatus = {
  totalPoints: number;
  tierIndex: number; // 0-based
  tierName: string;
  subIndex: number; // 1..segments
  subTotal: number; // segments
  tierSpan: number;
  tierProgress: number; // 0..tierSpan
  subSpan: number;
  subProgress: number; // 0..subSpan
  label: string; // e.g. 青铜 II
};

function roman(n: number): string {
  const map: Array<[number, string]> = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];
  let x = n;
  let out = "";
  for (const [v, s] of map) {
    while (x >= v) { out += s; x -= v; }
  }
  return out || "I";
}

/**
 * Compute current level from total historical points.
 * - tiers are sequential; each tier consumes `span` points.
 * - each tier can be split into `segments` sub-levels, each sub span = span/segments
 * - For clarity, we recommend `span % segments === 0`.
 */
export function computeLevelStatus(totalPoints: number, tiers: LevelTier[]): LevelStatus {
  const safeTiers = (tiers ?? []).filter(t => Number.isFinite(t.span) && t.span > 0 && Number.isFinite(t.segments) && t.segments >= 1);

  if (safeTiers.length === 0) {
    return {
      totalPoints,
      tierIndex: 0,
      tierName: "未设置等级",
      subIndex: 1,
      subTotal: 1,
      tierSpan: 1,
      tierProgress: 0,
      subSpan: 1,
      subProgress: 0,
      label: "未设置等级"
    };
  }

  let rem = Math.max(0, Math.floor(totalPoints));
  let idx = 0;

  while (idx < safeTiers.length - 1 && rem >= safeTiers[idx].span) {
    rem -= safeTiers[idx].span;
    idx += 1;
  }

  const tier = safeTiers[idx];
  const segments = Math.max(1, Math.floor(tier.segments));
  const subSpan = tier.span / segments;

  // 1..segments
  let subIndex = Math.floor(rem / subSpan) + 1;
  if (subIndex < 1) subIndex = 1;
  if (subIndex > segments) subIndex = segments;

  const subStart = (subIndex - 1) * subSpan;
  const subProgress = rem - subStart;

  const label = segments > 1 ? `${tier.name} ${roman(subIndex)}` : `${tier.name}`;

  return {
    totalPoints: Math.floor(totalPoints),
    tierIndex: idx,
    tierName: tier.name,
    subIndex,
    subTotal: segments,
    tierSpan: tier.span,
    tierProgress: rem,
    subSpan,
    subProgress,
    label
  };
}
