import { MockList } from "@/components/mock-workspace";

export const metadata = {
  title: "模拟考 / Mock exams",
  description: "换了业务场景、考点不变的模拟 assessment。",
};

export default function Page() {
  return <MockList />;
}
