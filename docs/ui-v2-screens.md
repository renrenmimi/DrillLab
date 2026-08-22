# UI v2 的前后对照

左边是 `feat/guided-learning-plans`（这条分支的父分支），右边是这一版。
截图都在 1440×900（移动端三张在 390×844），英文界面，深色主题为默认。
造数据的种子：跟着 React Assessment、读完地基前三节、标了一道八股、
做完一道 coding —— 也就是「回访者」那一档。

| 页面 | 之前 | 之后 |
| --- | --- | --- |
| 首页（新访客） | ![](ui-v2/fresh-home-before.jpg) | ![](ui-v2/fresh-home-after.jpg) |
| 首页（跟着计划） | ![](ui-v2/active-home-before.jpg) | ![](ui-v2/active-home-after.jpg) |
| 计划列表 | ![](ui-v2/plan-list-before.jpg) | ![](ui-v2/plan-list-after.jpg) |
| React 那条计划 | ![](ui-v2/plan-react-before.jpg) | ![](ui-v2/plan-react-after.jpg) |
| 一节课 | ![](ui-v2/lesson-before.jpg) | ![](ui-v2/lesson-after.jpg) |
| 背知识点 | ![](ui-v2/review-before.jpg) | ![](ui-v2/review-after.jpg) |
| 做练习 | ![](ui-v2/practice-before.jpg) | ![](ui-v2/practice-after.jpg) |
| Coding | ![](ui-v2/code-before.jpg) | ![](ui-v2/code-after.jpg) |
| 考场 | ![](ui-v2/arena-before.jpg) | ![](ui-v2/arena-after.jpg) |
| 首页（390px） | ![](ui-v2/m-home-before.jpg) | ![](ui-v2/m-home-after.jpg) |
| 计划页（390px） | ![](ui-v2/m-plan-before.jpg) | ![](ui-v2/m-plan-after.jpg) |
| 课程页抽屉（390px） | ![](ui-v2/m-lesson-drawer-before.jpg) | ![](ui-v2/m-lesson-drawer-after.jpg) |

看这几处：

1. **新访客的第一屏**从六张密卡变成三个决定，整屏只有一颗实心按钮。
   四个考试要选中「准备一场考试」才展开。
2. **跟着计划的首页**从「计划名 + 进度 + 一行标题 + 一颗按钮 + 四张等重的模式卡」
   变成「计划 / 当前档 / 进度 / 剩余估时 / 一张说清了为什么的下一件事卡」，
   四个模式退到最下面一节，标题层级明显更低。
3. **计划页**默认只展开当前那一档，当前档只露三条 —— 之前是 7 个档全部摊开、
   一屏几十行。
4. **课程页**从「三个应用并排」变成「侧栏 + 一栏正文 + 大桌面才有的目录」。
   页内那条计划带从一张带底色的卡收成一行。
5. **四个模式页**现在共用一套模板：眉题 / 大标题 / 一句话 / 计划上下文 /
   进度 / 筛选行 / 内容，容器宽度和标题对齐轴完全一致。
6. **顶栏**从九件东西（其中三件都在说「往这儿走」）收成「我在哪 + 四个工具」。
