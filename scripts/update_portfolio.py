#!/usr/bin/env python3
"""
Portfolio Automation Agent
--------------------------
This script fetches repositories from a GitHub profile, filters them
by a specific topic (e.g. 'portfolio-qa'), and merges any new discoveries
into the portfolio's projects.json data file.

It is designed to be run:
  - Locally for testing: python scripts/update_portfolio.py --dry-run
  - Automatically via GitHub Actions on a cron schedule.

Usage:
    python scripts/update_portfolio.py            # Live update
    python scripts/update_portfolio.py --dry-run  # Preview changes only
"""

import json
import sys
import os
import argparse
import urllib.request
import urllib.error
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Configuration — modify these to suit your needs
# ---------------------------------------------------------------------------

GITHUB_USERNAME = "crisemy"

# Repositories tagged with ANY of these topics will be considered for inclusion.
# Add your topic to a repo via: GitHub repo page → ⚙️ Settings → Topics
PORTFOLIO_TOPICS = {"portfolio-qa", "portfolio", "showcase"}

# Path to the JSON file (relative to the project root, where this script lives)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
PROJECTS_JSON_PATH = os.path.join(PROJECT_ROOT, "data", "projects.json")

# Icon mapping based on recognized keywords in the repo name / description.
# The agent will assign the first matching icon when auto-generating a new card.
ICON_MAP = [
    ({"llm", "agent", "prompt", "deepeval", "promptfoo"}, "fas fa-check-double"),
    ({"generator", "gherkin", "playwright", "risk"}, "fas fa-code-branch"),
    ({"pipeline", "cicd", "ci-cd", "regression"}, "fas fa-cubes"),
    ({"lab", "chaos", "intelligence", "observability"}, "fas fa-vial"),
    ({"cypress", "e2e", "pom", "ui"}, "fas fa-flask"),
    ({"api", "rest", "graphql"}, "fas fa-plug"),
    ({"performance", "load", "stress"}, "fas fa-tachometer-alt"),
    ({"data", "analytics", "dashboard"}, "fas fa-chart-line"),
    ({"mobile", "appium", "ios", "android"}, "fas fa-mobile-alt"),
]
DEFAULT_ICON = "fas fa-robot"

# ---------------------------------------------------------------------------


def log(message: str) -> None:
    """Prints a timestamped log message."""
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{ts}] {message}")


def fetch_github_repos(username: str) -> list[dict]:
    """
    Fetches all public repositories for a GitHub username via the REST API.
    Handles pagination automatically (up to 10 pages / 1000 repos).
    """
    repos = []
    page = 1
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "portfolio-agent/1.0"}

    # Optionally inject a GitHub token to increase rate limits (100→5000/hr)
    github_token = os.environ.get("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"
        log("Using GITHUB_TOKEN for authenticated API requests (5000 req/hr).")
    else:
        log("No GITHUB_TOKEN found. Using unauthenticated requests (60 req/hr).")

    while page <= 10:
        url = f"https://api.github.com/users/{username}/repos?per_page=100&page={page}&sort=updated"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as response:
                page_data = json.loads(response.read().decode("utf-8"))
                if not page_data:
                    break
                repos.extend(page_data)
                log(f"Fetched page {page} — {len(page_data)} repos received.")
                page += 1
        except urllib.error.HTTPError as e:
            log(f"ERROR: GitHub API returned HTTP {e.code}: {e.reason}")
            sys.exit(1)
        except urllib.error.URLError as e:
            log(f"ERROR: Could not reach GitHub API: {e.reason}")
            sys.exit(1)

    log(f"Total repositories fetched: {len(repos)}")
    return repos


def fetch_repo_topics(username: str, repo_name: str) -> list[str]:
    """
    Fetches the topics for a specific repository. The topics endpoint
    requires the special 'symmetra-preview' Accept header.
    """
    url = f"https://api.github.com/repos/{username}/{repo_name}/topics"
    headers = {
        "Accept": "application/vnd.github.mercy-preview+json",
        "User-Agent": "portfolio-agent/1.0",
    }
    github_token = os.environ.get("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"

    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("names", [])
    except Exception:
        # Non-critical: fall back to the topics embedded in the repo list response
        return []


def pick_icon(repo_name: str, description: str) -> str:
    """Assigns a FontAwesome icon based on keywords in the repo name/description."""
    searchable = (repo_name + " " + (description or "")).lower()
    for keywords, icon in ICON_MAP:
        if any(kw in searchable for kw in keywords):
            return icon
    return DEFAULT_ICON


def generate_tags_from_languages(repo: dict) -> list[str]:
    """
    Derives tech tags from the primary language reported by GitHub.
    A future enhancement could call the /languages endpoint for a full breakdown.
    """
    lang = repo.get("language")
    tags = []
    if lang:
        tags.append(lang)
    return tags if tags else ["QA", "Automation"]


def build_new_project_entry(repo: dict, topics: list[str]) -> dict:
    """
    Constructs a new project dictionary from a raw GitHub repo object.
    This is used when a new repository is discovered and needs to be added.
    """
    name = repo["name"]
    description = repo.get("description") or f"Open-source project: {name}"
    icon = pick_icon(name, description)
    tags = generate_tags_from_languages(repo)
    modal_id = f"modal-{name.lower().replace('-', '_')}"

    return {
        "id": modal_id,
        "title": name.replace("-", " ").title(),
        "icon": icon,
        "navLabel": name.replace("-", " ").title(),
        "shortDescription": description,
        "fullDescription": description,
        "tags": tags,
        "modalTags": tags + (topics if topics else []),
        "features": [
            f"Repository: {repo['html_url']}",
            f"Primary language: {repo.get('language', 'N/A')}",
            f"Last updated: {repo.get('updated_at', 'N/A')[:10]}",
        ],
        "githubUrl": repo["html_url"],
        "screenshotUrl": None,
        "priority": 99,    # Auto-discovered repos go to the end. You can re-order manually.
        "source": "agent", # Flag to distinguish auto-generated vs manually curated entries
    }


def load_projects(path: str) -> list[dict]:
    """Loads the current projects.json file."""
    if not os.path.exists(path):
        log(f"WARNING: {path} not found. Starting with an empty project list.")
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_projects(path: str, projects: list[dict]) -> None:
    """Saves the updated project list back to the JSON file."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(projects, f, indent=2, ensure_ascii=False)
        f.write("\n")  # trailing newline — good Git etiquette


def run(dry_run: bool = False) -> None:
    """Main agent execution logic."""
    log("=" * 60)
    log(f"Portfolio Agent starting. DRY RUN: {dry_run}")
    log("=" * 60)

    # 1. Fetch all repositories from GitHub
    all_repos = fetch_github_repos(GITHUB_USERNAME)

    # 2. Filter: keep only repos tagged with one of the portfolio topics
    log(f"Filtering repos by topics: {PORTFOLIO_TOPICS}")
    matching_repos = []

    for repo in all_repos:
        # The repo list response sometimes includes topics; if not, fetch separately.
        repo_topics = repo.get("topics", [])
        if not repo_topics:
            repo_topics = fetch_repo_topics(GITHUB_USERNAME, repo["name"])

        matched = PORTFOLIO_TOPICS.intersection(set(repo_topics))
        if matched:
            log(f"  ✓ MATCH — {repo['name']} (topics: {repo_topics})")
            repo["_fetched_topics"] = repo_topics
            matching_repos.append(repo)

    log(f"Found {len(matching_repos)} matching repositories.")

    # 3. Load the existing projects.json
    existing_projects = load_projects(PROJECTS_JSON_PATH)
    existing_github_urls = {p["githubUrl"] for p in existing_projects}
    log(f"Existing projects in JSON: {len(existing_projects)}")

    # 4. Detect NEW repositories that are not yet in the JSON
    new_projects = []
    for repo in matching_repos:
        if repo["html_url"] not in existing_github_urls:
            log(f"  ★ NEW PROJECT detected: {repo['name']}")
            entry = build_new_project_entry(repo, repo.get("_fetched_topics", []))
            new_projects.append(entry)

    if not new_projects:
        log("No new projects discovered. Portfolio JSON is up to date!")
    else:
        log(f"{len(new_projects)} new project(s) will be added:")
        for p in new_projects:
            log(f"   → {p['title']} ({p['githubUrl']})")

    # 5. Merge and save
    if new_projects and not dry_run:
        updated = existing_projects + new_projects
        # Sort by priority (manual projects first, then auto-discovered by update date)
        updated.sort(key=lambda p: p.get("priority", 99))
        save_projects(PROJECTS_JSON_PATH, updated)
        log(f"SUCCESS: projects.json updated with {len(new_projects)} new project(s).")
    elif dry_run and new_projects:
        log("DRY RUN: No changes written to disk.")
    else:
        log("Nothing to write.")

    log("Agent finished.")


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Portfolio Automation Agent")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and analyse repos but do NOT write changes to disk.",
    )
    args = parser.parse_args()
    run(dry_run=args.dry_run)
