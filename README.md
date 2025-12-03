# Brain - Digital Garden

A personal digital garden built with Docusaurus, containing mental models, playbooks, deep dives, and experiments.

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
# or
npm start
```

Your site will be running at `http://localhost:3000`

### Building

```bash
npm run build
```

### Serving Production Build

```bash
npm run serve
```

## Adding Content

### Creating a New Section

1. Create a new folder in `docs/`:
   ```bash
   mkdir docs/new-section
   ```

2. Add an `index.md` file:
   ```bash
   touch docs/new-section/index.md
   ```

3. Start writing! That's it!

### Adding a New Page

Just create a `.md` file anywhere in `docs/`:

```bash
touch docs/mental-models/new-mental-model.md
```

The file will automatically:
- Appear in the sidebar
- Be searchable
- Be indexed

### Frontmatter Options

Control page ordering and metadata with frontmatter:

```markdown
---
sidebar_position: 1
title: My Custom Title
---

# Your content here
```

## Structure

```
docs/
├── intro.md                    # Homepage
├── mental-models/              # Mental models section
│   ├── index.md
│   └── first-principles.md
├── playbooks/                  # Playbooks section
│   ├── index.md
│   └── test-driven-design/
├── deep-dives/                 # Deep dives section
│   ├── index.md
│   └── flink/
└── experiments/                # Experiments section
    └── index.md
```

## Markdown Features

### Admonitions

```markdown
:::tip
This is a tip
:::

:::info
This is info
:::

:::warning
This is a warning
:::

:::danger
This is dangerous
:::
```

### Code Blocks

```markdown
\`\`\`javascript
function hello() {
  console.log('Hello World!');
}
\`\`\`
```

### Links

```markdown
[Internal Link](./other-page.md)
[External Link](https://example.com)
```

## Configuration

- `docusaurus.config.js` - Main site configuration
- `sidebars.js` - Sidebar configuration (auto-generated)
- `src/css/custom.css` - Custom styling
