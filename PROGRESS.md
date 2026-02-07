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
- [ ] Rive 动画是占位符
- [ ] 手机遥控器未实现（WebSocket）
- [ ] Avatar 生成 API 集成

---

## 下一步计划

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

*最后更新: 2026-02-06*
