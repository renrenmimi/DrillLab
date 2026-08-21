// 交卷后的复盘页。薄壳。
//
// 四段路由里只有这一页允许出现提示和答案，所以只有它用完整的 arenaById()。

import { ArenaReview } from "@/components/arena-review";
import { allArena, arenaById } from "@/content/arena";

export function generateStaticParams() {
  return allArena().map((a) => ({ id: a.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = arenaById(id);
  if (!a) return {};
  return { title: `考场复盘 / Review · ${a.title}`, description: "先自评验收命令，再解锁提示和参考答案。" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArenaReview id={id} />;
}
