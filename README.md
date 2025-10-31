## 项目概述

甜狗窝（Tiangou）是一个基于 Electron 和 Vue 3 构建的即时通讯应用。项目集成了悟空 IM SDK（wukongimjssdk/wukongimjstcpsdk）实现实时消息功能。采用双架构模式：Vue 3 前端 + 基于 ee-core 框架的 Electron 后端。

## 核心技术栈

- **前端**: Vue 3 + Vite + Pinia + Vue Router + Element Plus + Tailwind CSS
- **后端**: Electron + ee-core 框架 + better-sqlite3
- **即时通讯**: 悟空 IM SDK（Electron 使用 TCP 版本，Web 使用 JS 版本）
- **构建系统**: ee-bin（Electron Egg 构建工具）

## 开发命令

### 开发模式

```bash
npm run dev                # 同时运行前端和 Electron 开发模式
npm run dev-frontend       # 仅运行前端开发服务器（端口 8080）
npm run dev-electron       # 仅运行 Electron 开发模式
```

### 构建

```bash
npm run build              # 构建前端 + Electron + 加密
npm run build-fe           # 仅构建前端并移动 dist 文件
npm run build-electron     # 仅构建 Electron 代码
npm run encrypt            # 加密 Electron 代码

# 平台特定构建
npm run build-w            # 构建 Windows x64 版本
npm run build-we           # 构建 Windows 版本（备选）
npm run build-m            # 构建 macOS 版本
npm run build-m-arm64      # 构建 macOS ARM64 版本
npm run build-l            # 构建 Linux 版本
```

### 其他命令

```bash
npm run start              # 启动已构建的应用
npm run re-sqlite          # 重新构建 better-sqlite3 原生模块
npm run lint               # 运行 ESLint 自动修复（根目录和前端）
npm run format             # 使用 Prettier 格式化代码
npm run format:check       # 检查代码格式
```

### 前端专用命令

```bash
cd frontend
npm run dev                # 运行 Vite 开发服务器
npm run build              # 构建生产版本前端
npm run preview            # 预览生产构建
npm run lint               # 检查前端代码
npm run format             # 格式化前端代码
```

## 架构设计

### 双 SDK 集成

项目根据不同环境使用两个版本的悟空 IM SDK：

1. **Electron（主进程/渲染进程）**: 使用 `wukongimjstcpsdk`（基于 TCP）- 位于 `electron/service/wkim.js`
2. **前端（Web）**: 使用 `wukongimjssdk`（基于 WebSocket）- 初始化于 `frontend/src/wksdk/`

前端的 `wksdk` 模块（`frontend/src/wksdk/`）提供统一接口，包含：

- `model.js`: 消息数据模型（MessageWrap, Part），支持解析 @提及、表情和链接
- `dataConvert.js`: SDK 与应用格式之间的数据转换
- `chatManager.js`、`conversationManager.js`、`channelManager.js`: 封装 SDK 功能的管理器类
- `setCallback.js`: SDK 回调处理器，桥接到 Pinia stores
- `utils.js`: 消息操作的工具函数

### Electron 后端结构

Electron 后端使用 ee-core 框架，结构如下：

- **`electron/main.js`**: 入口文件，注册生命周期钩子和预加载脚本
- **`electron/config/`**: 配置文件
  - `config.default.js`: 默认配置（窗口选项、日志、服务器设置、托盘配置）
  - `config.local.js`: 本地开发覆盖配置
  - `config.prod.js`: 生产环境覆盖配置
- **`electron/controller/`**: 前后端通信的 IPC 处理器
  - `chatManage.js`: 聊天管理操作
  - `chatMessage.js`: 消息操作
  - `example.js`: 示例控制器
- **`electron/service/`**: 业务逻辑服务
  - `wkim.js`: 悟空 IM SDK 集成（TCP 连接、消息发送、同步）
  - `web.js`: Web 相关服务，前端桥接
  - `database/`: SQLite 数据库服务
    - `sqlitedb.js`: 使用 better-sqlite3 存储聊天消息
    - `basedb.js`: 数据库基类
- **`electron/wksdk/`**: electron的 `wksdk` 模块提供统一接口，包含：
  - `model.js`: 消息数据模型（MessageWrap, Part），支持解析 @提及、表情和链接
  - `dataConvert.js`: SDK 与应用格式之间的数据转换
  - `setCallback.js`: SDK 回调处理器
  - `utils.js`: 消息操作的工具函数
- **`electron/preload/`**: 渲染进程的预加载脚本
  - `lifecycle.js`: 应用生命周期钩子
- **`electron/utils/`**: 工具函数
- **`electron/addon/`**: 原生插件

### 前端结构

Vue 3 应用，组织结构如下：

- **`frontend/src/main.js`**: 应用入口
- **`frontend/src/App.vue`**: 根组件
- **`frontend/src/router/`**: Vue Router 配置
  - 基于登录状态的动态路由注册
  - 身份验证路由守卫
  - 登录后加载异步路由
- **`frontend/src/stores/`**: Pinia 状态管理
  - `modules/app.js`: 应用全局状态（主题、路由注册状态）
  - `modules/user.js`: 用户认证和资料
  - `modules/chat.js`: 聊天状态（会话列表、消息、当前频道）
- **`frontend/src/wksdk/`**: 悟空 IM SDK 封装（参见上文"双 SDK 集成"）
- **`frontend/src/api/`**: HTTP API 服务
  - `auth.js`: 认证接口
  - `chat.js`: 聊天相关接口
  - `common.js`: 通用工具
- **`frontend/src/components/`**: 可复用 Vue 组件
- **`frontend/src/views/`**: 页面级组件
- **`frontend/src/layout/`**: 布局组件
- **`frontend/src/hooks/`**: Vue 组合式函数
- **`frontend/src/utils/`**: 工具函数
  - `cache.js`: 本地存储封装
  - `helper/`: 辅助函数，包括树结构操作
- **`frontend/src/enums/`**: 枚举定义
- **`frontend/src/assets/`**: 静态资源

### 自动导入配置

前端使用 unplugin-auto-import 和 unplugin-vue-components 实现自动导入：

- Vue API（ref、reactive、computed 等）自动导入
- Element Plus 组件自动注册
- 自定义组件从 `src/components/` 自动注册
- 配置位于 `frontend/config/autoImport.js` 和 `frontend/config/autoRegistryComponents.js`
- 生成的类型文件：`frontend/auto-imports.d.ts` 和 `frontend/components.d.ts`

### 状态管理流程

1. 用户登录 → 将用户信息存入 Cache（`Cache.set('USER_INFO', userInfo)`）
2. 路由守卫检查 USER_INFO → 将用户加载到 Pinia store
3. 认证后动态注册异步路由
4. 悟空 IM SDK 初始化连接（Electron 用 TCP，Web 用 WebSocket）
5. SDK 回调更新 Pinia stores（chat、user、app）
6. 组件从 Pinia stores 响应式更新

### IPC 通信模式

Electron 后端通过 IPC 通道向前端暴露服务。`electron/controller/` 中的控制器处理来自渲染进程的请求，并调用 `electron/service/` 中的服务。`web.js` 服务充当桥梁，通过 IPC 将 SDK 事件转发到前端。

## 重要实现细节

### 消息数据流

1. **接收消息**: SDK → `wkim.js` 监听器 → `web.js` 桥接 → 前端 IPC 处理器 → `setCallback.js` → Pinia chat store → UI 组件
2. **发送消息**: UI → Pinia action → `wksdk/chatManager.js` → SDK → 服务器
3. **消息模型**: 消息被包装在 `MessageWrap` 类中，提供：
   - 通过 `parts` getter 解析的内容（@提及、表情、链接）
   - 基于相邻消息的气泡定位逻辑
   - 已读/未读状态跟踪
   - 回复/表情回应支持

### 认证流程

1. 用户在登录页输入凭证
2. 前端调用 `/v1/user/login` API（代理到 `https://tgdd-api.jx3kaihe.top`）
3. 接收响应中的 `uid` 和 `token`
4. 将用户信息存入 Cache 和 Pinia store
5. 使用 uid/token 连接到悟空 IM 服务器
6. 路由注册异步路由
7. 导航到主应用视图

### 数据库使用

SQLite 数据库（`sqlite-tiangou.db`）在本地存储聊天消息，用于离线访问和快速加载。`sqlitedb.js` 服务提供 CRUD 操作。可通过 `setCustomDataDir()` 自定义数据库位置。

## 开发工作流

1. **开始开发**: 在根目录运行 `npm run dev` 同时启动前端和 Electron
2. **仅前端开发**: 使用 `npm run dev-frontend`，在 `frontend/src/` 中工作
3. **测试 Electron**: 构建前端后使用 `npm run dev-electron`
4. **添加功能**:
   - 前端：添加组件/视图、更新 stores、添加 API 调用
   - Electron：为 IPC 添加控制器、为业务逻辑添加服务
   - IM 功能：扩展 `wksdk` 管理器并更新回调
5. **构建**: 运行 `npm run build` 进行完整构建和加密

## 参考项目

当用户要求参考“tsdd”或“唐僧叨叨”项目时，或新增功能时可先了解参考项目中的相关逻辑

### 参考项目地址：`C:\Code\tiangou-web-tsdd`

## 配置说明

- 前端开发服务器运行在端口 8080
- `vite.config.js` 中的 API 代理将 `/v1` 转发到 `https://tgdd-api.jx3kaihe.top`
- Electron 窗口配置在 `electron/config/config.default.js`
- 上下文隔离已禁用（`contextIsolation: false`）以允许在渲染进程中直接使用 Electron API
- Node 集成已启用（`nodeIntegration: true`）

## Electron模式下的聊天记录同步逻辑

在当前用户在线时，将从后端Api获取的聊天记录及收到的聊天消息，使用sqlite数据库存储每个会话的聊天记录，在web页面获取某个会话的聊天记录时，优先通过本地sqlite数据库返回

### 数据来源

1. 从后端Api接口获取聊天记录（最完整的）
   接口入参：`{limit: limit,channel_id: channel.channelID, channel_type: channel.channelType, start_message_seq: 0, end_message_seq: startMessageSeq, pull_mode: 1,}`
   接口响应参数：`{end_message_seq:0,messages:[],more:0,pull_mode:0,start_message_seq:0}`

2. 从本地sqlite数据库获取聊天记录（通过后端Api接口查询过的及当前用户在线时记录的）

### 场景

1. 本地sqlite数据库存储的聊天记录是完整的（可通过总记录数及最后message的message_id判断），直接从本地sqlite数据库返回给web。

2. 本地sqlite数据库没有该会话的聊天记录，直接从后端Api获取。

3. 本地sqlite数据库只有一部分记录；假设完整的有200条记录，每页请求30条记录，有些页可能是完整的如1-30（就直接从本地sqlite数据库返回）；第二页31-60，其中可能部分记录缺失；第三页61-90可能全部都缺失。

### 实现方案

#### **方案选择：按页完整性判断策略**

采用简单高效的策略：每次请求按页判断该页本地数据是否完整，完整则返回本地，否则请求远程API并存储。

**设计原则**：遵循 KISS（保持简单）原则，无需额外元数据表，实现快速，维护成本低。

---

#### **完整性判断算法**

##### **1. 初次加载（获取最新消息）**

**请求参数**：

```javascript
{
  start_message_seq: 0,
  end_message_seq: 0,
  limit: 30
}
```

**判断逻辑**：

1. 查询本地最新的 `limit` 条消息（按 `message_seq` 降序）
2. 检查返回结果：
   - 如果 `count === limit` 且 `message_seq` 连续 → 本地数据完整，直接返回 ✅
   - 如果 `count < limit` 或 `seq` 不连续 → 请求后端API 📡

##### **2. 向上加载历史消息（往前翻页）**

**请求参数**：

```javascript
{
  start_message_seq: 0,
  end_message_seq: 100,  // 获取 seq < 100 的消息
  limit: 30
}
```

**判断逻辑**：

1. 查询本地数据库：

```sql
SELECT * FROM chat_messages
WHERE channel_id = ?
  AND channel_type = ?
  AND message_seq < ?        -- end_message_seq
ORDER BY message_seq DESC
LIMIT ?;                      -- limit
```

2. 完整性检查：
   - **条件A**：返回的消息数量 === `limit`
   - **条件B**：`message_seq` 连续性（`max_seq - min_seq + 1 === count`）
   - 如果 A && B 都满足 → 本地完整 ✅
   - 否则 → 请求API并存储 📡

**连续性检查示例**：

```javascript
// 本地返回30条消息，seq为：[99, 98, 97, ..., 70]
// 检查：99 - 70 + 1 = 30 === count ✅ 连续
```

##### **3. message_seq 连续性检查算法**

```javascript
function isSeqContinuous(messages) {
  if (!messages || messages.length === 0) return false

  // 提取所有 message_seq 并排序
  const seqs = messages.map(m => m.message_seq).sort((a, b) => a - b)

  // 检查连续性：相邻seq差值应为1
  for (let i = 1; i < seqs.length; i++) {
    if (seqs[i] - seqs[i - 1] !== 1) {
      return false // 发现缺口
    }
  }

  return true
}
```

---

#### **实现流程**

```
前端请求某页消息
    ↓
[Electron主进程 - MessageSyncService]
    ↓
1. 解析请求参数（channel_id, channel_type, start_seq, end_seq, limit）
    ↓
2. 查询本地SQLite数据库
    ↓
3. 完整性判断：
   ├─ 数量足够 && seq连续？
   │    ├─ 是 → 直接返回本地数据 ✅
   │    └─ 否 → ↓
   │
4. 请求后端API获取完整数据
    ↓
5. 数据处理：
   ├─ 转换数据格式（header/payload JSON序列化）
   ├─ 提取 message_content（payload.content）
   ├─ 提取 payload_type（payload.type）
    ↓
6. 存入本地SQLite
   ├─ 使用 message_id 去重（INSERT OR IGNORE）
   ├─ 批量插入优化性能
    ↓
7. 返回给前端
```

---

#### **核心模块设计**

##### **1. Electron 服务层（新增）**

**文件**：`electron/service/messageSyncService.js`

**职责**：

- 统一处理消息查询请求
- 判断本地数据完整性
- 协调本地DB和远程API
- 数据格式转换和存储

**关键方法**：

```javascript
class MessageSyncService {
  // 查询消息（智能路由到本地或远程）
  async getMessages(channel_id, channel_type, start_seq, end_seq, limit)

  // 检查本地数据完整性
  async checkLocalDataComplete(channel_id, channel_type, start_seq, end_seq, limit)

  // 从API获取并存储
  async fetchAndStoreFromAPI(params)

  // 批量存储消息
  async batchSaveMessages(messages)
}
```

##### **2. 数据库扩展（基于现有 sqlitedb.js）**

新增查询方法：

```javascript
// 按 message_seq 范围查询
async getMessagesBySeqRange(channelId, channelType, startSeq, endSeq, limit)

// 批量插入（去重）
async batchInsertMessages(messages)

// 获取会话的 message_seq 统计信息
async getChannelSeqStats(channelId, channelType)
```

##### **3. IPC Controller（新增）**

**文件**：`electron/controller/messageSync.js`

**职责**：接收前端请求，调用 MessageSyncService

```javascript
async getChannelMessages(params) {
  const { channel_id, channel_type, start_message_seq, end_message_seq, limit } = params
  return await messageSyncService.getMessages(...)
}
```

##### **4. 前端适配（修改现有 chat store）**

**文件**：`frontend/src/stores/modules/chat.js`

修改 `fetchChannelMessageList` 方法：

- 在 Electron 环境下，调用 IPC 接口而非直接请求 HTTP API
- 保持现有接口签名不变

```javascript
async fetchChannelMessageList(params) {
  if (window.electron) {
    // Electron 模式：使用本地同步服务
    return await window.ipcApiRoute.getChannelMessages(params)
  } else {
    // Web 模式：直接请求API
    return await chatApi.syncChannelMessageList(params)
  }
}
```

---

#### **数据去重策略**

使用 `message_id` 作为唯一标识：

```sql
-- 方式1：使用 UNIQUE 约束（建表时添加）
CREATE UNIQUE INDEX idx_unique_message_id ON chat_messages(message_id);

-- 方式2：插入时使用 INSERT OR IGNORE
INSERT OR IGNORE INTO chat_messages (...) VALUES (...);

-- 方式3：插入时使用 INSERT OR REPLACE（更新已存在的记录）
INSERT OR REPLACE INTO chat_messages (...) VALUES (...);
```

**推荐**：使用方式1 + 方式2，在建表时添加唯一索引，插入时使用 `INSERT OR IGNORE`。

---

#### **性能优化**

1. **批量插入**：使用事务批量插入消息，提升性能

```javascript
const insertStmt = db.prepare('INSERT OR IGNORE INTO chat_messages (...) VALUES (...)')
const insertMany = db.transaction(messages => {
  for (const msg of messages) insertStmt.run(msg)
})
insertMany(messages) // 事务化批量插入
```

2. **索引优化**：已创建的索引支持高效查询

```sql
idx_message_seq: (channel_id, channel_type, message_seq)  -- 范围查询
idx_message_id: (message_id)                               -- 去重查询
```

3. **缓存策略**：首屏消息缓存在内存（`cacheChatMessagesByChannelID`），避免重复查询

---

#### **边界情况处理**

1. **会话无消息**：本地返回空 + API返回空 → 标记为"无更多消息"
2. **网络异常**：API请求失败时，返回本地数据（即使不完整），并提示用户
3. **seq不连续但数量够**：可能是删除导致，需要检查连续性，不能仅判断数量
4. **首次使用**：本地库为空，所有请求走API并存储

---

#### **测试场景**

1. ✅ 全新会话首次加载（本地无数据）
2. ✅ 已缓存会话的首屏加载（本地完整）
3. ✅ 向上翻页（本地部分完整）
4. ✅ 收到新消息后的实时存储
5. ✅ 跨页缺失（第1页完整，第2页缺失）
6. ✅ 删除消息后的seq不连续场景
7. ✅ 离线模式下的本地数据展示

---

#### **后续扩展建议**

如未来需要更精细的同步控制，可升级为**方案B（元数据表管理）**：

- 新增 `channel_sync_meta` 表记录每个会话的同步状态
- 字段：`channel_id`, `channel_type`, `max_message_seq`, `is_fully_synced`, `last_sync_time`
- 可实现更智能的增量同步和全局状态查询

---

#### **关键代码位置**

- **数据库层**：`electron/service/database/sqlitedb.js`（已完成表结构设计）
- **同步服务**：`electron/service/messageSyncService.js`（待实现）
- **IPC控制器**：`electron/controller/messageSync.js`（待实现）
- **前端Store**：`frontend/src/stores/modules/chat.js`（需适配）
- **索引优化**：已在 `sqlitedb.js` 的 `init()` 方法中创建
