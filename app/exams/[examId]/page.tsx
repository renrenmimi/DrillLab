import { notFound } from "next/navigation";
import { ExamOverview } from "@/components/exam-overview";
import { EXAMS, examById } from "@/content/registry";

export function generateStaticParams() {
  return EXAMS.map((e) => ({ examId: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const exam = examById(examId);
  if (!exam) return {};
  return { title: exam.title, description: exam.description };
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  if (!examById(examId)) notFound();
  return <ExamOverview examId={examId} />;
}
