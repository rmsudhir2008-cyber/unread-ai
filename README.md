# Briefme — What Did I Miss?

Briefme is a privacy-first conversation intelligence micro-app for the ProtocolX “The Unread Problem” challenge. It turns a long unread chat into a calm, actionable briefing so people can see what changed, what matters, what is assigned, what is due, and which questions still need attention.

## What is implemented

- Paste or import local `.txt`/`.csv` conversation text, edit/remove preview rows, and inspect parsed messages.
- Reproducible synthetic college hackathon demo.
- Local rule-based summary, explainable priority signals, tasks, deadlines, mentions, decisions, and potentially unanswered questions.
- Expandable evidence/source references back to original parsed messages.
- Task completion/reopening, editing/dismissal, filters, local history search, rename/reanalyze, delete-one/delete-all controls.
- Browser-generated Markdown and JSON exports.
- Responsive white / Brief Blue interface with reduced-motion support and non-color labels.
- IndexedDB persistence with a safe in-memory fallback if IndexedDB is unavailable.

## Architecture

Static React + TypeScript + Vite. The parser, analysis engine, storage adapter, and export functions are independent browser modules. There is no backend, remote database, analytics, telemetry, third-party script, or cloud inference dependency.

## AI disclosure

The submitted application does **not** use a runtime GenAI service. It uses a deterministic, explainable rule-based engine (`rule-based-1.0`) that identifies explicit action language, deadlines, mentions, project decision language, and questions. This is intentionally disclosed rather than described as generative AI. AI-assisted coding may have been used during development, but no coding assistant runs inside the submitted application and no conversation text is sent to one.

## Privacy behavior

Conversation text is processed in the browser and stored only in this browser’s IndexedDB when the user saves/analyzes it. Text is not placed in URLs, logs, or network requests. Exports happen only after an explicit user click. Local storage is browser-managed and is not claimed to be encrypted. The app loads its own deployment assets, but does not upload conversation content.

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

Publish the `dist/` directory to GitHub Pages, Netlify, Cloudflare Pages, or another static host configured with SPA fallback to `index.html`. No secrets are required. The managed project build declaration should run `npm install && npm run build` and publish `dist`.

## Known limitations

Natural-language variation and ambiguous dates are not guessed; some valid tasks may be missed and relative dates are labeled unresolved without reliable context. IndexedDB can be disabled or cleared by browser policy. The initial engine is rule-based and not a local generative model. A real repository URL and deployed URL are intentionally not fabricated in this workspace.

## Submission fields

- GitHub repository URL: **To be created and verified**
- Public repository confirmation: **Pending repository creation**
- Deployed application URL: **To be created and verified**
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
