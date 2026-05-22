# AP Physics 1 — 难度-3 MCQ 题库（47 道综合题）

按知识点顺序生成的多概念综合题，每道题均要求多步推理与对常见错误概念的精准干扰。

```json
[
  {
    "id": "kinematics-scalars-vectors-1d-d3-1",
    "concept_ids": ["kinematics-scalars-vectors-1d"],
    "week": 1,
    "difficulty": 3,
    "type": "mcq",
    "question": "一个质点沿东西方向直线运动：前4秒匀速向东运动20 m，接下来3秒匀速向西运动15 m，最后2秒保持静止。整个9秒内，该质点的平均速度大小与平均速率之比为？",
    "options": [
      "A. 1 : 7",
      "B. 1 : 1",
      "C. 7 : 1",
      "D. 5 : 9"
    ],
    "answer": "A",
    "grading_rubric": "(1) 计算总位移 = 20−15 = 5 m；(2) 计算总路程 = 20+15 = 35 m；(3) 注意静止时间也计入总时长；(4) 比值 = 5/9 ÷ 35/9 = 1:7。",
    "explanation": "正解 A：平均速度 = 总位移/总时间 = 5/9 m/s（向东），平均速率 = 总路程/总时间 = 35/9 m/s，比值 5:35 = 1:7。B 错：把位移与路程混为一谈，认为方向变化不影响位移大小。C 错：颠倒了位移与路程在比值中的位置。D 错：将位移与总时间错配为比值的两端，忽略了平均速率需要路程除以时间。"
  },
  {
    "id": "kinematics-reference-frames-d3-1",
    "concept_ids": ["kinematics-reference-frames"],
    "week": 2,
    "difficulty": 3,
    "type": "mcq",
    "question": "一辆列车以10 m/s水平向东匀速行驶。乘客在车厢内将一小球以相对车厢竖直向上5 m/s的速度抛出。忽略空气阻力，取g=10 m/s²。小球从抛出到回到原高度的过程中，地面参考系中的水平位移和相对车厢的水平位移分别是？",
    "options": [
      "A. 地面参考系10 m，相对车厢0 m",
      "B. 地面参考系0 m，相对车厢0 m",
      "C. 地面参考系10 m，相对车厢10 m",
      "D. 地面参考系5 m，相对车厢5 m"
    ],
    "answer": "A",
    "grading_rubric": "(1) 滞空时间 t = 2v_y/g = 2×5/10 = 1 s；(2) 地面系小球水平速度 = 列车速度 = 10 m/s；(3) 地面系水平位移 = 10×1 = 10 m；(4) 相对车厢小球与车厢水平速度相同，相对位移为 0。",
    "explanation": "正解 A：在地面参考系，小球继承车厢水平速度10 m/s，t=1 s 内水平位移 = 10 m；在车厢参考系，小球水平方向无相对运动，相对位移 = 0。B 错：忽略列车惯性使小球在地面系也具有水平速度。C 错：把地面系结果错套到车厢系上，未理解相对运动概念。D 错：用了一半的滞空时间，结果两个数都减半。"
  },
  {
    "id": "dynamics-systems-center-of-mass-d3-1",
    "concept_ids": ["dynamics-systems-center-of-mass", "kinematics-displacement-velocity-acceleration"],
    "week": 4,
    "difficulty": 3,
    "type": "mcq",
    "question": "在光滑水平面上，质量2 kg的物块A位于原点x=0处以4 m/s向右运动，质量3 kg的物块B位于x=10 m处以6 m/s向左运动。两物块之间无相互作用力。2秒后系统质心的位置x_cm是（取向右为正）？",
    "options": [
      "A. 2 m",
      "B. 6 m",
      "C. -4 m",
      "D. 10 m"
    ],
    "answer": "A",
    "grading_rubric": "(1) 初始质心 x_cm,0 = (2×0+3×10)/5 = 6 m；(2) 质心速度 v_cm = (2×4+3×(-6))/5 = -2 m/s；(3) 2秒后质心位置 = 6 + (-2)×2 = 2 m。",
    "explanation": "正解 A：系统无外力，质心做匀速直线运动。v_cm = -2 m/s（向左），x_cm = 6 + (-2)(2) = 2 m。B 错：仅给出初始质心位置，未考虑质心运动。C 错：将质心初始位置取为原点，仅计算位移。D 错：错用单个物块的位置代替质心位置。"
  },
  {
    "id": "dynamics-force-concept-d3-1",
    "concept_ids": ["dynamics-force-concept", "dynamics-newtons-first-law"],
    "week": 4,
    "difficulty": 3,
    "type": "mcq",
    "question": "下列描述中，物体所受合外力一定不为零的有：(I) 物体做匀速圆周运动；(II) 物体在水平面上做匀速直线运动；(III) 物体竖直上抛运动到最高点的瞬间；(IV) 物体静止在粗糙斜面上。",
    "options": [
      "A. (I) 和 (III)",
      "B. (I)、(II) 和 (III)",
      "C. 只有 (I)",
      "D. (I)、(III) 和 (IV)"
    ],
    "answer": "A",
    "grading_rubric": "(I) 匀速圆周：速度方向变化，存在向心加速度，合力≠0；(II) 匀速直线：a=0，合力=0；(III) 上抛最高点：v=0 但 a=g≠0，合力=mg≠0；(IV) 静止平衡：合力=0。",
    "explanation": "正解 A：(I) 向心力使合力非零；(III) v=0 不代表 a=0，重力仍作用使合力=mg。(II) 错：匀速直线运动属于平衡态，合力为零。(IV) 错：静止意味着平衡，重力、支持力、摩擦力相互抵消。B 错：把匀速直线运动也算入有合力的情况，混淆了 v 与 a。C 错：忽略最高点处的重力不为零这一关键事实。D 错：把斜面静止物体误判为非平衡态。"
  },
  {
    "id": "dynamics-fbd-forces-d3-1",
    "concept_ids": ["dynamics-fbd-forces", "dynamics-newtons-first-law"],
    "week": 4,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量m=2 kg的物块静止在与水平面成30°的固定粗糙斜面上。取g=10 m/s²，sin30°=0.5, cos30°=√3/2≈0.87。斜面对物块的法向支持力N和摩擦力f的大小分别是？",
    "options": [
      "A. N ≈ 17.3 N, f = 10 N",
      "B. N = 20 N, f = 0",
      "C. N = 10 N, f ≈ 17.3 N",
      "D. N ≈ 17.3 N, f = 20 N"
    ],
    "answer": "A",
    "grading_rubric": "(1) 沿斜面方向平衡：f = mg sin30° = 2×10×0.5 = 10 N；(2) 垂直斜面方向平衡：N = mg cos30° = 2×10×0.87 ≈ 17.3 N；(3) 摩擦力方向沿斜面向上以平衡下滑分量。",
    "explanation": "正解 A：物块静止在斜面上需分解重力。N 平衡 mg 的法向分量 mg cos30°，f 平衡沿斜面下滑分量 mg sin30°。B 错：把斜面当成水平面，认为 N=mg 且无需摩擦。C 错：混淆 sin30° 与 cos30°，正分量颠倒。D 错：用 mg=20 N 整体作为摩擦力，未做分解。"
  },
  {
    "id": "dynamics-newtons-third-law-d3-1",
    "concept_ids": ["dynamics-newtons-third-law", "dynamics-newtons-second-law"],
    "week": 5,
    "difficulty": 3,
    "type": "mcq",
    "question": "一个人推一只箱子在水平粗糙地面上向右加速运动。下列说法正确的是？",
    "options": [
      "A. 人对箱子的推力与箱子对人的反推力大小始终相等，无论箱子是否加速",
      "B. 因为箱子加速向右，所以人对箱子的推力大于箱子对人的反推力",
      "C. 因为存在地面摩擦阻力，所以箱子对人的反推力小于人对箱子的推力",
      "D. 人对箱子的推力等于箱子对人的反推力，二者也等于箱子所受的摩擦力"
    ],
    "answer": "A",
    "grading_rubric": "(1) 牛顿第三定律对任意一对作用-反作用力都成立，与运动状态无关；(2) 箱子加速由其受到的合外力决定（推力−摩擦），与反作用力无关；(3) 作用-反作用力作用在不同物体上，不参与同一物体的合力。",
    "explanation": "正解 A：牛顿第三定律是绝对的——作用力与反作用力大小相等、方向相反、作用在不同物体上，与加速度、外部条件无关。B 错：把同一物体上的合力大小关系（推力 > 摩擦）误用到不同物体之间的作用-反作用力上。C 错：与 B 类似，混淆了 \"箱子受合外力非零\" 与 \"反作用力小于作用力\"。D 错：作用-反作用力作用在不同物体上，不能与同一物体上其他力做平衡比较。"
  },
  {
    "id": "dynamics-newtons-first-law-d3-1",
    "concept_ids": ["dynamics-newtons-first-law", "dynamics-fbd-forces"],
    "week": 5,
    "difficulty": 3,
    "type": "mcq",
    "question": "下列哪种情形中物体所受合外力一定为零？(I) 物体做匀速圆周运动；(II) 物体做匀速直线运动；(III) 物体处于静止状态；(IV) 物体竖直上抛到达最高点。",
    "options": [
      "A. (II) 和 (III)",
      "B. (I)、(II) 和 (III)",
      "C. (II)、(III) 和 (IV)",
      "D. (I)、(II)、(III) 和 (IV)"
    ],
    "answer": "A",
    "grading_rubric": "牛顿第一定律：合外力为零 ⇔ 加速度为零 ⇔ 速度大小和方向都不变。(I) 速度方向变 → 有向心加速度 → 合力≠0；(II) v 恒定 → a=0 → 合力=0；(III) 静止 → 平衡 → 合力=0；(IV) v=0 瞬时但 a=g≠0 → 合力=mg≠0。",
    "explanation": "正解 A：合力为零等价于速度（向量）保持不变。匀速直线运动与静止都是平衡态。B 错：把圆周运动也判为平衡态，忽略了向心加速度。C 错：把上抛最高点判为合力为零，把瞬时 v=0 误认为 a=0。D 错：把所有 \"看似停或匀\" 的情况都判为合力为零，未抓住向量本质。"
  },
  {
    "id": "dynamics-newtons-second-law-d3-1",
    "concept_ids": ["dynamics-newtons-second-law", "dynamics-fbd-forces"],
    "week": 5,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量m=2 kg的物块在光滑水平桌面上，受到一个与水平方向成37°斜向上的拉力F=10 N。sin37°=0.6, cos37°=0.8。物块的水平加速度大小是？",
    "options": [
      "A. 4 m/s²",
      "B. 5 m/s²",
      "C. 3 m/s²",
      "D. 1 m/s²"
    ],
    "answer": "A",
    "grading_rubric": "(1) 水平方向只有 F 的水平分量起作用：F_x = F cos37° = 10×0.8 = 8 N；(2) a = F_x/m = 8/2 = 4 m/s²。",
    "explanation": "正解 A：水平加速度只取决于水平合力，即 F cos37° / m = 8/2 = 4 m/s²。B 错：未做分解，直接用 F/m。C 错：混淆 sin 与 cos，用 F sin37°/m = 6/2 = 3。D 错：把竖直分量从 F 中减掉再除以 m：(10−6)/2 = 2，再加上一个其他错误得 1。"
  },
  {
    "id": "dynamics-gravitational-force-d3-1",
    "concept_ids": ["dynamics-gravitational-force", "dynamics-newtons-second-law"],
    "week": 5,
    "difficulty": 3,
    "type": "mcq",
    "question": "行星A的质量是行星B的4倍，半径是行星B的2倍。若同一物体在行星B表面所受的重力为W_B，则在行星A表面所受的重力为？",
    "options": [
      "A. W_B",
      "B. 4 W_B",
      "C. 2 W_B",
      "D. W_B/4"
    ],
    "answer": "A",
    "grading_rubric": "(1) 表面引力 g_surf = GM/R²；(2) g_A/g_B = (M_A/M_B) × (R_B/R_A)² = 4 × (1/2)² = 1；(3) 同一物体 W = mg，所以 W_A = W_B。",
    "explanation": "正解 A：g 与 M 成正比、与 R² 成反比。质量×4、半径×2 → g_A = 4/4 × g_B = g_B。B 错：只考虑质量增大，忽略半径增大也会减小 g。C 错：把半径影响线性化（只乘 1/2），未平方。D 错：把比值颠倒（除以 4 而不是除以 4 再乘以 4）。"
  },
  {
    "id": "dynamics-friction-d3-1",
    "concept_ids": ["dynamics-friction", "dynamics-newtons-second-law"],
    "week": 6,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量5 kg的物块静止在水平地面上，物块与地面间的静摩擦系数μ_s=0.4，动摩擦系数μ_k=0.3。施加恒定水平推力F=22 N，物块开始运动后的瞬时加速度是？取g=10 m/s²。",
    "options": [
      "A. 1.4 m/s²",
      "B. 0.4 m/s²",
      "C. 0 m/s²",
      "D. 4.4 m/s²"
    ],
    "answer": "A",
    "grading_rubric": "(1) 最大静摩擦 f_s,max = μ_s mg = 0.4×50 = 20 N；(2) F=22 > 20，物块克服静摩擦开始运动；(3) 运动后摩擦变为动摩擦 f_k = μ_k mg = 0.3×50 = 15 N；(4) a = (F − f_k)/m = (22−15)/5 = 1.4 m/s²。",
    "explanation": "正解 A：先判断能否克服最大静摩擦，再用动摩擦计算加速度。B 错：物块运动后未将摩擦系数从 μ_s 切换到 μ_k，仍用 f=μ_s mg=20，得 a=2/5=0.4。C 错：误以为 F<f_s,max，物块静止。D 错：完全忽略摩擦力，用 a=F/m=4.4。"
  },
  {
    "id": "dynamics-spring-forces-d3-1",
    "concept_ids": ["dynamics-spring-forces", "dynamics-newtons-second-law"],
    "week": 6,
    "difficulty": 3,
    "type": "mcq",
    "question": "一弹簧自然长度为0.20 m。竖直悬挂时，挂上质量2 kg的物体静止平衡后弹簧总长0.30 m。取下该物体后改挂质量5 kg的物体（仍在弹性范围内），新的弹簧总长是？取g=10 m/s²。",
    "options": [
      "A. 0.45 m",
      "B. 0.55 m",
      "C. 0.75 m",
      "D. 0.50 m"
    ],
    "answer": "A",
    "grading_rubric": "(1) 由原平衡：k×(0.30−0.20)=2×10 → k=200 N/m；(2) 新平衡：x_new = m'g/k = 5×10/200 = 0.25 m；(3) 新长度 = 0.20 + 0.25 = 0.45 m。",
    "explanation": "正解 A：先求 k=200 N/m，再用新重力求伸长 0.25 m，最后加上自然长度。B 错：用 0.30+0.25 — 把第一次的总长当成自然长度。C 错：按长度比例 0.30×(5/2)=0.75 — 误以为整个长度与质量成正比。D 错：求出新伸长后加到错误的基准上（如 0.25+0.25=0.50）。"
  },
  {
    "id": "dynamics-circular-motion-d3-1",
    "concept_ids": ["dynamics-circular-motion", "dynamics-friction", "dynamics-newtons-second-law"],
    "week": 6,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量1500 kg的汽车以恒定速率沿半径R=80 m的水平圆形路面行驶。轮胎与路面之间的最大静摩擦系数μ=0.5，取g=10 m/s²。汽车不发生侧滑的最大速率是？",
    "options": [
      "A. 20 m/s",
      "B. 10 m/s",
      "C. 28 m/s",
      "D. 40 m/s"
    ],
    "answer": "A",
    "grading_rubric": "(1) 向心力来源：静摩擦 f = μmg；(2) 临界条件：mv²/R = μmg；(3) v² = μgR = 0.5×10×80 = 400；(4) v_max = 20 m/s。",
    "explanation": "正解 A：把最大静摩擦设为向心力，v_max = √(μgR) = √400 = 20 m/s。B 错：把μ平方代入：v=√(μ²gR)=√100=10。C 错：忽略 μ，v=√(gR)=√800≈28.3。D 错：把 μ 放在分母：v=√(gR/μ)=√1600=40。"
  },
  {
    "id": "dynamics-inclined-planes-d3-1",
    "concept_ids": ["dynamics-inclined-planes", "dynamics-friction"],
    "week": 6,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量2 kg的物块静止在与水平方向成30°的固定斜面上。物块与斜面间的最大静摩擦系数μ_s=0.7。取g=10 m/s²，sin30°=0.5, cos30°≈0.87。物块所受的静摩擦力大小和方向是？",
    "options": [
      "A. f = 10 N，沿斜面向上",
      "B. f ≈ 12.1 N，沿斜面向上",
      "C. f = 10 N，沿斜面向下",
      "D. f ≈ 17.3 N，沿斜面向上"
    ],
    "answer": "A",
    "grading_rubric": "(1) 沿斜面下滑分量 mg sin30° = 10 N；(2) 最大静摩擦 f_s,max = μ_s mg cos30° = 0.7×17.3 ≈ 12.1 N；(3) 因下滑趋势=10 N < f_s,max，物块静止，所需摩擦力恰为 10 N，方向沿斜面向上。",
    "explanation": "正解 A：静摩擦力是 \"按需提供\" 的，不能直接用 μN。物块静止时摩擦力等于下滑分量 mg sin30°=10 N，方向阻止下滑趋势（沿斜面向上）。B 错：把最大静摩擦当作实际静摩擦，未理解静摩擦的 \"按需\" 性质。C 错：方向错误，摩擦力应阻止下滑趋势。D 错：用 N=mg cos30°≈17.3 N 作摩擦力，混淆法向力与摩擦力。"
  },
  {
    "id": "dynamics-systems-connected-d3-1",
    "concept_ids": ["dynamics-systems-connected", "dynamics-newtons-second-law"],
    "week": 6,
    "difficulty": 3,
    "type": "mcq",
    "question": "阿特伍德机：跨过定滑轮的轻绳两端连接质量m₁=3 kg和m₂=2 kg的物体。绳不可伸长，滑轮和绳质量忽略，无摩擦。释放后系统加速度大小a和绳中张力T依次是？取g=10 m/s²。",
    "options": [
      "A. a = 2 m/s², T = 24 N",
      "B. a = 2 m/s², T = 30 N",
      "C. a = 10 m/s², T = 20 N",
      "D. a = 2 m/s², T = 20 N"
    ],
    "answer": "A",
    "grading_rubric": "(1) 系统法：a = (m₁−m₂)g/(m₁+m₂) = 1×10/5 = 2 m/s²；(2) 单体法（m₂）：T − m₂g = m₂a → T = 2(10+2) = 24 N；(3) 验证（m₁）：m₁g − T = m₁a → 30 − 24 = 6 = 3×2 ✓。",
    "explanation": "正解 A：先用系统法求 a，再用任一物块的牛顿第二定律求 T。B 错：把 m₁g=30 N 直接当作 T，未考虑 m₁ 在加速下落，绳张力 < m₁g。C 错：误以为 m₂ 仍处于自由落体状态，a=g。D 错：把 m₂g=20 N 直接当作 T，未考虑 m₂ 在加速上升，绳张力 > m₂g。"
  },
  {
    "id": "dynamics-circular-orbits-d3-1",
    "concept_ids": ["dynamics-circular-orbits", "dynamics-circular-motion", "dynamics-gravitational-force"],
    "week": 6,
    "difficulty": 3,
    "type": "mcq",
    "question": "卫星A和卫星B绕同一恒星做圆轨道运动。卫星A的轨道半径是卫星B的4倍。下列关于周期T和轨道速率v的关系，正确的是？",
    "options": [
      "A. T_A = 8 T_B，v_A = v_B/2",
      "B. T_A = 4 T_B，v_A = v_B/4",
      "C. T_A = 2 T_B，v_A = 2 v_B",
      "D. T_A = 16 T_B，v_A = 4 v_B"
    ],
    "answer": "A",
    "grading_rubric": "(1) 由 GMm/r² = mv²/r，v ∝ 1/√r → v_A/v_B = 1/√4 = 1/2；(2) T = 2πr/v ∝ r^(3/2) → T_A/T_B = 4^(3/2) = 8（即开普勒第三定律）。",
    "explanation": "正解 A：从 GM/r² = v²/r 得 v² ∝ 1/r。周期 T = 2πr/v 同时受 r 增大和 v 减小影响。B 错：以为 T、v 都与 r 成线性关系。C 错：把 v 反向缩放，并把 T 也按 √r 处理。D 错：把 v 按 r 正比、T 按 r² 处理，与轨道物理完全相反。"
  },
  {
    "id": "energy-translational-kinetic-d3-1",
    "concept_ids": ["energy-translational-kinetic", "momentum-linear"],
    "week": 7,
    "difficulty": 3,
    "type": "mcq",
    "question": "物块A质量2 kg以8 m/s运动，物块B质量8 kg以4 m/s运动。关于两者动能和动量的关系，正确的是？",
    "options": [
      "A. KE_A = KE_B，但 p_A < p_B",
      "B. KE_A > KE_B，因为 A 的速度更大",
      "C. KE_A < KE_B，因为 B 的质量更大",
      "D. KE_A = KE_B，因此 p_A = p_B"
    ],
    "answer": "A",
    "grading_rubric": "(1) KE_A = ½×2×64 = 64 J；(2) KE_B = ½×8×16 = 64 J；(3) p_A = 2×8 = 16 kg·m/s，p_B = 8×4 = 32 kg·m/s；(4) KE 相等但 p 不等。",
    "explanation": "正解 A：动能与 v² 成正比，A 的速度大；动量与 v 一次方成正比，B 的质量大。结果碰巧 KE 相等而 p_B = 2p_A。B 错：只看 v，忽略质量。C 错：只看 m，忽略速度。D 错：以为相等的 KE 必然对应相等的 p（实际上 KE = p²/(2m)，m 不同时 p 不同）。"
  },
  {
    "id": "energy-work-d3-1",
    "concept_ids": ["energy-work", "dynamics-friction"],
    "week": 7,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量5 kg的物块在与水平方向成37°斜向上的拉力F=50 N作用下，沿粗糙水平面匀速移动10 m。sin37°=0.6, cos37°=0.8。摩擦力对物块做的功是？",
    "options": [
      "A. -400 J",
      "B. -500 J",
      "C. -300 J",
      "D. 0 J"
    ],
    "answer": "A",
    "grading_rubric": "(1) 匀速运动 → 合外力做功为零；(2) F 水平分量做功 W_F = F cos37° × 10 = 40×10 = 400 J；(3) 重力和法向力均与位移垂直，做功为零；(4) W_f = −W_F = −400 J。",
    "explanation": "正解 A：匀速意味着 ΔKE=0，故 W_合=0。F 的水平分量做功 +400 J，必有等大反向的摩擦做功 −400 J。B 错：用整个 F=50 N 计算 W=−500 J，未做分解。C 错：用 sin37° 代替 cos37°，W=−300 J。D 错：以为匀速 → 摩擦力做功为零（混淆了动能定理与单个力的功）。"
  },
  {
    "id": "energy-fx-graph-d3-1",
    "concept_ids": ["energy-fx-graph", "energy-work"],
    "week": 7,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量4 kg的物块从x=0处由静止开始沿x正向运动。物块所受合外力F随位置x变化为：0≤x<4 m段F=6 N（恒定，正向），4 m≤x≤8 m段F=2 N（恒定，正向）。物块到达x=8 m时的速度大小是？",
    "options": [
      "A. 4 m/s",
      "B. 2√2 m/s ≈ 2.83 m/s",
      "C. 2√3 m/s ≈ 3.46 m/s",
      "D. 8 m/s"
    ],
    "answer": "A",
    "grading_rubric": "(1) W_净 = 面积 = 6×4 + 2×4 = 32 J；(2) 由动能定理 W = ½mv² → 32 = ½×4×v²；(3) v² = 16 → v = 4 m/s。",
    "explanation": "正解 A：F-x 图下方面积等于合外力做功 32 J；由动能定理求出末速度。B 错：动能公式漏掉系数 ½（32 = 4v² → v²=8 → v=2√2）。C 错：只取第一段做功 24 J（½×4×v²=24 → v=2√3）。D 错：将 F-x 图面积当作速度数值，混淆功的量纲与速度。"
  },
  {
    "id": "energy-potential-energy-d3-1",
    "concept_ids": ["energy-potential-energy", "energy-work", "dynamics-systems-center-of-mass"],
    "week": 8,
    "difficulty": 3,
    "type": "mcq",
    "question": "一根质量m=4 kg、长L=2 m的均匀链子，初始时一半位于光滑水平桌面上、另一半垂在桌沿外。现将悬空部分缓慢拉至桌面上，使整条链子完全位于桌面。在此过程中外力对链子做的功是？取g=10 m/s²。",
    "options": [
      "A. +10 J",
      "B. +20 J",
      "C. +40 J",
      "D. -10 J"
    ],
    "answer": "A",
    "grading_rubric": "(1) 初始悬挂半段质量 m/2 = 2 kg，其质心位于桌沿下方 L/4 = 0.5 m 处；(2) 终态全部上桌，质心上升 L/4 = 0.5 m；(3) ΔU = m_hang·g·(L/4) = 2×10×0.5 = 10 J；(4) 缓慢过程 ΔKE=0，W_外 = +ΔU = +10 J。",
    "explanation": "正解 A：只有悬挂半段的质心上升，距离为该半段长度的一半（L/4）。W_外抵消重力做的负功使 ΔKE=0。B 错：把悬挂半段质心上升取为 L/2 而不是 L/4（误以为整段都上升 L/2）。C 错：错把整条链子质量都算入上升，4×10×L/4=40 J。D 错：把外力做功符号写反（外力实际克服重力做正功）。"
  },
  {
    "id": "energy-conservation-d3-1",
    "concept_ids": ["energy-conservation", "energy-work", "energy-translational-kinetic"],
    "week": 8,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量0.5 kg的小球从距地面h₁=5 m处自由下落，落地后反弹至最高h₂=3.2 m处。忽略空气阻力，取g=10 m/s²。在小球与地面的碰撞过程中，地面对小球做的功是？",
    "options": [
      "A. -9 J",
      "B. -41 J",
      "C. -16 J",
      "D. -25 J"
    ],
    "answer": "A",
    "grading_rubric": "(1) 落地瞬时 KE_前 = mgh₁ = 0.5×10×5 = 25 J；(2) 反弹瞬时 KE_后 = mgh₂ = 0.5×10×3.2 = 16 J；(3) 由动能定理：W_地 = ΔKE = 16 − 25 = −9 J。",
    "explanation": "正解 A：碰撞中只有地面对小球做功（重力做功在碰撞瞬间忽略），W = ΔKE。两个 KE 都是标量正数，相减得 −9 J，表示地面带走了 9 J 能量。B 错：把两个 KE 相加而非相减并加负号，误以为 |W|=KE_前+KE_后。C 错：只用反弹后的 KE 当作 W。D 错：只用落地前的 KE 当作 W。"
  },
  {
    "id": "energy-bar-charts-d3-1",
    "concept_ids": ["energy-bar-charts", "energy-conservation", "dynamics-friction"],
    "week": 8,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量2 kg的物块从静止开始沿粗糙斜面下滑3 m，斜面与水平方向夹角30°，到达底端时速度为4 m/s。取g=10 m/s²。摩擦力对物块做的功是？",
    "options": [
      "A. -14 J",
      "B. -30 J",
      "C. -16 J",
      "D. -46 J"
    ],
    "answer": "A",
    "grading_rubric": "(1) 高度损失 h = 3×sin30° = 1.5 m；(2) 初始势能（取底端为零势面）= mgh = 30 J；(3) 末动能 = ½×2×16 = 16 J；(4) 能量守恒：30 = 16 + |W_f| → W_f = −14 J。",
    "explanation": "正解 A：用能量棒图思维——初始 PE=30 J 全部 \"转化为末动能 16 J + 摩擦耗散 14 J\"，所以摩擦力做功 −14 J。B 错：只记入 PE 减少 30 J 而忽略 KE 增大。C 错：以为摩擦力做功等于末动能。D 错：把 PE 损失和 KE 获得错误相加（30+16=46）。"
  },
  {
    "id": "energy-power-d3-1",
    "concept_ids": ["energy-power", "energy-work"],
    "week": 9,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量m=50 kg的人匀速跑上一段斜长5 m、倾角53°的楼梯，用时5 s。sin53°=0.8, cos53°=0.6, g=10 m/s²。该人克服重力做功的平均功率是？",
    "options": [
      "A. 400 W",
      "B. 500 W",
      "C. 300 W",
      "D. 100 W"
    ],
    "answer": "A",
    "grading_rubric": "(1) 上升高度 h = L sin53° = 5×0.8 = 4 m；(2) 克服重力做功 W = mgh = 50×10×4 = 2000 J；(3) P = W/t = 2000/5 = 400 W。",
    "explanation": "正解 A：克服重力做功只与竖直高度有关，h = L sinθ。B 错：把斜长 L=5 m 当作高度：mgL/t = 500 W。C 错：把 cos53° 当作竖直方向系数：h=L cos53°=3 m → P=300 W。D 错：完全忽略高度因子，只用 mg/t = 100 W。"
  },
  {
    "id": "momentum-linear-d3-1",
    "concept_ids": ["momentum-linear", "energy-translational-kinetic"],
    "week": 10,
    "difficulty": 3,
    "type": "mcq",
    "question": "物块A质量2 kg、物块B质量4 kg。已知二者动能相等。则它们动量大小之比 p_A : p_B 为？",
    "options": [
      "A. 1 : √2",
      "B. 1 : 2",
      "C. √2 : 1",
      "D. 1 : 1"
    ],
    "answer": "A",
    "grading_rubric": "(1) 利用 KE = p²/(2m)；(2) KE_A = KE_B → p_A²/m_A = p_B²/m_B；(3) p_A/p_B = √(m_A/m_B) = √(2/4) = 1/√2。",
    "explanation": "正解 A：等动能时 p 与 √m 成正比。B 错：把 p 与 m 直接成正比（漏开平方）。C 错：颠倒比值方向。D 错：误以为相等动能 ⇒ 相等动量。"
  },
  {
    "id": "momentum-impulse-d3-1",
    "concept_ids": ["momentum-impulse", "momentum-linear"],
    "week": 10,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量0.5 kg的小球以10 m/s速度水平撞向竖直墙壁，反弹后以6 m/s水平速度沿相反方向离开，撞击过程持续0.1 s。墙壁对小球的平均作用力大小是？",
    "options": [
      "A. 80 N",
      "B. 20 N",
      "C. 50 N",
      "D. 30 N"
    ],
    "answer": "A",
    "grading_rubric": "(1) 取入射方向为正：v_i = +10 m/s，v_f = −6 m/s；(2) Δp = m(v_f − v_i) = 0.5×(−6−10) = −8 kg·m/s；(3) |F_平均| = |Δp|/Δt = 8/0.1 = 80 N。",
    "explanation": "正解 A：动量变化必须用向量减法，速度方向反向后，|Δv|=|v_f|+|v_i|=16 m/s。B 错：用速率之差 10−6=4 m/s 作为 Δv，未考虑方向反向。C 错：只用入射动量 0.5×10/0.1=50 N。D 错：只用反弹动量 0.5×6/0.1=30 N。"
  },
  {
    "id": "momentum-ft-graph-d3-1",
    "concept_ids": ["momentum-ft-graph", "momentum-impulse"],
    "week": 10,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量2 kg的物块从静止开始在光滑水平面上沿x方向受变力作用。F-t图像中，0~2 s段F线性从0增至4 N，2~5 s段F恒为4 N。物块在t=5 s末的速度大小是？",
    "options": [
      "A. 8 m/s",
      "B. 6 m/s",
      "C. 10 m/s",
      "D. 20 m/s"
    ],
    "answer": "A",
    "grading_rubric": "(1) 0~2 s 三角形冲量 J₁ = ½×2×4 = 4 N·s；(2) 2~5 s 矩形冲量 J₂ = 4×3 = 12 N·s；(3) 总冲量 J = 16 N·s；(4) v = J/m = 16/2 = 8 m/s。",
    "explanation": "正解 A：F-t 图下方面积 = 冲量；三角形要乘 ½，矩形 = F×Δt，最后总冲量除以质量。B 错：三角形面积漏掉 ½，得 J=8+12=20，再用错误 v=Δp/(2m)=5 — 实际计算更可能给出 6 m/s 的错误路径如：只用 F_avg×t/m=2×5/2 ×... C 错：把 F=4 N 误当作平均力对整个 5 s，J=20 N·s，v=10 m/s。D 错：忽略 m=2，直接把总冲量 16 N·s 当作速度，再加上一个误差。"
  },
  {
    "id": "momentum-conservation-d3-1",
    "concept_ids": ["momentum-conservation", "momentum-linear"],
    "week": 11,
    "difficulty": 3,
    "type": "mcq",
    "question": "在光滑水平面上，质量3 kg的物块A以4 m/s向东运动，与质量2 kg静止的物块B发生碰撞。碰撞后A继续以1 m/s向东运动。B的速度大小和方向是？",
    "options": [
      "A. 4.5 m/s 向东",
      "B. 6 m/s 向东",
      "C. 2.4 m/s 向东",
      "D. 3 m/s 向东"
    ],
    "answer": "A",
    "grading_rubric": "(1) 动量守恒：m_A v_Ai + m_B v_Bi = m_A v_Af + m_B v_Bf；(2) 3×4 + 0 = 3×1 + 2×v_B；(3) 12 = 3 + 2 v_B → v_B = 4.5 m/s 向东。",
    "explanation": "正解 A：碰前总动量 12 kg·m/s，碰后 A 仍带 3 kg·m/s，余下 9 kg·m/s 全部由 B 承担。B 错：把所有初动量都给 B：12/2=6 m/s，忽略 A 碰后还有动量。C 错：假设完全非弹性碰撞求共同速度：12/5=2.4 m/s，但题目并非此情形。D 错：用速度变化 (4−1=3) 直接转移给 B，未考虑两者质量不同。"
  },
  {
    "id": "momentum-collisions-d3-1",
    "concept_ids": ["momentum-collisions", "momentum-conservation", "energy-conservation"],
    "week": 11,
    "difficulty": 3,
    "type": "mcq",
    "question": "在光滑水平面上，质量4 kg的物块以5 m/s向右运动，与一质量1 kg静止的物块发生完全非弹性碰撞（粘在一起）。碰撞过程系统损失的动能占初始动能的百分比是？",
    "options": [
      "A. 20%",
      "B. 0%",
      "C. 80%",
      "D. 50%"
    ],
    "answer": "A",
    "grading_rubric": "(1) 共同速度 v = m₁v₁/(m₁+m₂) = 20/5 = 4 m/s；(2) KE_i = ½×4×25 = 50 J；(3) KE_f = ½×5×16 = 40 J；(4) 损失比 = 10/50 = 20%。也可用公式 m₂/(m₁+m₂) = 1/5。",
    "explanation": "正解 A：完全非弹性碰撞且初始一个静止时，能量损失比 = m_静/(m₁+m₂)。B 错：把 \"动量守恒\" 误推广为 \"动能也守恒\"。C 错：把比值颠倒为 m_动/(m₁+m₂) = 4/5。D 错：套用 (m₁−m₂)/(m₁+m₂)，把弹性碰撞或速度公式与能量损失混淆。"
  },
  {
    "id": "torque-rotational-kinematics-d3-1",
    "concept_ids": ["torque-rotational-kinematics"],
    "week": 12,
    "difficulty": 3,
    "type": "mcq",
    "question": "一圆盘从静止开始绕中心轴做匀角加速转动，角加速度α=2 rad/s²。第3秒末的瞬时角速度ω和前3秒内转过的角度θ分别是？",
    "options": [
      "A. ω = 6 rad/s，θ = 9 rad",
      "B. ω = 6 rad/s，θ = 18 rad",
      "C. ω = 2 rad/s，θ = 9 rad",
      "D. ω = 6 rad/s，θ = 6 rad"
    ],
    "answer": "A",
    "grading_rubric": "(1) 匀角加速 ω = αt = 2×3 = 6 rad/s；(2) θ = ½αt² = ½×2×9 = 9 rad。",
    "explanation": "正解 A：直接套用转动运动学公式 ω=αt 和 θ=½αt²。B 错：θ 公式漏掉 ½，得 18 rad。C 错：把 α=2 当作 ω，未乘 t。D 错：用 θ=ωt=18 — 误用末态角速度计算位移，未用平均角速度（应为 ωt/2=9）。"
  },
  {
    "id": "torque-linear-rotational-connection-d3-1",
    "concept_ids": ["torque-linear-rotational-connection", "dynamics-circular-motion"],
    "week": 12,
    "difficulty": 3,
    "type": "mcq",
    "question": "一直径为0.5 m的轮子绕中心轴匀速转动，轮缘上一点的线速度为10 m/s。该点的角速度ω和向心加速度a_c分别是？",
    "options": [
      "A. ω = 40 rad/s，a_c = 400 m/s²",
      "B. ω = 20 rad/s，a_c = 200 m/s²",
      "C. ω = 40 rad/s，a_c = 4000 m/s²",
      "D. ω = 2.5 rad/s，a_c = 2.5 m/s²"
    ],
    "answer": "A",
    "grading_rubric": "(1) 半径 r = d/2 = 0.25 m；(2) ω = v/r = 10/0.25 = 40 rad/s；(3) a_c = v²/r = 100/0.25 = 400 m/s²（或 rω² = 0.25×1600 = 400）。",
    "explanation": "正解 A：必须用半径 r=0.25 m 而非直径 d=0.5 m。B 错：直接用 d 而非 r，得 ω=20 和 a_c=200。C 错：a_c 公式中用 d²=0.25 而非 r²=0.0625，分母大小差 10 倍。D 错：把 v/r 颠倒为 r/v=0.025，再用其他错误算出 2.5。"
  },
  {
    "id": "torque-torque-d3-1",
    "concept_ids": ["torque-torque"],
    "week": 12,
    "difficulty": 3,
    "type": "mcq",
    "question": "一长L=2 m的水平杆，左端O为固定转轴。在距O点1 m处对杆施加垂直向下的力F₁=30 N；在距O点2 m的右端施加与杆方向（向右）成30°角斜向上的力F₂=40 N。两力对O点的合力矩大小是？sin30°=0.5。",
    "options": [
      "A. 10 N·m",
      "B. 70 N·m",
      "C. 50 N·m",
      "D. 30 N·m"
    ],
    "answer": "A",
    "grading_rubric": "(1) τ₁ = r₁ × F₁ = 1×30 = 30 N·m（顺时针）；(2) τ₂ = r₂ × F₂ × sin30° = 2×40×0.5 = 40 N·m（逆时针）；(3) 合力矩 = |40 − 30| = 10 N·m。",
    "explanation": "正解 A：F₂ 与杆成 30°，对力矩有贡献的是垂直杆分量 F₂ sin30°；两力矩方向相反，作差。B 错：把两力矩方向看成同向相加（70 N·m）。C 错：F₂ 力矩计算时漏掉 sin 因子，用 F₂×r=80 N·m，再减 30 得 50。D 错：只算 F₁ 力矩，忽略 F₂ 对转轴的贡献。"
  },
  {
    "id": "torque-rotational-inertia-d3-1",
    "concept_ids": ["torque-rotational-inertia"],
    "week": 13,
    "difficulty": 3,
    "type": "mcq",
    "question": "三个物体均质量为m、半径为R，分别为：(I) 实心圆盘绕通过盘心垂直盘面的轴；(II) 薄圆环绕通过环心垂直环面的轴；(III) 实心球绕过球心的直径轴。它们的转动惯量大小关系是？",
    "options": [
      "A. I_II > I_I > I_III",
      "B. I_III > I_II > I_I",
      "C. I_I = I_II = I_III",
      "D. I_I > I_II > I_III"
    ],
    "answer": "A",
    "grading_rubric": "(1) 圆盘 I_I = ½mR²；(2) 圆环 I_II = mR²；(3) 实心球 I_III = (2/5)mR²；(4) 比较系数：1 > 1/2 > 2/5。",
    "explanation": "正解 A：转动惯量取决于质量相对于转轴的 \"分布\" — 圆环质量全部集中在 R 处最大，球内质量更靠近轴最小。B 错：完全颠倒，误认为球的 I 最大。C 错：以为相同 m、R 即转动惯量相同，未理解质量分布的影响。D 错：错把圆盘排在圆环之上。"
  },
  {
    "id": "torque-rotational-equilibrium-d3-1",
    "concept_ids": ["torque-rotational-equilibrium", "torque-torque"],
    "week": 13,
    "difficulty": 3,
    "type": "mcq",
    "question": "一长4 m、质量6 kg的均匀木板水平放置在两个支点上：左支点位于x=1 m，右支点位于x=3 m（以木板左端为x=0原点）。在x=4 m的右端放置一质量2 kg的物体。取g=10 m/s²。左支点和右支点对木板的支持力大小依次是？",
    "options": [
      "A. N₁ = 20 N，N₂ = 60 N",
      "B. N₁ = N₂ = 40 N",
      "C. N₁ = 60 N，N₂ = 20 N",
      "D. N₁ = 10 N，N₂ = 70 N"
    ],
    "answer": "A",
    "grading_rubric": "(1) 木板重 60 N 作用于 x=2（重心），物重 20 N 作用于 x=4；(2) 对左支点（x=1）取矩：N₂×(3−1) = 60×(2−1) + 20×(4−1) → 2N₂ = 60+60=120 → N₂=60 N；(3) 由ΣF=0：N₁ = 80−60 = 20 N。",
    "explanation": "正解 A：先用力矩平衡求出一个支点反力，再用力平衡求另一个。B 错：用对称假设 N₁=N₂，忽略木板和物体重力位置不对称。C 错：交换两个支点反力（把矩列在错误方向）。D 错：力矩取距时把支点间距与悬臂距离混淆。"
  },
  {
    "id": "torque-newtons-second-law-rotational-d3-1",
    "concept_ids": ["torque-newtons-second-law-rotational", "torque-rotational-inertia", "dynamics-newtons-second-law"],
    "week": 13,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量m=2 kg、半径R=0.1 m的实心圆盘（I=½mR²）可绕通过中心的水平轴自由转动。一根绕在盘缘的轻绳，另一端竖直悬挂一质量m'=1 kg的物体。释放后物体下落带动圆盘转动。物体下落的线加速度是？取g=10 m/s²。",
    "options": [
      "A. 5 m/s²",
      "B. 10 m/s²",
      "C. 10/3 m/s²",
      "D. 20/3 m/s²"
    ],
    "answer": "A",
    "grading_rubric": "(1) 对物体：m'g − T = m'a；(2) 对圆盘：TR = Iα = ½mR² × (a/R) → T = ½ma；(3) 联立：m'g = m'a + ½ma → a = m'g/(m' + m/2) = 10/(1+1) = 5 m/s²。",
    "explanation": "正解 A：联立物体平动和圆盘转动两方程，并用 a=αR（绳不打滑约束）。B 错：忽略圆盘转动惯量，把物体当自由落体 a=g=10。C 错：错用圆环 I=mR² 代替圆盘的 ½mR²，得 a=g/(1+m/m')=10/3。D 错：忽略物体本身的加速度，把 T=m'g 直接代入圆盘方程。"
  },
  {
    "id": "rotation-rotational-kinetic-energy-d3-1",
    "concept_ids": ["rotation-rotational-kinetic-energy", "rotation-torque-work", "torque-rotational-inertia"],
    "week": 14,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量3 kg、半径0.2 m的实心圆柱（I=½mR²）绕通过几何中心的对称轴在t=0时静止。从t=0起在距轴R处施加恒定切向力F=6 N。t=4 s末圆柱的转动动能是？",
    "options": [
      "A. 192 J",
      "B. 96 J",
      "C. 384 J",
      "D. 12 J"
    ],
    "answer": "A",
    "grading_rubric": "(1) τ = FR = 6×0.2 = 1.2 N·m；(2) I = ½×3×0.04 = 0.06 kg·m²；(3) α = τ/I = 20 rad/s²；(4) ω(4) = 80 rad/s；(5) KE_rot = ½Iω² = ½×0.06×6400 = 192 J。",
    "explanation": "正解 A：先求 α，再用 ω=αt，最后用 KE=½Iω²。B 错：用环的转动惯量 I=mR²=0.12，α=10，ω=40，KE=½×0.12×1600=96 J。C 错：动能公式漏掉 ½：Iω²=384 J。D 错：误把 ω=α（无 t 因子），KE=½Iα²=12 J。"
  },
  {
    "id": "rotation-torque-work-d3-1",
    "concept_ids": ["rotation-torque-work", "rotation-rotational-kinetic-energy"],
    "week": 14,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量4 kg、半径0.2 m的圆盘（I=½mR²）绕通过盘心的水平轴自由转动。从静止开始受到沿盘缘切向的恒力F=4 N作用持续10 s。10 s内合外力对圆盘做的功是？",
    "options": [
      "A. 400 J",
      "B. 800 J",
      "C. 200 J",
      "D. 80 J"
    ],
    "answer": "A",
    "grading_rubric": "(1) τ = FR = 0.8 N·m；(2) I = 0.08 kg·m²；(3) α = 10 rad/s²；(4) θ = ½αt² = 500 rad；(5) W = τθ = 0.8×500 = 400 J（或用 W=ΔKE=½Iω² 验证）。",
    "explanation": "正解 A：力矩做功 W=τθ，与平动 W=Fd 类比。B 错：θ=½αt² 漏掉 ½，θ=1000，W=800 J。C 错：用环的 I=mR²=0.16，α=5，θ=250，W=200 J。D 错：用 W=τω 而非 τθ（混淆功和瞬时功率），0.8×100=80 J。"
  },
  {
    "id": "rotation-angular-momentum-d3-1",
    "concept_ids": ["rotation-angular-momentum", "dynamics-circular-motion"],
    "week": 14,
    "difficulty": 3,
    "type": "mcq",
    "question": "质量0.5 kg的小球用长r=0.4 m的细绳系于固定点O，在水平面内做匀速圆周运动，周期T=π s。小球关于O点的角动量大小是？",
    "options": [
      "A. 0.16 kg·m²/s",
      "B. 0.4 kg·m²/s",
      "C. 0.08 kg·m²/s",
      "D. 0.32 kg·m²/s"
    ],
    "answer": "A",
    "grading_rubric": "(1) ω = 2π/T = 2 rad/s；(2) v = rω = 0.4×2 = 0.8 m/s；(3) L = mvr = 0.5×0.8×0.4 = 0.16 kg·m²/s（亦等于 Iω = mr²ω）。",
    "explanation": "正解 A：质点的角动量 L = mvr 或等价 L = Iω = mr²ω。B 错：用线动量 mv 代替角动量，漏掉乘 r。C 错：错把质点当圆盘，用 I = ½mr²，得 L=0.08。D 错：周期与 ω 关系错算，例如 ω=4 rad/s，得 L=0.32。"
  },
  {
    "id": "rotation-angular-momentum-conservation-d3-1",
    "concept_ids": ["rotation-angular-momentum-conservation", "rotation-rotational-kinetic-energy"],
    "week": 15,
    "difficulty": 3,
    "type": "mcq",
    "question": "花样滑冰运动员张开双臂在冰面以ω₁=2 rad/s旋转，此时相对自身竖直轴的转动惯量I₁=8 kg·m²。她收紧双臂使转动惯量减小为I₂=2 kg·m²。新的角速度ω₂和动能变化ΔKE依次是？",
    "options": [
      "A. ω₂ = 8 rad/s，ΔKE = +48 J",
      "B. ω₂ = 8 rad/s，ΔKE = 0",
      "C. ω₂ = 4 rad/s，ΔKE = 0",
      "D. ω₂ = 2 rad/s，ΔKE = -12 J"
    ],
    "answer": "A",
    "grading_rubric": "(1) 角动量守恒：I₁ω₁ = I₂ω₂ → ω₂ = 8×2/2 = 8 rad/s；(2) KE₁ = ½×8×4 = 16 J，KE₂ = ½×2×64 = 64 J；(3) ΔKE = +48 J（来自手臂收紧所做的内力做功）。",
    "explanation": "正解 A：角动量守恒（无外力矩），但动能并不守恒——内力（肌肉）做功增加了 KE。B 错：把角动量守恒等同于动能守恒，是常见误解。C 错：用线性比例 ω₂=ω₁I₂/I₁ 写反，并假设 ΔKE=0。D 错：把角动量守恒误用为动量守恒，ω 不变。"
  },
  {
    "id": "rotation-rolling-d3-1",
    "concept_ids": ["rotation-rolling", "energy-conservation", "rotation-rotational-kinetic-energy"],
    "week": 15,
    "difficulty": 3,
    "type": "mcq",
    "question": "实心球（I=⅖mR²）和实心圆盘（I=½mR²）质量相同、半径相同。两者从同一光滑斜面同一高度同时由静止开始做纯滚动下滑（不打滑）。比较两者到达斜面底端时的状态：",
    "options": [
      "A. 球先到达底端，且到达时线速度比盘大",
      "B. 盘先到达底端，但速度比球小",
      "C. 两者同时到达，且速度相同",
      "D. 两者同时到达，但球的速度更大"
    ],
    "answer": "A",
    "grading_rubric": "(1) 滚动下滑：mgh = ½mv² + ½Iω² = ½mv²(1 + I/(mR²))；(2) 对球：v²=10gh/7；对盘：v²=4gh/3；(3) 10/7 ≈ 1.43 > 4/3 ≈ 1.33，球速更大；(4) a = g sinθ/(1+I/mR²)，球的 a 更大 → 球先到。",
    "explanation": "正解 A：转动惯量系数（I/mR²）越小，更多重力势能转化为平动 KE，加速度也更大，所以球更快。B 错：方向判断完全相反。C 错：忽略转动惯量差异，以为同高同质量必同时到达且同速。D 错：方向判断正确但忽略加速度差异。"
  },
  {
    "id": "rotation-orbiting-satellites-d3-1",
    "concept_ids": ["rotation-orbiting-satellites", "rotation-angular-momentum-conservation", "dynamics-gravitational-force"],
    "week": 15,
    "difficulty": 3,
    "type": "mcq",
    "question": "一卫星沿椭圆轨道绕地球运动。近地点距地心r₁=R，远地点距地心r₂=3R。已知近地点速度大小为v₁。远地点的速度大小v₂是？",
    "options": [
      "A. v₁/3",
      "B. v₁/9",
      "C. v₁/√3",
      "D. 3 v₁"
    ],
    "answer": "A",
    "grading_rubric": "(1) 引力始终沿径向，对地心力矩为零 → 角动量守恒；(2) 近、远地点 v 垂直于 r → L = mvr；(3) mv₁r₁ = mv₂r₂ → v₂ = v₁(r₁/r₂) = v₁/3。",
    "explanation": "正解 A：角动量守恒在近/远地点最容易应用（v⊥r）。B 错：错用 r² 比值（混淆 L 与某种 r²ω 表示）。C 错：错按 √r 比例缩放，类似圆轨道 v∝1/√r — 但对椭圆轨道两个特殊点应用角动量守恒。D 错：把比值方向颠倒。"
  },
  {
    "id": "oscillation-shm-definition-d3-1",
    "concept_ids": ["oscillation-shm-definition", "dynamics-circular-motion"],
    "week": 16,
    "difficulty": 3,
    "type": "mcq",
    "question": "下列哪些运动属于简谐运动（SHM）？(I) 抛体运动；(II) 弹簧振子（小振幅，光滑水平面）；(III) 单摆（小角度）；(IV) 圆锥摆。",
    "options": [
      "A. (II) 和 (III)",
      "B. (I)、(II) 和 (III)",
      "C. (II)、(III) 和 (IV)",
      "D. 全部"
    ],
    "answer": "A",
    "grading_rubric": "SHM 定义：恢复力与位移成正比且反向 (F=-kx)。(I) 抛体非周期，无恢复力，非SHM；(II) F=-kx 标准SHM；(III) 小角度 F≈-(mg/L)x，SHM；(IV) 圆锥摆是匀速圆周运动，非周期振动。",
    "explanation": "正解 A：只有 (II) 和 (III) 满足 F=-kx 的形式。B 错：把抛体误认为 SHM（实际上是匀变速运动）。C 错：把圆锥摆当成 SHM —— 它在水平面内做匀速圆周运动，无 \"回复力\" 振动。D 错：未理解 SHM 的判据，把任何看似周期的运动都算进去。"
  },
  {
    "id": "oscillation-shm-frequency-period-d3-1",
    "concept_ids": ["oscillation-shm-frequency-period", "oscillation-shm-definition"],
    "week": 16,
    "difficulty": 3,
    "type": "mcq",
    "question": "弹簧振子由弹簧（劲度系数k）和质量m的物体组成，在光滑水平面上振动周期为T。下列哪种改变会使周期变为2T？",
    "options": [
      "A. 弹簧不变，把质量替换为4m",
      "B. 质量不变，把弹簧劲度系数加倍",
      "C. 弹簧和质量都加倍",
      "D. 把振幅加倍"
    ],
    "answer": "A",
    "grading_rubric": "T = 2π√(m/k)。(A) m → 4m，T → 2T；(B) k → 2k，T → T/√2；(C) m、k 同乘 2，T 不变；(D) T 与振幅无关。",
    "explanation": "正解 A：T 与 √m 成正比，质量×4 时周期×2。B 错：k 增大反而使周期变小（T∝1/√k）。C 错：m/k 比值不变，T 不变。D 错：SHM 周期与振幅无关，是其最重要特征之一。"
  },
  {
    "id": "oscillation-shm-representing-d3-1",
    "concept_ids": ["oscillation-shm-representing", "oscillation-shm-definition"],
    "week": 17,
    "difficulty": 3,
    "type": "mcq",
    "question": "弹簧振子做SHM，位移满足 x = A cos(ωt)。当物体位移为 x = A/2 时（取离开平衡位置移动方向为正方向），速度大小 |v| 和加速度大小 |a| 的比值 |v|/|a| 是？",
    "options": [
      "A. √3/ω",
      "B. 1/ω",
      "C. √3",
      "D. 2/ω"
    ],
    "answer": "A",
    "grading_rubric": "(1) x = A cos(ωt) = A/2 → cos(ωt) = 1/2 → sin(ωt) = ±√3/2；(2) v = -Aω sin(ωt)，|v| = Aω·√3/2；(3) a = -Aω² cos(ωt)，|a| = Aω²·1/2；(4) |v|/|a| = (Aω·√3/2)/(Aω²/2) = √3/ω。",
    "explanation": "正解 A：用 sin²+cos²=1 关系求出 sin(ωt)，再代入 v 与 a 的表达式。B 错：以为 x=A/2 时 sin=cos，得 1/ω。C 错：忘记 |a| 中的 ω 因子，导致 ω 没出现在结果分母。D 错：把 sin(ωt) 取为 1 而非 √3/2，给出 2/ω。"
  },
  {
    "id": "oscillation-shm-energy-d3-1",
    "concept_ids": ["oscillation-shm-energy", "energy-conservation"],
    "week": 17,
    "difficulty": 3,
    "type": "mcq",
    "question": "弹簧振子在光滑水平面上做SHM，振幅A=0.2 m，质量m=0.5 kg，弹簧劲度系数k=200 N/m。当物体位移为x = A/2时，动能与势能之比 KE : U 是？",
    "options": [
      "A. 3 : 1",
      "B. 1 : 1",
      "C. 4 : 1",
      "D. 2 : 1"
    ],
    "answer": "A",
    "grading_rubric": "(1) 总能 E = ½kA² = ½×200×0.04 = 4 J；(2) U(x=A/2) = ½k(A/2)² = ½×200×0.01 = 1 J；(3) KE = E − U = 3 J；(4) KE : U = 3 : 1。",
    "explanation": "正解 A：U 与 x² 成正比，x=A/2 时 U/E = (A/2)²/A² = 1/4，所以 KE/E = 3/4，KE:U = 3:1。B 错：以为 x=A/2 时动能势能各半，未注意势能与 x² 关系而非 x。C 错：把 KE:U 当成 E:U，得 4:1。D 错：直觉上认为 KE 比 U 多一些就估 2:1，未严格计算。"
  },
  {
    "id": "fluids-density-structure-d3-1",
    "concept_ids": ["fluids-density-structure"],
    "week": 18,
    "difficulty": 3,
    "type": "mcq",
    "question": "液体A的密度ρ_A=1000 kg/m³，体积V_A=2 L；液体B体积V_B=4 L，密度未知。两液体均匀混合后总质量为7 kg，且假设混合后总体积不变。液体B的密度是？",
    "options": [
      "A. 1250 kg/m³",
      "B. 1750 kg/m³",
      "C. 1167 kg/m³",
      "D. 2500 kg/m³"
    ],
    "answer": "A",
    "grading_rubric": "(1) m_A = ρ_A V_A = 1000 × 0.002 = 2 kg；(2) m_B = m_total − m_A = 7 − 2 = 5 kg；(3) ρ_B = m_B/V_B = 5/0.004 = 1250 kg/m³。",
    "explanation": "正解 A：先用 ρV 求出 A 的质量，再求 B 的质量和体积。B 错：直接用总质量除以 V_B：7/0.004=1750 — 未减去 A 的质量。C 错：用总质量除以总体积（求平均密度）：7/0.006 ≈ 1167。D 错：算术错误，例如把 V_B 误当 V_A，得 5/0.002=2500。"
  },
  {
    "id": "fluids-pressure-d3-1",
    "concept_ids": ["fluids-pressure"],
    "week": 18,
    "difficulty": 3,
    "type": "mcq",
    "question": "U型管中装有水，左管开口与大气相通，右管开口与气体A相连。水柱左管比右管高出20 cm。水的密度ρ=1000 kg/m³，g=10 m/s²，大气压P₀=1.0×10⁵ Pa。气体A的压强是？",
    "options": [
      "A. 1.02×10⁵ Pa",
      "B. 0.98×10⁵ Pa",
      "C. 2×10³ Pa",
      "D. 1.0×10⁵ Pa"
    ],
    "answer": "A",
    "grading_rubric": "(1) 在U管底部同一水平面上取参考点，左右压强相等；(2) 左侧：P₀ + ρg h_左；右侧：P_A + ρg h_右；(3) P_A = P₀ + ρg(h_左 − h_右) = P₀ + 1000×10×0.20 = 10⁵ + 2000 = 1.02×10⁵ Pa。",
    "explanation": "正解 A：左管水柱高 ⇒ 大气压加上额外水柱压力压向 A 侧，使 A 压强高于大气。B 错：方向判断反了（以为 A 压强低于大气）。C 错：只给出表压 ρgh=2000 Pa，未加上大气压。D 错：忽略高度差，直接等于大气压。"
  },
  {
    "id": "fluids-newton-laws-d3-1",
    "concept_ids": ["fluids-newton-laws", "fluids-density-structure"],
    "week": 19,
    "difficulty": 3,
    "type": "mcq",
    "question": "一均匀木块密度ρ_block=600 kg/m³，体积V=1000 cm³。木块漂浮在水（ρ_水=1000 kg/m³）面上达到平衡时，浸没在水中的体积V_w是多少？若改为漂浮在油（ρ_油=800 kg/m³）面上达到平衡，浸没在油中的体积V_o是？",
    "options": [
      "A. V_w = 600 cm³，V_o = 750 cm³",
      "B. V_w = 400 cm³，V_o = 250 cm³",
      "C. V_w = 600 cm³，V_o = 480 cm³",
      "D. V_w = 1000 cm³，V_o = 1000 cm³"
    ],
    "answer": "A",
    "grading_rubric": "(1) 漂浮平衡：ρ_block × V × g = ρ_fluid × V_sub × g；(2) V_sub/V = ρ_block/ρ_fluid；(3) 水中：V_w = 1000 × 0.6 = 600 cm³；(4) 油中：V_o = 1000 × (600/800) = 750 cm³。",
    "explanation": "正解 A：浸没体积比例等于密度比 ρ_block/ρ_fluid；油密度小，需更多体积浸入才能平衡重力。B 错：用 1−ρ_block/ρ_fluid（混淆浸入与露出部分），水中应露出 400，浸入 600。C 错：油的比值错乘 ρ_block × ρ_油/1000 等错误算法。D 错：以为低密度物体也会完全沉没，未理解漂浮意味着部分浸没。"
  },
  {
    "id": "fluids-conservation-laws-d3-1",
    "concept_ids": ["fluids-conservation-laws", "fluids-pressure"],
    "week": 19,
    "difficulty": 3,
    "type": "mcq",
    "question": "水在水平管道中稳定流动。粗段截面积S₁=10 cm²、流速v₁=2 m/s、压强P₁=1.5×10⁵ Pa；细段截面积S₂=5 cm²。水的密度ρ=1000 kg/m³。细段水的流速v₂和压强P₂分别是？",
    "options": [
      "A. v₂ = 4 m/s，P₂ = 1.44×10⁵ Pa",
      "B. v₂ = 4 m/s，P₂ = 1.5×10⁵ Pa",
      "C. v₂ = 4 m/s，P₂ = 1.56×10⁵ Pa",
      "D. v₂ = 1 m/s，P₂ = 1.44×10⁵ Pa"
    ],
    "answer": "A",
    "grading_rubric": "(1) 连续方程：S₁v₁ = S₂v₂ → v₂ = 10×2/5 = 4 m/s；(2) 水平 Bernoulli：P₁ + ½ρv₁² = P₂ + ½ρv₂²；(3) P₂ = 1.5×10⁵ + ½×1000×(4−16) = 1.5×10⁵ − 6000 = 1.44×10⁵ Pa。",
    "explanation": "正解 A：截面减半 → 流速倍增；流速增大 → 动能增大 → 静压减小（Bernoulli 原理）。B 错：忽略 Bernoulli，认为压强不变。C 错：Bernoulli 中符号弄反，错把 ½ρv₂² 当作要加到 P₁ 上。D 错：连续方程颠倒，把 v₂=v₁(S₂/S₁)=1 而非 v₁(S₁/S₂)=4。"
  }
]
```

## 题目总览

| # | 知识点 ID | 周 | 主题 | 综合点 |
|---|---|---|---|---|
| 1 | kinematics-scalars-vectors-1d | 1 | 标量与向量（一维） | 位移/路程 + 平均速度/速率 |
| 2 | kinematics-reference-frames | 2 | 参考系与相对运动 | 抛体 + 参考系切换 |
| 3 | dynamics-systems-center-of-mass | 4 | 系统与质心 | 质心运动 + 多体动力学 |
| 4 | dynamics-force-concept | 4 | 力的概念与分类 | 力分类 + 第一定律判断 |
| 5 | dynamics-fbd-forces | 4 | 力与自由体图 | FBD + 斜面分解 |
| 6 | dynamics-newtons-third-law | 5 | 牛顿第三定律 | 第三定律 + 加速度概念 |
| 7 | dynamics-newtons-first-law | 5 | 牛顿第一定律 | 平衡判据 + 多场景 |
| 8 | dynamics-newtons-second-law | 5 | 牛顿第二定律 | 二定律 + 力分解 |
| 9 | dynamics-gravitational-force | 5 | 万有引力 | 表面重力公式 + 缩放 |
| 10 | dynamics-friction | 6 | 静/动摩擦 | μ_s vs μ_k 切换 |
| 11 | dynamics-spring-forces | 6 | 弹簧力 | Hooke + 自然长度区分 |
| 12 | dynamics-circular-motion | 6 | 圆周运动 | 向心力 + 摩擦限制 |
| 13 | dynamics-inclined-planes | 6 | 斜面问题 | 静摩擦按需 + 分解 |
| 14 | dynamics-systems-connected | 6 | 阿特伍德机 | 系统法 + 单体法 |
| 15 | dynamics-circular-orbits | 6 | 圆轨道趋势 | 开普勒第三定律 |
| 16 | energy-translational-kinetic | 7 | 平动动能 | KE 与 p 关系 |
| 17 | energy-work | 7 | 功 + 功能定理 | 功 + 匀速摩擦判断 |
| 18 | energy-fx-graph | 7 | F-x 图 | 图像面积 + 动能定理 |
| 19 | energy-potential-energy | 8 | 势能 | 链条势能 + 质心位移 |
| 20 | energy-conservation | 8 | 机械能守恒 | 弹跳能量损失 |
| 21 | energy-bar-charts | 8 | 能量棒图 | 斜面摩擦 + 棒图思路 |
| 22 | energy-power | 9 | 功率 | 楼梯 + 高度分解 |
| 23 | momentum-linear | 10 | 线动量 | 等动能 → 动量比 |
| 24 | momentum-impulse | 10 | 冲量 | 反弹 + 矢量减法 |
| 25 | momentum-ft-graph | 10 | F-t 图 | 三角形 + 矩形面积 |
| 26 | momentum-conservation | 11 | 动量守恒 | 一维碰撞 |
| 27 | momentum-collisions | 11 | 完全非弹性碰撞 | 能量损失百分比 |
| 28 | torque-rotational-kinematics | 12 | 转动运动学 | 匀角加速公式 |
| 29 | torque-linear-rotational-connection | 12 | 线-角关系 | r 与 d 区分 |
| 30 | torque-torque | 12 | 力矩 | 多力矩合成 |
| 31 | torque-rotational-inertia | 13 | 转动惯量 | 三种几何比较 |
| 32 | torque-rotational-equilibrium | 13 | 转动平衡 | 双支点支撑梁 |
| 33 | torque-newtons-second-law-rotational | 13 | 转动二定律 | 圆盘 + 悬挂物 |
| 34 | rotation-rotational-kinetic-energy | 14 | 转动动能 | τ → α → ω → KE |
| 35 | rotation-torque-work | 14 | 力矩做功 | W=τθ + 动能定理 |
| 36 | rotation-angular-momentum | 14 | 角动量 | mvr 与 Iω 等价 |
| 37 | rotation-angular-momentum-conservation | 15 | 角动量守恒 | KE 不守恒 |
| 38 | rotation-rolling | 15 | 滚动 | I/mR² 系数比较 |
| 39 | rotation-orbiting-satellites | 15 | 卫星轨道 | 椭圆轨道角动量守恒 |
| 40 | oscillation-shm-definition | 16 | SHM 定义 | 多场景判别 |
| 41 | oscillation-shm-frequency-period | 16 | SHM 周期 | T = 2π√(m/k) 缩放 |
| 42 | oscillation-shm-representing | 17 | SHM 表示 | sin²+cos²=1 + v、a 公式 |
| 43 | oscillation-shm-energy | 17 | SHM 能量 | U ∝ x² 关系 |
| 44 | fluids-density-structure | 18 | 流体密度 | 混合密度推导 |
| 45 | fluids-pressure | 18 | 流体压强 | U 型管 + 大气压 |
| 46 | fluids-newton-laws | 19 | 浮力 | 漂浮 + 多种液体 |
| 47 | fluids-conservation-laws | 19 | 连续 + Bernoulli | 截面变化 + 压强变化 |
