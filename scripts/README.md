# Backfill Scripts

## backfill-submissions.ts

Recomputes and updates existing quiz submissions with new interpretation fields:
- `skillProfile` - Accumulated skill tags from all selected options
- `evidenceHighlights` - Top 3-5 strongest signal answers with evidence
- `primaryRecommendations` - Recommendations from primary role playbook
- `secondaryRecommendations` - Recommendations from secondary role playbook

### Usage

```bash
npm run backfill
```

Or directly:

```bash
npx tsx scripts/backfill-submissions.ts
```

### Requirements

- `REDIS_URL` environment variable must be set
- Run from project root directory
- Node.js 18+ with TypeScript support

### What It Does

1. Connects to Redis using `REDIS_URL`
2. Retrieves all submission IDs from the `submissions:index` sorted set
3. For each submission:
   - Checks if it already has the new fields (skips if complete)
   - Recomputes scoring using the stored answers
   - Generates skill profile and evidence highlights
   - Looks up role playbooks to get recommendations
   - Updates the submission in Redis with new fields
4. Provides a summary of updated, skipped, and error counts

### Safety Features

- **Idempotent**: Safe to run multiple times (skips already-updated submissions)
- **Non-destructive**: Only adds new fields, doesn't modify existing data
- **Error handling**: Continues processing even if individual submissions fail
- **Progress tracking**: Shows progress for each submission

### Output Example

```
Starting backfill of existing submissions...

Connecting to Redis...
✓ Connected to Redis

Found 5 submissions to process

Processing 1/5: abc-123-def-456
  ✓ Updated submission abc-123-def-456
Processing 2/5: xyz-789-ghi-012
  ✓ Submission xyz-789-ghi-012 already has all fields, skipping
...

==================================================
Backfill Summary:
  Total submissions: 5
  Updated: 3
  Skipped (already up-to-date): 2
  Errors: 0
==================================================
```
