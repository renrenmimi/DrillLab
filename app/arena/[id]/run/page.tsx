// 进行中的考场。薄壳。
//
// 这一页（含 metadata）只碰 arenaPublicById()。ArenaPublic 在类型上就没有
// hints 和 solution，所以「不小心把答案渲染进 run 页」是编译错误，不是 review 时
// 靠眼睛看出来的问题。

import { ArenaRun } from "@/components/arena-run";
import { allArena, arenaPublicById } from "@/content/arena";

export function generateStaticParams() {
  return allArena().map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = arenaPublicById(id);
  if (!a) return {};
  return { title: `考场进行中 / In progress · ${a.title}`, description: `限时 ${a.minutes} 分钟，没有提示。` };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArenaRun id={id} />;
}
