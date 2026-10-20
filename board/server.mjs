// A read-only local board: which workers are running, what they are on, what is queued.
// 一个只读的本地面板：几路在干活、各在干什么、队列里排着什么。
// Usage / 用法：node board/server.mjs   →  http://127.0.0.1:3999
// Options / 参数：--state <file>  --config <file>   env: BOARD_PORT
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderBoard } from './view.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = Number(process.env.BOARD_PORT || 3999);
const HOST = '127.0.0.1';

// Fall back to the shipped examples so the board runs straight after a clone.
// 找不到自己的文件就退回示例，克隆下来直接能跑。
const pick = (name, fallback) => {
  const wanted = path.resolve(flag(name, path.join(HERE, fallback)));
  if (fs.existsSync(wanted)) return wanted;
  const example = wanted.replace(/\.json$/, '.example.json');
  return fs.existsSync(example) ? example : null;
};

const CONFIG_FILE = pick('--config', 'config.json');
const STATE_FILE = pick('--state', 'state.json');

const readJson = (file, fallback) => {
  if (!file) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`[board] cannot read ${file}: ${err.message}`);
    return fallback;
  }
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, state: STATE_FILE, config: CONFIG_FILE }));
    return;
  }

  if (url.pathname === '/state.json') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(readJson(STATE_FILE, {}), null, 2));
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    const config = readJson(CONFIG_FILE, {});
    const state = readJson(STATE_FILE, {});
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(renderBoard({ config, state }));
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('not found');
});

server.listen(PORT, HOST, () => {
  console.log(`board: http://${HOST}:${PORT}`);
  console.log(`  config: ${CONFIG_FILE || '(none, using defaults)'}`);
  console.log(`  state : ${STATE_FILE || '(none, empty board)'}`);
});
