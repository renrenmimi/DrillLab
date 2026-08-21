import { notFound } from "next/navigation";
import { DrillDetail } from "@/components/drill-detail";
import { allDrills, drillById } from "@/content/drills";

/** 99 道全部预渲染 —— 单题页要能被搜到、能被收藏 */
export function generateStaticParams() {
  return allDrills().map((q) => ({ id: q.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = drillById(id);
  if (!q) return {};
  return {
    title: `${q.zh} · 八股题库 / Drills`,
    // 面试官念的是英文，所以描述里带上英文原题和题库编号
    description: `${q.en}（题库 ${q.bank.map((n) => `#${n}`).join(" / ")}）`,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!drillById(id)) notFound();
  return <DrillDetail id={id} />;
}
