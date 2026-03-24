# Cristian Nadj — Portfolio Site & Automation Agent

[![Portfolio Agent](https://github.com/crisemy/crisemy.github.io/actions/workflows/agent_update.yml/badge.svg)](https://github.com/crisemy/crisemy.github.io/actions/workflows/agent_update.yml)
[![Live Site](https://img.shields.io/badge/Live%20Site-crisemy.github.io-00f2fe?style=flat&logo=github)](https://crisemy.github.io)

Personal portfolio website for **Cristian Nadj** — Senior QA Engineer & Test Architect with 20+ years of experience in automation frameworks, CI/CD orchestration, and AI-assisted software testing.

---

## 🌐 Live Site

**[https://crisemy.github.io](https://crisemy.github.io)**

---

## 🤖 Portfolio Automation Agent

This repository includes a **Python-based automation agent** that runs on a scheduled cron job via GitHub Actions. Its goal is to keep the portfolio up to date automatically — without requiring any manual HTML edits.

### How It Works

```
GitHub API  ──►  update_portfolio.py  ──►  data/projects.json  ──►  GitHub Pages
                   (Python Agent)          (Source of Truth)         (Live Site)
```

1. **Schedule:** The agent runs automatically every **Wednesday and Sunday at 03:00 UTC**.
2. **Discovery:** It calls the GitHub REST API to fetch all public repositories from `crisemy`.
3. **Filtering:** It keeps only repositories tagged with one of the portfolio topics (e.g., `portfolio-qa`).
4. **Merging:** It compares discovered repos against the existing `data/projects.json`. Any new repo not already listed is added automatically.
5. **Committing:** If the JSON changes, the agent commits and pushes the update to `main`, which triggers an automatic GitHub Pages redeploy.

### Triggering the Agent Manually

You can trigger a run at any time from the **Actions** tab on GitHub:

1. Go to [Actions → Portfolio Agent — Auto Update](https://github.com/crisemy/crisemy.github.io/actions/workflows/agent_update.yml)
2. Click **"Run workflow"**
3. Optionally enable **Dry Run** to preview changes without writing anything

### Adding a New Project to the Portfolio

To have a new GitHub repository appear automatically on the portfolio:

1. Go to the repository page on GitHub
2. Click the ⚙️ gear icon next to **"About"**
3. Add the topic: **`portfolio-qa`**
4. The agent will pick it up on its next scheduled run (or you can trigger it manually)

---

## 🗂️ Project Structure

```
crisemy.github.io/
├── index.html                  # Main HTML — layout only, no hardcoded project data
├── script.js                   # Fetches projects.json and renders cards + modals dynamically
├── style.css                   # All site styles (glassmorphism, animations, dark theme)
│
├── data/
│   └── projects.json           # ★ Source of truth for all portfolio projects
│
├── scripts/
│   └── update_portfolio.py     # Python automation agent
│
├── images/                     # Project screenshots and assets
│
└── .github/
    └── workflows/
        └── agent_update.yml    # GitHub Actions workflow (cron + manual trigger)
```

---

## 🛠️ Local Development

The site uses vanilla HTML, CSS, and JavaScript — no build step required.

Because `script.js` uses `fetch()` to load `data/projects.json`, you **must** serve the project through a local HTTP server (browsers block `fetch()` on `file://` URLs).

```bash
# Option 1 — Python (built-in, no install needed)
python3 -m http.server 8080

# Option 2 — Node.js
npx serve .
```

Then open **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## 🐍 Running the Agent Locally

```bash
# Preview what the agent would do (no files changed)
python3 scripts/update_portfolio.py --dry-run

# Run the agent and update data/projects.json
python3 scripts/update_portfolio.py
```

> **Tip:** Set the `GITHUB_TOKEN` environment variable to increase the API rate limit from 60 to 5,000 requests per hour:
> ```bash
> export GITHUB_TOKEN=your_personal_access_token
> python3 scripts/update_portfolio.py --dry-run
> ```

---

## 📋 `data/projects.json` Schema

Each project in the JSON array follows this structure:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique modal ID (e.g. `modal-ai-testing`) |
| `title` | `string` | Display title |
| `icon` | `string` | FontAwesome class (e.g. `fas fa-check-double`) |
| `navLabel` | `string` | Label shown in the nav dropdown |
| `shortDescription` | `string` | Text shown on the portfolio card |
| `fullDescription` | `string` | Text shown in the modal |
| `tags` | `string[]` | Tech tags shown on the card |
| `modalTags` | `string[]` | Tech tags shown in the modal header |
| `features` | `string[]` | Key features list in the modal |
| `githubUrl` | `string` | Link to the GitHub repository |
| `screenshotUrl` | `string \| null` | Path to a preview image (optional) |
| `priority` | `number` | Display order (lower = higher priority) |
| `source` | `"manual" \| "agent"` | How the entry was created |

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES2020) |
| Styling | Custom CSS — glassmorphism, CSS animations, CSS variables |
| Icons | [Font Awesome 6](https://fontawesome.com/) |
| Fonts | [Google Fonts — Inter & Outfit](https://fonts.google.com/) |
| Automation | Python 3.11 (stdlib only — no external dependencies) |
| CI/CD | GitHub Actions |
| Hosting | GitHub Pages |

---

## 📄 License

This project is open source. Feel free to fork and adapt the automation agent pattern for your own portfolio.

---

*Built and maintained by [Cristian Nadj](https://crisemy.github.io) — Senior QA Engineer & Test Architect*
