# Platform Quiz

A Next.js 14+ quiz application built with TypeScript, Tailwind CSS, and the App Router.

**Repository**: [https://github.com/Phronesis2025/platform_quiz](https://github.com/Phronesis2025/platform_quiz)

## Features

- **Landing Page** (`/`) - Welcome page explaining the quiz purpose
- **Quiz Page** (`/quiz`) - Interactive quiz with multiple questions
- **Result Page** (`/result/[id]`) - View individual quiz results
- **Admin Page** (`/admin`) - View all quiz submissions (authentication ready for future implementation)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Vercel KV (Redis) database (or local Redis for development)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# Vercel automatically provides REDIS_URL when you create a KV database
# Use: vercel env pull .env.local (recommended)
# Or manually set:
REDIS_URL=redis://default:password@host:port
```

Get your connection details from your Vercel dashboard: **Settings** > **Storage** > **KV**
Or use `vercel env pull .env.local` to automatically get all environment variables.

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
app/
  ├── layout.tsx          # Root layout with metadata
  ├── page.tsx            # Landing page (/)
  ├── globals.css         # Global styles with Tailwind
  ├── quiz/
  │   └── page.tsx        # Quiz page (/quiz)
  ├── result/
  │   └── [id]/
  │       └── page.tsx    # Dynamic result page (/result/[id])
  └── admin/
      └── page.tsx        # Admin dashboard (/admin)
```

## Technologies Used

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React** - UI library
- **Vercel KV** - Serverless Redis database for data persistence

## Database

This project uses Vercel KV (Redis) for data persistence. Quiz submissions are stored in Redis with the following structure:

- Quiz responses and answers
- Calculated role fit scores
- User metadata (name, team)
- Request metadata (user agent, IP hash)

Data is stored using Redis key patterns:
- `submission:{id}` - Individual submission data (JSON)
- `submissions:index` - Sorted set for ordering by creation date

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

## Notes

- Quiz results are stored in Vercel KV (Redis) database
- Admin page is structured to easily add authentication later
- All routes are functional and include navigation between pages
- IP addresses are hashed for privacy (SHA-256)
