# Briefme — What Did I Miss?

Briefme is a privacy-first conversation intelligence micro-app for the ProtocolX “The Unread Problem” challenge. It turns a long unread chat into a calm, actionable briefing so people can see what changed, what matters, what is assigned, what is due, and which questions still need attention.

## What is implemented

- Paste or import local `.txt`/`.csv` conversation text, edit/remove preview rows, and inspect parsed messages.
- Reproducible synthetic college hackathon demo.
- Local rule-based summary with explainable priority signals, explicit-date normalization, assignee detection, deduplicated deadlines, tasks, mentions, decisions, and potentially unanswered questions.
- Expandable evidence/source references back to original parsed messages.
- Task completion/reopening, editing/dismissal, filters, local history search, rename/reanalyze, delete-one/delete-all controls.
- Browser-generated Markdown and JSON exports.
- Responsive white / Brief Blue interface with reduced-motion support and non-color labels.
- IndexedDB persistence with a tested in-memory fallback if IndexedDB is unavailable or blocked.

## Architecture

Static React + TypeScript + Vite. The parser, explainable analysis engine, resilient storage adapter, and export functions are independent browser modules. The analysis pipeline separates parsing, signal scoring, deadline normalization, task extraction, decision detection, question resolution, and evidence linking. The public GitHub Pages deployment is local-first: it has no remote database, analytics, telemetry, third-party script, or required cloud inference dependency.

## AI disclosure

The public GitHub Pages application uses a deterministic, explainable rule-based engine (`rule-based-2.0`) rather than pretending keyword matching is generative AI. It identifies explicit action language, assignees, deadlines, mentions, project decisions, and potentially unanswered questions. An optional Gemini server adapter remains in the source for deployments that explicitly configure a server and disclose the transfer; it is not required or used by the GitHub Pages deployment.

## Privacy behavior

In Local mode, conversation text is processed in the browser and stored only in this browser’s IndexedDB or temporary in-memory fallback when the user saves/analyzes it. Text is not placed in URLs, logs, or network requests. Exports happen only after an explicit user click. Local storage is browser-managed and is not claimed to be encrypted. The GitHub Pages deployment does not upload conversation content.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The static build is:

```bash
npm run lint
npm test
npm run build
```

## Deployment

The live GitHub Pages deployment is available at [rmsudhir2008-cyber.github.io/unread-ai](https://rmsudhir2008-cyber.github.io/unread-ai/). The source repository is [github.com/rmsudhir2008-cyber/unread-ai](https://github.com/rmsudhir2008-cyber/unread-ai). GitHub Actions builds the `dist/` directory and publishes it with SPA fallback to `index.html`. No secrets are required for local analysis.

## Known limitations

Natural-language variation and ambiguous dates are not guessed; some valid tasks may be missed and relative dates are labeled unresolved without reliable context. IndexedDB can be disabled or cleared by browser policy. The initial engine is rule-based and not a local generative model. A real repository URL and deployed URL are intentionally not fabricated in this workspace.

## Submission fields

- GitHub repository URL: https://github.com/rmsudhir2008-cyber/unread-ai
- Public repository confirmation: **Confirmed public**
- Deployed application URL: https://rmsudhir2008-cyber.github.io/unread-ai/
- Project description: “Briefme is a local-first conversation briefing tool that helps people catch up on busy chats by surfacing explainable priorities, action items, deadlines, decisions, mentions, and unanswered questions, with evidence links back to the original messages.”
- GenAI disclosure: “No external GenAI inference service is used at runtime. Analysis is deterministic and rule-based in the browser.”


## Public product experience

Briefme opens directly into a polished product homepage—there is no sign-in wall, account gate, or loading delay. The sidebar keeps the full workspace available: Analyze, Focus, Tasks, Decisions, Saved, and Privacy. The light/dark theme switcher is available from the sidebar.

## Demo mode

The synthetic demo is available directly from the home page. No account is required.

## Optional Gemini analysis

Briefme now supports two analysis engines in the Analyze tab:

- **Local** keeps the conversation on the device and uses the deterministic rules engine.
- **Gemini AI** sends the selected conversation to Google Gemini through a server-side proxy for richer summaries, priorities, tasks, decisions, questions, and source-linked findings.

The Gemini API key is stored as the protected `GEMINI_API_KEY` runtime secret and is never included in browser JavaScript, source files, or exports. Users see an explicit disclosure before selecting Gemini. If Gemini is unavailable, Briefme safely falls back to local analysis and reports that status.

Gemini availability and quotas are controlled by Google AI Studio. The current provider may temporarily return capacity errors; local analysis remains available without interruption.

When **Gemini AI** is selected, **Preview & analyze with Gemini** sends the complete parsed conversation in one request, shows progress, saves the structured briefing, and opens **Focus** automatically. The same Gemini-backed analysis powers **Tasks** and **Decisions**, with every result linked to its original message.
