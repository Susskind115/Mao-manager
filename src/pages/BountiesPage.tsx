import React, { useEffect, useMemo, useState } from "react";
import { BountyCompletion, BountyTask } from "../types";
import { getLocalISODate } from "../utils/date";
import { uid } from "../utils/id";
import { loadBounties, loadBountyCompletions, saveBounties, saveBountyCompletions } from "../utils/storage";

/**
 * 悬赏任务：一次性、积分无上限、带截止日期，完成后自动下架。
 * - 不受每日 150 封顶影响（计入历史总获得，用于余额/等级）
 * - 删除为“软删除”，不影响历史积分（完成记录会保留）
 */
export default function BountiesPage() {
  const [bounties, setBounties] = useState<BountyTask[]>([]);
  const [bountyCompletions, setBountyCompletions] = useState<BountyCompletion[]>([]);
  const today = getLocalISODate();

  useEffect(() => {
    setBounties(loadBounties());
    setBountyCompletions(loadBountyCompletions());
  }, []);

  const activeBounties = useMemo(() => bounties.filter(b => b.active && !b.deleted), [bounties]);
  const inactiveBounties = useMemo(() => bounties.filter(b => !b.active && !b.deleted), [bounties]);

  function addBounty(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const title = (form.elements.namedItem("b_title") as HTMLInputElement).value.trim();
    const pointsStr = (form.elements.namedItem("b_points") as HTMLInputElement).value.trim();
    const deadline = (form.elements.namedItem("b_deadline") as HTMLInputElement).value;

    const points = Number(pointsStr);
    if (!title) return;
    if (!Number.isFinite(points) || points <= 0) return;
    if (!deadline) return;

    const item: BountyTask = {
      id: uid("b"),
      title,
      points: Math.floor(points),
      deadline,
      active: true,
    };

    const next = [item, ...bounties];
    setBounties(next);
    saveBounties(next);
    form.reset();
  }

  function downShelfBounty(bountyId: string) {
    const next = bounties.map(b => (b.id === bountyId ? { ...b, active: false } : b));
    setBounties(next);
    saveBounties(next);
  }

  function upShelfBounty(bountyId: string) {
    const next = bounties.map(b => (b.id === bountyId ? { ...b, active: true } : b));
    setBounties(next);
    saveBounties(next);
  }

  function deleteBounty(bountyId: string) {
    const ok = confirm("确定删除这个已下架的悬赏任务吗？删除后将不再显示（历史积分会保留）。");
    if (!ok) return;
    const next = bounties.map(b => (b.id === bountyId ? { ...b, deleted: true } : b));
    setBounties(next);
    saveBounties(next);
  }

  function completeBounty(b: BountyTask) {
    if (!b.active) return;

    const expired = today > b.deadline;
    if (expired) {
      alert("该悬赏任务已超过截止日期，无法完成。你可以选择下架或删除。");
      return;
    }

    const ok = confirm(`确认完成悬赏任务：${b.title}\n获得积分：${b.points}\n完成后将自动下架（一次性）。`);
    if (!ok) return;

    const completedAt = new Date().toISOString();

    // 1) append completion record (immutable history snapshot)
    const record: BountyCompletion = {
      id: uid("bc"),
      bountyId: b.id,
      title: b.title,
      points: b.points,
      deadline: b.deadline,
      completedAt,
    };
    const nextComp = [record, ...bountyCompletions];
    setBountyCompletions(nextComp);
    saveBountyCompletions(nextComp);

    // 2) mark bounty inactive + completedAt
    const nextB = bounties.map(x => (x.id === b.id ? { ...x, active: false, completedAt } : x));
    setBounties(nextB);
    saveBounties(nextB);
  }

  return (
    <div className="page">
      <h1>悬赏任务（一次性）</h1>

      <div className="callout">
        <div>
          <b>定位：</b>用于一次性里程碑/高价值产出（例如：提交项目、完成简历、跑完一次马拉松训练计划）。
        </div>
        <div className="muted" style={{ marginTop: 6 }}>
          规则：积分无上限；带截止日期；完成一次后自动下架；计入历史总获得（不受每日 150 封顶影响）。
        </div>
      </div>

      <section className="card">
        <h2>进行中</h2>
        {activeBounties.length === 0 ? (
          <div className="muted">暂无悬赏任务。你可以在下面添加一个。</div>
        ) : (
          <ul className="list">
            {activeBounties.map(b => {
              const expired = today > b.deadline;
              return (
                <li key={b.id} className="listRow">
                  <div>
                    <div className="taskTitle">{b.title}</div>
                    <div className="muted">截止：{b.deadline}{expired ? "（已过期）" : ""}</div>
                  </div>

                  <div className="right">
                    <span className="pill">+{b.points}</span>
                    <button onClick={() => completeBounty(b)} disabled={expired}>
                      {expired ? "已过期" : "完成"}
                    </button>
                    <button className="ghost" onClick={() => downShelfBounty(b.id)} title="暂时下架">
                      下架
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>添加悬赏任务</h2>
        <form className="form" onSubmit={addBounty}>
          <label>
            任务名称
            <input name="b_title" placeholder="例如：完成一份简历 / 提交一个项目里程碑" />
          </label>
          <label>
            积分（无上限）
            <input name="b_points" type="number" min="1" placeholder="例如：800" />
          </label>
          <label>
            截止日期
            <input name="b_deadline" type="date" />
          </label>
          <button type="submit">添加悬赏</button>
        </form>
        <div className="muted">
          建议：把悬赏设置成“你确实愿意为之付出”的大目标；积分越高，越能形成强动力。
        </div>
      </section>

      {inactiveBounties.length > 0 && (
        <section className="card">
          <h2>已下架</h2>
          <ul className="list">
            {inactiveBounties.map(b => {
              const done = Boolean(b.completedAt);
              return (
                <li key={b.id} className="listRow">
                  <div>
                    <div className="taskTitle">
                      {b.title} {done ? <span className="tag">已完成</span> : null}
                    </div>
                    <div className="muted">
                      截止：{b.deadline}
                      {b.completedAt ? ` ｜完成：${new Date(b.completedAt).toLocaleString()}` : ""}
                    </div>
                  </div>

                  <div className="right">
                    <span className="pill muted">+{b.points}</span>
                    {!done && (
                      <button className="ghost" onClick={() => upShelfBounty(b.id)}>
                        上架
                      </button>
                    )}
                    <button className="danger" onClick={() => deleteBounty(b.id)}>
                      删除
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
