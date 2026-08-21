import { CodingDetail } from "@/components/coding-detail";
import { allCodingProblems, codingProblemById } from "@/content/registry";
import { slashTitle } from "@/content/path";

export function generateStaticParams() {
  return allCodingProblems().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problem = codingProblemById(id);
  if (!problem) return {};
  return {
    title: slashTitle(problem.title, problem.titleEn),
    description: `${problem.requirements.length} 条验收标准，约 ${problem.minutes} 分钟。${
      problem.sandbox ? "可以直接在浏览器里写完并跑测试。" : "需要在本机跑。"
    }`,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CodingDetail id={id} />;
}
