// @ts-check
import { GoogleGenerativeAI } from "@google/generative-ai";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Get last N commits from git history
 * @param {number} count - Number of commits to fetch
 * @returns {Array<{hash: string, date: string, author: string, message: string}>}
 */
function getLastCommits(count = 10) {
  try {
    const output = execSync(`git log -${count} --pretty=format:"%H|%aI|%an|%s"`, { encoding: "utf-8" });

    return output
      .trim()
      .split("\n")
      .map((line) => {
        const [hash, date, author, message] = line.split("|");
        return { hash, date, author, message };
      });
  } catch (error) {
    console.error("Error fetching git commits:", error);
    throw error;
  }
}

/**
 * Generate CHANGELOG entry using Gemini Flash
 * @param {Array} commits - Array of commit objects
 * @param {string} apiKey - Google API key
 * @returns {Promise<string>}
 */
async function generateChangelogEntry(commits, apiKey) {
  const ai = new GoogleGenerativeAI({ apiKey });

  const commitsText = commits
    .map(
      (c) => `- [${c.hash.substring(0, 7)}] ${c.message} (${c.author}, ${new Date(c.date).toLocaleDateString("pl-PL")})`
    )
    .join("\n");

  const prompt = `
Jesteś asystentem tworzącym wpisy do dokumentu CHANGELOG.md dla projektu CulturAllyAI.

Otrzymujesz listę ostatnich commitów z repozytorium. Twoim zadaniem jest:
1. Przeanalizować zmiany i pogrupować je tematycznie
2. Stworzyć czytelny, zwięzły wpis po polsku
3. Użyć formatu list wypunktowanych (- )
4. Skupić się na wartości biznesowej i funkcjonalnej, nie na szczegółach technicznych
5. Jeśli commity dotyczą różnych obszarów, pogrupuj je w logiczne sekcje

Przykładowy format wpisu:
- Wdrożono poprawki do styli na stronie głównej
- Zaktualizowano zależności w package.json
- Wykonano modernizację kodu client-side (jQuery -> Svelte)

Lista commitów do analizy:
${commitsText}

Zwróć TYLKO listę wypunktowaną zmian (bez nagłówków sekcji, bez dat). Każda zmiana w osobnej linii zaczynającej się od "- ".
Maksymalnie 10-15 linii. Bądź zwięzły i konkretny.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating changelog with AI:", error);
    throw error;
  }
}

/**
 * Format date range for CHANGELOG section header
 * @param {Array} commits - Array of commit objects
 * @returns {string} Date range in format "DD.MM.YYYY - DD.MM.YYYY"
 */
function getDateRange(commits) {
  if (!commits || commits.length === 0) {
    const today = new Date();
    return `${today.toLocaleDateString("pl-PL")}`;
  }

  const dates = commits.map((c) => new Date(c.date)).sort((a, b) => a - b);
  const oldest = dates[0];
  const newest = dates[dates.length - 1];

  const formatDate = (date) => date.toLocaleDateString("pl-PL");

  if (oldest.toDateString() === newest.toDateString()) {
    return formatDate(newest);
  }

  return `${formatDate(oldest)} - ${formatDate(newest)}`;
}

/**
 * Update CHANGELOG.md file with new entry
 * @param {string} newEntry - New changelog entry
 * @param {string} dateRange - Date range for the section
 */
function updateChangelog(newEntry, dateRange) {
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
  let content = "";

  if (fs.existsSync(changelogPath)) {
    content = fs.readFileSync(changelogPath, "utf-8");
  } else {
    // Create new CHANGELOG if it doesn't exist
    content = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
  }

  // Find the position to insert new entry (after header, before first ## section or at the end)
  const sectionRegex = /^## /m;
  const match = content.match(sectionRegex);

  const newSection = `## ${dateRange}\n\n${newEntry}\n\n`;

  if (match) {
    // Insert before first section
    const insertPosition = match.index;
    content = content.slice(0, insertPosition) + newSection + content.slice(insertPosition);
  } else {
    // Append at the end
    content += newSection;
  }

  fs.writeFileSync(changelogPath, content, "utf-8");
  console.log("✅ CHANGELOG.md updated successfully");
}

/**
 * Create a new branch and commit changes
 * @param {string} dateRange - Date range for branch name
 */
function createBranchAndCommit(dateRange) {
  try {
    const branchName = `chore/update-changelog-${Date.now()}`;
    const baseBranch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
    }).trim();

    console.log(`Creating branch: ${branchName}`);
    execSync(`git checkout -b ${branchName}`);

    console.log("Adding CHANGELOG.md to git");
    execSync("git add CHANGELOG.md");

    console.log("Committing changes");
    execSync(`git commit -m "chore: update CHANGELOG.md (${dateRange})"`);

    console.log("Pushing branch to origin");
    execSync(`git push -u origin ${branchName}`);

    return { branchName, baseBranch };
  } catch (error) {
    console.error("Error creating branch and commit:", error);
    throw error;
  }
}

/**
 * Create Pull Request using GitHub API
 * @param {string} branchName - Source branch name
 * @param {string} baseBranch - Target branch name
 * @param {string} dateRange - Date range for PR title
 */
async function createPullRequest(branchName, baseBranch, dateRange) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN not found in environment");
  }

  // Get repository info from git remote
  const remoteUrl = execSync("git config --get remote.origin.url", {
    encoding: "utf-8",
  }).trim();

  const repoMatch = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
  if (!repoMatch) {
    throw new Error("Could not parse repository info from git remote");
  }

  const [, owner, repo] = repoMatch;

  console.log(`Creating PR in ${owner}/${repo}`);

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      title: `chore: Update CHANGELOG.md (${dateRange})`,
      head: branchName,
      base: baseBranch,
      body: `## 📝 Automatyczna aktualizacja CHANGELOG\n\nTen PR został wygenerowany automatycznie przez GitHub Actions.\n\n### Zakres zmian\nPeriod: **${dateRange}**\n\nPrzeanalizowano ostatnie 10 commitów i wygenerowano wpis do CHANGELOG.md przy użyciu Gemini Flash.\n\n---\n\n_Wygenerowano przez workflow: \`update-changelog.yml\`_`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create PR: ${response.status} - ${error}`);
  }

  const pr = await response.json();
  console.log(`✅ Pull Request created: ${pr.html_url}`);
  return pr;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log("🚀 Starting CHANGELOG update process...\n");

    // Validate environment
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY not found in environment");
    }

    // Step 1: Get last 10 commits
    console.log("📝 Fetching last 10 commits...");
    const commits = getLastCommits(10);
    console.log(`Found ${commits.length} commits\n`);

    // Step 2: Generate CHANGELOG entry using AI
    console.log("🤖 Generating CHANGELOG entry with Gemini Flash...");
    const changelogEntry = await generateChangelogEntry(commits, apiKey);
    console.log("Generated entry:");
    console.log(changelogEntry);
    console.log();

    // Step 3: Get date range
    const dateRange = getDateRange(commits);
    console.log(`Date range: ${dateRange}\n`);

    // Step 4: Update CHANGELOG.md
    console.log("📄 Updating CHANGELOG.md...");
    updateChangelog(changelogEntry, dateRange);

    // Step 5: Check if there are actual changes
    const gitStatus = execSync("git status --porcelain", {
      encoding: "utf-8",
    }).trim();

    if (!gitStatus) {
      console.log("ℹ️  No changes detected in CHANGELOG.md. Skipping PR creation.");
      return;
    }

    // Step 6: Create branch and commit
    console.log("\n🌿 Creating branch and committing changes...");
    const { branchName, baseBranch } = createBranchAndCommit(dateRange);

    // Step 7: Create Pull Request
    console.log("\n🔀 Creating Pull Request...");
    await createPullRequest(branchName, baseBranch, dateRange);

    console.log("\n✅ Process completed successfully!");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main();
