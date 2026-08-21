import { DrillList } from "@/components/drill-list";
import type { DrillQuery } from "@/components/drill-query";

export const metadata = {
  title: "八股题库 / Interview drills",
  description:
    "99 道面试问答题，一道一卡。默认只显示问题，答案折叠；按方向、掌握状态、题库编号筛。",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<DrillQuery>;
}) {
  const query = await searchParams;
  return <DrillList query={query} />;
}
