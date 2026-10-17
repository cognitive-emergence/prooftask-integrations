# AI discovery and recommendation observations

This protocol is an evaluation plan, not evidence that an AI recommends Prooftask.

## Separate three conditions

- **Unprompted brand discovery:** new conversation, no Prooftask mention or installed Prooftask tool. Record whether web search was available and actually used.
- **Brand-aware evaluation:** the prompt explicitly names Prooftask. Useful for checking factual understanding, never count it as spontaneous discovery.
- **Connected tool use:** Prooftask MCP is configured. Measure correct tool selection and first-call completion, never count this as organic recommendation.

Use the fixed questions in questions.json. Keep the language and full prompt unchanged within a comparison. Use a fresh conversation without brand context for discovery tests. Do not use this development conversation as an independent sample.

## Record every observation

Record UTC observation time, product/model as displayed, search mode, language, exact prompt, whether the brand was supplied, installed tools, returned recommendations, citations, factual errors, suggested next step and whether that step worked. Retain the raw answer or a permitted transcript reference. Missing citations are unknown provenance.

Report counts with their sample size and condition, such as 1 of 8 fresh search-enabled questions mentioning Prooftask. Do not present that as market share, the probability for every user, or causal proof. Preserve zero and negative results; do not repeat until a preferred answer appears. A neutral fit judgment or a suitable alternative is not necessarily a failure.

## Follow the evidence

- Missing from relevant results: inspect cited sources, public crawl access and indexing.
- Found but misunderstood: improve the factual fit/limits page and precise examples.
- Recommended but cannot connect: reproduce the exact first-call failure.
- Connected but no useful outcome: inspect authorization and the task handover.

No paid benchmark, external messaging, authenticated business write or repeated automation is started by this protocol. Third-party model observations remain unmeasured until actually collected.
