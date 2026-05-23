# 开发任务追踪

**项目**: AP Physics 1 学习平台  
**Bug 分级**: P0=运行时错误 P1=核心 UX 阻断 P2=功能局部损坏 P3=体验问题 P4=样式/优化  

---

## 已完成里程碑

| 阶段 | 内容 | 完成日期 |
|------|------|---------|
| Step 1–2 | 项目脚手架、Foundation + Infrastructure 层（Dexie / Repository / Storage）| 2026-05-20 |
| Step 3–5 | Domain 纯函数（LearningFlow / AdaptiveEngine / ContentCatalog / ProgressTracker）+ Application 层（Session / Context）| 2026-05-20 |
| Step 6 | Week 1 Day 1 垂直切片、ExternalCard、56 个静态页面 | 2026-05-20 |
| Step 7–8 | AI 服务、Settings 页、导航、仪表盘、导出 | 2026-05-21 |
| Step 9 | FRQ 历年真题系统（28 道题、PDF 定位、道德审判弹窗）| 2026-05-21 |
| Step 10 | Quiz System（197 题题库、MCQ/fill/short/feynman、AI 评分、AI 追问）| 2026-05-21 |
| Step 11 | P0/P1 质量加固（并发互斥、StrictMode 防护、重复提交防护、feynman 计分修复）| 2026-05-21 |
| Step 12 | FRQ 分数回填、每日综合得分（0–100）、Dashboard 得分 badge | 2026-05-22 |

---

## 已修复 Bug 记录

| 日期 | 优先级 | 描述 | 修复方式 |
|------|--------|------|---------|
| 2026-05-21 | P0 | dispatch 并发破坏 currentSnapshot | session-context 添加 inFlight ref 互斥锁 |
| 2026-05-21 | P0 | StrictMode load effect 双触发 | 添加 cancelled flag + `.catch(console.error)` |
| 2026-05-21 | P0 | QuizPanel unmount 后 setState（mountedRef 初始化错误）| `useEffect` 同时设置 `mountedRef.current = true` |
| 2026-05-21 | P0 | Enter 键重复提交 quiz | 添加 submittingRef 守卫 |
| 2026-05-21 | P0 | Dashboard ⚡ 包含 feynman 计数（N/4 而非 N/3）| QuizResult 增加 question_type 字段，dashboard 过滤 feynman |
| 2026-05-21 | P1 | NEEDS_RETRY 阶段无任何 UI，学生无退出路径 | 添加 NeedsRetryBanner 组件 |
| 2026-05-21 | P1 | quiz 题库耗尽后无提示，静默消失 | 添加 quizChecked 状态 + 耗尽提示文字 |
| 2026-05-21 | P2 | DayListView race condition on flowState change | 拆分为两个 effect，加 cancelled flag |
| 2026-05-21 | P2 | ScorePanel 默认满分，学生不输入即可过关 | `useState(0)` 替代 `useState(max)` |
| 2026-05-21 | P2 | frq.ts sort 仅按年份不按相关性 | `b.score - a.score \|\| b.year - a.year` |
| 2026-05-21 | P3 | FRQViewer pdf.destroy() 内存泄漏 | 删除 FRQViewer.tsx（死代码）|
| 2026-05-21 | P3 | ap24-q5 等 8 处 FRQ 概念映射错误 | 手动校正 frq_map.json |
| 2026-05-21 | P3 | q-friction-002 静/动摩擦混淆 | 改为描述已在匀速运动的情形 |
| 2026-05-22 | P1 | B/C 层 checkbox 点击无效（flowState.phase 依赖不全）| useDayResources 改为依赖 `flowState`（整个对象）|
| 2026-05-22 | P1 | Quiz 提交按钮客观题无效（mountedRef StrictMode 问题）| `useEffect` 补全 `mountedRef.current = true`；客观题立即跳结果，DB 保存 fire-and-forget |

---

## 已知遗留问题

### P2（内容质量）
- quiz-bank.json difficulty-3 题目偏少（Units 2–8 各 unit 仅 3–5 题）
- 14 个概念无 FRQ 示例覆盖（含图形技能、流体力学）

### P3（技术债）
- `quiz_results` 表无保留策略，重复刷题会无限增长（bulkGet 不慢，低风险）
- `completions` 表缺少 `[user_id+week+day]` 复合索引（当前 JS 层过滤，够用）
- pass-rate 计算逻辑在 DayListView / scoring.ts / session.ts 三处重复

### P4（低优先级）
- DayListView 约 350 行，可拆为 `useQuizChallenge` hook + 独立子组件
- seed TOCTOU：多标签同时打开时 seed 可能并发两次（bulkPut 幂等，不影响数据）
- ap26 SG PDF 待 CollegeBoard 发布后替换外链为本地文件
