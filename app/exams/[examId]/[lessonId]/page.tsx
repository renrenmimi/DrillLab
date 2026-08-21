import { notFound } from "next/navigation";
import { LessonBody } from "@/components/lesson-body";
import { EXAMS, findLesson, lessonsOf } from "@/content/registry";

export function generateStaticParams() {
  return EXAMS.flatMap((exam) =>
    lessonsOf(exam).map((ref) => ({ examId: exam.id, lessonId: ref.lesson.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ examId: string; lessonId: string }>;
}) {
  const { examId, lessonId } = await params;
  const ref = findLesson(examId, lessonId);
  if (!ref) return {};
  return { title: `${ref.lesson.title} · ${ref.exam.shortTitle}`, description: ref.lesson.blurb };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ examId: string; lessonId: string }>;
}) {
  const { examId, lessonId } = await params;
  if (!findLesson(examId, lessonId)) notFound();
  return <LessonBody examId={examId} lessonId={lessonId} />;
}
