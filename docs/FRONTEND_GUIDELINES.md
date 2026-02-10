# ARM - Frontend Guidelines

**Version:** 1.0  
**Last Updated:** February 10, 2026  
**Status:** Active

---

## Design System

### Color Palette (ARM Theme)

#### Primary Colors
```css
--arm-navy: #1B2A4A      /* Deep navy blue */
--arm-blue: #2B5797      /* Primary blue */
--arm-accent: #4472C4    /* Accent blue (links, active states) */
```

#### Surface Colors
```css
--arm-surface: #0F1629         /* Main background */
--arm-surfaceLight: #1A2340    /* Cards, panels */
--arm-border: #2A3654          /* Borders, dividers */
```

#### Text Colors
```css
--arm-text: #E2E8F0           /* Primary text */
--arm-textMuted: #94A3B8      /* Secondary text */
```

#### Semantic Colors
```css
--arm-success: #548235        /* Success states, ACTIVE */
--arm-warning: #BF8F00        /* Warning states, PAUSED */
--arm-danger: #C00000         /* Error states, QUARANTINED */
```

### Tailwind Usage

**Always use semantic tokens:**
```tsx
// ✅ Correct
<div className="bg-arm-surface text-arm-text border-arm-border">

// ❌ Wrong
<div className="bg-gray-900 text-white border-gray-700">
```

**Status-dependent colors:**
```tsx
// Lifecycle states
DRAFT → bg-gray-500
TESTING → bg-arm-warning
CANDIDATE → bg-arm-blue
APPROVED → bg-arm-success
DEPRECATED → bg-gray-600
RETIRED → bg-gray-700

// Instance states
PROVISIONING → bg-arm-warning
ACTIVE → bg-arm-success
PAUSED → bg-gray-500
QUARANTINED → bg-arm-danger
RETIRED → bg-gray-700
```

---

## Typography

### Font Family
```css
font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
```

**Load Inter from CDN (future):**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Font Sizes
```css
text-xs: 0.75rem    /* 12px - Labels, captions */
text-sm: 0.875rem   /* 14px - Body text, table cells */
text-base: 1rem     /* 16px - Default body */
text-lg: 1.125rem   /* 18px - Subheadings */
text-xl: 1.25rem    /* 20px - Section titles */
text-2xl: 1.5rem    /* 24px - Page titles */
text-3xl: 1.875rem  /* 30px - Hero text */
```

### Font Weights
```css
font-normal: 400    /* Body text */
font-medium: 500    /* Emphasized text */
font-semibold: 600  /* Headings, labels */
font-bold: 700      /* Page titles */
```

### Usage Guidelines
```tsx
// Page titles
<h1 className="text-2xl font-bold text-arm-text">

// Section titles
<h2 className="text-xl font-semibold text-arm-text">

// Labels
<label className="text-sm font-semibold text-arm-textMuted">

// Body text
<p className="text-sm text-arm-text">

// Muted text
<p className="text-xs text-arm-textMuted">

// Code/monospace
<code className="font-mono text-xs text-arm-accent">
```

---

## Spacing Scale

### Padding/Margin
```css
p-1: 0.25rem   /* 4px */
p-2: 0.5rem    /* 8px */
p-3: 0.75rem   /* 12px */
p-4: 1rem      /* 16px */
p-6: 1.5rem    /* 24px */
p-8: 2rem      /* 32px */
```

### Component Spacing
```tsx
// Page container
<div className="p-6">

// Card padding
<div className="p-4">

// Section spacing
<section className="space-y-6">

// List items
<div className="space-y-2">

// Inline elements
<div className="flex gap-2">
```

---

## Layout Patterns

### Page Layout
```tsx
export function PageView() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-arm-text mb-2">
          Page Title
        </h1>
        <p className="text-arm-textMuted">
          Page description
        </p>
      </div>

      {/* Content */}
      <div className="bg-arm-surfaceLight rounded-lg border border-arm-border">
        {/* Content here */}
      </div>
    </div>
  )
}
```

### Card Pattern
```tsx
<div className="bg-arm-surfaceLight rounded-lg border border-arm-border p-4">
  <h3 className="text-sm font-semibold text-arm-textMuted mb-2">
    Card Title
  </h3>
  <div className="text-arm-text">
    Card content
  </div>
</div>
```

### Table Pattern
```tsx
<table className="w-full">
  <thead className="bg-arm-surface border-b border-arm-border">
    <tr>
      <th className="text-left p-4 text-sm font-semibold text-arm-textMuted">
        Column
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-arm-border hover:bg-arm-surface">
      <td className="p-4 text-arm-text">
        Cell
      </td>
    </tr>
  </tbody>
</table>
```

### Drawer Pattern (Side Panel)
```tsx
<div className="fixed inset-y-0 right-0 w-[600px] bg-arm-surfaceLight border-l border-arm-border shadow-2xl overflow-y-auto">
  {/* Sticky header */}
  <div className="sticky top-0 bg-arm-surface border-b border-arm-border p-6">
    <h2 className="text-xl font-bold text-arm-text">
      Drawer Title
    </h2>
  </div>

  {/* Scrollable content */}
  <div className="p-6 space-y-6">
    {/* Sections */}
  </div>
</div>
```

### Modal Pattern (Centered)
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="bg-arm-surfaceLight rounded-lg border border-arm-border w-[500px] max-h-[80vh] overflow-y-auto">
    {/* Header */}
    <div className="border-b border-arm-border p-6">
      <h2 className="text-xl font-bold text-arm-text">
        Modal Title
      </h2>
    </div>

    {/* Content */}
    <div className="p-6">
      {/* Form or content */}
    </div>

    {/* Footer */}
    <div className="border-t border-arm-border p-6 flex justify-end gap-2">
      <button className="px-4 py-2 text-arm-textMuted hover:text-arm-text">
        Cancel
      </button>
      <button className="px-4 py-2 bg-arm-accent text-white rounded hover:bg-arm-blue">
        Confirm
      </button>
    </div>
  </div>
</div>
```

---

## Component Patterns

### Button Variants

#### Primary Button
```tsx
<button className="px-4 py-2 bg-arm-accent text-white rounded hover:bg-arm-blue transition-colors">
  Primary Action
</button>
```

#### Secondary Button
```tsx
<button className="px-4 py-2 border border-arm-border text-arm-text rounded hover:bg-arm-surface transition-colors">
  Secondary Action
</button>
```

#### Danger Button
```tsx
<button className="px-4 py-2 bg-arm-danger text-white rounded hover:bg-red-700 transition-colors">
  Delete
</button>
```

#### Text Button
```tsx
<button className="text-arm-accent hover:text-arm-blue transition-colors">
  View Details →
</button>
```

### Status Chips
```tsx
<span className="px-3 py-1 rounded-full text-xs font-medium bg-arm-accent text-white">
  APPROVED
</span>

<span className="px-3 py-1 rounded-full text-xs font-medium bg-arm-success text-white">
  ACTIVE
</span>

<span className="px-3 py-1 rounded-full text-xs font-medium bg-arm-danger text-white">
  QUARANTINED
</span>
```

### Input Fields
```tsx
<div className="space-y-2">
  <label className="block text-sm font-semibold text-arm-textMuted">
    Field Label
  </label>
  <input
    type="text"
    className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
    placeholder="Enter value..."
  />
</div>
```

### Textarea
```tsx
<textarea
  className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none resize-none"
  rows={4}
  placeholder="Enter description..."
/>
```

### Select Dropdown
```tsx
<select className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none">
  <option value="">Select option...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

---

## Component Architecture

### File Naming
- **Components:** PascalCase (e.g., `VersionDrawer.tsx`)
- **Views:** PascalCase with View suffix (e.g., `DirectoryView.tsx`)
- **Utilities:** camelCase (e.g., `formatDate.ts`)

### Component Structure
```tsx
// 1. Imports (React, Convex, types, components)
import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

// 2. Props interface
interface ComponentProps {
  id: Id<'agentVersions'>
  onClose: () => void
}

// 3. Component
export function Component({ id, onClose }: ComponentProps) {
  // 3a. Hooks (useState, useQuery, etc.)
  const [state, setState] = useState(false)
  const data = useQuery(api.module.function, { id })
  
  // 3b. Event handlers
  const handleClick = () => {
    setState(true)
  }
  
  // 3c. Render
  return (
    <div className="...">
      {/* JSX */}
    </div>
  )
}

// 4. No default export (named exports only)
```

### Hooks Usage
```tsx
// ✅ Correct order
const [state, setState] = useState()
const data = useQuery(api.module.function)
const mutation = useMutation(api.module.mutation)

// ❌ Wrong (hooks after conditionals)
if (condition) return null
const data = useQuery() // Error!
```

---

## Responsive Design

### Breakpoints
```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Mobile-First Approach
```tsx
// ✅ Correct (mobile first)
<div className="w-full md:w-1/2 lg:w-1/3">

// ❌ Wrong (desktop first)
<div className="w-1/3 lg:w-1/2 md:w-full">
```

### Sidebar Responsive
```tsx
// Desktop: Fixed sidebar
// Mobile: Collapsible hamburger menu (P1.2)
<aside className="w-64 lg:block hidden">
```

---

## Accessibility

### ARIA Labels
```tsx
// Buttons without text
<button aria-label="Close drawer">
  ✕
</button>

// Interactive elements
<div role="button" tabIndex={0} aria-label="View details">
```

### Keyboard Navigation
- **Tab:** Navigate between interactive elements
- **Enter/Space:** Activate buttons
- **Escape:** Close modals/drawers
- **Arrow keys:** Navigate lists (future)

### Focus States
```tsx
// Always include focus styles
<button className="... focus:outline-none focus:ring-2 focus:ring-arm-accent">
```

---

## State Management

### Convex Queries (Read)
```tsx
// Single item
const version = useQuery(api.agentVersions.get, { versionId })

// List
const versions = useQuery(api.agentVersions.list, { tenantId })

// Conditional query
const data = useQuery(
  api.module.function,
  condition ? { arg } : 'skip'
)
```

### Convex Mutations (Write)
```tsx
const createTemplate = useMutation(api.agentTemplates.create)

const handleCreate = async () => {
  try {
    const id = await createTemplate({ name, tenantId })
    // Success handling
  } catch (error) {
    // Error handling
  }
}
```

### Local State (useState)
```tsx
// UI state only (not data)
const [isOpen, setIsOpen] = useState(false)
const [activeTab, setActiveTab] = useState('templates')
const [search, setSearch] = useState('')
```

---

## Error Handling

### Query Errors
```tsx
const data = useQuery(api.module.function)

if (data === undefined) {
  return <LoadingSpinner />
}

if (data === null) {
  return <div>Not found</div>
}

return <div>{data.name}</div>
```

### Mutation Errors
```tsx
const mutation = useMutation(api.module.mutation)

const handleSubmit = async () => {
  try {
    await mutation({ args })
    showToast('Success!')
  } catch (error) {
    showToast('Error: ' + error.message)
  }
}
```

### Toast Pattern (P1.2)
```tsx
// Success
<Toast type="success" message="Version created" />

// Error
<Toast type="error" message="Failed to create version" />

// Warning
<Toast type="warning" message="Integrity check failed" />
```

---

## Loading States

### Skeleton Loaders
```tsx
// Table skeleton
<div className="animate-pulse space-y-2">
  {[...Array(5)].map((_, i) => (
    <div key={i} className="h-12 bg-arm-surface rounded" />
  ))}
</div>
```

### Spinner
```tsx
<div className="flex items-center justify-center h-full">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arm-accent" />
</div>
```

### Empty States
```tsx
<div className="p-8 text-center text-arm-textMuted">
  <p className="mb-2">No {resource} yet</p>
  <p className="text-sm">Instructions here</p>
</div>
```

---

## Animation

### Transitions
```css
transition-colors  /* Color changes (hover, active) */
transition-all     /* Multiple properties */
duration-200       /* 200ms (default) */
duration-300       /* 300ms (slower) */
```

### Usage
```tsx
// Hover effects
<button className="text-arm-textMuted hover:text-arm-text transition-colors">

// Active states
<div className="opacity-50 hover:opacity-100 transition-opacity">

// Drawer slide
<div className="transform translate-x-full transition-transform duration-300">
```

### No Heavy Animations
- No page transitions (instant)
- No loading animations >500ms
- No decorative animations
- Performance > aesthetics

---

## Icons

### Current Approach (P1.1)
- Emoji icons (📁, 🛡️, ✓, ⚠️, 💰, 📋, 🌐)
- No icon library dependency

### Future (P1.2)
- Consider: Lucide React (lightweight)
- Install: `pnpm add lucide-react`
- Usage: `<FileIcon className="w-4 h-4" />`

---

## Forms

### Form Layout
```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  {/* Field group */}
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-arm-textMuted">
      Field Label
    </label>
    <input
      type="text"
      className="w-full px-4 py-2 bg-arm-surface border border-arm-border rounded text-arm-text focus:border-arm-accent focus:outline-none"
    />
  </div>

  {/* Actions */}
  <div className="flex justify-end gap-2">
    <button type="button" className="px-4 py-2 text-arm-textMuted hover:text-arm-text">
      Cancel
    </button>
    <button type="submit" className="px-4 py-2 bg-arm-accent text-white rounded hover:bg-arm-blue">
      Submit
    </button>
  </div>
</form>
```

### Validation
```tsx
// Inline errors
{error && (
  <p className="text-xs text-arm-danger mt-1">
    {error}
  </p>
)}

// Field with error
<input
  className={`... ${error ? 'border-arm-danger' : 'border-arm-border'}`}
/>
```

---

## Data Display

### Tables
- **Header:** Dark background, semibold text, muted color
- **Rows:** Hover effect, border between rows
- **Cells:** Left-aligned text, consistent padding
- **Actions:** Right-aligned, text buttons

### Lists
- **Items:** Card-style with spacing
- **Hover:** Subtle background change
- **Click:** Entire row clickable (not just button)

### Code Blocks
```tsx
<code className="block bg-arm-surface px-4 py-2 rounded text-xs text-arm-text font-mono">
  {code}
</code>
```

### JSON Display
```tsx
<pre className="bg-arm-surface p-4 rounded text-xs text-arm-textMuted overflow-x-auto">
  {JSON.stringify(data, null, 2)}
</pre>
```

---

## Navigation

### Sidebar Navigation
- **Active state:** Blue background (`bg-arm-accent`)
- **Hover state:** Surface background (`bg-arm-surface`)
- **Icons:** Left-aligned with text
- **Spacing:** Consistent gap between items

### Tabs
- **Active state:** Blue underline, accent color text
- **Hover state:** Text color change
- **Border:** Bottom border on container

### Breadcrumbs (P1.2)
```tsx
<nav className="flex items-center gap-2 text-sm">
  <a href="/" className="text-arm-textMuted hover:text-arm-text">
    Home
  </a>
  <span className="text-arm-textMuted">/</span>
  <span className="text-arm-text">Current Page</span>
</nav>
```

---

## Naming Conventions

### Components
```tsx
// ✅ Correct
VersionDrawer.tsx
CreateTemplateModal.tsx
StatusChip.tsx

// ❌ Wrong
versionDrawer.tsx
createTemplateModal.tsx
status-chip.tsx
```

### Props Interfaces
```tsx
// ✅ Correct
interface VersionDrawerProps {
  versionId: Id<'agentVersions'>
  onClose: () => void
}

// ❌ Wrong
interface Props { ... }
interface IVersionDrawer { ... }
```

### Event Handlers
```tsx
// ✅ Correct
const handleClick = () => {}
const handleSubmit = async () => {}

// ❌ Wrong
const onClick = () => {}
const submit = () => {}
```

---

## Performance Guidelines

### Lazy Loading
```tsx
// Code splitting for large components
const HeavyComponent = lazy(() => import('./HeavyComponent'))

<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

### Memoization
```tsx
// Expensive computations
const sortedData = useMemo(
  () => data?.sort((a, b) => a.name.localeCompare(b.name)),
  [data]
)

// Callbacks passed to children
const handleClick = useCallback(() => {
  doSomething()
}, [dependency])
```

### Avoid Re-renders
```tsx
// ✅ Correct (stable reference)
const config = useMemo(() => ({ key: 'value' }), [])

// ❌ Wrong (new object every render)
const config = { key: 'value' }
```

---

## Code Style

### Imports Order
```tsx
// 1. React
import { useState, useEffect } from 'react'

// 2. External libraries
import { useQuery, useMutation } from 'convex/react'

// 3. Convex generated
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

// 4. Local components
import { Sidebar } from './components/Sidebar'

// 5. Types
import { AgentVersion } from '@arm/shared'

// 6. Styles (if any)
import './styles.css'
```

### Conditional Rendering
```tsx
// ✅ Correct (explicit)
{isLoading ? <Spinner /> : <Content />}
{data && <Content data={data} />}

// ❌ Wrong (implicit boolean coercion)
{data?.length && <Content />}  // 0 is falsy!
```

### Optional Chaining
```tsx
// ✅ Correct
const name = version?.genome?.modelConfig?.model

// ❌ Wrong (nested ternaries)
const name = version ? version.genome ? version.genome.modelConfig ? version.genome.modelConfig.model : '' : '' : ''
```

---

## Testing (P1.2+)

### Component Tests
```tsx
// ComponentName.test.tsx
import { render, screen } from '@testing-library/react'
import { Component } from './Component'

test('renders component', () => {
  render(<Component />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

### Convex Query Tests
```tsx
// Mock Convex queries
vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => mockData)
}))
```

---

## Documentation

### Component Documentation
```tsx
/**
 * VersionDrawer - Side panel showing version details
 * 
 * Features:
 * - Displays genome, hash, lineage
 * - Verifies integrity on load
 * - Shows change history
 * 
 * @param versionId - ID of version to display
 * @param onClose - Callback when drawer closes
 */
export function VersionDrawer({ versionId, onClose }: VersionDrawerProps) {
```

### Complex Logic
```tsx
// Explain non-obvious code
// Canonicalize genome for deterministic hashing
const canonical = canonicalizeGenome(genome)
```

---

## Forbidden Patterns

### ❌ Inline Styles
```tsx
// ❌ Wrong
<div style={{ color: 'red' }}>

// ✅ Correct
<div className="text-arm-danger">
```

### ❌ Magic Numbers
```tsx
// ❌ Wrong
<div className="w-[600px]">

// ✅ Correct (use Tailwind scale)
<div className="w-96">  // 384px

// ✅ Exception: Specific drawer width
<div className="w-[600px]">  // OK if documented
```

### ❌ Nested Ternaries
```tsx
// ❌ Wrong
{a ? b ? c : d : e}

// ✅ Correct
{a && b && <C />}
{a && !b && <D />}
{!a && <E />}
```

### ❌ Any Type
```tsx
// ❌ Wrong
const data: any = {}

// ✅ Correct
const data: AgentVersion = {}
```

---

## Git Workflow

### Branch Naming
```bash
feature/policy-editor
fix/drawer-scroll
refactor/state-machine
docs/update-guidelines
```

### Commit Messages
```bash
# Format: type: description

feat: add policy evaluation engine
fix: version drawer scroll issue
refactor: extract status chip component
docs: update frontend guidelines
style: format with prettier
test: add version creation tests
```

---

**Document Owner:** Frontend Team  
**Last Review:** February 10, 2026  
**Next Review:** March 10, 2026
