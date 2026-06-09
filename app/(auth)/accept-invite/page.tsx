import { Suspense } from "react";
import AcceptInvite from "./AcceptInvite";

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInvite />
    </Suspense>
  );
}
