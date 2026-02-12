import React, { useEffect, useMemo, useState } from "react";
import { BountyCompletion, LevelTier, Redemption, Task } from "../types";
import { calcEarnedForDate, calcTotalBountyEarned, calcTotalEarnedAll, calcTotalEarnedDaily, calcTotalSpent } from "../utils/points";
import { loadBountyCompletions, loadCompletions, loadLevels, loadRedemptions, loadTasks, saveLevels } from "../utils/storage";
import { downloadBackup, importBackupFromFile } from "../utils/backup";
import { computeLevelStatus } from "../utils/levels";

export default function HistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState(loadCompletions());
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [bountyCompletions, setBountyCompletions] = useState<BountyCompletion[]>([]);
  const [levels, setLevels] = useState<LevelTier[]>([]);

  useEffect(() => {
    setTasks(loadTasks());
    setCompletions(loadCompletions());
    setRedemptions(loadRedemptions());
    setBountyCompletions(loadBountyCompletions());
    setLevels(loadLevels());
  }, []);

  const dates = useMemo(() => Object.keys(completions).sort((a, b) => (a > b ? -1 : 1)), [completions]);
  const totalDailyEarned = useMemo(() => calcTotalEarnedDaily(tasks, completions), [tasks, completions]);
  const totalBountyEarned = useMemo(() => calcTotalBountyEarned(bountyCompletions), [bountyCompletions]);
  const totalEarned = useMemo(() => calcTotalEarnedAll(tasks, completions, bountyCompletions), [tasks, completions, bountyCompletions]);
    const totalSpent = useMemo(() => calcTotalSpent(redemptions), [redemptions]);

  const levelStatus = useMemo(() => computeLevelStatus(totalEarned, levels), [totalEarned, levels]);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<string>("");

  function onExport() {
    downloadBackup();
  }

  async function onImport() {
    if (!importFile) return;

    const ok = confirm("导入会覆盖当前浏览器中的本地数据（任务/奖励/悬赏/完成记录/兑换记录/等级配置）。确定继续吗？");
    if (!ok) return;

    try {
      setImportStatus("正在导入…");
      const meta = await importBackupFromFile(importFile);
      setImportStatus(`导入成功（备份时间：${new Date(meta.exportedAt).toLocaleString()}）。页面即将刷新…`);
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setImportStatus(`导入失败：${msg}`);
    }
  }
function updateLevelTier(id: string, patch: Partial<LevelTier>) {
  const next = levels.map(lv => (lv.id === id ? { ...lv, ...patch } : lv));
  setLevels(next);
  saveLevels(next);
}

function addLevelTier() {
  const id = `lv_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36)}`;
  const next = [...levels, { id, name: "新等级", span: 1000, segments: 5 }];
  setLevels(next);
  saveLevels(next);
}

function deleteLevelTier(id: string) {
  const ok = confirm("确定删除这个等级吗？");
  if (!ok) return;
  const next = levels.filter(lv => lv.id !== id);
  setLevels(next);
  saveLevels(next);
}

function validateTier(lv: LevelTier): string | null {
  if (!lv.name.trim()) return "等级名不能为空";
  if (!Number.isFinite(lv.span) || lv.span <= 0) return "积分跨度必须为正数";
  if (!Number.isFinite(lv.segments) || lv.segments < 1) return "段数必须 ≥ 1";
  if (Math.floor(lv.segments) !== lv.segments) return "段数必须为整数";
  if (lv.span % lv.segments !== 0) return "建议：跨度能被段数整除（否则小等级会出现小数边界）";
  return null;
}


  return (
    <div className="page">
      <h1>历史记录</h1>

      <section className="card">
        <div className="row">
          <div>
            <div className="muted">历史总获得</div>
            <div className="big">{totalEarned}</div>
            <div className="muted">= 日常 {totalDailyEarned} + 悬赏 {totalBountyEarned}</div>
          </div>
          <div>
            <div className="muted">历史总兑换</div>
            <div className="big">{totalSpent}</div>
          </div>
          <div className="muted">
            这里用于复盘：你在哪些日子完成度更高？奖励是否设置得足够吸引你？
          </div>
        </div>
      </section>

<section className="card">
  <h2>等级（基于历史总获得积分）</h2>

  <div className="row">
    <div>
      <div className="muted">当前等级</div>
      <div className="big">{levelStatus.label}</div>
      <div className="muted">
        大等级进度：{Math.floor(levelStatus.tierProgress)} / {levelStatus.tierSpan}
        {levelStatus.subTotal > 1 ? (
          <> ｜小等级：{levelStatus.subIndex} / {levelStatus.subTotal}</>
        ) : null}
      </div>
    </div>

    <div style={{ minWidth: 280, flex: 1 }}>
      <div className="muted">进度条（当前大等级）</div>
      <div className="progress" style={{ marginTop: 8 }}>
        <div
          className="progressBar"
          style={{ width: `${Math.min(100, Math.round((levelStatus.tierProgress / levelStatus.tierSpan) * 100))}%` }}
        />
      </div>
      {levelStatus.subTotal > 1 ? (
        <div className="muted" style={{ marginTop: 8 }}>
          当前小等级进度：{Math.floor(levelStatus.subProgress)} / {Math.floor(levelStatus.subSpan)}
        </div>
      ) : null}
    </div>
  </div>

  <div className="divider" />

  <h3 className="h3">等级配置（可自定义）</h3>
  <div className="muted">
    规则：按顺序依次消耗每个大等级的“跨度”；每个大等级可拆分为若干小等级，小跨度 = 大跨度 / 段数。
  </div>

  <div className="divider" />

  {levels.length === 0 ? (
    <div className="muted">尚未设置等级。点击“添加等级”。</div>
  ) : (
    <div className="tableWrap">
      <table className="table">
        <thead>
          <tr>
            <th>顺序</th>
            <th>大等级名称</th>
            <th>跨度（积分）</th>
            <th>段数（小等级数）</th>
            <th>提示</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {levels.map((lv, i) => {
            const warn = validateTier(lv);
            return (
              <tr key={lv.id}>
                <td>{i + 1}</td>
                <td>
                  <input
                    className="miniInput"
                    value={lv.name}
                    onChange={(e) => updateLevelTier(lv.id, { name: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="miniInput"
                    type="number"
                    min="1"
                    value={lv.span}
                    onChange={(e) => updateLevelTier(lv.id, { span: Math.floor(Number(e.target.value)) })}
                  />
                </td>
                <td>
                  <input
                    className="miniInput"
                    type="number"
                    min="1"
                    value={lv.segments}
                    onChange={(e) => updateLevelTier(lv.id, { segments: Math.floor(Number(e.target.value)) })}
                  />
                </td>
                <td className="muted">{warn ?? ""}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="danger" onClick={() => deleteLevelTier(lv.id)}>删除</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}

  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
    <button onClick={addLevelTier}>添加等级</button>
  </div>
</section>

      <section className="card">
        <h2>按天统计</h2>
        {dates.length === 0 ? (
          <div className="muted">还没有完成记录。去“任务”页勾选一下吧。</div>
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>获得积分</th>
                  <th>完成任务数</th>
                </tr>
              </thead>
              <tbody>
                {dates.map(d => {
                  const earned = calcEarnedForDate(d, tasks, completions);
                  const cnt = (completions[d] ?? []).length;
                  return (
                    <tr key={d}>
                      <td>{d}</td>
                      <td>{earned}</td>
                      <td>{cnt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>


<section className="card">
  <h2>悬赏完成记录</h2>
  {bountyCompletions.length === 0 ? (
    <div className="muted">暂无悬赏完成记录。</div>
  ) : (
    <ul className="list">
      {bountyCompletions.slice(0, 50).map(bc => (
        <li key={bc.id} className="listRow">
          <span className="taskTitle">{bc.title}</span>
          <div className="right">
            <span className="pill">+{bc.points}</span>
            <span className="muted">截止 {bc.deadline}</span>
            <span className="muted">{new Date(bc.completedAt).toLocaleString()}</span>
          </div>
        </li>
      ))}
    </ul>
  )}
  {bountyCompletions.length > 50 && <div className="muted">只显示最近 50 条。</div>}
</section>

      <section className="card">
        <h2>兑换记录</h2>
        {redemptions.length === 0 ? (
          <div className="muted">暂无兑换记录。</div>
        ) : (
          <ul className="list">
            {redemptions.slice(0, 50).map(r => (
              <li key={r.id} className="listRow">
                <span className="taskTitle">{r.rewardName}</span>
                <div className="right">
                  <span className="pill">-{r.cost}</span>
                  <span className="muted">{new Date(r.dateTime).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {redemptions.length > 50 && <div className="muted">只显示最近 50 条。</div>}
      </section>

      <section className="card">
        <h2>数据备份（推荐）</h2>

        <div className="row">
          <div>
            <div className="muted">存档：导出备份（JSON）</div>
            <div className="muted">建议定期导出并保存到网盘/OneDrive/USB。</div>
          </div>
          <div>
            <button onClick={onExport}>导出备份 JSON</button>
          </div>
        </div>

        <div className="divider" />

        <div className="row">
          <div>
            <div className="muted">读档：导入备份（JSON）</div>
            <div className="muted">选择你之前导出的备份文件，然后导入恢复。</div>
            <div className="muted" style={{ marginTop: 6 }}>
              当前选择：{importFile ? importFile.name : "未选择文件"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label className="ghost" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
              选择备份文件
              <input
                type="file"
                accept=".json,application/json"
                style={{ display: "none" }}
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
            </label>

            <button onClick={onImport} disabled={!importFile}>
              导入并恢复
            </button>
          </div>
        </div>

        {importStatus && (
          <div className="callout" style={{ marginTop: 12 }}>
            {importStatus}
          </div>
        )}

        <div className="divider" />

        <div className="muted">
          说明：本地版数据保存在浏览器 LocalStorage。清理“站点数据/缓存”、使用无痕窗口、重装浏览器/系统都可能导致数据丢失。
          导入会覆盖当前浏览器本地数据（任务、奖励、悬赏、完成记录、兑换记录与等级配置）。
        </div>
      </section>
    </div>
  );
}
