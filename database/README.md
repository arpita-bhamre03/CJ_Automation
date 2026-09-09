# Cosmos DB validation — not implemented yet

This directory is reserved for Azure Cosmos DB validation utilities.

**Status: pending.** Nothing is implemented here because none of the required
details are available yet:

- Cosmos endpoint, database name, container names, partition keys
- Which flows actually need database-level verification

**It also needs a dependency that has not been approved.** Cosmos DB access from
TypeScript requires `@azure/cosmos`, which is not in `package.json`. Per the
framework rules, no dependency is added without approval — ask before installing.

## Planned shape

```
database/
├── db-helper.ts              # generic connection + query execution
└── queries/
    └── <domain>-queries.ts   # named, reusable queries per domain
```

Environment variables are already reserved in `.env.example`:

```
COSMOS_ENDPOINT
COSMOS_KEY
COSMOS_DATABASE
COSMOS_CONTAINER
```

## Rules that will apply

- Credentials come from environment variables only, never committed.
- Tests never open a Cosmos connection directly; they go through `db-helper.ts`.
- Database assertions supplement UI/API assertions — they never replace them.
  Use them only where persistence or backend state genuinely needs verifying.
