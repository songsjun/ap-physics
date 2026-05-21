# AP Physics 1 自适应学习平台

AP Physics 1 的本地优先学习编排器，把 Khan Academy、OpenStax、PhET、Flipping Physics、AP Central 五个平台上的学习资源整合成有序、可追踪的完整学习体验。

## 技术栈

- **框架**: Next.js (App Router, `output: 'export'` 纯静态)
- **数据库**: Dexie.js 4.4.2 (IndexedDB)
- **AI**: Anthropic Claude API (浏览器直调，Key 存 localStorage)
- **样式**: Tailwind CSS
- **部署**: Cloudflare Pages / GitHub Pages

## 快速开始

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 生成 out/ 静态产物
```

## 项目结构

```
ap-physics-app/
├── app/
│   ├── page.tsx                    # 首页（重定向到当前进度）
│   ├── week/[w]/day/[d]/           # 每日学习页（56个静态页）
│   ├── dashboard/                  # 进度仪表盘
│   └── settings/                  # Claude API Key 配置
│
├── components/
│   ├── DayListView.tsx             # 学习主界面（资源列表 + FRQ）
│   ├── DayView.tsx                 # FlowState 渲染决策
│   ├── adapters/ExternalCard.tsx   # 外部资源适配器
│   └── AppInitializer.tsx          # DB 初始化 + storage.persist
│
├── lib/
│   ├── types.ts / constants.ts     # Foundation 层
│   ├── db.ts / storage.ts          # Infrastructure 层
│   ├── repository/                 # IRepository + DexieRepository
│   ├── domain/                     # LearningFlow / ContentCatalog / ProgressTracker
│   ├── app/                        # DaySessionManager / snapshot / context
│   ├── queries.ts                  # seedContentLibrary（版本化 seed）
│   └── frq.ts                      # FRQ 知识点匹配 + 类型定义
│
├── data/
│   ├── content_library.json        # 270 条资源 + 49 个知识点
│   └── frq_map.json                # 28 道历年 FRQ（2019/2022-2026）映射表
│
└── public/frq/                     # AP Physics 1 历年 FRQ PDF（本地）
    ├── ap19/ap22/ap23/ap24/ap25/ap26-frq-physics-1.pdf
    └── ap19/ap22/ap23/ap24/ap25-sg-physics-1.pdf
```

## 核心功能

- **8 周学习路径**：Week 1–8，顺序解锁，每日 A/B/C 三层任务
- **自适应补救**：Khan 得分 < 75% 时自动推荐 B 层相关资源
- **历年 FRQ 推荐**：根据当天知识点匹配相关真题，PDF 精准定位到目标页
- **AI 自检评分**：计算题文字作答 → Claude API 步骤评分（需配置 Key）
- **每日 AI 反馈**：当天完成后自动生成学习总结

## 内容库

| 层级 | 数量 | 说明 |
|------|------|------|
| A 必做 | 100 | Khan / PhET / AP Central / 原生题 |
| B 建议 | 114 | A 层 < 75% 时自动显示 |
| C 拓展 | 56 | 手动展开 |
| FRQ | 28 | 2019、2022–2026 历年真题 |

## 数据说明

- 用户进度存 IndexedDB，设备绑定
- API Key 存 localStorage，不上传任何服务器
- `LIBRARY_VERSION` 变更时自动重新 seed 内容库（当前 `1.4.0`）
