import React, { useEffect, useMemo, useState } from "react";
import { DAILY_POINTS_CAP, Task } from "../types";
import { getLocalISODate } from "../utils/date";
import { uid } from "../utils/id";
import { calcEarnedForDate } from "../utils/points";
import { loadCompletions, loadTasks, saveCompletions, saveTasks } from "../utils/storage";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState(loadCompletions());
  const today = getLocalISODate();

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  const completedSet = useMemo(() => new Set(completions[today] ?? []), [completions, today]);
  const todayEarned = useMemo(() => calcEarnedForDate(today, tasks, completions), [today, tasks, completions]);

  function toggleComplete(taskId: string) {
    const current = new Set(completions[today] ?? []);
    if (current.has(taskId)) current.delete(taskId);
    else current.add(taskId);

    const next = { ...completions, [today]: Array.from(current) };
    setCompletions(next);
    saveCompletions(next);
  }

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    const pointsStr = (form.elements.namedItem("points") as HTMLInputElement).value.trim();
    const points = Number(pointsStr);

    if (!title) return;
    if (!Number.isFinite(points) || points <= 0) return;

    const t: Task = { id: uid("t"), title, points: Math.floor(points), active: true };
    const next = [t, ...tasks];
    setTasks(next);
    saveTasks(next);
    form.reset();
  }

  function deleteTask(taskId: string) {
    const ok = confirm("确定删除这个已停用的任务吗？删除后将不再显示（历史积分会保留）。");
    if (!ok) return;
    const next = tasks.map(t => (t.id === taskId ? { ...t, deleted: true } : t));
    setTasks(next);
    saveTasks(next);
  }

  function toggleActive(taskId: string) {
    const next = tasks.map(t => (t.id === taskId ? { ...t, active: !t.active } : t));
    setTasks(next);
    saveTasks(next);
  }

  const activeTasks = tasks.filter(t => t.active && !t.deleted);
  const inactiveTasks = tasks.filter(t => !t.active && !t.deleted);

  return (
    <div className="page">
      <h1>日常任务（{today}）</h1>

      <div className="callout">
        <div>
          <b>规则：</b>完成任务获得积分；当日积分最多 <b>{DAILY_POINTS_CAP}</b>。
        </div>
        <div className="muted" style={{ marginTop: 6 }}>
          提示：如果任务积分总和超过 150，会自动按“总和封顶”计算。
        </div>
      </div>

      <section className="card">
        <h2>进行中</h2>
        {activeTasks.length === 0 ? (
          <div className="muted">暂无任务。先在下面添加一个任务吧。</div>
        ) : (
          <ul className="list">
            {activeTasks.map(t => (
              <li key={t.id} className="listRow">
                <label className="checkboxRow">
                  <input
                    type="checkbox"
                    checked={completedSet.has(t.id)}
                    onChange={() => toggleComplete(t.id)}
                  />
                  <span className="taskTitle">{t.title}</span>
                </label>
                <div className="right">
                  <span className="pill">+{t.points}</span>
                  <button className="ghost" onClick={() => toggleActive(t.id)} title="暂时停用">
                    停用
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="divider" />

        <div className="row">
          <div>
            <div className="muted">今日已获得</div>
            <div className="big">
              {todayEarned} / {DAILY_POINTS_CAP}
            </div>
          </div>
          <div className="muted">你可以在“商店”页用积分兑换奖励。</div>
        </div>
      </section>

      <section className="card">
        <h2>添加新任务</h2>
        <form className="form" onSubmit={addTask}>
          <label>
            任务名称
            <input name="title" placeholder="例如：英语学习 20 分钟" />
          </label>
          <label>
            积分
            <input name="points" type="number" min="1" max="150" placeholder="例如：20" />
          </label>
          <button type="submit">添加</button>
        </form>
        <div className="muted">建议：日常任务用于习惯养成；把“里程碑”放到悬赏任务里更合适。</div>
      </section>

      {inactiveTasks.length > 0 && (
        <section className="card">
          <h2>已停用</h2>
          <ul className="list">
            {inactiveTasks.map(t => (
              <li key={t.id} className="listRow">
                <span className="taskTitle">{t.title}</span>
                <div className="right">
                  <span className="pill muted">+{t.points}</span>
                  <button className="ghost" onClick={() => toggleActive(t.id)}>
                    启用
                  </button>
                  <button className="danger" onClick={() => deleteTask(t.id)}>
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
