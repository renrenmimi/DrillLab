// 开考前的说明屏。薄壳：解析 params、预生成六道题、给 metadata，剩下交给组件。
//
// metadata 也只用 arenaPublicById —— 这一页从头到尾拿不到 hints / solution。

import { ArenaBrief } from "@/components/arena-brief";
import { allArena, arenaPublicById } from "@/content/arena";
import { slashTitle } from "@/content/path";

export function generateStaticParams() {
  return allArena().map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = arenaPublicById(id);
  if (!a) return {};
  return {
    title: `考场 / Arena · ${slashTitle(a.title, a.titleEn)}`,
    description: slashTitle(a.scenario, a.scenarioEn),
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArenaBrief id={id} />;
}
