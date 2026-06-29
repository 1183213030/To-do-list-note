# 一起待办

> 基于微信云开发的共享清单小程序，适合情侣、室友或家人一起记录待办、生活事项与共同计划。

[![License](https://img.shields.io/badge/license-个人学习-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-微信小程序-07C160.svg)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![Cloud](https://img.shields.io/badge/cloud-微信云开发-006EFF.svg)](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

## 简介

**一起待办** 是一款轻量、无广告的微信小程序，支持多人共享同一份清单，双方可实时查看、添加和完成任务。项目使用微信云开发（CloudBase），无需自建服务器，免费额度即可运行。

**适用场景：** 情侣待办、家庭购物清单、合租家务分工、两人协作的小计划。

## 特性

- 多人共享清单，邀请加入即可协作
- 任务增删改查，支持日期与备注
- 智能分组：今天 / 已计划 / 全部 / 已完成
- 数据导出与导入，支持 JSON 备份与迁移
- 云函数鉴权，数据安全可控
- 无广告、无付费，纯私用体验版即可使用
## 技术栈

- 微信小程序原生开发
- WXML + WXSS + JavaScript
- 微信云开发 CloudBase
- 云数据库
- 云函数

## 项目结构

```
.
├── cloudfunctions/          # 云函数目录
│   ├── login/              # 用户登录
│   ├── createList/         # 创建清单
│   ├── getMyLists/         # 获取我的清单
│   ├── getListInfo/        # 获取清单信息
│   ├── joinList/           # 加入清单
│   ├── createTask/         # 创建任务
│   ├── getTasks/           # 获取任务列表
│   ├── updateTask/         # 更新任务
│   ├── toggleTaskDone/     # 切换任务完成状态
│   ├── deleteTask/         # 删除任务
│   ├── deleteList/         # 删除清单
│   ├── getHomeStats/       # 获取首页统计
│   ├── exportData/         # 导出数据
│   └── importData/         # 导入数据
├── pages/                  # 页面目录
│   ├── index/             # 首页
│   ├── list-detail/       # 清单详情页
│   ├── task-edit/         # 任务编辑页
│   ├── join/              # 加入清单页
│   ├── mine/              # 我的页面
│   └── import-data/       # 数据导入页
├── app.js                 # 小程序入口
├── app.json               # 小程序配置
├── app.wxss               # 全局样式
├── local.config.example.js # 云环境配置示例（复制为 local.config.js）
└── 部署指南.md             # 详细部署文档
```

## 快速开始

1. **克隆项目**

```bash
git clone https://github.com/1183213030/To-do-list-note.git
```

2. **用微信开发者工具打开项目目录**

3. **配置云开发环境 ID**

```bash
cp local.config.example.js local.config.js
```

编辑 `local.config.js`，填入你的云开发环境 ID：

```javascript
module.exports = {
  cloudEnv: 'your-env-id'  // 替换为你的环境 ID
}
```

> `local.config.js` 已加入 `.gitignore`，不会提交到 Git，可安全保存个人配置。

4. **按 [部署指南.md](./部署指南.md) 完成云开发开通、数据库创建与云函数部署**

5. **编译运行**，上传体验版并添加体验成员即可使用

## 数据库集合

需要在云开发控制台创建以下集合：

1. **users** - 用户信息
2. **lists** - 清单信息
3. **list_members** - 清单成员关系
4. **tasks** - 任务信息

## 部署步骤

### 1. 开通云开发

1. 在微信开发者工具中打开项目
2. 点击「云开发」按钮
3. 创建云开发环境（免费版即可）
4. 记下环境 ID

### 2. 配置环境 ID

复制 `local.config.example.js` 为 `local.config.js`，填入你的云开发环境 ID（详见上方「快速开始」）。

### 3. 创建数据库集合

在云开发控制台 - 数据库中，手动创建以下集合：
- users
- lists
- list_members
- tasks

### 4. 上传云函数

在微信开发者工具中，右键每个云函数文件夹，选择：
1. 「云函数」→「上传并部署：云端安装依赖」

需要上传的云函数：
- login
- createList
- getMyLists
- getListInfo
- joinList
- createTask
- getTasks
- updateTask
- toggleTaskDone
- deleteTask
- deleteList
- getHomeStats
- exportData
- importData

### 5. 测试运行

1. 点击「编译」按钮
2. 在模拟器中测试功能
3. 使用真机调试测试完整流程

### 6. 生成体验版

1. 点击「上传」按钮上传代码
2. 登录微信公众平台
3. 进入「版本管理」
4. 将上传的版本设置为体验版
5. 添加体验成员（你和对象的微信号）

## 核心功能

### 用户功能
- ✅ 自动登录获取 openid
- ✅ 创建个人清单
- ✅ 查看清单列表
- ✅ 邀请他人加入清单

### 清单功能
- ✅ 创建清单
- ✅ 分享清单
- ✅ 加入清单
- ✅ 查看清单成员

### 任务功能
- ✅ 添加任务
- ✅ 编辑任务
- ✅ 删除任务
- ✅ 完成/取消完成任务
- ✅ 设置任务日期
- ✅ 添加任务备注

### 智能列表
- ✅ 今天的任务统计
- ✅ 已计划任务统计
- ✅ 全部任务统计
- ✅ 已完成任务统计

### 数据管理
- ✅ 数据导出 - 导出所有清单和任务数据
- ✅ 数据导入 - 从 JSON 恢复数据
- ✅ 清除本地缓存

## 使用流程

### 基本流程
1. 用户 A 打开小程序，创建清单「我们的小清单」
2. 用户 A 添加任务「周末买东西」
3. 用户 A 点击「邀请对象」分享给用户 B
4. 用户 B 打开分享卡片，点击「加入清单」
5. 用户 B 可以看到用户 A 创建的任务
6. 用户 B 添加任务「晚上拿快递」
7. 用户 A 刷新后可以看到用户 B 的任务
8. 双方都可以完成/取消完成任务

### 数据导出流程
1. 进入「我的」页面
2. 点击「导出数据」
3. 系统自动复制 JSON 数据到剪贴板
4. 妥善保存导出的数据

### 数据导入流程
1. 进入「我的」页面
2. 点击「导入数据」
3. 粘贴之前导出的 JSON 数据
4. 点击「确认导入」
5. 系统自动校验并导入数据

## 注意事项

1. **仅供私用**：本项目不做正式发布，仅供体验版使用
2. **无需付费**：完全使用微信云开发免费额度
3. **数据安全**：所有权限校验在云函数中进行
4. **无广告**：项目纯净无广告
5. **环境 ID**：记得配置正确的云开发环境 ID
6. **数据备份**：支持数据导出功能，建议定期备份
7. **免费政策**：免费云环境活动截止 2026 年 12 月 31 日，后续以官方通知为准
8. **数据迁移**：如未来免费政策变化，可通过导出功能迁移数据

## 后续扩展（可选）

如需扩展功能，可以考虑：
- 任务标签系统
- 重要任务标记（flagged）
- 任务优先级
- 子任务功能
- 清单颜色和图标自定义
- 任务指派功能
- 订阅消息提醒

## 技术支持

如遇到问题：
1. 检查云函数是否全部上传成功
2. 检查数据库集合是否创建
3. 检查云开发环境 ID 是否正确
4. 查看云函数日志排查错误

## 相关链接

- [微信公众平台](https://mp.weixin.qq.com/)
- [微信开发者工具下载](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

## 许可

详见 [LICENSE](LICENSE)。本项目仅供个人学习和非商业私用。
