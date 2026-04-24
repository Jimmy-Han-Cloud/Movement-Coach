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

### Backend（11 步 + Avatar 功能）✅

| Step | 描述 | 关键文件 |
|------|------|----------|
| 1 | 项目骨架 FastAPI + Uvicorn | `backend/app/main.py` |
| 2 | Flow 数据模型 + Flow API | `backend/app/models/flow.py`, `backend/app/routes/flow.py` |
| 3 | Session 生命周期 (create, submit, get) | `backend/app/models/session.py`, `backend/app/routes/session.py` |
| 4 | Firestore 集成 (含内存 fallback) | `backend/app/services/firestore.py` |
| 5 | Gemini API post-session summary | `backend/app/services/gemini.py` |
| 6 | CORS + Firebase Auth 中间件 | `backend/app/services/auth.py` |
| 7 | User personalization parameters | `backend/app/models/user_params.py`, `backend/app/routes/user_params.py` |
| 8 | Debug endpoints + production mode | `backend/app/routes/debug.py` |
| + | Avatar 生成 (照片→卡通头像) | `backend/app/services/avatar.py` |
| 9 | Phase 模板库 (10 模板 + seed + CRUD) | `backend/app/models/phase_template.py`, `backend/app/services/phase_template.py`, `backend/app/routes/phase_template.py` |
| 10 | Flow 动态生成服务 | `backend/app/models/flow_generate.py`, `backend/app/services/flow_generator.py` |
| 11 | 安全加固 (routes 隔离 + .gitignore) | `backend/app/routes/debug.py`, `backend/.gitignore` |

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
- 手势触发交互（GestureButton 400ms dwell, GoBubble 200ms dwell, 2s debounce）
- 确认对话框系统（返回/结束/切歌）
- 状态管理（Playing → Paused → Switching → Finished）
- 全页面键盘映射（P1/P2/P3/P4 全覆盖）

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
- [x] **全页面键盘映射** (2026-02-09) — P1/P2/P3/P4 所有状态
- [x] **Avatar 生成失败 UI** (2026-02-09) — 红色 StatusBadge "Generation failed. Retry."
- [x] **UX_SPEC.md v1.1** (2026-02-09) — 与实现对齐的权威 UX 文档
- [x] **Phase 模板库存入 Firestore** ✅ (2026-02-09) — 10 模板 + seed 端点 + CRUD API
- [x] **Flow 动态生成服务** ✅ (2026-02-09) — `POST /api/flows/generate`，60-600s 任意时长
- [x] **安全加固** ✅ (2026-02-09) — routes 无直接 Firestore 访问、.gitignore 加固、PROGRESS.md 移除真实配置
- [ ] Frontend 接入动态 Flow（game 页面仍只用计时器） ⬅️ 下一步
- [ ] Rive 动画（用户制作中）
- [ ] Avatar 生成 API 集成
- [ ] 手机遥控器未实现（WebSocket）

---

## 架构实现状态

> 对比设计架构与实际实现（详见 WORKFLOW.md Part 6）

### Frontend 实现状态

| 设计要求 | 状态 | 说明 |
|---------|------|------|
| Webcam getUserMedia | ✅ | `lib/use-webcam.ts` |
| MediaPipe Pose (7 points) | ✅ | `modules/pose-validation/` |
| Real-time Phase Engine | ✅ | `modules/flow-engine/` |
| Validators | ✅ | `pose-hold-validator.ts`, `hand-motion-validator.ts` |
| Rive animation | ⚠️ 占位符 | 组件存在，无实际动画 |
| Visual feedback overlays | ✅ | `phase-hud.tsx`, `skeleton-canvas.tsx` |

### Backend 实现状态

| 设计要求 | 状态 | 说明 |
|---------|------|------|
| Firebase Anonymous Auth | ✅ | `backend/app/services/auth.py` |
| Firestore - sessions | ✅ | `backend/app/routes/session.py` |
| Firestore - flows | ✅ | `backend/app/routes/flow.py` |
| Firestore - user params | ✅ | `backend/app/routes/user_params.py` |
| Firestore - phase templates | ✅ | `backend/app/routes/phase_template.py` |
| Flow 动态生成 | ✅ | `backend/app/services/flow_generator.py` |
| Gemini summarization | ✅ | `backend/app/services/gemini.py` |
| Symbolic outcomes only | ✅ | 无图像存储 |
| 安全隔离 | ✅ | routes 不直接访问 Firestore |

### 待完成项目

| 功能 | 优先级 | 说明 |
|------|--------|------|
| Frontend Flow 集成 | 🔴 高 | game 页面接入 PhaseEngine + 动态 Flow |
| Rive 动画 | 🔴 高 | V1 Demo 必需，用户制作中 |
| Avatar 生成 API 集成 | 🟡 中 | 后端存在，前端未连接 |
| 手机遥控器 | 🟢 低 | V1.1 功能 |

---

## Phase 模板库设计（2026-02-09 确认）

### 概述

Phase 模板是独立的可复用动作片段，存储于 Firestore `phases` 集合。Flow 生成服务根据歌曲节奏/时长从模板库中选取并编排成完整 Flow。

**现状对比：**
- 现有 `services/flow.py` 中 Flow/Phase 是**硬编码**在代码里的（1 个 Flow, 8 个内联 Phase）
- 目标：Phase 作为独立实体存入 Firestore，Flow 由生成服务动态组装

### 10 个 Phase 模板

| # | ID | 类型 | Beats | Tempo | 意图 |
|---|---|---|---|---|---|
| 1 | `pose_shoulder_drop_neck_lift` | pose_hold | 4 | slow, medium | 肩膀下沉 + 颈部伸展 |
| 2 | `pose_chest_open_bilateral` | pose_hold | 4 | slow, medium | 胸部打开，双侧 |
| 3 | `pose_shoulder_lift_release` | pose_hold | 4 | slow, medium | 肩膀上提 + 释放 |
| 4 | `pose_elbow_overhead_reach` | pose_hold | 4 | slow, medium | 手肘过头伸展 |
| 5 | `motion_arm_diagonal_up_sweep` | hand_motion | 2 | medium, fast | 对角线向上扫臂 |
| 6 | `motion_arm_alternate_up_down` | hand_motion | 2 | medium, fast | 交替上下摆臂 |
| 7 | `motion_arm_vertical_alternate` | hand_motion | 2 | medium, fast | 垂直前方交替 |
| 8 | `motion_arm_accented_circular_loop` | hand_motion | 2 | medium, fast | 重音圆形节奏循环 |
| 9 | `neutral_reset_breath` | neutral | 2 | slow, medium, fast | 呼吸重置 |
| 10 | `neutral_shoulder_release` | neutral | 2 | slow, medium, fast | 肩膀被动释放 |

### 数据模型（Firestore Document）

```json
{
  "id": "pose_shoulder_drop_neck_lift",
  "type": "pose_hold",
  "beats_required": 4,
  "tempo_profile": ["slow", "medium"],
  "body_constraints": {
    "posture": "seated",
    "hand_out_of_frame_allowed": true,
    "max_arm_height": "unlimited"
  },
  "primary_anchors": ["shoulder", "elbow"],
  "intent": "Shoulders sink downward while the head gently elongates upward. No tilt, no rotation.",
  "verification_notes": [
    "Head stays centered",
    "No side bending",
    "Calm, decompressive feeling"
  ],
  "status": "active",
  "version": 1
}
```

### 关键设计决策

#### 1. `intent` + `verification_notes` 替代 `description`

**决定**：不用单个 `description` 字符串，改为结构化的 `intent`（字符串）+ `verification_notes`（数组）。

**原因**：
- `intent` → Rive 动画选择、AI Summary、Debug 用
- `verification_notes` → Phase Engine 验证 checklist、QA 对照、AI 评估
- 低成本、高收益的结构化设计

#### 2. `primary_anchors` 分组简写

**决定**：模板层用分组名（`shoulder`, `elbow`, `hand`），Flow 生成时展开为具体追踪点（`left_shoulder`, `right_shoulder` 等）。

**原因**：
- V1 的 10 个 Phase 全是**双侧对称**动作，不需要区分左右
- 模板更简洁可读
- 展开逻辑在 Flow 生成服务中，单一职责
- 向后兼容：将来加单侧动作可以直接用 `left_hand` 等值，与 `hand` 共存

**层级关系**：
```
模板层 (Firestore)          运行时层 (Phase Engine)
"shoulder"            →     ["left_shoulder", "right_shoulder"]
"elbow"               →     ["left_elbow", "right_elbow"]
"hand"                →     ["left_hand", "right_hand"]
```

### 实施状态

- [x] 10 个 Phase 内容设计完成
- [x] 数据模型字段确认
- [x] 设计决策记录
- [x] 写入 Firestore ✅ (2026-02-09) — `backend/app/services/phase_template.py`
- [x] Flow 生成服务 ✅ (2026-02-09) — `backend/app/services/flow_generator.py`
- [ ] Frontend 接入（替换 game 页面纯计时器）

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
| 页面/状态 | ArrowLeft | ArrowRight | Enter/Space | S |
|-----------|-----------|------------|-------------|---|
| P1 Welcome | — | — | START | — |
| P2 idle | Generate | — | Generate | — |
| P2 generating | — | — | — | — |
| P2 previewing | Regenerate | Confirm Avatar | Confirm Avatar | — |
| P2 selecting-song | Prev Song | Next Song | Lock & Start | — |
| P3 Playing | Return P2 (c) | End early (c) | Pause | Change song (c) |
| P3 Paused | Return P2 (c) | End early (c) | Resume | Change song (c) |
| P3 Dialog | Cancel | — | Confirm | — |
| P4 Result | Repeat | Exit | New Song | — |

*(c) = 需要确认对话框*

### 技术细节

#### Smart Framing
- 请求 1280×720 视频
- 使用 `object-cover` + 动态 `object-position`
- 从 MediaPipe head/shoulder Y 计算偏移
- EMA 平滑（系数 0.1）
- 边界：10-40%，默认 25%

#### 手势检测
- 指尖估算：wrist + (wrist - elbow) × 0.4
- Dwell time：400ms (GestureButton), 200ms (GoBubble)
- Debounce：2000ms
- Sticky hover：200ms 宽限期
- Padding：15% 增大触发区域

---

## 下一步计划

### ✅ Phase 模板库 + Flow 生成（已完成）

- [x] 添加暂停视觉覆盖层 ✅ (2026-02-06)
- [x] 添加摄像头错误重试按钮 ✅ (2026-02-06)
- [x] 全页面键盘映射 ✅ (2026-02-09)
- [x] Avatar 生成失败 UI ✅ (2026-02-09)
- [x] UX_SPEC.md v1.1 ✅ (2026-02-09)
- [x] Phase 模板设计（10 个） ✅ (2026-02-09)
- [x] Phase 模板写入 Firestore ✅ (2026-02-09)
- [x] Flow 动态生成服务 ✅ (2026-02-09)
- [x] 安全加固 ✅ (2026-02-09)

### 🔴 Frontend Flow 集成（下一步）
目标：**game 页面接入 PhaseEngine + 动态生成的 Flow**

- [ ] game 页面调用 `POST /api/flows/generate` 获取 Flow
- [ ] 接入 PhaseEngine，HUD 显示 phase name/description
- [ ] 端到端测试完整流程

### 🔴 Rive 动画（用户制作中）
- [ ] 创建基础 Rive 动画文件（骨架）
- [ ] 状态机设计（idle/pose/transition）
- [ ] 与 Page 1/2/3 集成

### 🟡 Avatar 生成 API 集成
- [ ] 前后端连接
- [ ] 实时叠加显示

### 🟢 手机遥控器（V1.1）
- [ ] WebSocket 服务
- [ ] 手机端 PWA 页面
- [ ] QR 码配对

---

## 环境配置

> 真实值不纳入版本控制。

- **Backend**: 复制 `backend/.env.example` → `backend/.env`，填入真实值
- **Frontend**: 复制 `frontend/.env.example` → `frontend/.env.local`，填入真实值

---

## 启动命令

```bash
# Backend
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev
```

---

---

## Session 2026-04-24 — 已完成

### UX 体验优化

| # | 任务 | 状态 |
|---|------|------|
| 1 | **樱花气泡动画增强** — 50片花瓣（原12片），动画1200ms，进入游戏前2秒全屏樱花雨过渡 | ✅ |
| 2 | **选歌预览音频** — 切换预置歌曲时自动播放15秒预览（音量0.4，跳过10s静音片段） | ✅ |
| 3 | **PayPal 打赏入口** — ResultModal 底部添加 QR 码区域（占位图 `/public/donate-qr.svg`，待替换真实二维码） | ✅ |

### 游戏逻辑修复

| # | 任务 | 状态 |
|---|------|------|
| 4 | **完成度评分改为基于表现** — `performanceScore` 替代纯时间进度；基于 phase 质量（ok=100%/partial=50%/missed=0%）均值计算，排除 neutral phase | ✅ |

### Flow 编排规则重写（核心）

| # | 任务 | 状态 |
|---|------|------|
| 5 | **Gemini Prompt 规则重写** — 新节奏结构：`HAND_MOTION(15-30s) → POSE_HOLD(8-12s恢复) → HAND_MOTION…`；所有8个模板必须出现；同一动作可重复，连续重复每次 ≤6s；POSE_HOLD 改为 8-15s（原20-35s） | ✅ |
| 6 | **`_cap_neutral_duration` 修复** — 原逻辑把多余秒数全堆给最后一个 phase（导致 `pose_elbow_overhead_reach` 末尾持续数十秒）；改为插入新的短 POSE_HOLD phase（≤6s，循环4种模板） | ✅ |
| 7 | **Firestore 缓存自动修复** — `_load_cached_flow` 读取后验证每个 phase 时长，超限时自动清缓存并触发重新生成（解决 Mozart Minuet 坏缓存问题） | ✅ |
| 8 | **新增 `delete_document`** — `firestore.py` 补充删除接口，支持 Firestore 和内存 fallback 两种模式 | ✅ |

### Avatar 设计

| # | 任务 | 状态 |
|---|------|------|
| 9 | **新 Avatar 设计 Brief** — 生成详细修改描述，指导 Claude Design 修正比例（头身比1:2）、面部（Pixar 风格/圆眼/微笑）、配色（coral/lavender/rose）、结构（头/颈/肩/上臂/下臂分段，适配 Rive 骨骼绑定） | ✅ |

### 待完成项

- [ ] 替换 `/public/donate-qr.svg` 为真实 PayPal 二维码
- [ ] 按新 Brief 更新 coach Avatar 形象并重新导入 Rive
- [ ] 端到端测试新 Flow 编排规则（Mozart Minuet 下次启动将自动清缓存重新生成）

*最后更新: 2026-04-24*
