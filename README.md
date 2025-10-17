# CulturAllyAI

## 1. Project Name

CulturAllyAI

## 2. Project Description

CulturAllyAI is a simple web application designed to generate concise, engaging, and factual descriptions of cultural events using LLMs based solely on user-provided input. It enables organizers, cultural institutions, and volunteers to quickly obtain well-structured event descriptions without the need for extensive manual editing.

## Table of Contents
- [Project Name](#1-project-name)
- [Project Description](#2-project-description)
- [Tech Stack](#3-tech-stack)
- [Getting Started Locally](#4-getting-started-locally)
- [Available Scripts](#5-available-scripts)
- [Project Scope](#6-project-scope)
- [Project Status](#7-project-status)
- [License](#8-license)

## 3. Tech Stack

- **Frontend:** Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui
- **Backend:** Supabase (PostgreSQL, authentication, and backend services)
- **AI Integration:** Openrouter.ai for connecting to various AI models
- **CI/CD & Hosting:** GitHub Actions, DigitalOcean

## 4. Getting Started Locally

### Prerequisites

- **Node.js:** Version specified in [.nvmrc](./.nvmrc) - currently **22.14.0**
- **Package Manager:** npm

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Devrilo/CulturAllyAI.git
cd CulturAllyAI
npm install
```

### Running the Project

To start the development server:

```bash
npm run dev
```

Then open your browser and navigate to `http://localhost:3000`.

## 5. Available Scripts

- **npm run dev:** Starts the Astro development server (`astro dev`).
- **npm run build:** Builds the production version of the site (`astro build`).
- **npm run preview:** Previews the production build locally (`astro preview`).
- **npm run astro:** Runs Astro CLI commands.
- **npm run lint:** Runs code linting via ESLint.
- **npm run lint:fix:** Fixes linting issues.
- **npm run format:** Formats code using Prettier.

## 6. Project Scope

The MVP includes:

- A user-friendly event description creation form capturing city, date, category, age category, title, and key information.
- AI-generated event descriptions (up to 500 characters) based on user input.
- User account functionalities including registration (email + passowrd), login, and account management.
- Event management features such as saving, editing, and deleting event descriptions.
- A rating system for evaluating generated descriptions (thumbs up/down).
- Clipboard functionality for quick copying of event descriptions.

Future enhancements may include additional mobile support, advanced social features, and extended integrations.

## 7. Project Status

This project is currently in the MVP stage, focused on delivering a robust foundation for cultural event description generation.

## 8. License

This project is open source under the MIT License.
