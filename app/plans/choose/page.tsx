// /plans/choose —— 薄壳。换一条引导计划。
//
// 【为什么单独一个路由】侧栏那个「换一条」以前指向 /plans，
// 而你可能已经站在 /plans 上 —— 点了没有任何反应。
// 一个只做「换」这件事的地址，让那个链接永远是一次真实的跳转，
// 而且浏览器返回键和页面上的「取消」都能回到原处。
import { PlanChooser } from "@/components/plan-chooser";
import { assertPlans } from "@/content/plans-assert";

export const metadata = {
  title: "换一条引导计划 / Change your guided plan",
  description:
    "在六条引导计划之间切换。换一条不会删除任何进度：已经读过的课文、做对的练习、自评过的八股都还在，新计划照样把它们算进去。",
};

export default function Page() {
  assertPlans();
  return <PlanChooser />;
}
