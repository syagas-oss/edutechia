# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development & Build
- Run dev server: `npm run dev`
- Build for production: `npm run build`
- Preview production build: `npm run preview`
- Lint/typecheck: `npm run lint`
- Clean build artifacts: `npm run clean`

### Testing
- Run unit/integration tests: `npm test` (jest/vitest configuration)
- Run a single test file: `npm test src/YourComponent.test.tsx`

## Architecture Overview

**EduTEchIA** is a React frontend application built with Vite that generates educational activities through an AI-powered workflow orchestrated by n8n.

### Frontend Structure
- **Vite + React 19**: Modern build tool and React 19 with new features (parallel rendering, optimized hydration)
- **TailwindCSS v4**: CSS framework with JIT compilation, using the new `@theme` block for custom design tokens
- **VitePWA**: Progressive Web App support for offline capability and PWA manifests
- **n8n Engine**: n8n webhook at `https://n8n-i9qf.onrender.com/webhook/teacher-assistant` processes AI-generated activities

### Key Components
| File | Purpose |
|------|---------|
| `src/main.tsx` | React DOM entry point |
| `src/App.tsx` | Main application with chat interface, voice dictation, and webhook communication |
| `src/components/ActivityCard.tsx` | Bento-grid display of generated AI activities |
| `src/lib/storage.ts` | LocalStorage utilities for session/state persistence |
| `src/types.ts` | TypeScript interfaces for `Activity`, `Message`, `ContextData` |

### Project Structure
```
edutechia/
├── src/
│   ├── main.tsx            # React entry
│   ├── App.tsx             # Main component (chat + context selectors)
│   ├── index.css           # Tailwind + custom styles + print media queries
│   ├── types.ts            # Type definitions
│   ├── components/
│   │   └── ActivityCard.tsx # Activity display component
│   └── lib/
│       └── storage.ts      # LocalStorage helpers
├── package.json            # Dependencies (npm 7/9)
└── tsconfig.json           # TypeScript configuration
```

### Key Patterns
- **Context injection**: Context selectors (stage/subject/duration) are injected as `[CONTEXTO PRE-CARGADO: ...]` into prompts
- **Voice dictation**: Web Speech API (`webkitSpeechRecognition`) with Spanish language (`es-ES`)
- **Local persistence**: Session ID and chat history stored in localStorage keys `docente_ai_session_id` and `docente_ai_chat_history`
- **Sound effects**: `use-sound` package with custom SFX for send/receive/error states
- **Smart normalization**: n8n response payloads are normalized to the `Activity` interface with fallback field mapping
- **Print-ready**: CSS `@media print` overrides for proper A4 layout when exporting activities

### Data Flow
1. User selects context (stage/subject/duration) or types a prompt
2. Frontend sends `POST` to n8n webhook with `sessionId` + `message` payload
3. n8n processes with Gemini LLM, returns structured activity JSON
4. Frontend parses/normalizes response and renders in `ActivityCard` bento grid
5. Activities are stored in localStorage for persistence across sessions

### Environment Variables
- `GEMINI_API_KEY`: Injected by AI Studio at runtime (not in code)
- `APP_URL`: Host URL for self-referential links

### Design System
- **Theme**: Dark glassmorphism with cyan/fuchsia/amber accents
- **Fonts**: Outfit (display), Plus Jakarta Sans (body)
- **Colors**: Background `#02040a`, primary `cyan-400`, secondary `fuchsia-300`, accent `amber-300`
- **Effects**: Backdrop blur `30px`, ambient glows, pulse animations
