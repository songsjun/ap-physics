# 开发任务追踪

**项目**: AP Physics 1 学习平台  
**开始日期**: 2026-05-20  
**Bug 分级**: P1=崩溃/数据丢失 P2=核心流程阻断 P3=功能局部损坏 P4=体验问题 P5=样式  
**规则**: P3及以上全部修复后才能进入下一步

---

## Step 1 — 项目脚手架 + Foundation 层
**状态**: ✅ 完成（2026-05-20）

### 任务
- [x] 创建 Next.js 14 项目（output: export, TypeScript, Tailwind, App Router）
- [x] 安装依赖：dexie@4.4.2, @anthropic-ai/sdk, uuid, @types/uuid
- [x] 创建 lib/types.ts（所有共享类型）
- [x] 创建 lib/constants.ts（PASS_THRESHOLD, LIBRARY_VERSION等）
- [x] 配置 next.config.ts（output: 'export', images.unoptimized）
- [ ] 配置 generateStaticParams（week/day 动态路由预生成）← Step 6 创建动态路由后完成

### 验收标准
- [x] `npm run build` 无报错
- [ ] `npm run dev` 正常启动，localhost:3000 可访问（未测试，不阻断）
- [x] TypeScript 无类型错误（`npx tsc --noEmit`）
- [x] 静态导出产物在 out/ 目录生成

### 测试方法
```bash
cd ap-physics-app && npm run build && echo "BUILD OK"
npx tsc --noEmit && echo "TYPES OK"
ls out/ && echo "STATIC OK"
```

### 已知问题
（待填写）

---

## Step 2 — Infrastructure 层（Dexie + Repository + Storage）
**状态**: ✅ 完成（2026-05-20）

### 任务
- [x] 创建 lib/db.ts（getDb() 懒初始化，完整 Dexie schema）
- [x] 创建 lib/repository/interface.ts（IRepository）
- [x] 创建 lib/repository/dexie.repo.ts（DexieRepository 完整实现）
- [x] 创建 lib/repository/index.ts（export const repo）
- [x] 创建 lib/storage.ts（StorageService: userId + apiKey）
- [x] 创建 lib/queries.ts（seedContentLibrary with version check + phase/adapter_type/slot_order 派生）

### 验收标准
- [ ] 浏览器首次打开后 IndexedDB 中有 202 条 resources + 49 条 knowledge_points
- [ ] 每条 resource 有正确的 adapter_type、slot_order、phase 字段
- [ ] 再次刷新不重复写入（版本标记有效）
- [ ] `getDb()` 在 SSR 阶段抛出错误（build 时不崩溃）
- [ ] week=1 day=1 查询返回正确数量的 A/B 层资源

### 测试方法
```
浏览器 DevTools → Application → IndexedDB → PhysicsLearningDB
检查 resources 表行数，抽查 adapter_type/slot_order/phase 字段
```

---

## Step 3 — Domain 纯函数（LearningFlow + AdaptiveEngine）
**状态**: ✅ 完成（2026-05-20）— 22/22 测试通过

### 任务
- [x] 创建 lib/domain/flow.ts（computeFlowState + shouldUnlock）
- [x] 创建 lib/domain/adaptive.ts（prioritize）
- [x] 创建 tests/domain/flow.test.ts（覆盖6条决策规则）
- [x] 创建 tests/domain/adaptive.test.ts

### 验收标准（单元测试）
- [ ] Rule 1: isUnlocked=false → LOCKED ✓
- [ ] Rule 2: 有未完成 A 资源 → PRESENTING，slot/total 正确 ✓
- [ ] Rule 3: mode=REVIEW + 全部 A 完成 → COMPLETE ✓
- [ ] Rule 4: passRate≥0.75 + 全部 A 完成 → COMPLETE ✓
- [ ] Rule 5: passRate<0.75 + bCandidates 非空 → REMEDIATION ✓
- [ ] Rule 6: passRate<0.75 + bCandidates 空 → NEEDS_RETRY ✓
- [ ] shouldUnlock: STANDARD passRate≥0.75 → true ✓
- [ ] shouldUnlock: REVIEW 全完成 → true ✓
- [ ] prioritize: 概念交集多的排前面 ✓
- [ ] LearningFlow 不修改输入 snapshot（纯函数验证）✓

### 测试方法
```bash
npx vitest run tests/domain/
```
所有测试绿色通过。

---

## Step 4 — Domain I/O（ContentCatalog + ProgressTracker）
**状态**: ✅ 完成（2026-05-20）

### 任务
- [x] 创建 lib/domain/catalog.ts（ContentCatalog）
- [x] 创建 lib/domain/progress.ts（ProgressTracker with Dexie transaction）

### 验收标准
- [ ] catalog.getDay(1,1,'A') 返回 Week1 Day1 A 层资源（按 slot_order）
- [ ] catalog.getBCandidates(['kinematics-displacement-velocity-acceleration'], seenIds) 返回正确 B 层资源
- [ ] tracker.record() + getDayStats() 在同一事务内执行不报错
- [ ] passRate 计算：只计 passed/failed，排除 skipped
- [ ] getDayStats 接收外部 totalACount，不在事务内读 resources 表

### 测试方法
浏览器 Console 手动调用（或集成测试）：
```js
const { catalog } = await import('./lib/domain/catalog.js')
const r = await catalog.getDay(1, 1, 'A')
console.assert(r.length > 0, 'Week1 Day1 has A resources')
console.assert(r.every((x,i,a) => i===0 || a[i-1].slot_order <= x.slot_order), 'sorted by slot_order')
```

---

## Step 5 — Application 层（Session + Context）
**状态**: ✅ 完成（2026-05-20）

### 任务
- [x] 创建 lib/app/snapshot.ts（assembleDaySnapshot）
- [x] 创建 lib/app/session.ts（DaySessionManager）
- [x] 创建 lib/app/session-context.tsx（DayProvider + useDayContext）

### 验收标准
- [ ] session.load('test-user', 1, 1) 返回 { phase: 'PRESENTING', resource, slot:1, total:N }
- [ ] session.execute(COMPLETE_RESOURCE) 返回下一个 FlowState
- [ ] 完成当天所有 A 资源后，passRate≥0.75 时返回 COMPLETE
- [ ] 完成当天所有 A 资源，passRate<0.75，有 B 候选 → REMEDIATION
- [ ] DayProvider loading=true 时 DaySkeleton 渲染，loading=false 后显示实际内容
- [ ] dispatch 引用稳定（不触发子组件重渲染）

### 测试方法
浏览器 Console + React DevTools Profiler 检查渲染次数。

---

## Step 6 — Week 1 Day 1 垂直切片（ExternalCard + 基本流程）
**状态**: ✅ 完成（2026-05-20）— 56 个静态页面生成

### 任务
- [x] 创建 components/AppInitializer.tsx（seed + storage.persist + 数据健康检查）
- [x] 更新 app/layout.tsx（集成 AppInitializer）
- [x] 创建 components/DayView.tsx（switch FlowState）
- [x] 创建 components/adapters/ExternalCard.tsx（外链 + 手动完成确认）
- [x] 创建 app/week/[w]/day/[d]/page.tsx（DayProvider wrapper + generateStaticParams）
- [x] 创建 components/DaySkeleton.tsx

### 验收标准（浏览器手动测试）
- [ ] 访问 /week/1/day/1 显示骨架屏后加载第一个资源
- [ ] ExternalCard 显示资源标题、时长估计、「打开资源」按钮
- [ ] 「打开资源」在新标签页打开 URL
- [ ] 「已完成」按钮点击后 FlowState 转换到下一资源
- [ ] 完成所有 A 层后显示 COMPLETE 或 REMEDIATION
- [ ] 页面刷新后进度保留（IndexedDB 持久化）

---

## Step 7 — 完整 Adapter + AI + Settings
**状态**: ✅ 完成（重新设计，2026-05-21）

> **设计变更**：native_quiz / ai_graded_text / CHECK phase 整体移除（commit 7927b11）。
> 课内互动由 QuizPanel（daily challenge）统一承载，PhET 实验步骤通过 Resource.description 字段
> 在 ResourceRow 内展示。ChecklistCard / QuizCard / AIGradedCard 不再需要。

### 任务
- [~] ~~创建 components/adapters/ChecklistCard.tsx~~ → 已废弃，PhET 步骤移入 ResourceRow
- [~] ~~创建 components/adapters/QuizCard.tsx~~ → 已废弃，由 QuizPanel 替代
- [x] 创建 lib/ai.ts（AIService）
- [~] ~~创建 components/adapters/AIGradedCard.tsx~~ → 已废弃，QuizPanel short-answer 题用 AI 评分
- [x] 创建 app/settings/page.tsx（API Key 录入）
- [x] Settings 页 Key 保存后 localStorage 可查到

---

## Step 8 — 导航 + 仪表盘 + 导出
**状态**: ✅ 完成（2026-05-21）

### 任务
- [x] 创建 app/page.tsx（重定向到当前进度）
- [x] 创建 app/dashboard/page.tsx（进度概览）
- [x] 创建 lib/app/share.ts（exportJson）
- [x] 更新 app/settings/page.tsx（添加导出功能）

---

## Step 9 — FRQ 历年真题系统
**状态**: ✅ 完成（2026-05-21）

### 任务
- [x] 下载 AP Central FRQ PDF（2019、2022–2026 题目 + 答案）→ public/frq/
- [x] 创建 data/frq_map.json（28 道题，含 frq_page / sg_page / concepts[]）
- [x] 创建 lib/frq.ts（findRelatedFRQ / frqTypeLabel / FRQEntry）
- [x] DayListView 集成 FRQ 推荐区（可折叠、新标签 PDF、道德审判弹窗）
- [x] LIBRARY_VERSION 升至 1.4.0 触发重 seed

### 已修复问题（本阶段）
- frq_map.json 中 8 处概念映射错误（ap24-q5、ap23-q3 等）
- DayListView race condition（split into 2 effects with cancelled flag）
- ScorePanel 默认值 max → 0
- B 层 forceOpen 自动展开逻辑
- MoralJudgmentDialog 精简为 1 项确认
- FRQViewer.tsx 删除（死代码，pdf.destroy() 内存泄漏）
- lib/frq.ts sort 修复（score-first，year-desc 作为 tiebreaker）

---

## 已修复 Bug 记录

| 日期 | 优先级 | 描述 | 修复方式 |
|------|--------|------|---------|
| 2026-05-21 | P2 | DayListView race condition on flowState change | 拆分为两个 effect，加 cancelled flag |
| 2026-05-21 | P3 | ScorePanel 默认满分，学生不输入即可过关 | useState(0) 替代 useState(max) |
| 2026-05-21 | P3 | FRQViewer pdf.destroy() 内存泄漏 | 删除 FRQViewer.tsx（已是死代码）|
| 2026-05-21 | P3 | frq.ts sort 仅按年份不按相关性 | b.score - a.score \|\| b.q.year - a.q.year |
| 2026-05-21 | P4 | ap24-q5 等 8 处 FRQ 概念映射错误 | 手动校正 frq_map.json |

## Step 10 — Quiz System（Daily Challenge）
**状态**: ✅ 完成（2026-05-21）

- [x] quiz-bank.json（197 题：147 regular + 50 feynman，49 个概念全覆盖）
- [x] Dexie quiz_questions / quiz_results 表
- [x] selectDailyQuestions（3 regular + 1 feynman，终身去重，weakness-based 费曼选题）
- [x] QuizPanel（MCQ / fill / short / feynman 四种题型，AI 评分，AI 追问）
- [x] ChallengePrompt 软触发，Dashboard ⚡N/M 指示器
- [x] C 层按薄弱概念排序（failed A-tier 概念的 C 层资源优先展示）

---

## 已知遗留问题（P4/P5）

- seed.ts TOCTOU：多标签同时打开时 seed 可能并发执行两次（bulkPut 幂等，不丢数据，低频）
- ap26 SG PDF 待 CollegeBoard 发布后替换外链为本地文件
