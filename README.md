<p align="center">
  <img width="192" height="192" alt="192x192" src="https://github.com/user-attachments/assets/4c97f877-4fba-4146-885c-26f945bb6682" />
</p>

<h1 align="center">Upstream: Event logging for your Next.js project</h1>

<p align="center">
  <img src="https://img.shields.io/npm/v/@uplabs/sdk" alt="npm version" />
  <img src="https://img.shields.io/npm/dm/@uplabs/sdk" alt="npm downloads" />
  <img src="https://img.shields.io/badge/license-AGPL--3.0-red" alt="License" />
  <a href="https://github.com/linuskang/up/actions/workflows/ci.yml">
    <img src="https://github.com/linuskang/up/actions/workflows/ci.yml/badge.svg" alt="Build" />
  </a>
</p>

This is a small logging project I've been developing for the past few months, and using it internally across my apps. Basically, Upstream is a easy way to integrate logging into your own Next.js apps. It takes minutes to setup - you create a account, project, API key, and integrate it with your project using the SDK.

A demo of the application is available at https://up.linus.my

<img width="2523" height="1265" alt="image" src="https://github.com/user-attachments/assets/bd8359a4-4776-4617-b15b-89c8678c9497" />

## Getting Started

> This guide will be changed with the upcoming releases >0.0.10 - currently reworking how Upstream ingests events. Future releases will only require you to insert a hook component into your app.

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

3. ``cd packages/db && npx prisma generate``

4. Add your ``.env`` into ``/apps/web``

4. Run db migrations ``npx prisma migrate dev``

Finally, run the development server using ``cd apps/web && npm run dev``

After, go to ``http://localhost:3000`` and start editing!

## Selfhost (Docker)

Copy paste this into your directory:

```yml
services:
  app:
    image: ghcr.io/linuskang/upstream:latest
    container_name: upstream
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      BASE_URL: ${BASE_URL}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${BETTER_AUTH_URL}

      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}

      RESEND_API_KEY: ${RESEND_API_KEY}
      RESEND_EMAIL_FROM: ${RESEND_EMAIL_FROM}

      CRON_SECRET: ${CRON_SECRET}
      ALLOW_SIGNUP: ${ALLOW_SIGNUP}

      VAPID_PUBLIC_KEY: ${VAPID_PUBLIC_KEY}
      VAPID_PRIVATE_KEY: ${VAPID_PRIVATE_KEY}
      VAPID_EMAIL: ${VAPID_EMAIL}
    ports:
      - "3000:3000"
    depends_on:
      - db
    networks:
      - upstream

  db:
    image: postgres:17
    container_name: upstream-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - upstream:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - upstream

volumes:
  upstream:

networks:
  upstream:
    driver: bridge
```


Run ``docker compose up -d`` and access at port ``3000`` to create your account. By default, the first account created will receive full administrative privileges to the instance.

## Some notes

We are very very early in this project. Expect bugs.

We are not accepting contributions yet.

Documentation lives in [apps/docs](/apps/docs) and can be deployed as a standalone Fumadocs site.

### If you REALLY want to contibute still...

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or PR. We use vouch to organise trust levels in this repository.

## AI Declaration

See [ai.md](ai.md)

## License

AGPL-3.0

Please see the [license file](LICENSE) for more information.

Built with ❤️ by [Linus Kang](https://github.com/linuskang)
