const axios = require("axios");
const fs = require("fs");
const path = require("path");

const GITHUB_USERNAME = "tess-vu";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function getStats() {
  try {
    const query = `
      query {
        user(login: "${GITHUB_USERNAME}") {
          contributionsCollection {
            totalCommitContributions
            totalIssueContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
          }
        }
      }
    `;

    const response = await axios.post(
      "https://api.github.com/graphql",
      { query },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data.data.user.contributionsCollection;
    const total =
      data.totalCommitContributions +
      data.totalIssueContributions +
      data.totalPullRequestContributions +
      data.totalPullRequestReviewContributions;

    const commits = Math.round((data.totalCommitContributions / total) * 100);
    const prs = Math.round((data.totalPullRequestContributions / total) * 100);
    const issues = Math.round((data.totalIssueContributions / total) * 100);
    const reviews = Math.round(
      (data.totalPullRequestReviewContributions / total) * 100
    );

    return { commits, prs, issues, reviews };
  } catch (error) {
    console.error("Error fetching stats:", error);
    process.exit(1);
  }
}

function generateSVG(stats) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <style>
        .stat-label { font-size: 14px; font-weight: 600; fill: #e0e0e0; text-anchor: middle; }
        .stat-value { font-size: 28px; font-weight: 700; fill: #4ade80; text-anchor: middle; }
        .stat-line { stroke: #4ade80; stroke-width: 2; }
      </style>
    </defs>
    
    <!-- Background -->
    <rect width="400" height="400" fill="#1e293b"/>
    
    <!-- Grid lines -->
    <line x1="200" y1="0" x2="200" y2="400" stroke="#444" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="0" y1="200" x2="400" y2="200" stroke="#444" stroke-width="1" stroke-dasharray="2,2"/>
    
    <!-- Diamond/Radar chart -->
    <polygon points="200,50 320,200 200,350 80,200" fill="#4ade80" opacity="0.2" stroke="#4ade80" stroke-width="2"/>
    
    <!-- Stats positioned at cardinal points -->
    <!-- Commits (Top Left) -->
    <text x="80" y="190" class="stat-value">${stats.commits}%</text>
    <text x="80" y="210" class="stat-label">Commits</text>
    
    <!-- Code Review (Top) -->
    <text x="200" y="30" class="stat-value">${stats.reviews}%</text>
    <text x="200" y="48" class="stat-label">Code Review</text>
    
    <!-- Issues (Right) -->
    <text x="330" y="210" class="stat-value">${stats.issues}%</text>
    <text x="330" y="225" class="stat-label">Issues</text>
    
    <!-- Pull Requests (Bottom) -->
    <text x="200" y="375" class="stat-value">${stats.prs}%</text>
    <text x="200" y="390" class="stat-label">Pull Requests</text>
  </svg>`;

  const assetsDir = path.join(__dirname, "../assets");
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  fs.writeFileSync(path.join(assetsDir, "contribution-stats.svg"), svg);
  console.log("✓ Stats generated: assets/contribution-stats.svg");
}

(async () => {
  const stats = await getStats();
  generateSVG(stats);
})();
