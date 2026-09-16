<p align="center">
  <img width="192" height="192" alt="192x192" src="https://github.com/user-attachments/assets/4c97f877-4fba-4146-885c-26f945bb6682" />
</p>

<h1 align="center">Upstream: Simple and open events logging platform for your SaSS projects.</h1>

<p align="center">
  <img src="https://img.shields.io/npm/v/@uplabs/sdk" alt="npm version" />
  <img src="https://img.shields.io/npm/dm/@uplabs/sdk" alt="npm downloads" />
  <img src="https://img.shields.io/badge/license-CC_BY_NC_4.0-red" alt="License" />
  <a href="https://github.com/linuskang/up/actions/workflows/ci.yml">
    <img src="https://github.com/linuskang/up/actions/workflows/ci.yml/badge.svg" alt="Build" />
  </a>
</p>

This is a passion project I've been developing for the past few months, and using it internally across my apps. I needed a simple logging platform that was quick to setup for new projects, had awesome logging capabilities, and beautiful UI, hence, this is what I came up with.

Basically, Upstream is a easy way to integrate logging into your own applications. It takes minutes to setup - you create a account, project, API key, and integrate it with your project using my SDK. For me, I'm mostly using Upstream for product logs like user signups, reports, etc as I can easily view these alerts on the mobile app with push notifications support for essential events!

<img width="2523" height="1265" alt="image" src="https://github.com/user-attachments/assets/bd8359a4-4776-4617-b15b-89c8678c9497" />

### Check it out at https://up.linus.my

## I want to try Upstream!

1. Go to https://up.linus.my and register an API key for your project.
2. Install the sdk
```bash
npm i @uplabs/sdk
```
3. Start ingesting events, below is an example.

```ts
import { Upstream } from '@uplabs/sdk'

const up = new Upstream({
  apiKey: "YOUR_API_KEY"
})

up.events.ingest({
    title: "Hello, World!",
    icon: "😁",
});
```

## Running locally for development

Pretty straightforward. Heres how:

1. ``git clone https://github.com/linuskang/up && cd up``

2. ``npm install``

3. ``cd apps/web && npx prisma generate``

4. Add your ``.env`` into the root directory at ``/apps/web``

4. Run db migrations ``npx prisma migrate dev``

Finally, run the development server using ``npm run dev``

After, go to ``http://localhost:3000`` and start editing!

### Contributing.

Please see the [CONTRIBUTING](CONTRIBUTING.md) guide for more information. Upstream isn't currently accepting PRs, however, if your wanting to fix small bugs, create a PR and I will take a look.

Before creating PRs, please create an issue to discuss with me what you are planning to add/fix and I will let you know whether we are ok with this (dont want to waste your time!).

After we exit beta, all public contributions will be accepted!

## Self-host

Lucky for you, you can self-host using docker!

Here's the ``docker-compose.yml`` for you to get started.

1. Copy paste this into your directory:

```yml
services:
  app:
    image: ghcr.io/linuskang/up:latest
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file: .env
    restart: unless-stopped
    depends_on:
      - db
    networks:
      - upstream_net
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: upstream
      POSTGRES_PASSWORD: upstream
      POSTGRES_DB: upstream
    volumes:
      - upstream_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - upstream_net
volumes:
  upstream_data:
networks:
  upstream_net:
    driver: bridge
```

2. Add your ``.env`` in the same directory:

```
DATABASE_URL=""
BASE_URL=""

BETTER_AUTH_SECRET=""
BETTER_AUTH_URL=""

GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

RESEND_API_KEY=""
RESEND_EMAIL_FROM=""

CRON_SECRET=""
ALLOW_SIGNUP=""

VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_EMAIL=""
```

3. Run ``docker compose up -d``

4. Apply the database migrations using ``npx prisma migrate deploy``

5. Visit the site at ``0.0.0.0:3000``

## Some notes

We are very very early in this project. Expect bugs.

We are not accepting contributions yet.

Documentation lives in [apps/docs](/apps/docs) and can be deployed as a standalone Fumadocs site.

### If you REALLY want to contibute still...

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or PR. We use vouch to organise trust levels in this repository.

## AI Declaration

See [ai.md](ai.md)

## License

Upstream is licensed under **CC BY-NC 4.0**.

**This means you can:**

- ✅ Share — copy and redistribute the material in any medium or format
- ✅ Adapt — remix, transform, and build upon the material

**As long as you:**

- ✅ Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
- ❌ NonCommercial — You may not use the material for commercial purposes.
- ❌ No additional restrictions — You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits.

Please see the [license file](LICENSE) for more information.

Built with ❤️ by [Linus Kang](https://github.com/linuskang)
