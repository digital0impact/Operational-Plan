import { saveStaticInfoSectionAction } from "@/app/actions/plans";
import { SubmitButton } from "@/components/submit-button";

export function StaticInfoSection({
  planId,
  sectionKey,
  description,
}: {
  planId: string;
  sectionKey: string;
  description: string;
}) {
  const action = saveStaticInfoSectionAction.bind(null, planId, sectionKey);

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-muted">{description}</p>
      <SubmitButton pendingLabel="جارٍ المتابعة…">متابعة ←</SubmitButton>
    </form>
  );
}
