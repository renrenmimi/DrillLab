import { MockDetail } from "@/components/mock-detail";
import { EXAMS, examById } from "@/content/registry";
import { slashTitle } from "@/content/path";

export function generateStaticParams() {
  return EXAMS.flatMap((exam) =>
    exam.mockExams.map((mock) => ({ examId: exam.id, mockId: mock.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ examId: string; mockId: string }>;
}) {
  const { examId, mockId } = await params;
  const mock = examById(examId)?.mockExams.find((m) => m.id === mockId);
  if (!mock) return {};
  return {
    title: slashTitle(mock.title, mock.titleEn),
    description: slashTitle(mock.scenario, mock.scenarioEn),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ examId: string; mockId: string }>;
}) {
  const { examId, mockId } = await params;
  return <MockDetail examId={examId} mockId={mockId} />;
}
