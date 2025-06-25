# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Requirements

**IMPORTANT: Always respond in Japanese when working in this repository.** This is Hiroaki Suzuki's personal Japanese notebook site, and all interactions should be conducted in Japanese to maintain consistency with the content and user preferences.

## Overview

This is Hiroaki Suzuki's personal notebook site built with Eleventy (11ty) static site generator. The site converts Markdown files from an Obsidian vault (`tech-notebook/public/`) into HTML and publishes them via GitHub Pages.

## Key Commands

### Development

- `npm start` - Start development with CSS and Eleventy watch mode
- `npm run watch:css` - Watch and compile PostCSS files
- `npm run watch:eleventy` - Start Eleventy development server

### Build

- `npm run build` - Build both CSS and Eleventy for production
- `npm run build:css` - Compile PostCSS to final CSS
- `npm run build:eleventy` - Build Eleventy static site

### Linting & Formatting

- `npx eslint .` - Run ESLint on JavaScript files
- `npx prettier --check .` - Check code formatting
- `npx prettier --write .` - Format code automatically

## Architecture

### Content Management

- **Content Source**: `tech-notebook/public/` directory contains Markdown files managed via Obsidian
- **Obsidian Integration**: The tech-notebook vault syncs to S3 using Remotely Save plugin for cross-device editing
- **Public vs Private**: Only files in `public/` directory are published; private notes remain local

### Build Process

1. Eleventy processes Markdown files from `tech-notebook/public/`
2. PostCSS compiles CSS from `css/style.pcss` using nested styles, imports, and autoprefixer
3. Custom transforms handle WikiLinks (`[[link]]`), external links, image paths, and table scrolling
4. RSS feed generation for latest 20 posts
5. Tag system with automatic counting and listing

### Key Files

- `eleventy.config.mjs` - Main Eleventy configuration with transforms and plugins
- `layout/default.njk` - Base template with navigation, sidebar, responsive design and semantic article structure
- `css/style.pcss` - Main PostCSS entry point with imports from modular `css/_*.pcss` files
- `css/_variables.pcss` - CSS custom properties for colors, font sizes, and breakpoints
- `css/_content.pcss` - Article content styles including heading colors (h1-h6) and link hover effects
- `css/_sidebar.pcss` - Tag navigation styles with animated hover effects
- `postcss.config.js` - PostCSS plugin configuration
- `eslint.config.mjs` - ESLint configuration

### Deploy

- GitHub Actions automatically deploys on push to main branch
- Site builds and publishes to GitHub Pages

## Content Structure

### Frontmatter

Markdown files support `created`, `updated`, and `tags` frontmatter for metadata and categorization.

### Special Features

- WikiLink syntax `[[Page Name]]` converts to internal links
- Mermaid diagram support via CDN
- Prism.js syntax highlighting
- Responsive table scrolling
- Tag-based navigation with counts

## Styling Architecture

### CSS Organization

- **Modular Structure**: CSS is split into semantic modules (`_base.pcss`, `_content.pcss`, `_sidebar.pcss`, etc.)
- **Design System**: Centralized color scheme and typography defined in `_variables.pcss`
- **Semantic HTML**: Uses `<article>` tags for content areas with proper heading hierarchy

### Key Design Patterns

- **Heading Colors**: h1-h6 have distinct colors applied only within article content, not globally
- **Interactive Elements**: Hover effects on links and navigation with smooth transitions
- **Responsive Design**: Mobile-first approach with `@custom-media` breakpoints
- **Page Titles**: Conditional display of page titles (hidden on home and tags pages)

### Color System

- Content headings use a professional color palette (blues, teals, browns)
- Link hover effects provide visual feedback (color changes, animated underlines)
- Consistent spacing and typography scaling across all components