#!/bin/bash
set -e

# 自动从环境变量注入 API Key 到 auth-profiles.json
# 支持的环境变量：GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY

AUTH_DIR="$HOME/.openclaw/agents/main/agent"
AUTH_FILE="$AUTH_DIR/auth-profiles.json"

# 如果 auth-profiles.json 不存在，则创建
if [ ! -f "$AUTH_FILE" ]; then
  mkdir -p "$AUTH_DIR"
  echo '{"version":2,"profiles":{}}' > "$AUTH_FILE"
fi

# 注入 Google (Gemini) API Key
if [ -n "$GEMINI_API_KEY" ]; then
  echo "Injecting GEMINI_API_KEY into auth-profiles.json..."
  # 使用 node 来安全地修改 JSON
  node -e "
    const fs = require('fs');
    const store = JSON.parse(fs.readFileSync('$AUTH_FILE', 'utf8'));
    store.profiles['google:default'] = {
      type: 'api_key',
      provider: 'google',
      key: process.env.GEMINI_API_KEY
    };
    fs.writeFileSync('$AUTH_FILE', JSON.stringify(store, null, 2));
  "
fi

# 注入 OpenAI API Key
if [ -n "$OPENAI_API_KEY" ]; then
  echo "Injecting OPENAI_API_KEY into auth-profiles.json..."
  node -e "
    const fs = require('fs');
    const store = JSON.parse(fs.readFileSync('$AUTH_FILE', 'utf8'));
    store.profiles['openai:default'] = {
      type: 'api_key',
      provider: 'openai',
      key: process.env.OPENAI_API_KEY
    };
    fs.writeFileSync('$AUTH_FILE', JSON.stringify(store, null, 2));
  "
fi

# 注入 Anthropic API Key
if [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "Injecting ANTHROPIC_API_KEY into auth-profiles.json..."
  node -e "
    const fs = require('fs');
    const store = JSON.parse(fs.readFileSync('$AUTH_FILE', 'utf8'));
    store.profiles['anthropic:default'] = {
      type: 'api_key',
      provider: 'anthropic',
      key: process.env.ANTHROPIC_API_KEY
    };
    fs.writeFileSync('$AUTH_FILE', JSON.stringify(store, null, 2));
  "
fi

# 注入 OpenRouter API Key
if [ -n "$OPENROUTER_API_KEY" ]; then
  echo "Injecting OPENROUTER_API_KEY into auth-profiles.json..."
  node -e "
    const fs = require('fs');
    const store = JSON.parse(fs.readFileSync('$AUTH_FILE', 'utf8'));
    store.profiles['openrouter:default'] = {
      type: 'api_key',
      provider: 'openrouter',
      key: process.env.OPENROUTER_API_KEY
    };
    fs.writeFileSync('$AUTH_FILE', JSON.stringify(store, null, 2));
  "
fi

# 执行传入的命令（即 CMD）
exec "$@"
