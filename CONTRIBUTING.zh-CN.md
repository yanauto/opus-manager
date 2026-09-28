# 参与贡献

[English](CONTRIBUTING.md) · 中文

谢谢你愿意帮忙。这页说明谁能改什么，以及怎样的改动容易被合并。

## 谁在维护

- [@yanauto](https://github.com/yanauto)：仓库主人。任何改动进 `main` 都要经他批准。
- [@dodocat-sun](https://github.com/dodocat-sun)：维护者。可以建分支、整理 issue、审 PR。

`main` 分支受保护：所有改动都走 PR，PR 必须经 @yanauto 批准才能合并（见 [`.github/CODEOWNERS`](.github/CODEOWNERS)）。禁止强推，禁止删除分支。

其他人也欢迎 fork 后按同样的方式提 PR。

## 动手之前

- **小修小补**（错字、坏链接、示例里写错的参数）：直接提 PR。
- **较大的改动**（改变工作流程、给 skill 加章节、改工单或回执格式）：先开 issue，说清楚要解决什么问题。免得 PR 写完了才发现方向不对。

## 最需要的帮助

**其他模型和命令行工具的实测结果。** 这个 skill 用的是用户电脑上现有的编程命令行工具，每个工具的无头运行、自动批准、选模型、只读这几个参数都不一样。你试过哪种组合，请告诉我们：

- 哪个工具和模型写代码，哪个做审查；
- 无头运行跑通的完整命令；
- 哪里顺利、哪里出问题、大概花了多少钱；
- 你用的操作系统。

可以开 issue 写这些，也可以提 PR，在中英两份 README 的「实测数据」表里各加一行。数字必须来自真实使用，写明样本多大，不要往好了凑。

## 每个 PR 都要守的规矩

1. **中英文同步。** 下面这些成对的文件，改一个就要在同一个 PR 里改另一个：
   - `skill/en/opus-manager/` ↔ `skill/zh/opus-manager/`（`SKILL.md` 和 `templates/`）
   - `README.md` ↔ `README.zh-CN.md`
   - `CONTRIBUTING.md` ↔ `CONTRIBUTING.zh-CN.md`

   两份 `SKILL.md` 的章节和顺序保持一致。只会写一种语言的话，在 PR 里说一声，维护者来补另一份。
2. **改 skill 要实际跑过。** 改了 `SKILL.md` 或模板，至少在一个真实项目里用它跑一张工单，在 PR 里写明跑了什么、结果怎样。
3. **写得短、写得直白。** 写清楚 Claude 该做什么，不要长篇解释为什么好。不编数字，不编引语。
4. **一个 PR 只做一件事。** 好审，出问题也好撤回。

## 绝不提交凭据

不要提交 API 密钥、令牌、密码、`.env` 文件和 AI 会话记录（`.claude/sessions/`、`*.jsonl`）。这是公开仓库，推上去的东西在你删掉之前可能已经被人复制走了。

每次推送和每个 PR 都会在 CI 里用 [gitleaks](https://github.com/gitleaks/gitleaks) 扫一遍。检查报红，PR 就合并不了。这时要删掉那条凭据，并去服务商那里作废它（当它已经泄露了），再重新推送。

想在推送之前就在本机拦住，装好 gitleaks，然后在每份克隆里执行一次：

```bash
git config core.hooksPath .githooks
```

## 许可证

提交贡献即表示你同意贡献内容以 [MIT 许可证](LICENSE) 发布。
