# Contributing

Thanks for taking the time to contribute to the MSK Scripts Shop. This document
covers how to get the project running locally and what we expect before a change
is merged.

Please also read our [Code of Conduct](./CODE_OF_CONDUCT.md). Security issues go
through [SECURITY.md](./SECURITY.md), not public issues.

## Prerequisites

- Node.js >= 22 and npm
- A local copy of `.env.local` (copy `.env.example` and fill in the values you
  need). Most of the storefront works without a database; the ticket-bot and
  admin features need MariaDB and the relevant secrets.

## Getting started

```bash
npm ci                 # install exact dependency versions
cp .env.example .env.local   # then fill in the values
npm run dev            # http://localhost:3005
```

## Before you open a pull request

Run the same checks CI runs and make sure they all pass:

```bash
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit (strict)
npm test               # Vitest
npm run build          # production build
```

Guidelines:

- **Keep changes focused.** One logical change per pull request. Every changed
  line should trace back to the purpose of the PR.
- **Match the existing style.** TypeScript strict mode, the existing component
  and file conventions, and the design tokens in `app/globals.css` (never
  hard-coded colors).
- **Security matters.** Validate input server-side, never expose secrets to the
  client, and keep the Content-Security-Policy intact (see `proxy.ts`).
- **Add tests** for logic where mistakes are costly (auth, permissions, billing,
  parsing). Tests live in `tests/`.
- **Update the docs** when you change behavior, env variables, routes or the
  database schema.

## Rights in your contribution

Please read this before you open a pull request.

This project is **source available, not open source**. It runs under the
[MSK Source Available License](LICENSE.md) ([deutsche Fassung](LICENSE_DE.md)),
and § 9 of that license governs contributions. In short:

- You grant MSK Scripts an **exclusive, unlimited, sublicensable right of use**
  in whatever you submit, free of charge. That includes commercial use.
- **Your copyright stays yours.** Under § 29 (1) UrhG it cannot be transferred
  between living persons, so only rights of use change hands. Your right to be
  recognized as the author stays untouched, and attribution happens through the
  Git history and the contributor list.
- You confirm that you are entitled to grant those rights, and that your
  contribution infringes no third-party rights. If it contains third-party code,
  mark it and name its license in the pull request.
- Contributing gives you no rights in the Project itself beyond reading and
  running it locally (§ 2 of the license).
- Issues and pull requests are public and create no obligation of
  confidentiality. For security vulnerabilities use the route in
  [SECURITY.md](SECURITY.md) instead, which is expressly permitted research
  under § 6 of the license.

Opening a pull request counts as your agreement to those terms. If you are not
comfortable with them, open an issue instead and describe the change. That is
just as useful and costs you nothing.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/) in English,
for example:

```
feat(admin): add gift card management
fix(cart): keep gift recipient after reload
test: cover the rate limiter window reset
chore(deps): bump next to 16.3.1
```

## Pull request process

1. Create a branch off `main`.
2. Push your branch and open a pull request against `main`.
3. Make sure the CI checks (Lint, Typecheck, Test, Build) are green.
4. A maintainer reviews and merges. Merging to `main` triggers an automatic
   deployment, so keep `main` releasable at all times.

Thanks again for contributing!
