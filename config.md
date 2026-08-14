---
title: Terraria 插件配置
description: 配置 Terraria 服务器连接、消息同步与 RCON 命令白名单
fields:
  - key: base.say_way
    label: 聊天前缀
    type: text
    description: QQ 消息转发到 Terraria 时显示的前缀，默认 "说："
    placeholder: 说：

  - key: base.display_server_name
    label: 显示服务器名称
    type: switch
    description: 消息中是否显示服务器名称

  - key: base.servers
    label: 服务器列表
    type: array
    description: 配置多个 Terraria 服务器连接（TianSuo 协议）
    itemFields:
      - key: server_name
        label: 服务器名称
        type: text
        description: 与 TianSuo 配置中 ServerName 一致（也是握手时 x-self-name 头的值）
        placeholder: main

      - key: host
        label: 服务器地址
        type: text
        description: TianSuo 所在主机地址
        placeholder: 127.0.0.1

      - key: port
        label: 服务器端口
        type: number
        description: TianSuo WebSocket 监听端口
        placeholder: 8080

      - key: access_token
        label: 访问令牌
        type: secret
        description: 与 TianSuo 配置中 AccessToken 一致（若 TianSuo 启用则必填）

      - key: reconnect_max_attempts
        label: 最大重连次数
        type: number
        description: 断线后最大重连次数，0 表示无限
        placeholder: 0

      - key: group_list
        label: 关联群聊
        type: text
        description: 关联的 QQ 群号

      - key: bot_self_id
        label: 机器人账号
        type: text
        description: 使用哪个机器人 QQ 号发送消息

      - key: command_header
        label: 命令前缀
        type: text
        description: RCON 命令前缀，默认 "$"
        placeholder: $

      - key: command_user
        label: 命令用户白名单
        type: textarea
        description: 允许执行 RCON 命令的 QQ 号列表，每行一个

      - key: rcon_command_whitelist
        label: RCON 命令白名单
        type: textarea
        description: 允许执行的 RCON 命令列表（首词匹配），每行一条

      - key: sync_enabled
        label: 启用同步
        type: switch
        description: 是否启用消息同步
---

```mioku-fields
keys:
  - base.say_way
  - base.display_server_name
  - base.servers
```
