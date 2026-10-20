// Renders the board as one static HTML page. No client framework, no build step.
// 把看板渲染成一张 HTML。不依赖前端框架，不需要构建。

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const LABELS = {
  zh: {
    live: '本机 / 实时', refresh: '刷新', overview: '工作台总览',
    headline: '各司其职，协同推进。',
    intro: '经理定方向、派任务；工人施工，审查员把关，发布员统一上线。',
    mWorking: '在岗工人', mIdle: '待命工位', mQueue: '队列批次', mDone: '今日完成',
    seats: '团队席位', seatsSub: '按任务定岗位，模型是搭档',
    workers: '当前任务', workersSub: '谁在干什么、走到哪一步',
    queue: '发布队列', queueSub: '合并与上线排在前面的事',
    today: '今日记录', todaySub: '今天跑过的单',
    quiet: '分钟前更新', noActivity: '暂无活动记录', inService: '在岗', standby: '待命',
    defaultModel: '默认', emptyWorkers: '现在没有在跑的工人。', emptyQueue: '队列是空的。', emptyToday: '今天还没有别的记录。',
    stage: '阶段', task: '任务', role: '岗位', model: '模型', minutes: '分钟', noTitle: '暂无任务说明',
    minsAgo: '分钟前', hoursAgo: '小时前', daysAgo: '天前', time: '时间',
    footLeft: '只读本机状态文件', footRight: '上一页每 15 秒自动刷新', stale: '很久没动静', fresh: '最近有活动', waiting: '排队中', running: '进行中', done: '已完成',
  },
  en: {
    live: 'LOCAL / LIVE', refresh: 'Refresh', overview: 'BOARD OVERVIEW',
    headline: 'Everyone on their own job.',
    intro: 'The manager plans and dispatches; workers build, reviewers gate, the releaser ships.',
    mWorking: 'Workers running', mIdle: 'Seats idle', mQueue: 'Queued batches', mDone: 'Done today',
    seats: 'Team seats', seatsSub: 'Role decides the job, model is the partner',
    workers: 'In flight', workersSub: 'Who is doing what, and how far it got',
    queue: 'Release queue', queueSub: 'What is waiting to merge and ship',
    today: 'Today', todaySub: 'Tickets touched today',
    quiet: 'min since update', noActivity: 'no activity yet', inService: 'running', standby: 'standby',
    defaultModel: 'default', emptyWorkers: 'No worker is running right now.', emptyQueue: 'The queue is empty.', emptyToday: 'Nothing else today.',
    stage: 'Stage', task: 'Task', role: 'Role', model: 'Model', minutes: 'min', noTitle: 'No task note',
    minsAgo: 'min ago', hoursAgo: 'h ago', daysAgo: 'd ago', time: 'Time',
    footLeft: 'Reads a local state file only', footRight: 'Auto-refresh every 15s', stale: 'quiet for a while', fresh: 'recently active', waiting: 'queued', running: 'running', done: 'done',
  },
};

const CSS = `
:root{--bg:#0c0d10;--panel:#121418;--line:#272b32;--ink:#e8e9ed;--mut:#8c929e;--ok:#9de6bd;--warn:#edc384;--bad:#f294a2;--accent:#b4a1fa}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.6 -apple-system,BlinkMacSystemFont,"PingFang SC","Segoe UI",sans-serif}
a{color:inherit}
.shell{max-width:1440px;margin:auto;padding:0 40px}
.nav{height:64px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);gap:16px}
.brand{display:flex;align-items:center;gap:12px;font-size:17px;font-weight:650}
.brand-icon{width:32px;height:32px;border:1px solid #55505f;border-radius:9px;display:grid;place-items:center;color:var(--accent);font-size:20px}
.brand small{color:var(--mut);font-size:11px;font-weight:400;letter-spacing:1.6px;margin-left:10px}
.nav-right{display:flex;align-items:center;gap:14px}
.live{font-size:11px;letter-spacing:1.4px;color:var(--ok)}
.live i{display:inline-block;width:6px;height:6px;background:currentColor;border-radius:50%;margin-right:7px}
.btn{background:#1a1c22;border:1px solid #333640;color:#d7dae2;border-radius:7px;padding:6px 12px;font-size:12px;text-decoration:none}
.btn:hover{background:#282b34}
.heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:26px 0 20px}
.eyebrow{font-size:10px;letter-spacing:1.6px;color:var(--mut)}
h1{font-size:28px;letter-spacing:-.6px;line-height:1.35;margin:6px 0}
h2{font-size:14px;margin:0;font-weight:550}
h2 .sub{font-weight:400;color:var(--mut);margin-left:12px;font-size:11px}
p{margin:0}
.intro{color:var(--mut);font-size:12px}
.date{font-size:12px;color:var(--mut);white-space:nowrap}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);border-radius:11px;background:linear-gradient(120deg,#181b21,#121418);margin-bottom:24px;overflow:hidden}
.metric{padding:16px 22px;border-right:1px solid var(--line)}
.metric:last-child{border:0}
.metric-label{font-size:12px;color:var(--mut)}
.metric-value{font-size:28px;font-weight:500;letter-spacing:-1px;font-variant-numeric:tabular-nums}
.panel{border:1px solid var(--line);border-radius:12px;background:var(--panel);margin-bottom:22px;overflow:hidden}
.panel-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:15px 22px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.seats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1px;background:var(--line)}
.seat{background:var(--panel);padding:14px 16px}
.seat.occupied{background:linear-gradient(150deg,#25233199,#16171c)}
.seat-top{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:10px;color:var(--mut)}
.seat.occupied .seat-state{color:var(--ok)}
.seat h3{font-size:12px;font-weight:550;margin:10px 0 4px}
.seat h3 small{display:block;font-size:9px;color:var(--mut);font-weight:400;margin-top:2px}
.seat p{font-size:10px;color:var(--mut);min-height:30px}
.seat-model{font-size:10px;color:#abb1bf;margin-top:8px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;padding:18px 22px}
.card{border:1px solid #32353f;border-radius:9px;padding:13px 15px;background:#17191f}
.card.warn{border-color:#715d40}.card.bad{border-color:#774550}.card.unknown{opacity:.75}
.card-top{display:flex;align-items:baseline;justify-content:space-between;gap:10px;font-size:10px;color:var(--mut)}
.card strong{display:block;font-size:13px;margin:7px 0 4px;overflow-wrap:anywhere}
.card p{font-size:11px;color:var(--mut)}
.card-foot{display:flex;justify-content:space-between;gap:10px;font-size:10px;color:var(--mut);border-top:1px solid var(--line);margin-top:10px;padding-top:7px;flex-wrap:wrap}
.dot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:6px;background:#8c929e}
.dot.ok{background:var(--ok)}.dot.warn{background:var(--warn)}.dot.bad{background:var(--bad)}
.list{list-style:none;margin:0;padding:8px 22px 18px;counter-reset:q}
.list li{counter-increment:q;border-top:1px solid var(--line);padding:12px 0 12px 30px;position:relative;font-size:12px}
.list li:first-child{border-top:0}
.list li:before{content:counter(q,decimal-leading-zero);position:absolute;left:0;top:15px;color:#687080;font:10px ui-monospace,monospace}
.list .sub{display:block;color:var(--mut);font-size:11px;margin-top:4px}
.pill{font-size:10px;border:1px solid #3c414c;border-radius:5px;padding:1px 6px;float:right;color:var(--mut)}
.pill.running{color:var(--accent)}.pill.done{color:var(--ok)}.pill.bad{color:var(--bad)}
.empty{font-size:12px;color:var(--mut);padding:18px 22px}
table{width:100%;border-collapse:collapse;text-align:left}
th{font-size:10px;font-weight:400;color:var(--mut);padding:0 10px 10px}
th:first-child,td:first-child{padding-left:0}
td{font-size:12px;padding:11px 10px;border-top:1px solid var(--line)}
.table-wrap{padding:16px 22px 20px;overflow-x:auto}
.mono{font-family:ui-monospace,SFMono-Regular,monospace;font-variant-numeric:tabular-nums}
.foot{display:flex;justify-content:space-between;gap:12px;color:#646c7a;font-size:10px;padding:10px 0 30px;flex-wrap:wrap}
@media(max-width:760px){.shell{padding:0 16px}.metrics{grid-template-columns:1fr 1fr}.metric:nth-child(2){border-right:0}.metric:nth-child(-n+2){border-bottom:1px solid var(--line)}h1{font-size:23px}.date{display:none}.brand small{display:none}}
`;

// Accepts either an absolute timestamp or `minutesAgo: 12` (handy for examples and hand-written files).
// 接受绝对时间，也接受 `minutesAgo: 12`（示例和手写文件方便）。
const minutesSince = (value, now) => {
  if (typeof value === 'number') return Math.max(0, Math.round(value));
  const t = Date.parse(value);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((now - t) / 60000));
};

const agoText = (mins, t) => {
  if (mins === null) return t.noActivity;
  if (mins < 90) return `${mins} ${t.minsAgo}`;
  if (mins < 60 * 30) return `${Math.round(mins / 60)} ${t.hoursAgo}`;
  return `${Math.round(mins / 1440)} ${t.daysAgo}`;
};

function healthOf(worker, now) {
  const mins = minutesSince(worker.minutesAgo ?? worker.lastActivity, now);
  if (mins === null) return { key: 'unknown', mins: null };
  if (mins >= 30) return { key: 'bad', mins };
  if (mins >= 15) return { key: 'warn', mins };
  return { key: 'ok', mins };
}

const clock = (value, now = Date.now()) => {
  const t = typeof value === 'number' ? now - value * 60000 : Date.parse(value);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
};

export function renderBoard({ config, state, now = Date.now() }) {
  const t = LABELS[config.lang] || LABELS.en;
  const seats = config.seats || [];
  const workers = (state.workers || []).map((w) => ({ ...w, health: healthOf(w, now) }));
  const queue = state.queue || [];
  const today = state.today || [];
  const seatName = (id) => (seats.find((s) => s.id === id) || {}).name || id || '—';

  const nWorking = workers.length;
  const nIdle = Math.max(0, seats.filter((s) => !workers.some((w) => w.role === s.id)).length);
  const nDone = today.filter((row) => row.status === 'done').length;
  const dateText = new Date(now).toLocaleDateString(config.lang === 'zh' ? 'zh-CN' : 'en-US', {
    timeZone: 'Asia/Shanghai', month: 'long', day: 'numeric', weekday: 'long',
  });

  const seatHtml = seats.length
    ? seats.map((s) => {
        const here = workers.filter((w) => w.role === s.id);
        return `<div class="seat ${here.length ? 'occupied' : ''}">
        <div class="seat-top"><span>${esc(s.group || '')}</span><span class="seat-state">${here.length ? `${here.length} · ${esc(t.inService)}` : esc(t.standby)}</span></div>
        <h3>${esc(s.name)}<small>${esc(s.id)}</small></h3>
        <p>${esc(s.scope || '')}</p>
        <div class="seat-model">${esc(t.defaultModel)} ${esc(s.defaultModel || '—')}</div>
      </div>`;
      }).join('')
    : `<div class="empty">${esc(t.emptyWorkers)}</div>`;

  const workerHtml = nWorking
    ? `<div class="cards">${workers.map((w) => `<div class="card ${w.health.key}">
        <div class="card-top"><span>${esc(seatName(w.role))}</span><span><i class="dot ${w.health.key}"></i>${esc(agoText(w.health.mins, t))}</span></div>
        <strong>${esc(w.task || '—')}</strong>
        <p>${esc(w.title || t.noTitle)}</p>
        <div class="card-foot"><span>${esc(w.model || '—')}${w.stage ? ' · ' + esc(w.stage) : ''}</span><span class="mono">${esc(clock(w.startedAt ?? w.startedMinutesAgo, now))}</span></div>
      </div>`).join('')}</div>`
    : `<div class="empty">${esc(t.emptyWorkers)}</div>`;

  const queueHtml = queue.length
    ? `<ul class="list">${queue.map((b) => `<li><span class="pill ${esc(b.status || 'waiting')}">${esc(t[b.status] || b.status || t.waiting)}</span>${esc(b.batch || b.task || '—')}${b.note ? `<span class="sub">${esc(b.note)}</span>` : ''}${Array.isArray(b.items) && b.items.length ? `<span class="sub">${b.items.map(esc).join(' · ')}</span>` : ''}</li>`).join('')}</ul>`
    : `<div class="empty">${esc(t.emptyQueue)}</div>`;

  const todayHtml = today.length
    ? `<div class="table-wrap"><table><thead><tr><th>${esc(t.task)}</th><th>${esc(t.role)}</th><th>${esc(t.model)}</th><th>${esc(t.stage)}</th><th>${esc(t.time)}</th></tr></thead><tbody>${today.map((row) => `<tr><td>${esc(row.task || '—')}</td><td>${esc(seatName(row.role))}</td><td>${esc(row.model || '—')}</td><td>${esc(t[row.status] || row.status || '—')}</td><td class="mono">${esc(clock(row.at ?? row.minutesAgo, now))}</td></tr>`).join('')}</tbody></table></div>`
    : `<div class="empty">${esc(t.emptyToday)}</div>`;

  return `<!doctype html><html lang="${config.lang === 'zh' ? 'zh-CN' : 'en'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">
<meta http-equiv="refresh" content="15">
<title>${esc(config.title || 'Mission Control')}</title><style>${CSS}</style></head><body>
<div class="shell">
  <header class="nav"><div class="brand"><span class="brand-icon">◇</span>${esc(config.title || 'Mission Control')}<small>MISSION CONTROL</small></div>
  <div class="nav-right"><span class="live"><i></i>${esc(t.live)}</span><a class="btn" href="/">↻ ${esc(t.refresh)}</a></div></header>
  <section class="heading"><div><div class="eyebrow">${esc(t.overview)}</div><h1>${esc(t.headline)}</h1><p class="intro">${esc(t.intro)}</p></div><div class="date">${esc(dateText)}</div></section>
  <section class="metrics">
    <div class="metric"><div class="metric-label">${esc(t.mWorking)}</div><div class="metric-value">${nWorking}</div></div>
    <div class="metric"><div class="metric-label">${esc(t.mIdle)}</div><div class="metric-value">${nIdle}</div></div>
    <div class="metric"><div class="metric-label">${esc(t.mQueue)}</div><div class="metric-value">${queue.length}</div></div>
    <div class="metric"><div class="metric-label">${esc(t.mDone)}</div><div class="metric-value">${nDone}</div></div>
  </section>
  <section class="panel"><div class="panel-head"><h2>${esc(t.seats)}<span class="sub">${esc(t.seatsSub)}</span></h2></div><div class="seats">${seatHtml}</div></section>
  <section class="panel"><div class="panel-head"><h2>${esc(t.workers)}<span class="sub">${esc(t.workersSub)}</span></h2><span class="date">${nWorking} ${esc(t.inService)}</span></div>${workerHtml}</section>
  <section class="panel"><div class="panel-head"><h2>${esc(t.queue)}<span class="sub">${esc(t.queueSub)}</span></h2><span class="date">${queue.length}</span></div>${queueHtml}</section>
  <section class="panel"><div class="panel-head"><h2>${esc(t.today)}<span class="sub">${esc(t.todaySub)}</span></h2><span class="date">${today.length}</span></div>${todayHtml}</section>
  <footer class="foot"><span>${esc(t.footLeft)}</span><span>${esc(t.footRight)} · <span class="mono">${esc(clock(0, now))}</span></span></footer>
</div></body></html>`;
}
