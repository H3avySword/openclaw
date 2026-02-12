---
summary: "配置出站正则替换规则，在 AI 回复发送到聊天渠道前对文本进行匹配和替换"
read_when:
  - 需要过滤 AI 回复中的特定内容（如 HTML 标签）
  - 配置出站消息的正则替换规则
  - 自定义 AI 回复的后处理逻辑
title: "出站正则替换（Outbound Regex）"
---

# 出站正则替换

OpenClaw 支持在 AI 回复发送到聊天渠道前，对文本执行配置驱动的正则替换。
典型用途包括去除特定标签及其内容、屏蔽敏感词、格式转换等。

## 配置方式

在 `openclaw.json` 的 `messages` 中添加 `outboundRegex` 数组：

```json5
{
  "messages": {
    "outboundRegex": [
      {
        "pattern": "<delete>[\\s\\S]*?</delete>",
        "replacement": "",
        "flags": "gi"
      }
    ]
  }
}
```

## 字段说明

每条规则包含以下字段：

| 字段          | 类型     | 必填 | 说明                                   |
| ------------- | -------- | ---- | -------------------------------------- |
| `pattern`     | `string` | ✅    | 正则表达式字符串                       |
| `replacement` | `string` | ✅    | 替换内容，支持 `$1`、`$2` 等捕获组引用 |
| `flags`       | `string` | ❌    | 正则标志，默认 `"g"`（全局替换）       |

### 常用 flags

| 标志 | 含义                 |
| ---- | -------------------- |
| `g`  | 全局替换（匹配所有） |
| `i`  | 大小写不敏感         |
| `gi` | 全局 + 大小写不敏感  |
| `m`  | 多行模式             |

## 使用示例

### 去除 HTML 标签及内容

AI 有时会输出自定义标签（如 `<delete>...</delete>`），可以配置规则将其移除：

```json5
{
  "messages": {
    "outboundRegex": [
      {
        "pattern": "<delete>[\\s\\S]*?</delete>",
        "replacement": "",
        "flags": "gi"
      }
    ]
  }
}
```

**效果：**

- 输入：`正常内容<delete>这段会被删除</delete>保留的内容`
- 输出：`正常内容保留的内容`

### 替换为指定文本

```json5
{
  "messages": {
    "outboundRegex": [
      {
        "pattern": "<hide>[\\s\\S]*?</hide>",
        "replacement": "[内容已隐藏]",
        "flags": "gi"
      }
    ]
  }
}
```

### 屏蔽敏感词

```json5
{
  "messages": {
    "outboundRegex": [
      {
        "pattern": "敏感词A|敏感词B",
        "replacement": "***",
        "flags": "gi"
      }
    ]
  }
}
```

### 使用捕获组

利用正则捕获组 `$1`、`$2` 等引用匹配内容：

```json5
{
  "messages": {
    "outboundRegex": [
      {
        "pattern": "<bold>(.*?)</bold>",
        "replacement": "**$1**",
        "flags": "gi"
      }
    ]
  }
}
```

**效果：**

- 输入：`这是 <bold>加粗文本</bold>`
- 输出：`这是 **加粗文本**`

### 多条规则组合

规则按数组顺序**依次执行**，前一条规则的输出是后一条规则的输入：

```json5
{
  "messages": {
    "outboundRegex": [
      { "pattern": "<delete>[\\s\\S]*?</delete>", "replacement": "", "flags": "gi" },
      { "pattern": "<hide>[\\s\\S]*?</hide>", "replacement": "[已隐藏]", "flags": "gi" },
      { "pattern": "\\bhttp://\\S+", "replacement": "[链接]", "flags": "g" }
    ]
  }
}
```

## 行为细节

- 替换发生在 AI 回复文本净化（sanitize）之后、LINE 指令解析和 `responsePrefix` 前缀之前
- 规则全局生效，适用于所有渠道（WhatsApp、Telegram、Slack、Discord 等）
- 如果替换后文本为空且无附带媒体，该回复将被静默丢弃（不发送到渠道）
- 无效的正则模式会被静默跳过并在日志中输出警告，不影响其他规则执行

## 注意事项

> [!WARNING]
> `pattern` 是 JSON 字符串中的正则表达式，反斜杠需要**双重转义**。
> 例如 `\s` 在 JSON 中需要写成 `\\s`，`\b` 写成 `\\b`。

> [!TIP]
> 建议使用 `json5` 格式的配置文件（OpenClaw 支持），可以添加注释来说明每条规则的用途。
