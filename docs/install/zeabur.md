---
summary: "在 Zeabur 平台通过 GitHub 集成部署 OpenClaw"
title: "Zeabur 部署"
---

# Zeabur 部署指南

通过 Zeabur 的 GitHub 集成自动构建和部署 OpenClaw。

## 前置条件

- 代码已 push 到 GitHub 仓库
- 已注册 [Zeabur](https://zeabur.com) 账号并绑定 GitHub

## 操作步骤

### 1. 创建服务

1. 登录 [Zeabur Dashboard](https://dash.zeabur.com)
2. **Create Project** → 选择区域（建议东京/新加坡）
3. **Add Service** → **Deploy from GitHub**
4. 选择你的 OpenClaw 仓库和分支
5. Zeabur 自动检测 `Dockerfile` 并构建

### 2. 配置环境变量

在服务的 **Variables** 面板中添加：

**必填：**

```env
OPENCLAW_GATEWAY_TOKEN=<你的随机令牌>
OPENCLAW_GATEWAY_BIND=lan
HOME=/home/node
```

生成 Token（PowerShell）：

```powershell
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
```

生成 Token（Bash）：

```bash
openssl rand -hex 32
```

**AI 提供商密钥（至少配一个）：**

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AI...
```

### 3. 设置启动命令

在 **Custom Command** 中覆盖默认启动命令：

```
node openclaw.mjs gateway --allow-unconfigured --bind lan --port 18789
```

- `--allow-unconfigured` 跳过交互式 onboard 向导
- `--bind lan` 监听 `0.0.0.0`，允许外部访问
- `--port 18789` 指定端口

### 4. 暴露端口

在 **Networking** 面板中：

- 暴露端口 `18789`
- 绑定域名（Zeabur 自动分配 `.zeabur.app` 域名，也可绑自定义域名）

### 5. 添加持久化存储

在 **Storage** 面板中添加：

| 挂载路径               | 说明                 |
| ---------------------- | -------------------- |
| `/home/node/.openclaw` | 配置、会话、渠道数据 |

> ⚠️ 不挂载持久化存储的话，每次重部署会丢失配置和聊天记录。

### 6. 部署并等待启动

点击 **Deploy**，等待构建完成。首次构建约 3-5 分钟（`pnpm install` + `pnpm build`）。

### 7. 创建配置文件

部署成功后，进入 Zeabur 的 **Console（终端）** 执行：

```bash
mkdir -p /home/node/.openclaw

cat > /home/node/.openclaw/openclaw.json << 'EOF'
{
  "messages": {
    "outboundRegex": [
      { "pattern": "<disclaimer>[\\s\\S]*?</disclaimer>", "replacement": "", "flags": "gi" }
    ]
  }
}
EOF
```

根据需要添加更多配置项，完整配置参考 [Configuration](/gateway/configuration)。

### 8. 添加渠道（可选）

在 Zeabur Console 中执行：

**Telegram：**

```bash
node openclaw.mjs channels add --channel telegram --token "<Bot Token>"
```

**Discord：**

```bash
node openclaw.mjs channels add --channel discord --token "<Bot Token>"
```

**WhatsApp（扫码）：**

```bash
node openclaw.mjs channels login
```

添加完渠道后重启服务使配置生效。

### 9. 验证

**健康检查：**

```bash
node openclaw.mjs health --token "$OPENCLAW_GATEWAY_TOKEN"
```

**浏览器访问：**

打开 `https://<你的域名>.zeabur.app/`，应看到 Control UI 页面。在 Settings 中填入你设置的 `OPENCLAW_GATEWAY_TOKEN` 完成连接。

## 与 docker-setup.sh 的对应关系

| docker-setup.sh 步骤     | Zeabur 对应操作             |
| ------------------------ | --------------------------- |
| `docker build` 构建镜像  | 自动检测 Dockerfile 构建    |
| 生成 Token 写入 `.env`   | Variables 面板手动设置      |
| `onboard` 交互向导       | `--allow-unconfigured` 跳过 |
| `docker compose up` 启动 | 自动启动容器                |
| 渠道配置命令             | Console 终端手动执行        |

## 常见问题

**Q: 构建失败怎么办？**
检查 Zeabur 的 Build Logs，常见原因是内存不足。OpenClaw 构建需要较大内存，确保 Zeabur plan 有足够资源。

**Q: 无法访问 Control UI？**
确认端口 `18789` 已暴露，启动命令包含 `--bind lan`。

**Q: 重部署后配置丢失？**
确认已添加持久化存储挂载 `/home/node/.openclaw`。
