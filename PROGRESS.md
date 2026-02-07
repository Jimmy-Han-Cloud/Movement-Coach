# Movement Coach - 项目进度

## 项目概述

**Movement Coach** - 浏览器端、摄像头驱动、音乐同步的引导式运动体验，面向久坐电脑用户。

- 3-5 分钟会话
- 追踪 7 个身体点：Head, L/R Shoulder, L/R Elbow, L/R Hand
- 两种动作类型：**Pose Hold**（姿势保持）和 **Hand Motion**（手部轨迹）
- Phase-based 系统，3 分钟会话包含 8 个 phases

## 技术栈

| 层级 | 技术 |
|------|------|
| Frontend | Next.js (TypeScript), MediaPipe Pose, Canvas overlay, Rive |
| Backend | Python 3.11, FastAPI, Uvicorn, Google Cloud Run |
| Auth | Firebase Anonymous Auth |
| Database | Firestore |
| LLM | Gemini API (仅 post-session summary) |

## 架构原则

- **Frontend 运行所有实时逻辑**（MediaPipe, Phase Engine, validation）
- **Backend 仅处理持久化**
- 无 WebSocket - Frontend 只在会话结束时发送结果
- Phase Engine 是**时间驱动**的（phases 按时间推进，不依赖验证结果）
- Module 3 (Visual Feedback) **只能展示状态，不能推导状态**

---

## 已完成工作

### Backend（8 步 + Avatar 功能）✅

| Step | 描述 | 关键文件 |
|------|------|----------|
| 1 | 项目骨架 FastAPI + Uvicorn | `backend/app/main.py` |
| 2 | Flow 数据模型 + Flow API | `backend/app/models/flow.py`, `backend/app/routers/flows.py` |
| 3 | Session 生命周期 (create, submit, get) | `backend/app/models/session.py`, `backend/app/routers/sessions.py` |
| 4 | Firestore 集成 (含内存 fallback) | `backend/app/services/firestore.py` |
| 5 | Gemini API post-session summary | `backend/app/services/gemini.py` |
| 6 | CORS + Firebase Auth 中间件 | `backend/app/services/auth.py` |
| 7 | User personalization parameters | `backend/app/models/user_params.py`, `backend/app/routers/user_params.py` |
| 8 | Debug endpoints + production mode | `backend/app/routers/debug.py` |
| + | Avatar 生成 (照片→卡通头像) | `backend/app/services/avatar.py` |

### Frontend（7 步 + Step 8 UI/UX）✅

| Step | 描述 | 关键文件 |
|------|------|----------|
| 1 | Next.js 骨架 + Types + API Client | `frontend/types/`, `frontend/lib/api/` |
| 2 | Module 1 - Flow + Phase Engine | `frontend/modules/flow-engine/` |
| 3 | Module 2 - MediaPipe Pose + Validation | `frontend/modules/pose-validation/` |
| 4 | Module 3 - Visual Feedback (Canvas + HUD) | `frontend/modules/visual-feedback/` |
| 5 | Module 4 - Session Summary | `frontend/modules/session-summary/` |
| 6 | 全模块集成到 session page | `frontend/app/session/page.tsx` |
| 7 | Firebase Anonymous Auth + 摄像头修复 | `frontend/lib/firebase.ts`, `frontend/lib/use-auth.ts`, `frontend/lib/use-webcam.ts` |
| **8** | **UI/UX Design System + 4页面布局** | 见下方详情 |

### Step 8: UI/UX Design System ✅

基于 **UX Specification v1.0** 实现。

#### Design Tokens (`frontend/app/globals.css`)
- 颜色系统（primary, success, warning, error, neutral）
- Avatar 透明度（P2: 90%, P3: 80%）
- 字体比例、间距系统（4px 网格）
- 圆角、阴影、动画时长
- 手势交互参数（dwell time: 500ms, debounce: 2s）

#### UI 组件 (`frontend/components/ui/`)
| 组件 | 功能 |
|------|------|
| `Button` | 主要按钮（primary/secondary/ghost/danger） |
| `Card` | 卡片容器（default/elevated/glass） |
| `ProgressBar` | 进度条 |
| `StatusBadge` | 状态徽章（generating/previewing/locked/failed 等） |
| `Dropdown` | 下拉菜单（歌曲选择） |
| `GestureButton` | 手势触发按钮（500ms dwell, 2s debounce） |
| `GoBubble` | Go 气泡（手势触发，burst 动画） |
| `ConfirmDialog` | 确认对话框（3种类型） |

#### Layout 容器 (`frontend/components/layouts/`)
| 容器 | 用途 |
|------|------|
| `WelcomeLayout` | Page 1 三栏布局（Left-Center-Right） |
| `CameraLayout` | Page 2/3 全屏摄像头布局 |
| `ResultModal` | Page 4 结果弹窗 |

#### 页面结构
| 页面 | 路由 | 文件 |
|------|------|------|
| Page 1 - Welcome | `/` | `frontend/app/page.tsx` |
| Page 2 - Avatar Setup | `/avatar` | `frontend/app/avatar/page.tsx` |
| Page 3 - Game | `/game` | `frontend/app/game/page.tsx` |
| Page 4 - Result | 内嵌于 `/game` | `ResultModal` 组件 |

#### 特性
- 手势触发交互（手与按钮重合 500ms 触发）
- 确认对话框系统（返回/结束/切歌）
- 状态管理（Idle → Playing → Paused → Switching）
- 远程控制键盘映射

---

## 当前状态

- [x] 代码全部已 commit，git working tree clean
- [x] 摄像头正常启动并显示
- [x] Firebase Auth token 验证通过
- [x] HUD 显示（时间、状态、Phase 信息）
- [x] **UI/UX Design System 完成**
- [x] **4个页面布局完成**
- [x] **Smart Framing 智能取景**（MediaPipe head/shoulder → 动态 object-position）
- [x] **手势触发优化**（GoBubble 150px, dwell 200ms, sticky hover, 15% padding）
- [x] **歌曲选择移至 Page 2**
- [ ] Rive 动画是占位符
- [ ] 手机遥控器未实现（WebSocket）
- [ ] Avatar 生成 API 集成

---

## V1 Demo 稳定性检查清单

### 目标
**一次完整会话：setup → play → result，固定流程，清晰反馈**

### 流程完整性

| 步骤 | 状态 | 说明 |
|------|------|------|
| Page 1 → Page 2 | ✅ | START 按钮正常 |
| Page 2 Avatar 生成 | ✅ | 2秒占位符动画 |
| Page 2 歌曲选择 | ✅ | 5首歌曲 + ◀/▶ |
| Page 2 → Page 3 | ✅ | GoBubble + songId 参数 |
| Page 3 游戏循环 | ✅ | 计时器运行 |
| Page 3 暂停/继续 | ✅ | Enter/Space |
| Page 3 → Result | ✅ | 计时器结束触发 |
| Result → 重玩 | ✅ | 重置计时器 |
| Result → 新歌曲 | ✅ | 返回 Page 2 |
| Result → 退出 | ✅ | 返回 Page 1 |

### 错误处理

| 场景 | 状态 | 说明 |
|------|------|------|
| 摄像头被拒绝 | ✅ | 显示错误 + Try Again 按钮 |
| MediaPipe 加载失败 | ⚠️ | 静默失败，游戏仍可运行 |
| 网络离线 | ⚠️ | API 调用失败，无离线模式 |

### 视觉反馈

| 元素 | 状态 | 说明 |
|------|------|------|
| 加载状态 | ✅ | Auth/Data/Webcam |
| Avatar 状态徽章 | ✅ | idle/generating/previewing/locked |
| 游戏 HUD | ✅ | 计时器 + 状态 |
| 歌曲进度 | ✅ | 进度条 |
| 暂停覆盖层 | ✅ | 半透明背景 + Paused 文字 + 继续提示 |
| 动作指引 | ❌ | 无"做什么"提示 |

### V1 Demo 关键缺口

#### 必须修复 (Critical)

1. **无动作指引** ⬅️ 待解决
   - 游戏只有计时器
   - 用户不知道该做什么动作
   - 需要：卡通形象根据 Flow 做动作引导用户

2. **~~暂停状态不明显~~** ✅ 已修复 (2026-02-06)
   - 添加 `PauseOverlay` 组件
   - 显示暂停图标 + "Paused" 文字
   - 显示 "Press Enter or remote confirm to resume" 提示
   - 摄像头画面变暗

3. **~~摄像头错误恢复~~** ✅ 已修复 (2026-02-06)
   - 添加 `CameraError` 组件
   - 显示摄像头错误图标 + 错误信息
   - 显示 "Try Again" 重试按钮
   - `use-webcam.ts` 添加 `retry()` 函数

#### 可选优化 (Nice to Have)

4. **MediaPipe 加载指示器**
   - 目前静默加载
   - 可显示"准备摄像头..."

5. **离线回退**
   - API 调用静默失败
   - 可缓存上次的 flow/params

### 键盘控制（远程模拟）

| 按键 | 功能 |
|------|------|
| Enter / Space | 暂停/继续 |
| ArrowLeft | 返回 Avatar 页 |
| ArrowRight | 提前结束 |
| S | 切换歌曲 |

### 技术细节

#### Smart Framing
- 请求 1280×720 视频
- 使用 `object-cover` + 动态 `object-position`
- 从 MediaPipe head/shoulder Y 计算偏移
- EMA 平滑（系数 0.1）
- 边界：10-40%，默认 25%

#### 手势检测
- 指尖估算：wrist + (wrist - elbow) × 0.4
- Dwell time：300ms (GestureButton), 200ms (GoBubble)
- Debounce：2000ms
- Sticky hover：200ms 宽限期
- Padding：15% 增大触发区域

---

## 下一步计划

### 🔴 V1 Stable Demo（当前优先）
目标：**一次可靠的完整会话 demo**

- [x] 添加暂停视觉覆盖层 ✅ (2026-02-06)
- [x] 添加摄像头错误重试按钮 ✅ (2026-02-06)
- [ ] **卡通形象动作引导系统** ⬅️ 当前任务
- [ ] 端到端测试完整流程

### Rive — Phase 1（最小可用动画）
- [ ] 创建基础 Rive 动画文件
- [ ] 状态机设计（idle/pose/transition）
- [ ] 与 Page 1/2/3 集成

### Step 9：手机遥控器（V1.1）
- [ ] WebSocket 服务
- [ ] 手机端 PWA 页面
- [ ] QR 码配对

### Step 10：Avatar Reference
- [ ] Avatar 生成 API 集成
- [ ] 实时叠加显示

### Rive — Phase 2（深化动画）
- [ ] 情绪表情
- [ ] 节奏动画
- [ ] 成就感反馈

---

## 环境配置

### Backend `.env`
```
FIREBASE_SERVICE_ACCOUNT_PATH=/Users/hh/Newproject/2Movement Coach/Movement-Coach/backend/credentials/service-account.json
GOOGLE_CLOUD_PROJECT=movement-coach-62e3c
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_AUTH_DEBUG=false
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBq8BO73pgGed0y94bK9GtmKJOtnT9dyBk
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=movement-coach-62e3c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=movement-coach-62e3c
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=movement-coach-62e3c.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=25671856112
NEXT_PUBLIC_FIREBASE_APP_ID=1:25671856112:web:1bdc00f77d04feb247b735
```

---

## 启动命令

```bash
# Backend
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev
```

---

*最后更新: 2026-02-06 (Gap 2 & 3 fixed: PauseOverlay + CameraError)*
