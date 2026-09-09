<p align="center">
  <img src="src/assets/images/logo_title-removebg.png" alt="InternHub" width="300">
</p>

# InternHub

InternHub is a web platform for managing educational internships. It brings students, companies, and professors together in one place, making it easier to discover opportunities, manage applications, recruit candidates, and monitor internship progress.

This project is the final capstone project for the second year of the Higher Technician in Web Application Development programme (DAW).

## The Problem

Internship management is often spread across job boards, email threads, spreadsheets, and manual follow-up. This makes it harder for students to find suitable placements, for companies to reach relevant candidates, and for professors to supervise students effectively.

InternHub centralizes this workflow in a role-based platform focused on communication, visibility, and follow-up throughout the internship lifecycle.

## Main Features

### Students

- Browse, search, and filter internship offers.
- View offer details and company locations on a map.
- Apply for internships and track application status.
- Maintain a public profile and upload a CV.
- Record and follow active internship progress.

### Companies

- Create and manage a company profile and office locations.
- Publish and manage internship offers.
- Review candidates and update application decisions.
- Manage active internships linked to their offers.

### Professors

- Manage a professor profile.
- Follow assigned students and their internship progress.
- Review student activity and completed hours.

## Technology Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite 7, JavaScript, TypeScript, CSS |
| UI build tooling | Vite, SWC, ESLint |
| Authentication and data | Firebase Authentication and Firestore; Supabase migration layer |
| Storage | Cloudinary for profile images and CV files |
| Maps | React Leaflet and Leaflet |
| Documents | jsPDF and PDF.js |
| AI assistance | OpenRouter integration |

Firebase remains available as the active backend while the Supabase schema, policies, authentication import, and data migration are validated. The migration SQL and helper scripts are kept in [`supabase/`](supabase/) and [`scripts/`](scripts/).

## Project Structure

```text
internhub/
├── public/                  # Static assets
├── scripts/                 # Firebase-to-Supabase migration helpers
├── src/
│   ├── assets/              # Images and styles
│   ├── components/          # Reusable UI and role-specific views
│   ├── pages/               # Application pages
│   ├── routes/              # Route definitions and access control
│   ├── services/            # Firebase, Supabase, AI, storage, and domain services
│   └── types/               # TypeScript domain types
├── supabase/                # Schema, policies, seeds, and migrations
├── .env.example             # Environment-variable template
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm
- A Firebase project for the current backend configuration

### Installation

```bash
git clone <repository-url>
cd internhub
npm install
```

Create a local environment file from the template, then provide the credentials for the services you plan to use:

```bash
copy .env.example .env
```

On macOS or Linux, use `cp .env.example .env` instead. The `.env` file is intentionally ignored by Git and must never be committed.

### Available Commands

```bash
npm run dev                         # Start the development server
npm run build                       # Create a production build
npm run lint                        # Run ESLint
npm run firebase:users:export       # Export Firebase Auth users for migration
npm run supabase:users:import       # Import exported users into Supabase Auth
npm run migrate:firestore:supabase  # Migrate Firestore data to Supabase
```

Migration commands require server-side credentials and are intended for controlled migration work, not for the standard frontend development workflow.

## Environment Variables

Use [`.env.example`](.env.example) as the reference for required configuration. It covers Firebase, Supabase, Cloudinary, and OpenRouter settings, as well as `VITE_DATA_BACKEND` for selecting the active data backend during the migration.

Keep private keys, service-account files, and exported user data outside version control. The repository's [`.gitignore`](.gitignore) includes the relevant local files and generated artifacts.

## Development Approach

The project was organized using Kanban to make tasks visible and support continuous progress throughout the development cycle. Its design prioritizes a clear and accessible experience for students and the professionals who support their placement process.
