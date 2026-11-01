<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep Cloud as the authoritative intake store; database insert triggers queue external copies so copy outages cannot lose submissions.
- External copies use a server-only client; list reads verify roles and scope non-staff row IDs through authoritative Cloud RLS before querying external data. Public delivery accepts only a stored submission ID and exposes no records.
- Case naming and staff-role helpers live in case-rules; database triggers own unique response matching and attachment linkage so every intake path obeys the same rules.
- External table DDL is supplied for the owner to apply separately; managed migrations only target the portal's Cloud database.
- Card deletion uses the shared DeleteCard control and existing admin-only Cloud DELETE policies; confirmation describes retained files, external copies, and unlinked child submissions.
- SOP operational records are staff-only; assigned participants read released decisions through a case-authorized RPC. Attachment visibility is enforced both on metadata and storage.
- SOP tasks initialize idempotently by stage through database triggers or explicit staff setup; anchors and holidays stay staff-confirmed. Nested automated task inserts retain audits without duplicate bell/Hub notices; the stage change supplies the notification.
- Case section tabs use URL search state; stage transitions use an authenticated staff-checked RPC with an expected-stage guard and optional confirmed response-email anchor.
- Case exports use the signed-in client and authorized storage links; private archives include staff data while hearing packets include selected documents only.
- Hub delivery mirrors portal notifications to the eXp Hub channel via src/lib/hub-notify.* (constants / server calls / dispatch function) claimed one-row-per-notification in public.hub_deliveries; HubNoticeDispatcher polls from AppShell and the red bell stays independent.
- Authenticated workspace navigation lives in AppShell; metrics derive from RLS-visible disputes. Personal reminders use a separate case-authorized table and guarded RPCs because creator/assignee ownership, snoozing and popup claims must not alter SOP tasks or generate workflow audit alerts.
- Personal reminder Hub announcements use durable per-reminder delivery claims and server-only transport; shared staff-channel dispatch is staff-only to avoid exposing participant-created reminder text, and uncertain deliveries are never automatically replayed.
- Shared training links and new-view head metadata live in portal-library so reference views stay consistent without importing route modules.
- Reminder AI uses authenticated staff-only server functions and server-only Responses helpers; suggestions populate an editable draft and never save automatically or change SOP deadlines.
- The manual workflow is sourced from case-process.json; regenerate its public distribution PDF when that content changes, keeping it free of case records and labeled as proposed rather than replacing the governing SOP.
- Case progress uses authenticated RLS-scoped reads and recorded task/workflow dates; operational deadlines stay staff-only and no due dates are inferred by the dashboard.
