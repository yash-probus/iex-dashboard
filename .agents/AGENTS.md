# Database Management Rules

- **NEVER drop any database tables.**
- Do NOT run `npx prisma db push --accept-data-loss` or any destructive database commands that might drop unmapped tables.
- If updating the Prisma schema, always verify that no existing tables will be dropped unintentionally. If there is a risk, stop and ask the user for explicit permission before proceeding with any DB synchronization.
