import { CodingList, type CodingQuery } from "@/components/coding-list";

export const metadata = {
  title: "Coding 题 / Coding problems",
  description:
    "全站成型的 coding 题，可按方向、难度、能不能在浏览器里跑筛选。能跑的题带一个真沙箱：左边写、右边预览、一个按钮跑测试。",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<CodingQuery>;
}) {
  const query = await searchParams;
  return <CodingList query={query} />;
}
