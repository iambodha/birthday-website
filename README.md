# Birthday Website (Template)

This repository is a reusable, modular web experience intended as a template for building a guided, multimedia "birthday"-style site made of small interactive modules (puzzles, games, audio, and a final message). The original project contained private content which has been removed; the codebase and example content make it straightforward to adapt the site for other purposes.

## What this repo contains

- **Top-level template and assets**
	- `template.html` — minimal HTML template used for static exports or quick previews.
	- `public/EXAMPLE-private-birthday-content.json` — example data structure showing how to supply private/personal content safely.
	- `public/private-birthday-content.json` — placeholder for the site's private content (removed for privacy in this repo).

- **App source** (`src/`)
	- `src/app/` — Next.js app routes and pages (each mini-experience lives under a route such as `/happy-birthday`, `/puzzle`, `/puzzle-2`, `/puzzle-3`).
	- `src/App.svelte` and `src/app.css` — legacy or small standalone components/styles used in parts of the project.

- **Reusable libraries** (`src/lib/`)
	- `audio-playback.ts` — audio utilities and playback helpers.
	- `background-music.ts` — background music controller.
	- `birthday-content.ts` — loader/shape for external content (the JSON templates mentioned above).
	- `chess.ts` — chess puzzle logic and helpers.
	- `experience-state.ts` — state management across the mini-games.

## Templates and how to use them

- `template.html`
	- A small, self-contained HTML file useful for static previews or as a starting scaffold. Replace placeholders with your own assets or embed a built bundle.

- `public/EXAMPLE-private-birthday-content.json`
	- Shows the data shape the app expects for private/personal content (media URLs, text blocks, puzzle definitions, etc.). Copy this file to `public/private-birthday-content.json` and replace values with your own data.
	- Keeping private content in `public/private-birthday-content.json` keeps app code generic and makes it easy to swap in new content without touching the UI logic.

- Page templates in `src/app/`
	- Each route is implemented as a page component. The project separates presentation (React components / Svelte snippets) from game logic (files in `src/lib/`) so you can reuse or replace individual mini-games.
	- To add a new mini-game: add a new route under `src/app/`, implement the UI, and wire the game logic to `experience-state.ts`.

## Customization guide

1. Copy `public/EXAMPLE-private-birthday-content.json` to `public/private-birthday-content.json` and edit the values to supply your own texts, image URLs, and media.
2. Swap or add audio assets and update references in `audio-playback.ts` or the relevant page component.
3. Modify or extend puzzles by editing modules under `src/lib/` (for example `chess.ts` for chess puzzles or the crossword implementation).
4. Add or remove pages by creating new files under `src/app/` and updating any navigation/state code if needed.

## Development

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

The `package.json` scripts provided in this project are:

- `dev` — runs the Next.js development server
- `build` — builds the production site
- `start` — starts the production server
- `lint` — runs ESLint

Open http://localhost:3000 in your browser while `npm run dev` is running.

## Notes and best practices

- The app is intended as a template and intentionally separates private content from code. Keep sensitive media or text in a separate JSON file (not checked into public repos) or use environment-driven storage for private deployments.
- The puzzles and mini-games are modular — you can reuse `src/lib/*` logic in other projects.

## Contributing

If you plan to adapt or extend this template, please:

- Fork the repository.
- Add your content to `public/private-birthday-content.json` (do not commit private data to public forks).
- Open a PR with code changes and a short description of the new feature.

## License

This project uses the repository's LICENSE file. See the `LICENSE` file in the repository root for details.

---

If you'd like, I can also:

- add a short `README` section describing how to replace each specific puzzle implementation, or
- generate a sanitized example `public/private-birthday-content.json` populated with non-personal demo content.

Tell me which you'd prefer and I'll update the repo.
