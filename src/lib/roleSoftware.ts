/**
 * Role Software Recommendations
 *
 * This module maps each role to a list of software / tools
 * that someone in that role should start exploring and learning.
 *
 * IMPORTANT:
 * - The actual tool names and categories should come from
 *   `AMENTUM_SOFTWARE_REQs.docx`.
 * - Update the placeholder arrays below using that document so
 *   the app reflects your real requirements.
 */

import type { RoleId } from "./quiz";

/**
 * Software recommendations for a role
 */
export interface RoleSoftware {
  /**
   * Highest-priority tools to learn first for this role.
   * Populate from AMENTUM_SOFTWARE_REQs.docx.
   */
  learnFirst: string[];

  /**
   * Additional tools that are useful to grow into next.
   * Populate from AMENTUM_SOFTWARE_REQs.docx.
   */
  nextSteps: string[];
}

/**
 * Role → software mapping.
 *
 * NOTE FOR MAINTAINERS:
 * - Replace the placeholder values with the actual tools listed
 *   in `AMENTUM_SOFTWARE_REQs.docx`.
 * - Keep the wording user-friendly (no internal abbreviations only).
 */
export const ROLE_SOFTWARE: Record<RoleId, RoleSoftware> = {
  BE: {
    // Backend Engineer – tools that help you build and run the backend API,
    // manage data, and work effectively in the codebase.
    learnFirst: [
      "Git (v2.40 or higher) – version control for source code management",
      "Node.js (v20.19.0 or higher) – JavaScript runtime used by the frontend build tooling",
      "pnpm (v9.0.0 or higher) – JavaScript package manager for installing frontend/back-end libraries",
      "PHP (v8.2 or higher) – server-side runtime used by the Laravel backend API",
      "Composer (v2.x) – PHP dependency manager for installing Laravel and backend packages",
      "SQL Server (v16.x or v17.x) – primary database engine for application data",
      "Redis (v7.x) – in-memory data store for caching, queues, and sessions",
    ],
    nextSteps: [
      "Laravel 12.x – backend web framework (installed via Composer)",
      "TypeScript 5.9.x – typed JavaScript for safer backend and tooling code (installed via pnpm)",
      "Vite 7.3.x – modern build tool used in the frontend stack (installed via pnpm)",
      "Understanding required PHP extensions (redis, openssl, mbstring, tokenizer, xml, ctype, json, bcmath)",
      "Performance tuning and monitoring for SQL Server and Redis",
    ],
  },
  FE: {
    // Frontend Engineer – tools for building and debugging the Vue/Nuxt UI.
    learnFirst: [
      "Git (v2.40 or higher) – version control for source code and branching",
      "Node.js (v20.19.0 or higher) – runtime needed for Vue build tools and dev server",
      "pnpm (v9.0.0 or higher) – package manager for the frontend monorepo",
      "Visual Studio Code – main IDE with Vue/TypeScript support",
      "Vue.js 3.5.x – core frontend framework (installed via pnpm)",
      "TypeScript 5.9.x – typed JavaScript for the Vue codebase (installed via pnpm)",
      "Vite 7.3.x – dev server and bundler used to run and build the frontend (installed via pnpm)",
      "Tailwind CSS 4.1.x – utility-first CSS framework used for styling (installed via pnpm)",
      "Nuxt UI 4.3.x – UI component library for the Vue/Nuxt stack (installed via pnpm)",
    ],
    nextSteps: [
      "VS Code: Vue - Official extension – Vue 3 language support with TypeScript integration",
      "VS Code: ESLint extension – linting for JavaScript/TypeScript",
      "VS Code: Tailwind CSS IntelliSense – autocomplete for Tailwind utility classes",
      "VS Code: Prettier – opinionated code formatter for consistent style",
      "Postman or Insomnia – API client for exercising backend endpoints from the UI",
    ],
  },
  QA: {
    // Quality Assurance Engineer – tools for testing, verification, and working with the stack.
    learnFirst: [
      "Git (v2.40 or higher) – to pull branches, review changes, and reproduce issues",
      "Postman or Insomnia – API testing tools for exercising backend REST endpoints",
      "SQL Server (v16.x or v17.x) – to inspect and validate application data",
      "Redis (v7.x) – to understand cache/state behavior when debugging issues",
      "Visual Studio Code – to read tests, logs, and configuration",
    ],
    nextSteps: [
      "Basic Node.js and pnpm usage – to run test suites or dev servers locally",
      "Basic PHP and Laravel concepts – to understand backend routes and behavior",
      "Vue.js and TypeScript basics – to reason about frontend logic when investigating defects",
      "Using ESLint and Prettier in VS Code – to keep small QA-side changes consistent",
      "Understanding Laravel 12.x, Vue 3.5.x, and Tailwind CSS 4.1.x as the core app stack",
    ],
  },
  PM: {
    // Product Manager – tools needed to understand the platform, workflows, and constraints.
    learnFirst: [
      "Visual Studio Code – for reading configuration, environment docs, and simple code references",
      "Postman or Insomnia – to explore and understand key API endpoints and data shapes",
      "High-level familiarity with Git – how branches and releases are managed",
      "High-level familiarity with Node.js, PHP/Laravel, and Vue – to speak the same language as the team",
    ],
    nextSteps: [
      "Basic SQL Server querying – to understand core tables and data models",
      "Basic Redis concepts – caches, queues, and how they affect user experience",
      "Reading framework-level docs (Laravel 12.x, Vue 3.5.x, Nuxt UI, Tailwind CSS) to understand capabilities and constraints",
      "Understanding the installation order and system requirements to plan realistic timelines with IT/Sec",
    ],
  },
};

/**
 * Get software recommendations for a specific role
 */
export function getRoleSoftware(roleId: RoleId): RoleSoftware {
  return ROLE_SOFTWARE[roleId];
}

/**
 * Get software recommendations from a role string
 * (handles "BE + FE" tie format by using the first role)
 */
export function getRoleSoftwareByString(
  roleString: string,
): RoleSoftware | null {
  if (roleString.includes(" + ")) {
    const [firstRole] = roleString.split(" + ") as [RoleId];
    return ROLE_SOFTWARE[firstRole] || null;
  }

  return ROLE_SOFTWARE[roleString as RoleId] || null;
}
