# Security and Privacy Model

## Data boundary

In **Local** mode, conversation text stays in the browser. It is parsed and analyzed locally, then persisted only in IndexedDB or the documented temporary in-memory fallback. Text is not put in URLs, logs, telemetry, or export filenames.

Exports are explicit user actions. Imported content is rendered as React text, never injected as HTML.

## Threats addressed

| Threat | Mitigation |
| --- | --- |
| Malformed or hostile imported text | Strict size validation, plain-text rendering, preserved source lines |
| XSS through conversation content | No `dangerouslySetInnerHTML`, no `eval`, React text nodes |
| Accidental network exfiltration | Local analysis path has no fetch dependency; static deployment has no analytics SDK |
| Storage unavailability | IndexedDB failures resolve safely to the in-memory adapter |
| Untraceable AI-like output | Rule-based engine, stable engine version, source-linked findings and readable reasons |
| Destructive local actions | Explicit delete controls and local-only storage ownership |

## Optional server adapter

The source contains an optional Gemini adapter for deployments that explicitly configure a protected server secret. It is not used by the GitHub Pages deployment. Users must see the transfer disclosure before selecting that mode. The privacy-first judging path is Local mode.

## Honest limitations

Browser-managed IndexedDB is not claimed to be encrypted. Clearing browser data removes local history. Rule-based extraction can miss natural-language variation and intentionally marks ambiguous dates rather than guessing.
