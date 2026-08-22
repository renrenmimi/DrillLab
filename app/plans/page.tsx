// /plans —— 薄壳。
//
// 【这一页承担一件额外的事：让引用写错时构建失败】
// content/plans 在模块作用域跑完整性断言（引用了不存在的课文 / coding 题 /
// 考场题 / 模拟考，或者某一档解析出 0 条，就抛）。这一页是预渲染的，
// 所以 next build 一定会 import 到它 —— 断言因此是构建期检查，不是运行期祈祷。
import { PlanList } from "@/components/plan-list";
import { assertPlans } from "@/content/plans-assert";

export const metadata = {
  title: "引导计划 / Guided plans",
  description:
    "按目标走的六条学习计划：从零完整学习、React 考试、GraphQL Federation 考试、Spring Boot 控制器、前端面试复习、Cab Booking。每一条都是一串有序、可续、跨模式的步骤，用的全是站里已有的内容。",
};

export default function Page() {
  // 构建期跑一次完整性检查。引用写错就在这里抛，next build 直接失败。
  assertPlans();
  return <PlanList />;
}
