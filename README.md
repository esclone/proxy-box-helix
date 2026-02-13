# Proxy Box

一个基于 **Node.js + Express** 的轻量级代理与隧道管理服务，集成了 **核心代理程序（core）** 与 **Cloudflared**，支持自动下载、启动、管理，并提供 Web 接口与反向代理能力。

---

## ✨ 功能特性

- 🚀 自动下载并启动 core
- 🌐 可选启用 Cloudflared
- 🔁 Express 反向代理（支持 WebSocket）
- 🔐 可选 HTTPS（自定义 TLS 证书）
- 🧩 WARP WireGuard 出口支持（IPv4 / IPv6）
- 📄 404 使用远端页面（热更新）

---

## 📦 运行环境

- Node.js >= 18
- 支持系统：
  - Linux
  - Windows

---

## ⚙️ 配置说明

配置优先级：

1. 环境变量 `CONFIG`
2. 本地 `config.json`

### 示例 `config.json`

```json
{
  "path": "/api",
  "network": "ws",
  "uuid": "api",

  "warp_add_ipv6": false,
  "warp_ipv6": "",
  "warp_secretKey": "",
  "warp_reserved": "",

  "cloudflared_enabled": false,
  "cloudflared_access_token": "",

  "tls_enabled": false,
  "tls_key": "BASE64_KEY",
  "tls_cert": "BASE64_CERT"
}
```

---

## 🚀 启动方式

```bash
yarn install
yarn start
```

或使用Docker

---

## ⚠️ 注意事项

- Linux 下会自动执行 `chmod +x`
- core / cloudflared 崩溃默认会退出主进程（可关闭）
- 请确保端口未被占用
