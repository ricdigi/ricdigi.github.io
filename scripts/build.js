/* scripts/build.js — ES-module version */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import fse from 'fs-extra';
import { globSync } from 'glob';        // ⬅️  named export, no “default”
import { marked } from 'marked';
import matter from 'gray-matter';
import nunjucks from 'nunjucks';


/* ───────────────────────────── basic paths ── */
const SRC = 'src';      // where your sources live
const OUT = 'dist';     // output folder

/* ─────────────────────────── marked config ── */
marked.setOptions({ gfm: true, breaks: true });
const preprocessMathBlocks = (md) =>
  md.replace(/\$\$([^$]+)\$\$/gs, (_, m) => `\n<div>$$${m}$$</div>\n`);

/* ─────────────────────────── clean + copy ── */
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const d of ['css', 'js', 'img']) {
  await fse.copy(path.join(SRC, d), path.join(OUT, d));
}

/* ───────────────────── Nunjucks templates ── */
const nunjucksEnv = nunjucks.configure(
  [
    path.join(SRC, 'templates'),
    path.join(SRC, 'img', 'assets')
  ],
  { autoescape: false }
);

// Add the custom `date` filter
nunjucksEnv.addFilter('date', function (input, format = 'YYYY-MM-DD') {
  if (!input) return '';
  const date = new Date(input);
  return date.toISOString().slice(0, 10);
});

/* ─────────────────────── load manifest files ── */
function loadSectionMarkdown(section) {
  return globSync(path.join(SRC, 'content', section, '*.md')).map((fp) => {
    const { data, content } = matter.read(fp);

    return {
      ...data,
      content,
      slug: path.basename(fp, '.md'),
      filename: data.filename || `${section}/${path.basename(fp, '.md')}.html`,
      card_img: data.thumbnail || data.card_img || '',
      summary: data.description || data.summary || '',
      group: data.group || 'Ungrouped',
    };
  });
}


/* helper: get blog posts from front-matter */
function loadBlogPosts() {
  return globSync(path.join(SRC, 'content', 'blog', '*.md'))
    .map((f) => {
      const { data, content } = matter.read(f);

      return {
        slug: path.basename(f, '.md'),
        title: data.title || 'Untitled',
        date: data.date || '',
        excerpt: data.summary || data.excerpt || content.split('\n').find(l => l.trim()) || ''
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/* helper: group blog posts by month/year */
function groupByMonthYear(posts) {
  const result = {};
  for (const post of posts) {
    const date = new Date(post.date);
    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' }); // e.g., "May 2024"
    (result[key] ||= []).push(post);
  }
  return result;
}

/* helper: group array items by a key */
function groupBy(arr, key) {
  return arr.reduce((acc, obj) => {
    (acc[obj[key]] ||= []).push(obj);
    return acc;
  }, {});
}


/* ─────────────────────── build list pages ── */
const aboutPages = loadSectionMarkdown('about');
const projects = loadSectionMarkdown('projects');
const research = loadSectionMarkdown('research');
const blog = loadSectionMarkdown('blog');

const projectGroups  = groupBy(projects, 'group');
const researchGroups = groupBy(research, 'group');
const blogByMonth = groupByMonthYear(blog);


await writeFile(
  path.join(OUT, 'projects.html'),
  nunjucks.render('projects.html', {
    currentPage: 'projects',
    projects,
    projectGroups
  })
);

await writeFile(
  path.join(OUT, 'research.html'),
  nunjucks.render('research.html', {
    currentPage: 'research',
    research,
    researchGroups
  })
);

await writeFile(
  path.join(OUT, 'blog.html'),
  nunjucksEnv.render('blog.html', {
    currentPage: 'blog',
    blog,
    blogByMonth
  })
);


function getTemplateFor(mdFile) {
  if (mdFile.includes(`${path.sep}projects${path.sep}`)) {
    return 'project-detail.html';
  }
  if (mdFile.includes(`${path.sep}research${path.sep}`)) {
    return 'research-detail.html';
  }
  if (mdFile.includes(`${path.sep}blog${path.sep}`)) {
    return 'blog-detail.html';
  }
  if (mdFile.includes(`${path.sep}about${path.sep}`)) {
    return 'about.html';
  }

  return 'base.html'; // fallback
}

for (const mdFile of globSync(path.join(SRC, 'content', '**/*.md'))) {
  const { data, content } = matter.read(mdFile);
  const htmlFrag = marked.parse(preprocessMathBlocks(content));
  const wrapper = mdFile.includes(`${path.sep}blog${path.sep}`) ? 'content-wrapper-blog' : 'content-wrapper-normal';

  const slug = path.basename(mdFile, '.md');

  const currentPage = mdFile.includes(`${path.sep}projects${path.sep}`) ? 'projects'
  : mdFile.includes(`${path.sep}research${path.sep}`) ? 'research'
  : mdFile.includes(`${path.sep}blog${path.sep}`) ? 'blog'
  : mdFile.includes(`${path.sep}about${path.sep}`) ? 'about'
  : 'about';  // fallback

  let submenuData = {};
  if (mdFile.includes(`${path.sep}projects${path.sep}`)) submenuData.projectGroups = projectGroups;
  else if (mdFile.includes(`${path.sep}research${path.sep}`)) submenuData.researchGroups = researchGroups;
  else if (mdFile.includes(`${path.sep}blog${path.sep}`)) submenuData.blogByMonth = blogByMonth;

  const templateFile = getTemplateFor(mdFile);
  const pageHTML = nunjucks.render(
    templateFile,
    {
      ...data,
      ...submenuData,
      content: htmlFrag,
      title: data.title || 'Untitled',
      currentPage,
      currentSlug: slug
    }
  );

  const rel = path.relative(path.join(SRC, 'content'), mdFile).replace(/\.md$/, '.html');
  const out = path.join(OUT, rel);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, pageHTML, 'utf8');
}


// scripts/build.js  ── add just before the final console.log
await fse.copy(
  path.join(OUT, 'about/about.html'), // note subfolder inside dist
  path.join(OUT, 'index.html')
);

console.log('✅  Static build completed → dist/');
