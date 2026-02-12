import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { BountyCompletion, DAILY_POINTS_CAP, Redemption, Task } from "../types";
import { getLocalISODate } from "../utils/date";
import { calcBalance, calcEarnedForDate } from "../utils/points";
import { ensureDefaults, loadBountyCompletions, loadCompletions, loadRedemptions, loadTasks } from "../utils/storage";

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState(loadCompletions());
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [bountyCompletions, setBountyCompletions] = useState<BountyCompletion[]>([]);

  useEffect(() => {
    ensureDefaults();
    setTasks(loadTasks());
    setCompletions(loadCompletions());
    setRedemptions(loadRedemptions());
    setBountyCompletions(loadBountyCompletions());
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!e.key) return;
      setTasks(loadTasks());
      setCompletions(loadCompletions());
      setRedemptions(loadRedemptions());
      setBountyCompletions(loadBountyCompletions());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const today = getLocalISODate();
  const todayEarned = useMemo(
    () => calcEarnedForDate(today, tasks, completions),
    [today, tasks, completions]
  );
  const balance = useMemo(
    () => calcBalance(tasks, completions, bountyCompletions, redemptions),
    [tasks, completions, bountyCompletions, redemptions]
  );
  const progressPct = Math.round((todayEarned / DAILY_POINTS_CAP) * 100);

  return (
    <div className="appShell">
      <header className="topBar">
        <div className="brand">
          <div className="logo">⏳</div>
          <div>
            <div className="brandTitle">Time Manager</div>
            <div className="brandSub">日常任务/悬赏 → 积分（每日上限 {DAILY_POINTS_CAP}）→ 商店兑换</div>
          </div>
        </div>

        <div className="stats">
          <div className="statCard">
            <div className="statLabel">今日积分</div>
            <div className="statValue">
              {todayEarned} / {DAILY_POINTS_CAP}
            </div>
            <div className="progress">
              <div className="progressBar" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <div className="statCard">
            <div className="statLabel">当前余额</div>
            <div className="statValue">{balance}</div>
            <div className="statHint">= 历史获得 - 历史兑换</div>
          </div>
        </div>
      </header>

      <nav className="nav">
        <NavLink to="/tasks" className={({ isActive }) => (isActive ? "navItem active" : "navItem")}>
          ✅ 日常
        </NavLink>
        <NavLink to="/bounties" className={({ isActive }) => (isActive ? "navItem active" : "navItem")}>
          🏹 悬赏
        </NavLink>
        <NavLink to="/shop" className={({ isActive }) => (isActive ? "navItem active" : "navItem")}>
          🛒 商店
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => (isActive ? "navItem active" : "navItem")}>
          📜 记录
        </NavLink>
      </nav>

      <main className="content">{children}</main>

      <footer className="footer">
        <span>本地版：数据保存在浏览器 LocalStorage。建议定期在“记录”页导出备份。</span>
      </footer>
    </div>
  );
}
