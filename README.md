# mioku-plugin-terraria

为 Mioku 提供 Terraria（TShock）服务器与 QQ 群消息互通能力，使用 [TianSuo](https://github.com/Jerryplusy/TianSuo) 协议（JSON over WebSocket）。

## 功能特性

- **消息双向同步**：QQ 群消息广播到 Terraria 服务器，Terraria 服务器内玩家聊天、加入、退出、死亡事件推送到群聊
- **RCON 命令执行**：在群聊中以命令前缀（默认 `$`）开头的消息会被当作服务器命令执行，支持白名单
- **多服务器支持**：可同时连接多台 Terraria 服务器，每台独立配置
- **自动重连**：连接断开后按指数退避自动重连，可配置最大重试次数

## 服务端要求

Terraria 服务器需安装 [TianSuo](https://github.com/Jerryplusy/TianSuo) TShock 插件

## 配置

通过 WebUI 配置页面管理

## 命令

| 命令                       | 描述                       | 权限  |
|--------------------------|--------------------------|-----|
| `/ts 状态`                  | 查看所有服务器的 WebSocket 连接状态  | 主人  |
| `/ts 开启同步 <服务器名称>`       | 开启指定服务器的群聊消息同步           | 主人  |
| `/ts 关闭同步 <服务器名称>`       | 关闭指定服务器的群聊消息同步           | 主人  |
| `/ts 重连`                  | 断开并重新建立所有服务器的 WebSocket 连接 | 主人  |

## 鸣谢

- [TianSuo](https://github.com/Jerryplusy/TianSuo)：Terraria WebSocket 桥
- [TShock](https://github.com/TShock/TShock) 与 [Pryaxis](https://github.com/Pryaxis)：Terraria 服务端框架与插件 API
- [Re-Logic](https://www.terraria.org/)：Terraria
