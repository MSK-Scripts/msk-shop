# MSK Scripts Shop

[![CI](https://github.com/MSK-Scripts/msk-shop/actions/workflows/ci.yml/badge.svg)](https://github.com/MSK-Scripts/msk-shop/actions/workflows/ci.yml)
[![CodeQL](https://github.com/MSK-Scripts/msk-shop/actions/workflows/codeql.yml/badge.svg)](https://github.com/MSK-Scripts/msk-shop/actions/workflows/codeql.yml)
[![License: MSK-SAL v1.1](https://img.shields.io/badge/License-MSK--SAL%20v1.1-red?style=flat-square)](LICENSE.md)

The headless storefront behind [msk-scripts.de](https://www.msk-scripts.de), built on Next.js 16, React 19, TypeScript, Tailwind CSS and MariaDB.

It sells FiveM resources through the Tebex Headless API and doubles as the management platform for the Discord Ticket Bot and the Giveaway Bot: API keys, Stripe subscriptions, hosted transcripts, custom domains and fully hosted bots. It also runs the MSK image gallery and its CDN.

**This is not an open-source project.** The code is public to read, not free to use, see [License](#license).

## Quick start

Requirements: Node.js 24, a MariaDB or MySQL database and a Tebex Headless project.

```bash
npm install
cp .env.example .env.local      # fill in Tebex, database, session and OAuth values
npm run dev                     # http://localhost:3000
```

`npm run lint`, `npm run typecheck`, `npm test` and `npm run build` are what CI runs on every push and pull request. A local database via Docker is described in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#lokale-entwicklungs-datenbank-docker).

## Documentation

| Topic | Where |
|---|---|
| Features and Ticket Bot tiers | [docs/features.md](docs/features.md) |
| Stack, project layout, database, configuration, security architecture, styling | [docs/development.md](docs/development.md) |
| CI/CD, manual installation, environment variables, updating, troubleshooting | [docs/operations.md](docs/operations.md) |
| Server-side deploy runbook (German) | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Design system | [DESIGN.md](DESIGN.md) |
| Security policy and reporting | [SECURITY.md](SECURITY.md) |

## Help and contributing

- Questions and support: [Discord](https://discord.gg/5hHSBRHvJE) or info@msk-scripts.de
- Bugs and suggestions: [GitHub Issues](https://github.com/MSK-Scripts/msk-shop/issues)
- Security issues, please report privately: [SECURITY.md](SECURITY.md)
- Pull requests are welcome, but read [CONTRIBUTING.md](CONTRIBUTING.md) first, especially [Rights in your contribution](CONTRIBUTING.md#rights-in-your-contribution), and the [Code of Conduct](CODE_OF_CONDUCT.md)

## License

MSK Source Available License (MSK-SAL) v1.1: [English](LICENSE.md) · [Deutsch](LICENSE_DE.md). The German version is binding (§ 12.4).

| | |
|---|---|
| ✅ **Allowed** | Reading the code, running it locally for private study, opening issues, submitting pull requests, security research along [SECURITY.md](SECURITY.md) |
| ❌ **Not allowed** | Copying or reusing the code, derivative works, hosting it publicly, any commercial use, redistribution, recreating the design of the protected components |
| ⚖️ **Untouched** | The statutory rights under § 69d and § 69e UrhG (§ 5 of the license) |

The npm dependencies keep their own licenses, and the media on `cdn.msk-scripts.de` is not covered (§ 8). Names and logos are not licensed (§ 7). For commercial licenses, collaborations or white-label requests, write to `info@msk-scripts.de` with the subject `MSK License Request`.
