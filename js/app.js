// Configure marked BEFORE using it
marked.setOptions({
  breaks: true,
  gfm: true
});

// Load the SVG logo
fetch('img/assets/website_logo.svg')
  .then(res => res.text())
  .then(svg => {
    const container = document.getElementById('logo-container');
    container.innerHTML = svg;
  });

// Initial load after DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  loadPage('about.md');
});

function loadPage(file) {
  fetch('content/' + file)
    .then(res => res.text())
    .then(md => {
      const contentDiv = document.getElementById('content');
      const scrollContainer = document.getElementById('content-column');

      let html = marked.parse(preprocessMathBlocks(md));
      const wrapped = `<div class="content-wrapper">${html}</div>`;
      contentDiv.innerHTML = wrapped;

      updateSubmenu(file);

      if (window.MathJax) {
        MathJax.typesetPromise().then(() => {
          setTimeout(() => {
            scrollContainer.scrollTop = 0;
            window.scrollTo(0, 0);
          }, 100);
        });
      } else {
        setTimeout(() => {
          scrollContainer.scrollTop = 0;
          window.scrollTo(0, 0);
        }, 100);
      }

    });

  // Highlight active menu item
  const mainItems = document.querySelectorAll('#main-menu li');
  mainItems.forEach(li => li.classList.remove('active'));
  const clickedItem = Array.from(mainItems).find(li => li.textContent.toLowerCase() === file.split('.')[0]);
  if (clickedItem) clickedItem.classList.add('active');
}


async function updateSubmenu(file) {
  const submenu = document.getElementById('sub-menu-items');
  submenu.innerHTML = '';

  const section = file.replace('.md', '');

  try {
    const res = await fetch(`content/${section}/manifest.json`);
    const data = await res.json();

    if (section === "blog") {
      // Sort by date descending
      data.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Group by Month Year
      const groups = {};
      data.forEach(item => {
        const date = new Date(item.date);
        const groupKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(item);
      });

      Object.entries(groups).forEach(([groupTitle, items]) => {
        const heading = document.createElement('li');
        heading.textContent = groupTitle;
        heading.classList.add('submenu-heading');
        submenu.appendChild(heading);

        items.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item.title;
          li.classList.add('submenu-item');
          li.onclick = () => {
            document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
            li.classList.add('active');
            loadMarkdown(item.link);
          };
          submenu.appendChild(li);
        });
      });

      // Render main blog page with date-sorted list
      renderBlogList(data);
    } else {
      // Show preview cards in content column
      renderPreviewGrid(data);

      // ✅ Now add this part to build submenu grouped by item.group
      const groups = {};
      data.forEach(item => {
        const group = item.group || 'Other';
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
      });

      Object.entries(groups).forEach(([groupTitle, items]) => {
        const heading = document.createElement('li');
        heading.textContent = groupTitle;
        heading.classList.add('submenu-heading');
        submenu.appendChild(heading);

        items.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item.title;
          li.classList.add('submenu-item');
          li.onclick = () => {
            document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
            li.classList.add('active');
            loadMarkdown(item.link);
          };
          submenu.appendChild(li);
        });
      });
    }


  } catch (err) {
    console.error("Error loading submenu manifest:", err);
  }
}

function renderPreviewGrid(items) {
  const contentDiv = document.getElementById('content');
  const html = items.map(item => `
    <div class="preview-card">
      <a href="#" onclick="loadMarkdown('${item.link}'); return false;">
        <img src="${item.thumbnail}" alt="${item.title}" />
      </a>
    </div>
  `).join('');

  contentDiv.innerHTML = `<div class="preview-grid">${html}</div>`;
}

function renderBlogList(items) {
  const contentDiv = document.getElementById('content');

  const html = items.map(item => {
    const date = new Date(item.date);
    const formatted = date.toLocaleDateString('default', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    return `
      <li>
        <a href="#" onclick="loadMarkdown('${item.link}'); return false;">
          <strong>${item.title + " - "}</strong>
          <normal>${formatted}</normal> <br>
          <p>${item.description}</p>
        </a>
      </li>
    `;
  }).join('');

  contentDiv.innerHTML = `<h1>Blog Posts</h1><ul class="blog-list">${html}</ul>`;
}

function loadMarkdown(path) {
  fetch('content/' + path)
    .then(res => res.text())
    .then(md => {
      const contentColumn = document.getElementById('content');
      const scrollContainer = document.getElementById('content-column');
      const html = marked.parse(preprocessMathBlocks(md));
      document.getElementById('content').innerHTML = `<div class="content-wrapper">${html}</div>`;

      if (window.MathJax) {
        MathJax.typesetPromise().then(() => {
          setTimeout(() => {
            scrollContainer.scrollTop = 0;
            window.scrollTo(0, 0);
          }, 100);
        });
      } else {
        setTimeout(() => {
          scrollContainer.scrollTop = 0;
          window.scrollTo(0, 0);
        }, 100);
      }
    });
}

fetch('img/assets/website_logo.svg')
  .then(res => res.text())
  .then(svg => {
    document.getElementById('splash-logo-inner').innerHTML = svg;

    setTimeout(() => {
      const splash = document.getElementById('splash-logo');
      const container = document.getElementById('container');

      splash.classList.add('fade-out');

      setTimeout(() => {
        splash.style.display = 'none';
        container.style.display = 'grid'; // or 'block'

        // ⏱ Delay fade-in by 0.5s
        setTimeout(() => {
          container.classList.add('visible');
        }, 500); // 0.5 second delay

      }, 2000); // fade-out duration
    }, 2000); // wait for all splash animations to finish

  });

function preprocessMathBlocks(md) {
  // Wrap all $$...$$ blocks in <div> so MathJax notices them
  return md.replace(/\$\$([^$]+)\$\$/gs, (_, math) => `\n<div>$$${math}$$</div>\n`);
}


