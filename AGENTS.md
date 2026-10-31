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
- External copies use a server-only client and authenticated staff-role checks; public delivery accepts only a stored submission ID and exposes no records.
- External table DDL is supplied for the owner to apply separately; managed migrations only target the portal's Cloud database.
