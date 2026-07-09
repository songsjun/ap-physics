# AP Physics 1 自适应学习平台

AP Physics 1 的本地优先学习编排器，把 Khan Academy、OpenStax、PhET、Flipping Physics、AP Central 五个平台上的学习资源整合成有序、可追踪的完整学习体验。

## 技术栈

- **框架**: Next.js (App Router, 本地服务模式)
- **数据库**: PostgreSQL（学生身份与学习记录）+ Dexie.js（本地课程内容缓存）
- **AI**: 本地 AOPS AI Gateway / AP AI proxy
- **样式**: Tailwind CSS
- **运行方式**: 本地 Node.js 服务 + PostgreSQL

## 快速开始

```bash
npm install
cp .env.example .env
# 编辑 .env：非开发环境必须设置真实 SESSION_SECRET
createdb ap_physics
npm run db:schema
npm run student:create -- --name "Student Name"
npm run dev      # http://localhost:3000
npm run build
npm test         # 运行单元测试
```

`npm run db:schema`、`npm run student:create` 和 Next.js 运行时都会按 Next 的 `.env*` 规则加载环境变量。常用变量：

- `DATABASE_URL` / `POSTGRES_URL`: PostgreSQL 连接串，默认 `postgres://localhost:5432/ap_physics`
- `SESSION_SECRET`: session cookie 签名密钥；生产环境缺失或仍是示例占位值会启动失败
- `ACCESS_CODE_LOOKUP_SECRET`: access code 查询 HMAC 密钥；缺失时使用 `SESSION_SECRET`
- `SESSION_TTL_SECONDS`: session 有效期，默认 14 天

## 项目结构

```
ap-physics-app/
├── app/
│   ├── page.tsx                    # 首页（重定向到当前进度）
│   ├── week/[w]/day/[d]/           # 每日学习页（56个静态页）
│   ├── dashboard/                  # 进度仪表盘（含每日综合得分 badge）
│   └── settings/                  # Claude API Key 配置 + 数据导出
│
├── components/
│   ├── AppInitializer.tsx          # DB 初始化 + storage.persist
│   └── day/
│       ├── DayListView.tsx         # 学习主界面（资源列表 + 挑战题 + FRQ）
│       ├── ResourceRow.tsx         # A/B/C 层资源行（含评分）
│       ├── QuizPanel.tsx           # 每日挑战题（MCQ/fill/short/feynman + AI 追问）
│       └── RelatedFRQCard.tsx      # FRQ 推荐 + 分数回填 + 道德审判弹窗
│
├── lib/
│   ├── types.ts / constants.ts     # Foundation 层
│   ├── infra/                      # db / storage / ai / seed（Infrastructure 层）
│   ├── repository/                 # IRepository + DexieRepository
│   ├── domain/                     # flow / scoring / frq / adaptive（纯函数）
│   └── app/                        # session / useDayResources / quiz（Application 层）
│
├── data/
│   ├── content_library.json        # 289 条资源 + 50 个知识点（LIBRARY_VERSION=1.5.2）
│   └── frq_map.json                # 28 道历年 FRQ（2019/2022–2026）知识点映射
│
└── public/
    ├── quiz-bank.json              # 261 道题库（MCQ/fill/short/feynman，difficulty 1–3，QUIZ_BANK_VERSION=1.0.2）
    └── frq/                        # AP Physics 1 历年 FRQ PDF（本地）
```

## 核心功能

- **8 周学习路径**：Week 1–8，顺序解锁，每日 A/B/C 三层任务
- **自适应补救**：通过率 < 75% 时自动推荐 B 层相关资源（按薄弱知识点概念重合度排序）
- **每日挑战题**：3 道客观题 + 1 道费曼反思，AI 评分主观题，AI 追问
- **每日综合得分**：0–100 分（A层完成+质量 55 分 + B/C/FRQ 加成 15 分 + Quiz 30 分）
- **历年 FRQ 推荐**：根据当天知识点匹配相关真题，PDF 精准定位到目标页 + 分数回填
- **每日 AI 反馈**：当天完成后自动生成学习总结（需配置 Claude API Key）

## 内容库

| 层级 | 数量 | 说明 |
|------|------|------|
| A 必做 | 113 | Khan 94 / PhET 14 / AP Central 2 / OpenStax 3 |
| B 建议 | 119 | OpenStax 阅读 + Test Prep，通过率 < 75% 自动显示 |
| C 拓展 | 57 | OpenStax Problems & Exercises，手动展开 |
| Quiz | 261 | MCQ 160 / fill 47 / short 4 / feynman 50，难度 1–3 |
| FRQ | 28 | 2019、2022–2026 历年真题 |

## 数据说明

- 学生必须使用后台生成的 access code 登录
- 学生身份、资源完成记录、每日挑战题答题内容、FRQ 分数和解锁状态存入本地 PostgreSQL
- 课程资源与题库仍缓存到 IndexedDB（Dexie PhysicsLearningDB v4），用于离线读取静态内容
- AI 服务通过本地 gateway 调用，不在浏览器保存模型密钥
- `LIBRARY_VERSION` / `QUIZ_BANK_VERSION` 变更时客户端自动重新 seed
