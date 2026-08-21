import { MockDetail } from "@/components/mock-detail";
import { EXAMS, examById } from "@/content/registry";

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
  return { title: mock.title, description: mock.scenario };
}

export default async function Page({
  params,
}: {
  params: Promise<{ examId: string; mockId: string }>;
}) {
  const { examId, mockId } = await params;
  return <MockDetail examId={examId} mockId={mockId} />;
}
