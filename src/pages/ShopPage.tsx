import React, { useEffect, useMemo, useState } from "react";
import { BountyCompletion, Redemption, Reward, Task } from "../types";
import { uid } from "../utils/id";
import { calcBalance } from "../utils/points";
import { loadBountyCompletions, loadCompletions, loadRedemptions, loadRewards, loadTasks, saveRedemptions, saveRewards } from "../utils/storage";

export default function ShopPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [completions, setCompletions] = useState(loadCompletions());
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [bountyCompletions, setBountyCompletions] = useState<BountyCompletion[]>([]);

  useEffect(() => {
    setTasks(loadTasks());
    setRewards(loadRewards());
    setCompletions(loadCompletions());
    setRedemptions(loadRedemptions());
    setBountyCompletions(loadBountyCompletions());
  }, []);

  const balance = useMemo(
    () => calcBalance(tasks, completions, bountyCompletions, redemptions),
    [tasks, completions, bountyCompletions, redemptions]
  );

  function addReward(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const costStr = (form.elements.namedItem("cost") as HTMLInputElement).value.trim();
    const description = (form.elements.namedItem("description") as HTMLInputElement).value.trim();
    const cost = Number(costStr);

    if (!name) return;
    if (!Number.isFinite(cost) || cost <= 0) return;

    const r: Reward = { id: uid("r"), name, cost: Math.floor(cost), description: description || undefined, active: true };
    const next = [r, ...rewards];
    setRewards(next);
    saveRewards(next);
    form.reset();
  }

function deleteReward(rewardId: string) {
  const ok = confirm("确定删除这个已下架的奖励吗？删除后将不再显示（历史兑换记录不受影响）。");
  if (!ok) return;
  const next = rewards.map(r => (r.id === rewardId ? { ...r, deleted: true } : r));
  setRewards(next);
  saveRewards(next);
}

  function toggleActive(rewardId: string) {
    const next = rewards.map(r => (r.id === rewardId ? { ...r, active: !r.active } : r));
    setRewards(next);
    saveRewards(next);
  }

  function redeem(reward: Reward) {
    const cost = reward.cost;
    if (balance < cost) {
      alert(`积分不足：当前余额 ${balance}，需要 ${cost}`);
      return;
    }

    const item: Redemption = {
      id: uid("x"),
      dateTime: new Date().toISOString(),
      rewardId: reward.id,
      rewardName: reward.name,
      cost
    };

    const next = [item, ...redemptions];
    setRedemptions(next);
    saveRedemptions(next);
  }

  const activeRewards = rewards.filter(r => r.active && !r.deleted);
  const inactiveRewards = rewards.filter(r => !r.active && !r.deleted);

  return (
    <div className="page">
      <h1>商店兑换</h1>

      <section className="card">
        <div className="row">
          <div>
            <div className="muted">当前可用积分</div>
            <div className="big">{balance}</div>
          </div>
          <div className="muted">
            兑换建议：把“奖励”设计成你真正喜欢且可兑现的小事（咖啡、游戏时间、买小物件等）。
          </div>
        </div>
      </section>

      <section className="card">
        <h2>可兑换奖励</h2>
        {activeRewards.length === 0 ? (
          <div className="muted">暂无奖励。先在下面添加一个吧。</div>
        ) : (
          <ul className="grid">
            {activeRewards.map(r => (
              <li key={r.id} className="rewardCard">
                <div className="rewardTop">
                  <div className="rewardName">{r.name}</div>
                  <div className="pill">-{r.cost}</div>
                </div>
                {r.description && <div className="muted">{r.description}</div>}
                <div className="rewardActions">
                  <button onClick={() => redeem(r)} disabled={balance < r.cost}>
                    {balance < r.cost ? "积分不足" : "兑换"}
                  </button>
                  <button className="ghost" onClick={() => toggleActive(r.id)} title="暂时下架">
                    下架
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>添加奖励</h2>
        <form className="form" onSubmit={addReward}>
          <label>
            奖励名称
            <input name="name" placeholder="例如：看一集剧 / 买一本书" />
          </label>
          <label>
            价格（积分）
            <input name="cost" type="number" min="1" placeholder="例如：120" />
          </label>
          <label>
            备注（可选）
            <input name="description" placeholder="例如：仅限周末使用" />
          </label>
          <button type="submit">添加</button>
        </form>
      </section>

      {inactiveRewards.length > 0 && (
        <section className="card">
          <h2>已下架</h2>
          <ul className="list">
            {inactiveRewards.map(r => (
              <li key={r.id} className="listRow">
                <span className="taskTitle">{r.name}</span>
                <div className="right">
                  <span className="pill muted">-{r.cost}</span>
                  <button className="ghost" onClick={() => toggleActive(r.id)}>上架</button>
                  <button className="danger" onClick={() => deleteReward(r.id)}>删除</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
