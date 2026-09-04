const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, '..', 'content', 'blog');
const dataFile = path.join(__dirname, '..', 'data', 'posts.json');

if (!fs.existsSync(blogDir)) {
  console.error('Directory content/blog not found:', blogDir);
  process.exit(1);
}

const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
const posts = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(blogDir, file), 'utf8');
  const slug = file.replace(/\.md$/, '');
  
  // Extract first H1 title
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : slug;
  
  // Extract date
  const dateMatch = content.match(/\*Published:\s*([^|*]+)/i);
  const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString().slice(0, 10);
  
  // Extract tags
  const tagsMatch = content.match(/Tags:\s*([^*]+)\*/i);
  const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()) : [];
  
  // Extract first paragraph for summary
  const paragraphs = content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !p.startsWith('#') && !p.startsWith('*Published'));

  const summary = paragraphs.length > 0
    ? paragraphs[0].replace(/[#*`_\[\]]/g, '').trim().slice(0, 180) + '...'
    : 'Read technical writeup.';

  posts.push({ title, slug, date, summary, tags });
}

// Sort newest first
posts.sort((a, b) => b.date.localeCompare(a.date));

fs.writeFileSync(dataFile, JSON.stringify(posts, null, 2), 'utf8');
console.log(`[OK] Successfully indexed ${posts.length} posts into data/posts.json:`);
posts.forEach(p => console.log(`  - [${p.date}] ${p.title} (${p.slug})`));
