# infat0x.github.io

Personal website, security research disclosures, and technical writeups of Ali Guliyev ([infat0x](https://github.com/infat0x)).

## Overview

A lightweight, client-side Markdown-driven portfolio engineered with a minimalist dark monospace aesthetic. Built for native GitHub Pages deployment with zero backend dependencies.

* **Stack:** Pure HTML5, CSS3, Vanilla JavaScript (SPA hash router)
* **Engines:** Client-side Markdown rendering via `marked.js`, syntax highlighting via `highlight.js`, flowchart diagrams via `mermaid.js`
* **Hosting:** GitHub Pages (`infat0x.github.io`)

## Structure

* `content/` &mdash; Core site pages written in pure Markdown (`home.md`, `about.md`, `tools.md`, `contact.md`)
* `content/blog/` &mdash; Security writeups, CVE disclosures, and technical guides
* `data/posts.json` &mdash; Indexed post metadata and tags
* `assets/` &mdash; Monospace styling, vendored libraries, and local assets

## Adding New Posts

1. Add a new `.md` file to `content/blog/`.
2. Run `node scripts/update-posts.js` to update `data/posts.json`.
3. Commit and push to `main`.

## License

MIT &copy; [Ali Guliyev](https://github.com/infat0x)
