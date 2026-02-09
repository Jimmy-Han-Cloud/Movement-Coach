# Movement Coach - 完整工作流程

> 此文档是项目的核心参考文档，包含：
> - PRD 核心原则（不可变）
> - 动作安全约束
> - 完整用户流程
> - 技术实现指南
> - 关键决策记录
>
> Last Updated: 2026-02-06

---

## Part 1: 核心原则（PRD v1 Immutable）

### 产品定义
- **类型**：浏览器端、摄像头驱动、音乐同步的引导式运动体验
- **用户**：久坐电脑用户
- **时长**：3-5 分钟（全局固定）
- **目标**：颈部、肩膀、上背、手臂的有意义运动
- **原则**：无评分、无失败、无判断

### 7 个追踪点（不可变）

| # | 名称 | 说明 |
|---|------|------|
| 1 | Head | 前额中心 |
| 2 | Left Shoulder | 左肩 |
| 3 | Right Shoulder | 右肩 |
| 4 | Left Elbow | 左肘 |
| 5 | Right Elbow | 右肘 |
| 6 | Left Hand | 左手腕（估算手掌位置） |
| 7 | Right Hand | 右手腕（估算手掌位置） |

**不可变**：没有任何 Phase、Flow 或功能可以减少或替换这些点。

### 动作语义（不可变）

| 类型 | 应用于 | 验证规则 |
|------|--------|---------|
| **Pose Hold** | Head, Shoulders, Elbows | 到达目标位置 + 保持时间（1.5-3秒） |
| **Hand Motion** | Both Hands | 起止位置对齐 + 方向正确 + 节奏匹配 |

**关键**：手肘必须参与，不允许仅手腕运动。

### Phase 模型（不可变结构）

系统由显式 Phase 组成：
- Neutral / Calibration phases（校准）
- Pose Hold phases（姿势保持）
- Hand Motion phases（手部运动）

Phase 顺序在每个 Flow 中固定，个性化不会改变 Phase 语义。

### 安全约束（不可个性化）

| 约束 | 说明 |
|------|------|
| 最小保持时间 | Pose Hold 不能低于安全阈值 |
| 最小手肘参与 | 手部运动必须有手肘配合 |
| 肩部打开 | 每次会话至少一个有效的肩部打开动作 |

### 个性化范围

**可调整（逐步、有界）：**
- 姿势保持时长
- 位置容差
- 手肘参与阈值
- 手部运动节奏

**不可调整：**
- 会话总时长
- Phase 顺序
- 动作语义类型
- 追踪点数量

### 智能逻辑（仅授权）

| 逻辑 | 状态 | 说明 |
|------|------|------|
| ① 意图检测 | ✅ 授权 | 检测用户是否向目标移动，仅影响反馈语气 |
| ② 微调时间 | ✅ 授权 | Phase 时长可调 ±0.5s，不跳过/重排 Phase |
| 其他 | ❌ 禁止 | V1 不存在其他智能逻辑 |

---

## Part 2: 动作安全约束

### 核心哲学

1. **动作是受约束的，不是发明的**
   - 所有动作来自预定义动作库
   - 随机性是组合性的，不是生成性的

2. **控制 > 幅度**
   - 优先：控制参与、关节参与、结构完整
   - 不追求：大幅度、夸张角度、视觉戏剧化

### 全局安全约束

| 约束 | 说明 |
|------|------|
| 无弹道运动 | 无突然加速/减速，无甩动/抽动 |
| 颈部保护 | 头部运动缓慢、有意识，无快速旋转 |
| 肩肘必须参与 | 手部运动必须有肩肘配合 |

### 时间原则

| 原则 | 说明 |
|------|------|
| 保持时间必须 | 静态位置必须有意到达并保持 |
| 动静交替 | 有效序列在 Pose Hold 和 Hand Motion 间交替 |
| 节奏不强制 | 音乐节奏引导但不强制，安全优先 |

### 评估哲学

| 评估 | 说明 |
|------|------|
| 参与 > 精确 | 评估关节是否有意义地参与，不评估精确角度 |
| 努力独立于成功 | 正在努力但未到达 ≠ 没有运动 |

### 系统明确避免

- ML 动作分类用于实时验证
- 竞争性评分或排名
- 二元通过/失败判断
- 强制对称
- 高速或大幅度编舞

---

## Part 3: 产品概述

**Movement Coach** - 浏览器端、摄像头驱动、音乐同步的引导式运动体验。

- 目标用户：久坐电脑用户
- 会话时长：3-5 分钟
- 核心价值：通过卡通形象引导用户完成颈部、肩膀、上背和手臂的运动

---

## 页面流程总览

```
Page 1 (Welcome)
    ↓ 点击 START 或遥控器确认
Page 2 (Avatar Setup)
    ├── 生成阶段：Generate → 卡通形象预览 → Confirm
    └── 选歌阶段：选歌 → 触发气泡 → 系统生成 Flow
    ↓
Page 3 (Game)
    ├── 卡通形象根据 Flow 做动作
    ├── 用户跟随，系统检测 7 个追踪点
    └── 完成或提前结束
    ↓
Page 4 (Result)
    ├── AI 生成反馈
    └── 重复 / 新歌曲 / 退出
```

---

## Page 1 - Welcome（欢迎页）

### 功能
- 展示产品信息和介绍
- 显示二维码供用户扫描连接手机遥控器
- START 按钮进入下一页

### 用户操作
| 操作方式 | 动作 |
|---------|------|
| 鼠标 | 点击 START 按钮 |
| 手机遥控器 | 确认键 |

### 进入条件
- 点击后直接进入 Page 2

---

## Page 2 - Avatar Setup（形象设置）

### 阶段 1：生成卡通形象

#### 触发生成
| 操作方式 | 动作 |
|---------|------|
| 鼠标 | 点击 Generate 按钮 |
| 手机遥控器 | 左键 |
| 手势 | 手停留在左键区域 300ms |

#### 生成流程
1. 系统抓拍用户照片
2. 发送到后端生成卡通形象
3. 返回卡通形象显示在屏幕上

#### 卡通形象特征
| 属性 | 值 |
|------|-----|
| 透明度 | 90% |
| 头部比例 | 比真实大 10%（显得可爱） |
| 表情 | 喜怒哀乐轮流切换 |
| Pose | 轮流指向左键、右键位置（指示用户操作） |

#### 数据存储
- 后端**不保存**用户照片
- 后端**不保存**卡通形象
- 用户退出系统后形象丢失

#### 不满意可重新生成
三种方式触发 Regenerate（同 Generate）

#### 确认形象
| 操作方式 | 动作 |
|---------|------|
| 鼠标 | 点击 Confirm Avatar 按钮 |
| 手机遥控器 | 右键 |
| 手势 | 手停留在右键区域 300ms |

---

### 阶段 2：选择歌曲

#### 界面变化
- 卡通形象锁定（不可修改）
- 下方出现音乐选择栏
- 右侧出现 Go 气泡

#### 卡通形象行为（选歌阶段）
| 属性 | 值 |
|------|-----|
| Pose | 轮流指向**左键 → 右键 → 气泡**（3 个位置循环） |
| 表情 | 喜怒哀乐轮流切换 |
| 说明 | 这是预设 Pose，不是跟随 Flow |

#### 选歌操作
| 操作方式 | 左键 | 右键 |
|---------|------|------|
| 鼠标 | 上一首 | 下一首 |
| 手机遥控器 | 上一首 | 下一首 |
| 手势 | 手停留触发 | 手停留触发 |

#### 歌曲预览
- 切换歌曲时可**实时 preview 音乐**
- 此时**没有 Flow/Phase**，只是音乐预览

#### 手机遥控器选歌键
- 打开下拉菜单选歌
- 功能与屏幕选歌栏类似

#### 确认歌曲（触发气泡）
| 操作方式 | 动作 |
|---------|------|
| 鼠标 | 点击 Go 气泡 |
| 手机遥控器 | 确认键 |
| 手势 | 手停留在气泡区域 200ms |

#### Flow 生成（后台）
1. 系统分析音乐特征（节奏、时长）
2. 从数据库拉取 Phase 片段
3. 根据节奏和时长编排成完整 Flow
4. 允许消耗一点时间生成
5. 完成后进入 Page 3

---

## Page 3 - Game（游戏）

### 卡通形象引导

#### 卡通形象特征
| 属性 | 值 |
|------|-----|
| 透明度 | 80% |
| 大小 | 与真人基本一致 |
| 头部比例 | 比真实略大（显得可爱） |
| 位置 | 与真人重叠 |

#### 动作引导
- 卡通形象根据 Flow 信息做动作
- 用户跟随卡通形象的动作
- 系统检测用户是否完成动作

---

### 动作检测

#### 7 个追踪点
| 编号 | 名称 | 说明 |
|------|------|------|
| 1 | Head | 前额中心 |
| 2 | Left Shoulder | 左肩 |
| 3 | Right Shoulder | 右肩 |
| 4 | Left Elbow | 左肘 |
| 5 | Right Elbow | 右肘 |
| 6 | Left Hand | 左手掌估算点 |
| 7 | Right Hand | 右手掌估算点 |

#### 手掌位置估算
```
手掌位置 = 手腕 + (手腕 - 手肘) × 0.4
```
- 手腕向手肘反方向延伸
- 约一个手掌的长度

#### Phase 包含信息
- 7 个点的目标位置
- 保持时间（Pose Hold）
- 手部运动轨迹（Hand Motion）

---

### 用户控制

#### 屏幕控制
| 操作 | 效果 | 需要确认 |
|------|------|---------|
| 鼠标点击后退 | 刷新 Page 2，可重新生成形象 | - |

#### 手机遥控器
| 按键 | 功能 | 需要确认 |
|------|------|---------|
| 左键 | 结束游戏 → 返回 Page 2 选歌 | ✅ 弹窗确认 |
| 选歌键 | 同左键 | ✅ 弹窗确认 |
| 确认键 | 暂停 / 播放 | ❌ 直接执行 |
| 右键 | 结束游戏 → 进入 Page 4 | ✅ 弹窗确认 |

#### 键盘映射（模拟遥控器）
| 按键 | 功能 |
|------|------|
| ArrowLeft | 返回 Page 2（需确认） |
| ArrowRight | 结束游戏到 Page 4（需确认） |
| Enter / Space | 暂停 / 播放 |
| S | 切换歌曲（需确认） |

---

### 游戏结束条件
1. 歌曲播放完毕（自动）
2. 用户按右键结束（手动）

---

## Page 4 - Result（结果页）

### 内容
- 完成百分比显示
- AI 生成简短反馈
- 三个操作按钮

### 按钮功能
| 位置 | 按钮 | 功能 |
|------|------|------|
| 左 | Repeat | 重复当前歌曲 → 快速回到 Page 3 |
| 中 | New Song | 重新选歌 → 返回 Page 2 |
| 右 | Exit | 退出 → 返回 Page 1 |

### 手机遥控器
| 按键 | 对应按钮 |
|------|---------|
| 左键 | Repeat（重复） |
| 确认键 | New Song（新歌曲） |
| 右键 | Exit（退出） |
| 选歌键 | 无功能（Page 4 只有 3 个按钮） |

---

## 技术架构

### 卡通形象系统

#### Page 2 行为
| 阶段 | Pose | 表情 |
|------|------|------|
| 生成预览 | 指向左键、右键（交替） | 喜怒哀乐切换 |
| 选歌阶段 | 指向左键、右键、气泡（三位置循环） | 喜怒哀乐切换 |

#### Page 3 行为
| 属性 | 值 |
|------|-----|
| Pose | 根据 Flow 的 Phase 信息做动作 |
| 表情 | 根据用户表现反馈（待定） |

### Flow 生成系统

#### 输入
- 歌曲音频特征（节奏、时长、节拍）

#### 处理
1. 分析音乐特征
2. 从 Phase 片段库匹配
3. 根据节奏编排顺序
4. 生成完整 Flow

#### 输出
- Flow JSON（包含多个 Phase）
- 每个 Phase 包含：位置、时间、轨迹

### Phase 类型

| 类型 | 追踪点 | 验证规则 |
|------|--------|---------|
| Neutral | Head, Shoulders, Elbows | 无验证，记录基线 |
| Pose Hold | Head, Shoulders, Elbows | 到达位置 + 保持时间 |
| Hand Motion | Hands, Elbows | 起止位置 + 方向 + 节奏 |

---

## 手机遥控器按键总览

| 页面 | 左键 | 选歌键 | 确认键 | 右键 |
|------|------|--------|--------|------|
| Page 1 | - | - | 进入 Page 2 | - |
| Page 2 生成 | Generate | - | - | Confirm Avatar |
| Page 2 选歌 | 上一首 | 下拉选歌 | 触发气泡 | 下一首 |
| Page 3 | 返回 Page 2 | 返回 Page 2 | 暂停/播放 | 结束到 Page 4 |
| Page 4 | Repeat | 无功能 | New Song | Exit |

---

## 设计原则

### 安全约束（不可个性化）
- 最小姿势保持时间
- 最小手肘参与阈值
- 每次会话至少一个有效的肩部打开动作

### 可个性化（逐步调整）
- 姿势保持时长
- 位置容差
- 手肘参与阈值
- 手部运动节奏

### 不可个性化
- 会话总时长
- Phase 顺序
- 运动语义类型
- 追踪点（始终 7 个）

---

## 智能逻辑（仅授权）

### ✅ Smart Logic ① - 意图检测
- 检测用户是否正在向目标移动
- 仅影响反馈语气
- 不影响成功判定、计时或验证

### ✅ Smart Logic ② - 微调时间
- Phase 时长可调整 ±0.5 秒
- 仅在 Phase 内
- 不跳过或重排 Phase
- 不违反安全约束

### ❌ 其他智能逻辑
- V1 不存在其他智能逻辑

---

## Rive 动画系统实施指南

> 此部分记录卡通形象动作引导系统的实现计划（缺口 1）
> Added: 2026-02-06

### 为什么选择 Rive

| 优点 | 说明 |
|------|------|
| 免费 | 基础版免费，够用 |
| 网页编辑器 | 不需要安装软件，浏览器打开 https://rive.app |
| 状态机 | 可以根据 Phase 切换动画 |
| 轻量 | 文件小，加载快 |
| React 支持 | 有官方 `@rive-app/react-canvas` 库 |

---

### 学习 Rive 基础（Day 1-2）

#### Step 1：注册 Rive 账号
1. 打开 https://rive.app
2. 点击 "Get Started" 注册（可用 Google 账号）
3. 进入 Rive Editor（网页版）

#### Step 2：官方教程
| 教程 | 链接 | 时长 | 学习内容 |
|------|------|------|---------|
| 1. 界面介绍 | https://rive.app/learn-rive | 10分钟 | 编辑器基本操作 |
| 2. 绘制形状 | 同上 | 15分钟 | 画圆、矩形、路径 |
| 3. 骨骼绑定 | 同上 | 20分钟 | 让角色可以动 |
| 4. 动画基础 | 同上 | 20分钟 | 关键帧动画 |
| 5. 状态机 | 同上 | 30分钟 | 根据输入切换动画 |

#### Step 3：社区资源
- 地址：https://rive.app/community
- 可下载免费角色模板学习和修改

---

### 角色设计需求

#### 角色部位
| 部位 | 要求 |
|------|------|
| 头部 | 比真实大 10%，有表情变化 |
| 身体 | 简化的上半身 |
| 手臂 | 可以举起、放下、指向 |
| 手 | 可以挥动 |

#### 需要的动画列表

**Page 2 用（预设循环）：**
| 动画 | 描述 | 循环 |
|------|------|------|
| `idle` | 待机呼吸 | ✅ |
| `point_left` | 指向左键 | ✅ |
| `point_right` | 指向右键 | ✅ |
| `point_go` | 指向气泡 | ✅ |
| `emotion_happy` | 开心表情 | |
| `emotion_neutral` | 平静表情 | |

**Page 3 用（跟随 Flow）：**
| 动画 | 描述 | Phase 类型 |
|------|------|-----------|
| `neutral_pose` | 中立姿势 | Neutral |
| `arms_up` | 双手举起 | Pose Hold |
| `arms_out` | 双手展开 | Pose Hold |
| `neck_tilt_left` | 头向左倾 | Pose Hold |
| `neck_tilt_right` | 头向右倾 | Pose Hold |
| `wave_motion` | 手部挥动 | Hand Motion |

---

### 状态机设计

```
┌─────────────────────────────────────────────────────┐
│                    State Machine                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  输入（Inputs）:                                      │
│  ├── phase_type: Number (0=neutral, 1=pose, 2=motion)│
│  ├── pose_index: Number (具体哪个动作)                │
│  └── emotion: Number (0=neutral, 1=happy, 2=sad...)  │
│                                                      │
│  状态（States）:                                      │
│  ├── Idle Layer (always playing)                     │
│  │   └── idle (breathing animation)                  │
│  │                                                   │
│  ├── Pose Layer                                      │
│  │   ├── neutral_pose                                │
│  │   ├── arms_up                                     │
│  │   ├── arms_out                                    │
│  │   └── neck_tilt                                   │
│  │                                                   │
│  └── Emotion Layer                                   │
│      ├── emotion_happy                               │
│      ├── emotion_neutral                             │
│      └── emotion_sad                                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

### 前端集成代码

#### 文件位置
```
frontend/modules/visual-feedback/rive-character.tsx  (已存在占位组件)
frontend/public/avatar.riv                           (待创建)
```

#### 集成代码示例
```tsx
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect } from 'react';

interface RiveCharacterProps {
  phaseType: number;   // 0=neutral, 1=pose_hold, 2=hand_motion
  poseIndex: number;   // 具体动作索引
  emotion: number;     // 表情索引
}

export function RiveCharacter({ phaseType, poseIndex, emotion }: RiveCharacterProps) {
  const { rive, RiveComponent } = useRive({
    src: '/avatar.riv',
    stateMachines: 'MainStateMachine',
    autoplay: true,
  });

  // 获取状态机输入
  const phaseInput = useStateMachineInput(rive, 'MainStateMachine', 'phase_type');
  const poseInput = useStateMachineInput(rive, 'MainStateMachine', 'pose_index');
  const emotionInput = useStateMachineInput(rive, 'MainStateMachine', 'emotion');

  // 当 phase 变化时，更新状态机
  useEffect(() => {
    if (phaseInput) phaseInput.value = phaseType;
    if (poseInput) poseInput.value = poseIndex;
    if (emotionInput) emotionInput.value = emotion;
  }, [phaseType, poseIndex, emotion, phaseInput, poseInput, emotionInput]);

  return <RiveComponent className="w-full h-full" />;
}
```

---

### 实施计划

#### 阶段 1：学习 Rive（Day 1-2）
| 任务 | 时间 |
|------|------|
| 注册账号，熟悉界面 | 30分钟 |
| 完成官方教程 1-5 | 2小时 |
| 下载社区模板练习 | 1小时 |
| 尝试创建简单角色 | 2小时 |

#### 阶段 2：创建角色（Day 3-4）
| 任务 | 时间 |
|------|------|
| 设计角色外观 | 2小时 |
| 设置骨骼绑定 | 2小时 |
| 创建基础动画（idle, point） | 3小时 |
| 创建动作动画（arms_up, wave） | 3小时 |

#### 阶段 3：状态机（Day 5）
| 任务 | 时间 |
|------|------|
| 设置状态机输入 | 1小时 |
| 连接动画到状态 | 2小时 |
| 测试状态切换 | 1小时 |

#### 阶段 4：前端集成（Day 6）
| 任务 | 时间 |
|------|------|
| 导出 .riv 文件 | 10分钟 |
| 更新 RiveCharacter 组件 | 1小时 |
| 连接 Phase Engine | 2小时 |
| 测试完整流程 | 1小时 |

---

### 备选方案

#### 方案 C1：使用 Rive 社区资源
- 下载接近的角色模板
- 修改动画适应需求
- 比从零开始快很多

推荐搜索关键词：
- "character"
- "person"
- "avatar"

#### 方案 C2：委托设计
平台：
- Fiverr（搜索 "Rive animation"）
- Upwork
- 价格通常 $50-200

---

---

## Part 6: 架构实现状态

> 对比设计架构与实际实现

### 设计架构（Hard Boundary）

```
Frontend (Next.js):
- Webcam getUserMedia
- MediaPipe Pose to extract the 7 points
- Real-time Phase Engine + validators
- Rive animation playback (reference guide)
- Visual feedback overlays

Backend (Python FastAPI on Cloud Run):
- Firebase Anonymous Auth integration
- Firestore storage: users, sessions, flows, personalization params
- Post-session Gemini summarization only (no real-time)
- Stores only symbolic session outcomes, not raw frames
```

### Frontend 实现状态

| 设计要求 | 状态 | 实现位置 |
|---------|------|---------|
| Webcam getUserMedia | ✅ 已完成 | `lib/use-webcam.ts` |
| MediaPipe Pose (7 points) | ✅ 已完成 | `modules/pose-validation/mediapipe-tracker.ts` |
| Real-time Phase Engine | ✅ 已完成 | `modules/flow-engine/phase-engine.ts` |
| Validators | ✅ 已完成 | `modules/pose-validation/pose-hold-validator.ts`, `hand-motion-validator.ts` |
| Rive animation playback | ⚠️ 占位符 | `modules/visual-feedback/rive-character.tsx` (无实际动画) |
| Visual feedback overlays | ✅ 已完成 | `modules/visual-feedback/phase-hud.tsx`, `skeleton-canvas.tsx` |

### Backend 实现状态

| 设计要求 | 状态 | 实现位置 |
|---------|------|---------|
| Firebase Anonymous Auth | ✅ 已完成 | `backend/app/services/auth.py` |
| Firestore - users | ⚠️ 需验证 | 可能在 user_params 中 |
| Firestore - sessions | ✅ 已完成 | `backend/app/routers/sessions.py` |
| Firestore - flows | ✅ 已完成 | `backend/app/routers/flows.py` |
| Firestore - personalization params | ✅ 已完成 | `backend/app/routers/user_params.py` |
| Post-session Gemini summarization | ✅ 已完成 | `backend/app/services/gemini.py` |
| Symbolic outcomes only (no raw frames) | ✅ 符合设计 | 无图像存储逻辑 |

### 未完成项目

| 功能 | 状态 | 说明 |
|------|------|------|
| Rive 动画 | ❌ 未完成 | 组件存在但无实际 .riv 文件和动画 |
| Avatar 生成 API | ❌ 未集成 | 前端是 2 秒占位符，后端有 `avatar.py` 但未连接 |
| 音乐分析 → Flow 生成 | ❓ 需验证 | WORKFLOW 说要分析音乐生成 Flow，需确认后端是否实现 |
| 手机遥控器 | ❌ 未完成 | WebSocket 未实现，QR 配对未实现 |

### 差距总结

| 类别 | 设计 | 现状 | 差距 |
|------|------|------|------|
| 前端核心 | 5 项 | 4 项完成 | Rive 未完成 |
| 后端核心 | 4 项 | 4 项完成 | ✅ 一致 |
| 额外功能 | - | - | Avatar API、音乐分析、遥控器 |

---

## Part 7: 关键技术决策记录

> 记录开发过程中的重要设计决策

### 2026-02-06 决策

#### 1. Smart Framing（智能取景）
**问题**：用户只能看到大头照，看不到上半身
**决策**：使用 MediaPipe head/shoulder Y 坐标动态计算 `object-position`
**实现**：
- 请求 1280×720 视频
- `object-cover` 保持无黑边
- `object-position: center ${offset}%` 动态调整
- EMA 平滑（系数 0.1）
- 边界：10-40%，默认 25%

#### 2. 手势触发优化
**问题**：手势触发不够灵敏
**决策**：
- GoBubble 尺寸增大到 150px
- Dwell time 减少：GestureButton 300ms, GoBubble 200ms
- 添加 sticky hover（200ms 宽限期）
- 增大 padding 到 15%

#### 3. 手掌位置估算
**问题**：MediaPipe 只提供手腕位置，需要估算手掌/指尖
**决策**：`手掌 = 手腕 + (手腕 - 手肘) × 0.4`
**说明**：手掌长度约为前臂的 40%

#### 4. 歌曲选择位置
**问题**：歌曲选择最初在 Page 3
**决策**：移至 Page 2，让 Page 3 成为纯执行空间
**实现**：
- Page 2 添加 SongCarousel + GoBubble
- Page 3 通过 URL 参数接收 songId
- Page 3 的歌曲显示为只读

#### 5. 暂停视觉反馈
**问题**：暂停时无明显视觉区分
**决策**：添加 PauseOverlay 组件
**实现**：
- 半透明黑色背景（40%）
- 暂停图标（两个竖条）
- "Paused" 文字
- 继续操作提示

#### 6. 摄像头错误恢复
**问题**：摄像头失败后无法重试
**决策**：添加 CameraError 组件 + retry 函数
**实现**：
- 错误图标 + 错误信息
- "Try Again" 按钮
- `use-webcam.ts` 添加 `retry()` 方法

#### 7. 卡通形象动画方案
**问题**：卡通形象不会动，无法引导用户
**决策**：使用 Rive 动画系统
**理由**：
- 免费、网页编辑器
- 支持状态机（根据 Phase 切换动画）
- 轻量、React 支持好
**状态**：待实施（见 Rive 动画系统实施指南）

---

*此文档基于 2026-02-06 与用户确认的完整流程*
*PRD 核心原则、动作安全约束、关键决策记录添加于 2026-02-06*
