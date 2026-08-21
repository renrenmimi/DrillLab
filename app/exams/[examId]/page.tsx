import { notFound } from "next/navigation";
import { ExamOverview } from "@/components/exam-overview";
import { EXAMS, examById } from "@/content/registry";
import { slashTitle } from "@/content/path";

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
  return {
    title: slashTitle(exam.title, exam.titleEn),
    description: slashTitle(exam.description, exam.descriptionEn),
  };
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
