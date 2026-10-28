# Discovery channel feedback loop

## Existing entry points

| Channel | Entry | Current publication milestone |
| --- | --- | --- |
| Google search | Public sitemap and existing scenario guides | Sitemap fetching repaired; indexing and search traffic require Search Console evidence |
| GitHub | Repository README → public discovery or annotated n8n import | Public |
| npm / MCP | Published package → client setup → public tools | v0.1.0 publicly installed and official Registry record active |
| n8n | Template 21159 → setup → authorized existing delivery | Published; complete setup/submission/result sync documented in [delivery loop](../n8n/DELIVERY_LOOP.md); live service acceptance remains separate |
| Provider reuse | Provider guide → authorized real delivery | Guide public; adoption not established |

## Use the existing attribution vocabulary

Repository links use `utm_source=partner` with fixed campaign names `github_integrations`, `n8n_integrations`, `n8n_creator` or `mcp_integrations`. Keep these values stable. Do not put customer names, emails, tokens or project IDs in campaign values. Guide-to-draft attribution and source conversion are supplied by Prooftask PR #533 and require verified production deployment before use is claimed.

## Measure before adding channels

1. Check Search Console sitemap fetches, indexed guide URLs, queries, impressions and clicks. Record observed dates and do not treat submission as indexing.
2. Compare source-specific public views, template use, draft preparation and agreement conversion in the existing operator report after #533 is verified live. Historical/unknown traffic stays unknown.
3. For MCP/npm, keep installation and public tool checks distinct from actual client adoption. A package download is not a delivery.
4. Check published n8n template 21159 for description/JSON drift and actual referral use. Keep companion status sync separate from the approved preparation workflow; a listing view does not prove completed integration.
5. Use real service-provider deliveries to validate invitation, buyer review and second use. Publish a customer case only after both parties approve the exact public projection.

## Next implementation priorities

- Confirm Google and Bing ownership and submission state using their actual consoles before changing search configuration.
- Inspect search-retrieval crawler access independently of training-crawler policy; retain private-route restrictions. A robots allowance alone does not prove firewall access.
- Add a new scenario guide only when an actual search query or repeated service-provider task supports it. Reuse the existing guide/checklist/draft structure.
- Keep public records and provider pages subject to existing consent and disclosure rules. Never create fake projects, users, reviews or cases to populate discovery.
