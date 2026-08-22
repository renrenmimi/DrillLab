import { notFound } from "next/navigation";
import { PlanDetail } from "@/components/plan-detail";
import { PLANS, resolvedPlanById } from "@/content/plans";
import { assertPlans } from "@/content/plans-assert";
import { slashTitle } from "@/content/path";

export function generateStaticParams() {
  return PLANS.map((p) => ({ planId: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return {};
  return {
    title: slashTitle(plan.zh, plan.en),
    description: slashTitle(plan.outcomeZh, plan.outcomeEn),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  assertPlans();
  const { planId } = await params;
  const plan = resolvedPlanById(planId);
  if (!plan) notFound();
  return <PlanDetail plan={plan} />;
}
