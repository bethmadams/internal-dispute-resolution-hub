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
- Submission broker contact names and emails use shared intake validation and dedicated nullable columns on each submission type; queued external copies retain them in payload without external schema changes.
- Stage emails use a database-owned once-per-case/stage queue and server-only Gmail transport; confirmed staff stage changes immediately dispatch the stored queue row and workspace polling provides fallback. Public delivery accepts only a stored initial receipt ID, and uncertain sends cannot be automatically replayed. Response deadlines anchor to confirmed Gmail acceptance or staff-confirmed prior invitation, never a stage change alone.
- External copies use a server-only client; list reads verify roles and scope non-staff row IDs through authoritative Cloud RLS before querying external data. Public delivery accepts only a stored submission ID and exposes no records.
- Case naming and staff-role helpers live in case-rules; database triggers own unique response matching and attachment linkage so every intake path obeys the same rules.
- External table DDL is supplied for the owner to apply separately; managed migrations only target the portal's Cloud database.
- Card deletion uses the shared DeleteCard control and existing admin-only Cloud DELETE policies; confirmation describes retained files, external copies, and unlinked child submissions.
- SOP operational records are staff-only; assigned participants read released decisions through a case-authorized RPC. Attachment visibility is enforced both on metadata and storage.
- SOP tasks initialize idempotently by stage through database triggers or explicit staff setup; anchors and holidays stay staff-confirmed. Nested automated task inserts retain audits without duplicate bell/Hub notices; the stage change supplies the notification.
- Case section tabs use URL search state; stage transitions use an authenticated staff-checked RPC with an expected-stage guard and optional confirmed response-email anchor.
- Case stages and section guidance are defined in case-stages; additive enum values preserve existing cases, while database stage initialization keeps stable task keys and never overwrites existing deadlines or completion. Stage changes do not infer operational dates or send new email types.
- Case exports use the signed-in client and authorized storage links; private archives include staff data while hearing packets include selected documents only.
- Hub delivery eligibility is shared in src/lib/hub-notify.ts and enforced in both client dispatchers and authenticated server handlers; public.hub_deliveries retains one-row-per-notification claims so bell-only events cannot leak through direct calls or old queues.
- Authenticated workspace navigation lives in AppShell; metrics derive from RLS-visible disputes. Personal reminders use a separate case-authorized table and guarded RPCs because creator/assignee ownership, snoozing and popup claims must not alter SOP tasks or generate workflow audit alerts.
- Personal reminder Hub delivery runs from PersonalReminderAlerts independently of popup claims and checks stored reminder timing server-side; durable per-reminder claims prevent duplicate sends, shared-channel dispatch stays staff-only, and uncertain deliveries are never automatically replayed.
- Shared training links and new-view head metadata live in portal-library so reference views stay consistent without importing route modules.
- Reminder AI uses authenticated staff-only server functions and server-only Responses helpers; suggestions populate an editable draft and never save automatically or change SOP deadlines.
- The manual workflow is sourced from case-process.json; regenerate its public distribution PDF when that content changes, keeping it free of case records and labeled as proposed rather than replacing the governing SOP.
- Case progress uses authenticated RLS-scoped reads and recorded task/workflow dates; operational deadlines stay staff-only and no due dates are inferred by the dashboard.
