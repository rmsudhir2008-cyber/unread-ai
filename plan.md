# UNREAD AI — Implementation & Design Plan

## Product direction

UNREAD AI is a local-first conversation intelligence micro-app for the ProtocolX “What Did I Miss?” challenge. It helps a user catch up on a busy conversation by turning raw messages into an actionable briefing: what changed, what matters, what is assigned, what is due, what mentions the user, which decisions are confirmed, and which questions may still need answers. The product will remain useful without credentials, model downloads, or network access after the static assets are loaded.

## Scope and implementation approach

- **Frontend:** React 18 + TypeScript + Vite, strict compiler settings, static build only.
- **No backend:** no server, database, analytics, telemetry, third-party scripts, cloud inference, or remote conversation transport.
- **Local persistence:** IndexedDB stores conversation metadata, parsed messages, analysis results, user corrections, task states, timestamps, and engine version. A small storage adapter will fall back to an in-memory session with a visible warning if IndexedDB is unavailable.
- **Rule-based analysis:** deterministic, explainable extraction modules will be used instead of pretending keyword matching is generative AI. README and Privacy UI will state that no runtime GenAI service is used. The engine will preserve source message IDs and expose its signals and confidence.
- **Input flow:** paste, `.txt`, `.csv`, or synthetic demo → validate → parse → editable preview → analyze → persisted result. Parser supports timestamped and untimestamped records, sender detection, multiline continuation, and explicit preservation of unparsed lines.
- **Analysis modules:** parser, priority scoring, task extraction, deadline resolution, decision classification, question classification, mention/relevance detection, summary composition, and source-context lookup. Each module uses shared strict types and is independently testable.
- **Results state:** one application store coordinates dashboard, analysis, priorities, action items, decisions/questions, history, privacy/settings, filters, sorting, task updates, and exports. Findings link to original messages and show surrounding context.
- **Exports:** browser-generated Markdown and validated JSON via Blob downloads. Filenames use conversation metadata only, never message text.
- **Navigation:** client-side route state using the History API and a synchronized `public/manus-routes.json` manifest. Refresh-safe fallback is configured for static hosting.
- **Testing:** Vitest unit tests for parser, multiline/malformed input, priority scoring, mentions, tasks, dates, ambiguity, decisions, questions, source references, storage adapter, export shape, filters/sorting, privacy boundaries, and task updates; an integration test covers demo → analysis → task completion → export. If browser tooling is unavailable, the limitation will be documented rather than overstated.

## Project structure

```text
unreadai/
├── public/
│   ├── manus-routes.json       # Static route declarations
│   └── favicon.svg             # Local mark, no third-party asset
├── src/
│   ├── analysis/               # Pipeline orchestration and deterministic extractors
│   ├── components/             # Reusable UI cards, badges, message/source views
│   ├── data/                   # Synthetic demonstration conversation
│   ├── hooks/                  # Application state and persistence hooks
│   ├── pages/                  # Dashboard, Analyze, Results, History, Privacy
│   ├── parser/                 # Conversation parsing and validation
│   ├── storage/                # IndexedDB schema and resilient adapter
│   ├── types/                  # Shared domain types
│   ├── utils/                  # Date, export, filtering, and safe text utilities
│   ├── App.tsx                 # Shell, route state, modal/context handling
│   ├── main.tsx                # Vite entry
│   └── styles.css              # Design system and responsive layout
├── tests/                      # Unit and integration coverage
├── app.config.ts               # Project logo metadata
├── index.html
├── package.json / lockfile
├── tsconfig*.json / vite.config.ts
├── README.md
├── TODO.md
└── plan.md
```

## Design system

- **Design movement:** “Quiet systems” editorial productivity UI: an information-dense command center softened by generous rhythm and calm, precise hierarchy.
- **Core principles:** (1) actionable before exhaustive, (2) evidence always visible, (3) calm under information overload, (4) privacy is a first-class status, not a footnote.
- **Color philosophy:** charcoal surfaces create focus and reduce visual noise; a distinctive emerald “signal green” marks local processing, confirmed states, and the next useful action; warm amber and coral are reserved for urgency and risk. Color is paired with labels, icons, and text so meaning never depends on color alone.
- **Layout paradigm:** a persistent left rail and evidence-oriented main canvas, with a narrow “signal strip” for counts and a source drawer for message context. Avoid a generic centered marketing grid; the app should feel like a focused workbench.
- **Signature elements:** the **Signal Rail** (priority markers with words and scores), **Evidence Link** (source-message pill that opens context), and **Local-first beacon** (shield + “stays on this device” status).
- **Interaction philosophy:** every action either reduces uncertainty or improves traceability. Controls use plain-language labels, inline feedback, reversible task states, and no decorative buttons. Results can be scanned first, then expanded into evidence.
- **Animation:** restrained 160–220ms fades/slides for cards and drawers, never motion-dependent; `prefers-reduced-motion` disables transitions. No looping decorative animation.
- **Typography:** system sans stack for UI reliability, with a slightly editorial serif/mono accent reserved for the UNREAD wordmark and source timestamps. Type hierarchy uses compact uppercase labels, readable 16px body copy, and strong 32–44px page titles.
- **Brand essence:** “The private briefing layer for conversations you haven’t caught up on.” Personality: focused, candid, reassuring.
- **Brand voice:** headlines are direct and useful; CTAs describe the outcome. Examples: “Start with the messages that changed something.” and “Show me what needs my attention.”
- **Wordmark & logo:** a compact `UNREAD` wordmark with a bracketed “eye” glyph: a dark square containing an emerald open bracket and a single signal dot, suggesting a message being surfaced without surveillance.
- **Signature brand color:** **Signal Emerald** `#39D98A`, used sparingly as the ownable visual cue for local, confirmed, and actionable states.

## Privacy and security decisions

- Conversation content is never placed in URLs, logs, telemetry, error reports, or network requests.
- Imported files are treated as untrusted text and rendered with React text nodes, never HTML injection.
- No `eval`, `dangerouslySetInnerHTML`, embedded external scripts, or hidden cloud fallback.
- Privacy page will explicitly explain IndexedDB is browser-managed storage and is not claimed to be encrypted.
- Delete-one and delete-all actions will require confirmation; settings will expose storage clearing and an honest processing-method label.
- A network-boundary test will stub `fetch` and verify analysis/export paths do not call it.

## Delivery workflow

1. Build typed foundation, parser, storage, analysis engine, and demo data.
2. Connect the responsive shell and all navigation pages to real state.
3. Add task corrections, filters/sorting, source context, history, privacy, and exports.
4. Add test fixtures and integration coverage.
5. Run dependency install, typecheck, lint, unit/integration tests, production build, and route-manifest checks; fix confirmed failures.
6. Start the Preview server on the configured port, verify HTTP readiness, and inspect the main and mobile layouts if a concrete visual issue requires it.
7. Configure static build output and static-hosting instructions. No deployment URL or repository URL will be invented; submission fields will use explicit placeholders until a real link is established.
8. Commit the working project to the managed Webdev checkpoint workflow and report the Preview URL unless publication is actually verified.

## Honest limitations

The initial release uses deterministic rule-based extraction rather than a local generative model. Natural-language variation, ambiguous dates, and speaker/assignee inference are intentionally marked as uncertain instead of guessed. IndexedDB can be cleared by the browser or unavailable in restricted contexts. Static hosting must provide SPA fallback or the app should be served from its root route; the project will document this.
