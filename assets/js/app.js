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

    // Render Mermaid diagrams safely without error bombs
    if (window.mermaid) {
      const mermaidBlocks = appElement.querySelectorAll('pre code.language-mermaid');
      if (mermaidBlocks.length > 0) {
        for (let i = 0; i < mermaidBlocks.length; i++) {
          const block = mermaidBlocks[i];
          const pre = block.parentElement;
          const code = (block.textContent || '').trim();
          try {
            if (typeof mermaid.parse === 'function') {
              await mermaid.parse(code);
            }
            const div = document.createElement('div');
            div.className = 'mermaid';
            div.textContent = code;
            pre.replaceWith(div);
          } catch (err) {
            console.warn('Skipping invalid mermaid diagram:', err);
          }
        }
        try {
          await mermaid.run();
        } catch (e) {
          console.warn('Mermaid execution error suppressed:', e);
        }
        // Remove any error SVGs or bomb icons if Mermaid ever inserted them
        document.querySelectorAll('#dmermaid, [id^="dmermaid"], svg[aria-roledescription="error"], .error-icon').forEach(el => el.remove());
      }
    }
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

  // Event Listeners
  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('DOMContentLoaded', handleRoute);

  // Global toggle for mobile hamburger
  window.toggleNav = function () {
    if (navToggle) navToggle.classList.toggle('active');
    if (navMenu) navMenu.classList.toggle('active');
  };
})();
