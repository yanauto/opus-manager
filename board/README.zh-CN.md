# 看板 · Mission Control

[English](README.md) · 中文

一块本机的只读看板：几路在干活、各在干什么、走到哪一步、队列里排着什么。

它不管派活，也不改任何东西。只读一个 JSON 状态文件，把内容画成一张网页，自己刷新。

## 跑起来

需要 Node 18 以上，没有其他依赖。

```bash
node board/server.mjs
# → http://127.0.0.1:3999
```

克隆下来直接跑会用自带的示例数据。要看自己的，复制两份文件再改：

```bash
cp board/config.example.json board/config.json   # 岗位和默认模型
cp board/state.example.json  board/state.json    # 谁在干什么、队列里有什么
```

参数：`--state <file>`、`--config <file>`；端口用环境变量 `BOARD_PORT`。

## 数据从哪来

`state.json` 就是个普通文件。你或 Claude 在派单、交回执、上线的时候往里写一行就行，不用起服务、不用接口。看板每 15 秒重读一次。

```json
{
  "workers": [
    {
      "task": "ticket-101",
      "title": "搜索接口加了缓存，重复请求打到一个进程",
      "role": "builder",
      "model": "DeepSeek",
      "stage": "施工中",
      "startedAt": "2026-10-15T01:20:00Z",
      "lastActivity": "2026-10-15T01:34:00Z"
    }
  ],
  "queue": [
    { "batch": "batch-7", "status": "running", "note": "卡在 PR 等审查员", "items": ["ticket-101"] }
  ],
  "today": [
    { "task": "ticket-98", "role": "builder", "model": "DeepSeek", "status": "done", "at": "2026-10-15T00:12:00Z" }
  ]
}
```

- `role` 填 `config.json` 里的 `seats[].id`，没填就显示原样。
- 时间写绝对时间；手写嫌麻烦也可以写 `minutesAgo: 12` 表示 12 分钟前。
- `lastActivity` 超过 15 分钟变黄、超过 30 分钟变红，用来发现卡住的工人。

## 写状态文件时注意

这是给人看的看板，别往里面塞提示词全文、客户资料、密钥。放任务编号、阶段、模型就够了。`state.json` 和 `config.json` 已在 `.gitignore` 里，不会被提交。

## 文件

- `server.mjs` —— 一个 http 服务，零依赖
- `view.mjs` —— 渲染，纯字符串拼接，没有前端框架
- `config.example.json`、`state.example.json` —— 照着改

想接自己的记录，改 `server.mjs` 里读文件那几行就够了；也可以直接定时把状态写成 `state.json`，一行不用改。
