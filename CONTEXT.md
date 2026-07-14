# CONTEXT.md — crisemy.github.io Portfolio Agent

## Project Identity

Personal portfolio site for **Cristian Nadj** — Senior QA Engineer & Test Architect (20+ years). The site lives at **https://crisemy.github.io** and is auto-populated with GitHub repositories tagged with `portfolio-qa`.

---

## Core Workflow

```
GitHub API  ──►  update_portfolio.py  ──►  data/projects.json  ──►  GitHub Pages
                   (Python Agent)           (Source of Truth)        (Live Site)
```

1. **Schedule:** Every **Sunday at 03:00 UTC** (`0 3 * * 0`) via GitHub Actions.
2. **Discovery:** Fetch all public repos from `crisemy` via the GitHub REST API (paginated, up to 10 pages).
3. **Filtering:** Keep only repos whose topics intersect with `{"portfolio-qa", "portfolio", "showcase"}`.
4. **Merging:** Compare discovered repos against `data/projects.json`. New repos are auto-added with `"source": "agent"`; existing agent-generated entries get fully refreshed metadata; manually curated entries (`"source": "manual"`) keep their curated fields but get machine-readable features appended.
5. **Committing:** If the JSON changed, the agent commits and pushes to `main`, triggering a GitHub Pages redeploy.

---

## Repository Structure

```
crisemy.github.io/
├── index.html                   # Static layout, no hardcoded projects
├── assets/
│   ├── css/
│   │   ├── style.css            # Glassmorphism, themes, modals, dropdowns
│   │   ├── tailwind-output.css  # Compiled Tailwind (purged ~11 KB)
│   │   └── tailwind-input.css   # Tailwind source
│   ├── js/
│   │   └── script.js            # Fetches projects.json, renders cards/modals/nav
│   └── images/
├── data/
│   └── projects.json            # ★ Source of truth — JSON array of project objects
├── scripts/
│   └── update_portfolio.py      # ★ Python automation agent (stdlib only)
├── config/
│   └── tailwind.config.js       # Tailwind config with content paths
├── images/                      # Runtime screenshots (e.g., github-deployment.png)
├── .github/workflows/
│   └── agent_update.yml         # GitHub Actions workflow (cron + manual trigger)
├── CONTEXT.md                   # This file
└── README.md                    # Project docs
```

---

## Agent Script: `scripts/update_portfolio.py`

| Concern | Implementation |
|---|---|
| **API calls** | `urllib.request` — stdlib, no external deps |
| **Auth** | Reads `GITHUB_TOKEN` env var; falls back to unauthenticated (60 req/hr) |
| **Topic discovery** | Uses `application/vnd.github.mercy-preview+json` accept header for topics endpoint |
| **Icon assignment** | Keyword matching on repo name + description → FontAwesome icons |
| **Title formatting** | Hyphens/underscores → capitalized words; known acronyms preserved (LLM, QA, CI/CD, API, etc.) |
| **Deduplication** | Compares all fields except `lastSyncedAt` to detect real changes |
| **Sorting** | By `repoUpdatedAt` descending (newest first) |
| **index.html sync** | Updates the `<p class="portfolio-sync">` line with timestamp + counts |
| **`--dry-run`** | Preview mode — fetches & analyses but writes nothing |

### Project JSON Schema

| Field | Type | Notes |
|---|---|---|
| `id` | string | e.g. `modal-ai-test-generator` |
| `title` | string | Display name |
| `icon` | string | FontAwesome class |
| `navLabel` | string | Dropdown label |
| `shortDescription` | string | Card text |
| `fullDescription` | string | Modal text |
| `tags` | string[] | Small tech tags on cards |
| `modalTags` | string[] | Tags in modal header |
| `features` | string[] | Bullet list in modal (first N may be curated, last 4 are machine-synced) |
| `githubUrl` | string | Link to repo |
| `screenshotUrl` | string\|null | Optional preview image |
| `priority` | number | Display order (lower = first); agent entries get `99` |
| `source` | `"manual"\|"agent"` | Origin |
| `repoLanguage` | string | Injected by agent |
| `repoTopics` | string[] | Injected by agent |
| `repoUpdatedAt` | string | ISO datetime |
| `lastSyncedAt` | string | ISO datetime of last sync |

### Source Types

- **`"agent"`**: Fully auto-generated. All fields except `screenshotUrl` and `lastSyncedAt` are overwritten on every sync.
- **`"manual"`**: Curated by hand. The agent preserves curated fields (`fullDescription`, `features` prefix, `screenshotUrl`, `priority`), merges new language tags, and appends/replaces the machine-readable feature lines (Repository:, Primary language:, Last updated:, Topics:).

---

## Frontend: `assets/js/script.js`

- Fetches `data/projects.json` on page load
- Renders portfolio cards into `#portfolio-grid-container`
- Renders modals into `#modals-container` (open via `openModal(id)`, close via `closeModal(id)`)
- Populates nav dropdown under Portfolio menu
- Features: theme toggle (dark/light with localStorage), smooth scroll, intersection observer animations, Escape-to-close, backdrop-click-to-close, keyboard accessibility

---

## Deployment

- **Hosting:** GitHub Pages (auto-deploys from `main`)
- **CI/CD:** GitHub Actions — `agent_update.yml`
- **Manual trigger:** Actions tab → "Portfolio Agent — Auto Update" → Run workflow (optional dry run)
- **Manual local run:** `python3 scripts/update_portfolio.py --dry-run`

---

## How to Add a New Project

1. Go to the desired GitHub repo → ⚙️ About → Topics
2. Add topic **`portfolio-qa`**
3. Wait for next Sunday's cron (or trigger the action manually)

---

## Tailwind CSS

- Source: `assets/css/tailwind-input.css`
- Config: `config/tailwind.config.js`
- Build: `npm run build:css` → outputs minified `tailwind-output.css`
- Dev: `npm run dev:css` (watch mode)
- Custom CSS variables and glassmorphism live in `assets/css/style.css`
