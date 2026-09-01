import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isPaidPlan } from "@/lib/subscription";
import { TopBar } from "@/components/top-bar";

// كل صفحة تحت هذا التخطيط مرتبطة بجلسة مستخدم ومدرسة محدَّدة — لا فائدة
// من محاولة توليدها كصفحة ثابتة، ومحاولة ذلك تجعل البناء يستعلم قاعدة
// البيانات أثناء البناء نفسه بلا داعٍ.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.school) {
    redirect("/admin");
  }

  return (
    <div className="min-h-full bg-bg">
      <TopBar
        schoolName={user.school.name}
        userName={user.name}
        role={user.role}
        isPaid={isPaidPlan(user.school)}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
