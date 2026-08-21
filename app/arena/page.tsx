import { ArenaList } from "@/components/arena-list";

export const metadata = {
  title: "考场 / Arena",
  description: "计时、无提示、答案锁到交卷之后的从零重写。沙箱跑绿不等于能在空文件夹里做出来。",
};

export default function Page() {
  return <ArenaList />;
}
