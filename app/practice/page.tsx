import { PracticePage, type PracticeQuery } from "@/components/practice-page";

export const metadata = {
  title: "练习 / Practice",
  description: "全站练习，可按考试、难度、类型筛选。",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<PracticeQuery>;
}) {
  const query = await searchParams;
  return <PracticePage query={query} />;
}
