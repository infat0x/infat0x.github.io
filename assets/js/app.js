/**
 * Ali Guliyev Personal Website - Markdown SPA Router & Parser
 * Native GitHub Pages compatible - Zero backend dependencies
 */

(function () {
  'use strict';

  // Configure marked options
  if (window.marked) {
    marked.setOptions({
      gfm: true,
      breaks: false,
      headerIds: true,
      mangle: false
    });
  }

  // Configure mermaid options
  if (window.mermaid) {
    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true,
      securityLevel: 'loose',
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#181818',
        primaryColor: '#2b2b2b',
        primaryBorderColor: '#ff424d',
        primaryTextColor: '#eeeeee',
        lineColor: '#ff424d'
      }
    });
  }

  const appElement = document.getElementById('app');
  const navLinks = document.querySelectorAll('.nav-menu a');
  const navMenu = document.querySelector('.nav-menu');
  const navToggle = document.querySelector('.nav-toggle');
  const langSwitch = document.getElementById('lang-switch');

  // Cache to avoid refetching identical files
  const cache = new Map();

  async function fetchText(url) {
    if (cache.has(url)) {
      return cache.get(url);
    }
    const response = await fetch(url + '?v=' + Date.now());
    if (!response.ok) {
      throw new Error(`Failed to load ${url} (HTTP ${response.status})`);
    }
    const text = await response.text();
    cache.set(url, text);
    return text;
  }

  function setActiveNav(hash) {
    const cleanHash = hash.replace(/\/$/, '') || '#/';
    navLinks.forEach(link => {
      const linkHash = link.getAttribute('href');
      if (
        (cleanHash === '#/' && (linkHash === '#/' || linkHash === 'index.html' || linkHash === '')) ||
        (cleanHash.startsWith('#/blog') && linkHash === '#/blog') ||
        linkHash === cleanHash
      ) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Close mobile nav menu if open
    if (navMenu && navMenu.classList.contains('active')) {
      navMenu.classList.remove('active');
      if (navToggle) navToggle.classList.remove('active');
    }
  }

  async function renderMarkdown(markdownText) {
    if (!window.marked) {
      appElement.innerHTML = `<pre>${markdownText}</pre>`;
      return;
    }
    const html = marked.parse(markdownText);
    appElement.innerHTML = html;

    // Apply syntax highlighting
    if (window.hljs) {
      appElement.querySelectorAll('pre code:not(.language-mermaid)').forEach(block => {
        hljs.highlightElement(block);
      });
    }

    // Setup Code Block Containers, Headers, and Copy Buttons
    appElement.querySelectorAll('pre').forEach(pre => {
      // Don't add to mermaid blocks or already processed blocks
      if (pre.querySelector('code.language-mermaid') || pre.classList.contains('mermaid') || pre.closest('.code-block-container')) return;

      const codeElement = pre.querySelector('code');
      // Detect language if specified (e.g. language-bash -> bash)
      let lang = '';
      if (codeElement && codeElement.className) {
        const langMatch = codeElement.className.match(/language-([a-zA-Z0-9_-]+)/);
        if (langMatch) {
          lang = langMatch[1];
        }
      }

      // Create code block wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-container';

      // Create header bar
      const header = document.createElement('div');
      header.className = 'code-header';

      const langSpan = document.createElement('span');
      langSpan.className = 'code-lang';
      langSpan.textContent = lang || '';

      const copySvg = `<svg class="copy-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="13" height="13" rx="2.5"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>`;
      const checkSvg = `<svg class="copy-icon check-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-code-btn';
      copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
      copyBtn.innerHTML = `${copySvg}<span class="copy-text">copy</span>`;

      copyBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const textToCopy = (codeElement ? codeElement.innerText : pre.innerText).replace(/^\s+|\s+$/g, '');

        const copySuccess = () => {
          copyBtn.innerHTML = `${checkSvg}<span class="copy-text">copied!</span>`;
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.innerHTML = `${copySvg}<span class="copy-text">copy</span>`;
            copyBtn.classList.remove('copied');
          }, 2000);
        };

        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(textToCopy);
            copySuccess();
            return;
          } catch (err) {
            console.warn('Clipboard API failed, trying fallback...', err);
          }
        }
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          copySuccess();
        } catch (err) {
          console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textarea);
      });

      header.appendChild(langSpan);
      header.appendChild(copyBtn);

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
    });

    // Render Mermaid diagrams with interactive zoom, pan, and fullscreen
    if (window.mermaid) {
      const mermaidBlocks = appElement.querySelectorAll('pre code.language-mermaid');
      if (mermaidBlocks.length > 0) {
        mermaidBlocks.forEach(block => {
          const pre = block.parentElement;
          const div = document.createElement('div');
          div.className = 'mermaid';
          div.textContent = block.textContent;
          pre.replaceWith(div);
        });
        try {
          await mermaid.run();
        } catch (e) {
          console.warn('Mermaid rendering error:', e);
        }
        // Remove error SVGs if an error ever occurred
        document.querySelectorAll('svg[aria-roledescription="error"]').forEach(el => el.remove());

        // Enhance rendered Mermaid diagrams with zoom, pan, and fullscreen
        enhanceMermaidContainers(appElement);
      }
    }
  }

  function enhanceMermaidContainers(container) {
    const mermaidElements = container.querySelectorAll('.mermaid');
    mermaidElements.forEach((mermaidDiv, idx) => {
      if (mermaidDiv.closest('.mermaid-container')) return;
      const svg = mermaidDiv.querySelector('svg');
      if (!svg) return;

      // Create outer container
      const wrapper = document.createElement('div');
      wrapper.className = 'mermaid-container';

      // Create toolbar
      const toolbar = document.createElement('div');
      toolbar.className = 'mermaid-toolbar';
      toolbar.innerHTML = `
        <span class="m-title">Flowchart #${idx + 1}</span>
        <button class="m-btn m-zoom-in" title="Zoom In">+</button>
        <button class="m-btn m-zoom-out" title="Zoom Out">&minus;</button>
        <button class="m-btn m-reset" title="Reset Zoom">↺ Reset</button>
        <button class="m-btn m-fullscreen" title="Toggle Fullscreen">⛶ Expand</button>
      `;

      // Create viewport & content
      const viewport = document.createElement('div');
      viewport.className = 'mermaid-viewport';

      const content = document.createElement('div');
      content.className = 'mermaid-content';

      // Move mermaidDiv into content
      mermaidDiv.parentNode.insertBefore(wrapper, mermaidDiv);
      content.appendChild(mermaidDiv);
      viewport.appendChild(content);
      wrapper.appendChild(toolbar);
      wrapper.appendChild(viewport);

      const hint = document.createElement('div');
      hint.className = 'mermaid-hint';
      hint.innerHTML = 'scroll to zoom &bull; click &amp; drag to pan';
      wrapper.appendChild(hint);

      // State
      let scale = 1;
      let translateX = 0;
      let translateY = 0;
      let isDragging = false;
      let startX = 0;
      let startY = 0;

      function updateTransform(smooth) {
        content.style.transition = smooth ? 'transform 0.15s ease-out' : 'none';
        content.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      }

      // Toolbar Controls
      const btnIn = toolbar.querySelector('.m-zoom-in');
      const btnOut = toolbar.querySelector('.m-zoom-out');
      const btnReset = toolbar.querySelector('.m-reset');
      const btnFs = toolbar.querySelector('.m-fullscreen');

      btnIn.addEventListener('click', (e) => {
        e.preventDefault();
        scale = Math.min(scale * 1.3, 6.0);
        updateTransform(true);
      });

      btnOut.addEventListener('click', (e) => {
        e.preventDefault();
        scale = Math.max(scale / 1.3, 0.35);
        updateTransform(true);
      });

      btnReset.addEventListener('click', (e) => {
        e.preventDefault();
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateTransform(true);
      });

      btnFs.addEventListener('click', (e) => {
        e.preventDefault();
        wrapper.classList.toggle('is-fullscreen');
        if (wrapper.classList.contains('is-fullscreen')) {
          btnFs.innerHTML = '✕ Close';
          document.body.style.overflow = 'hidden';
        } else {
          btnFs.innerHTML = '⛶ Expand';
          document.body.style.overflow = '';
        }
      });

      // Escape key to exit fullscreen
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && wrapper.classList.contains('is-fullscreen')) {
          wrapper.classList.remove('is-fullscreen');
          btnFs.innerHTML = '⛶ Expand';
          document.body.style.overflow = '';
        }
      });

      // Pan Dragging (Mouse)
      viewport.addEventListener('mousedown', (e) => {
        if (e.target.closest('.mermaid-toolbar')) return;
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        viewport.classList.add('grabbing');
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform(false);
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          viewport.classList.remove('grabbing');
        }
      });

      // Pan Dragging (Touch)
      let touchStartX = 0;
      let touchStartY = 0;
      viewport.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          isDragging = true;
          touchStartX = e.touches[0].clientX - translateX;
          touchStartY = e.touches[0].clientY - translateY;
        }
      }, { passive: true });

      viewport.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        translateX = e.touches[0].clientX - touchStartX;
        translateY = e.touches[0].clientY - touchStartY;
        updateTransform(false);
      }, { passive: true });

      viewport.addEventListener('touchend', () => {
        isDragging = false;
      });

      // Mouse Wheel Zoom
      viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 0.87;
        const newScale = Math.min(Math.max(scale * factor, 0.35), 6.0);
        scale = newScale;
        updateTransform(false);
      }, { passive: false });
    });
  }

  async function renderBlogIndex() {
    appElement.innerHTML = `<div class="loading">Loading writeups...</div>`;
    try {
      const postsJson = await fetchText('./data/posts.json');
      const posts = JSON.parse(postsJson);

      posts.sort((a, b) => {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        return timeB - timeA;
      });

      let html = `
        <h1>Blog &amp; Technical Writeups</h1>
        <p>Security writeups, vulnerability research notes, and penetration testing walk-throughs written in Markdown.</p>
        <ul class="post-list">
      `;

      posts.forEach(post => {
        const tagsHtml = (post.tags || [])
          .map(tag => `<span class="badge">${tag}</span>`)
          .join('');

        html += `
          <li class="post-item">
            <h2 class="post-title"><a href="#/blog/${post.slug}">${post.title}</a></h2>
            <div class="post-meta">
              <span><b>Date:</b> ${post.date}</span>
              ${tagsHtml}
            </div>
            <p>${post.summary}</p>
            <p><a href="#/blog/${post.slug}">Read Article &rarr;</a></p>
          </li>
        `;
      });

      html += `</ul>`;
      appElement.innerHTML = html;
      document.title = `Blog | Ali Guliyev Personal Website`;
    } catch (err) {
      console.error('Error loading posts:', err);
      appElement.innerHTML = `
        <h1>Blog</h1>
        <div class="error-msg">
          <p>Unable to load posts index. Please verify <code>data/posts.json</code> exists.</p>
        </div>
      `;
    }
  }

  async function handleRoute() {
    const rawHash = window.location.hash || '#/';
    const route = rawHash.replace(/^#\/?/, '').replace(/\/$/, '');

    setActiveNav(rawHash);
    appElement.innerHTML = `<div class="loading">Loading...</div>`;

    // Special Route: Blog Index
    if (route === 'blog') {
      await renderBlogIndex();
      return;
    }

    // Special Route: Single Blog Post (e.g. blog/cve-2026-24061)
    if (route.startsWith('blog/')) {
      const slug = route.replace(/^blog\//, '');
      const filePath = `./content/blog/${slug}.md`;
      try {
        const md = await fetchText(filePath);
        await renderMarkdown(md);
        
        // Add back link to blog list
        const backLink = document.createElement('div');
        backLink.innerHTML = `<p><a href="#/blog" class="back-link">&larr; Back to all writeups</a></p>`;
        appElement.insertBefore(backLink, appElement.firstChild);

        // Update document title from first H1
        const firstH1 = appElement.querySelector('h1');
        if (firstH1) {
          document.title = `${firstH1.textContent} | Ali Guliyev`;
        }
      } catch (err) {
        console.error('Post load error:', err);
        appElement.innerHTML = `
          <h1>Post Not Found</h1>
          <div class="error-msg">
            <p>Could not load writeup <code>${slug}.md</code>.</p>
            <p><a href="#/blog">&larr; Return to Blog</a></p>
          </div>
        `;
      }
      return;
    }

    // Standard Markdown Routes
    let filePath = './content/home.md';
    let pageTitle = 'Homepage';

    if (route.startsWith('az')) {
      if (langSwitch) {
        langSwitch.setAttribute('href', '#/');
        langSwitch.textContent = 'english';
      }
    } else {
      if (langSwitch) {
        langSwitch.setAttribute('href', '#/az');
        langSwitch.textContent = 'azərbaycan dili';
      }
    }

    if (route === '' || route === 'home') {
      filePath = './content/home.md';
      pageTitle = 'Homepage';
    } else if (route === 'about') {
      filePath = './content/about.md';
      pageTitle = 'About';
    } else if (route === 'tools') {
      filePath = './content/tools.md';
      pageTitle = 'Tools';
    } else if (route === 'presentations') {
      filePath = './content/presentations.md';
      pageTitle = 'Presentations';
    } else if (route === 'music') {
      filePath = './content/music.md';
      pageTitle = 'Music';
    } else if (route === 'press') {
      filePath = './content/press.md';
      pageTitle = 'Press';
    } else if (route === 'contact') {
      filePath = './content/contact.md';
      pageTitle = 'Contact';
    } else if (route === 'az') {
      filePath = './content/az/home.md';
      pageTitle = 'Ana səhifə';
    } else {
      filePath = `./content/${route}.md`;
      pageTitle = route.charAt(0).toUpperCase() + route.slice(1);
    }

    try {
      const md = await fetchText(filePath);
      await renderMarkdown(md);
      document.title = `${pageTitle} | Ali Guliyev Personal Website`;
    } catch (err) {
      console.error('Route error:', err);
      appElement.innerHTML = `
        <h1>Page Not Found</h1>
        <div class="error-msg">
          <p>The requested page <code>${route}</code> does not exist.</p>
          <p><a href="#/">&larr; Return to Homepage</a></p>
        </div>
      `;
    }
  }

  // Real-time Visitor Counter (Padded plain text in Consolas: 000001, 000002...)
  async function initVisitorCounter() {
    const counterElement = document.getElementById('visitor-counter');
    if (!counterElement) return;

    const counterKey = 'infat0x_github_io_visits';
    const isNewSession = !sessionStorage.getItem('visited_' + counterKey);
    const endpoint = isNewSession
      ? `https://countapi.mileshilliard.com/api/v1/hit/${counterKey}`
      : `https://countapi.mileshilliard.com/api/v1/get/${counterKey}`;

    const formatCount = (num) => String(num || 0).padStart(6, '0');

    // Read cached count if available to avoid delay
    const cachedCount = localStorage.getItem('last_known_' + counterKey);
    if (cachedCount) {
      counterElement.textContent = formatCount(cachedCount);
    }

    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.value === 'number') {
          sessionStorage.setItem('visited_' + counterKey, 'true');
          localStorage.setItem('last_known_' + counterKey, data.value);
          counterElement.textContent = formatCount(data.value);
        }
      } else if (!counterElement.textContent) {
        counterElement.textContent = cachedCount ? formatCount(cachedCount) : '000001';
      }
    } catch (err) {
      console.warn('Visitor counter fetch failed:', err);
      if (!counterElement.textContent) {
        counterElement.textContent = cachedCount ? formatCount(cachedCount) : '000001';
      }
    }
  }

  // Event Listeners
  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('DOMContentLoaded', () => {
    handleRoute();
    initVisitorCounter();
  });

  // Global toggle for mobile hamburger
  window.toggleNav = function () {
    if (navToggle) navToggle.classList.toggle('active');
    if (navMenu) navMenu.classList.toggle('active');
  };
})();
