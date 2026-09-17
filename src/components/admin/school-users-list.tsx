import { generatePasswordResetAction } from "@/app/actions/admin";
import { USER_ROLE_LABELS } from "@/lib/constants";

type SchoolUser = { id: string; name: string; email: string; role: string };

export function SchoolUsersList({
  schoolId,
  users,
}: {
  schoolId: string;
  users: SchoolUser[];
}) {
  if (users.length === 0) {
    return <p className="text-sm text-muted">لا يوجد مستخدمون لهذه المدرسة.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {users.map((user) => (
        <li
          key={user.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 p-3.5"
        >
          <div>
            <p className="text-sm font-semibold text-ink">{user.name}</p>
            <p className="text-xs text-muted" dir="ltr">
              {user.email} · {USER_ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
          <form action={generatePasswordResetAction.bind(null, schoolId, user.id)}>
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent"
            >
              إعادة تعيين كلمة المرور
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
