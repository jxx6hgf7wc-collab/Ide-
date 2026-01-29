# Spark - Creative Assistant PRD

## Original Problem Statement
Build an app for people who lack creativity and help them with specific queries but not everyday questions like "what should I wear".

## User Choices
- AI-powered using GPT-5.2 via Emergent LLM Key
- All creative categories (writing prompts, design inspiration, problem-solving, gift ideas, project names, content ideas)
- Theme toggle in settings (dark/light mode)
- User accounts to save favorites

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI with MongoDB
- **AI**: OpenAI GPT-5.2 via emergentintegrations library
- **Auth**: JWT-based authentication

## User Personas
1. **Creative Professional** - Needs inspiration for projects
2. **Content Creator** - Needs blog/social media ideas
3. **Gift Giver** - Struggles with unique gift ideas
4. **Entrepreneur** - Needs project/brand naming help
5. **Writer** - Needs story prompts and ideas

## Core Requirements
- [x] User registration and authentication
- [x] 6 creative categories with AI-powered suggestions
- [x] Save favorites functionality
- [x] Theme toggle (dark/light mode)
- [x] Query history

## What's Been Implemented (Jan 2026)
- Landing page with Bento grid category layout
- User auth (register/login/logout)
- Dashboard with category cards and recent activity
- AI creative generation using GPT-5.2
- Favorites CRUD operations
- Settings with theme toggle
- Responsive design with Fraunces + Outfit fonts
- Protected routes

## Prioritized Backlog

### P0 (Critical) - Complete
- [x] Core AI generation
- [x] User authentication
- [x] Save favorites

### P1 (High) - Next Phase
- [ ] Add loading progress indicator for AI generation (20+ sec)
- [ ] Query templates/examples for each category
- [ ] Export favorites to clipboard/file

### P2 (Medium)
- [ ] Social sharing of suggestions
- [ ] Favorite folders/organization
- [ ] Search within favorites

## Next Tasks
1. Improve AI generation UX with better loading feedback
2. Add category-specific prompt templates
3. Implement favorites organization features
