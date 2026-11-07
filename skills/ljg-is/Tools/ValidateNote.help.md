# ValidateNote

校验 `ljg-is` 生成的 Org 或 Markdown 笔记。

当前生成合同是 `ljg-is-v5`：文件名使用 `--理解-<目标>__is`，标题使用「理解：<目标>」。成品把名词的「是什么」与动词的「怎样运作」接起来，并继续给出认知修正和行动判断。

验证器硬性检查缺字段、字段长度、文件名、schema、标题、自然段、项目符号、字段式标题、过密顿号、过多分号和超长句。它不要求虚构主人公、创造物反制或问号结尾。

`operation` 是否写清机制、`recognition` 是否写出判断变化、`falsifier` 是否真会推翻解释，不再用关键词判失败。字段存在且长度合格时，结果仍带 `warnings`，`review_required` 为 true，`review_status` 为 `review_required`。这只表示需要人工复核，不是读者理解通过，也不会自动写入 `NARRATIVE_PASS` 或其他评估通过。空字段和结构错误仍然失败。

`ljg-is-v4`、`ljg-is-v3`、`ljg-is-v2` 和无 schema 的 legacy 笔记仍可读取验证，但不会被新工作流生成。

```bash
bun ~/.agents/skills/ljg-is/Tools/ValidateNote.ts \
  ~/Context/20260823T010203--理解-目标函数__is.md
```

结构通过且需要复核时，向 stdout 输出 `{"status":"review_required", ...}` 并退出 0。没有 v4/v5 语义字段的结构检查通过时，status 为 `structural_checks_only`。失败时向 stderr 输出 `{"status":"error", ...}` 并退出 1；缺少文件参数时退出 2。

运行自检：

```bash
bun test ~/.agents/skills/ljg-is/Tools/ValidateNote.test.ts
```
