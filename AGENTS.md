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
