"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { resolveDuplicate } from "@/app/actions";

type DuplicateActionsProps = {
  primaryId: string;
  secondaryId: string;
};

function SubmitButton({
  label,
  actionType,
  winnerId
}: {
  label: string;
  actionType: "not_duplicate" | "merge";
  winnerId?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <input type="hidden" name="actionType" value={actionType} />
      <input type="hidden" name="winnerId" value={winnerId ?? ""} />
      <button className="secondaryLink compactLink" type="submit" disabled={pending}>
        {pending ? "Sparar..." : label}
      </button>
    </>
  );
}

export function DuplicateActions({ primaryId, secondaryId }: DuplicateActionsProps) {
  const [mode, setMode] = useState<"default" | "merge">("default");

  return (
    <div className="duplicateActions">
      <form action={resolveDuplicate}>
        <input type="hidden" name="primaryId" value={primaryId} />
        <input type="hidden" name="secondaryId" value={secondaryId} />
        <SubmitButton label="Inte dublett" actionType="not_duplicate" />
      </form>

      {mode === "merge" ? (
        <>
          <form action={resolveDuplicate}>
            <input type="hidden" name="primaryId" value={primaryId} />
            <input type="hidden" name="secondaryId" value={secondaryId} />
            <SubmitButton label="Behåll A" actionType="merge" winnerId={primaryId} />
          </form>
          <form action={resolveDuplicate}>
            <input type="hidden" name="primaryId" value={primaryId} />
            <input type="hidden" name="secondaryId" value={secondaryId} />
            <SubmitButton label="Behåll B" actionType="merge" winnerId={secondaryId} />
          </form>
          <button className="secondaryLink compactLink" type="button" onClick={() => setMode("default")}>
            Avbryt
          </button>
        </>
      ) : (
        <button className="primaryButton compactLink" type="button" onClick={() => setMode("merge")}>
          Merge
        </button>
      )}
    </div>
  );
}
