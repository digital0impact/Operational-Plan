import { removeTeamMemberAction, revokeInviteAction } from "@/app/actions/team";
import { CopyLink } from "@/components/copy-link";
import { USER_ROLE_LABELS } from "@/lib/constants";

type Member = { id: string; name: string; email: string; role: string };
type PendingInvite = { id: string; email: string; token: string };

export function TeamMembersList({
  members,
  pendingInvites,
  canManage,
}: {
  members: Member[];
  pendingInvites: PendingInvite[];
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 p-3.5"
          >
            <div>
              <p className="text-sm font-semibold text-ink">{member.name}</p>
              <p className="text-xs text-muted" dir="ltr">
                {member.email} · {USER_ROLE_LABELS[member.role] ?? member.role}
              </p>
            </div>
            {canManage && member.role === "TEAM_MEMBER" ? (
              <form action={removeTeamMemberAction.bind(null, member.id)}>
                <button
                  type="submit"
                  className="shrink-0 text-xs text-muted hover:text-danger"
                >
                  إزالة
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>

      {pendingInvites.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted">
            دعوات معلَّقة — انسخ الرابط وأرسله للعضو المدعو
          </p>
          {pendingInvites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-end justify-between gap-3 rounded-lg border border-dashed border-border p-3.5"
            >
              <div className="flex-1">
                <CopyLink path={`/invite/${invite.token}`} label={invite.email} />
              </div>
              {canManage ? (
                <form action={revokeInviteAction.bind(null, invite.id)}>
                  <button
                    type="submit"
                    className="shrink-0 text-xs text-muted hover:text-danger"
                  >
                    إلغاء
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
