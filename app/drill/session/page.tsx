import { DrillSessionPage } from "@/components/drill-session-page";

export const metadata = {
  title: "抽认卡 / Flashcards",
  description:
    "八股题库的抽认卡：先只给问题，翻面看答案，然后自评「会 / 模糊 / 不会」。键盘全程可用。",
};

interface Query {
  /** 这一轮要过哪些题，逗号分隔。没有它就是「选范围」那一屏 */
  ids?: string;
  scope?: string;
  random?: string;
}

export default async function Page({ searchParams }: { searchParams: Promise<Query> }) {
  const sp = await searchParams;
  const ids = (sp.ids ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return <DrillSessionPage ids={ids} scope={sp.scope} random={sp.random === "1"} />;
}
