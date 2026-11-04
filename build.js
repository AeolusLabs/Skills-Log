#!/usr/bin/env node
// Regenerates README.md from skills.json (the single source of truth).
//   node build.js                                   rebuild README
//   node build.js add "<category>" <name> <owner/repo> "<use>"   add a skill, then rebuild
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'skills.json');
const skills = JSON.parse(fs.readFileSync(file, 'utf8'));

if (process.argv[2] === 'add') {
  const [, , , category, name, repo, use] = process.argv;
  if (!category || !name || !repo || !use) {
    console.error('usage: node build.js add "<category>" <name> <owner/repo> "<use>"');
    process.exit(1);
  }
  if (skills.some((s) => s.name === name && s.repo === repo)) {
    console.error(`already listed: ${name}`);
    process.exit(1);
  }
  skills.push({ category, name, repo, use });
  fs.writeFileSync(file, JSON.stringify(skills, null, 2) + '\n');
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-'); // GitHub heading-anchor rule
const esc = (s) => String(s).replace(/\|/g, '\\|');
const cats = [...new Set(skills.map((s) => s.category))];

let md = `# Skills Index

A browsable list of AI agent skills: what each one does and where to get it.
**${skills.length} skills** across **${cats.length} categories**.

## Jump to

${cats.map((c) => `- [${c}](#${slug(c)}) (${skills.filter((s) => s.category === c).length})`).join('\n')}

## How to use a skill from this list

1. Find the skill below and open its repo link.
2. Install it with the [skills CLI](https://github.com/vercel-labs/skills): \`npx skills add <owner/repo>\`
   (for example \`npx skills add pbakaus/impeccable\`). Repos that ship a Claude Code plugin, such as
   Superpowers, can also be installed as a plugin - see that repo's README.
3. Read the skill's \`SKILL.md\` before trusting it. Skills run with your agent's permissions.

`;

for (const c of cats) {
  md += `## ${c}\n\n| Skill | Use | Repo |\n|---|---|---|\n`;
  for (const s of skills.filter((x) => x.category === c)) {
    const note = s.note ? ` _(${s.note})_` : '';
    md += `| \`${s.name}\` | ${esc(s.use)} | [${s.repo}](https://github.com/${s.repo})${note} |\n`;
  }
  md += '\n';
}

md += `## Adding a skill

Edit [\`skills.json\`](skills.json) (one object per skill: \`category\`, \`name\`, \`repo\`, \`use\`), then run \`node build.js\`.
Or in one step:

\`\`\`
node build.js add "Design & frontend" my-skill owner/repo "What it is used for"
\`\`\`

\`README.md\` is generated - edit \`skills.json\`, not the README. A GitHub Action rebuilds it on every push that changes \`skills.json\`.
`;

fs.writeFileSync(path.join(__dirname, 'README.md'), md);
console.log(`README.md written: ${skills.length} skills, ${cats.length} categories`);
