# Contributing

> [!NOTE]
> This guide isn't done yet and is still being worked on. I've tried my best to get everything you need to start tinkering with Upstream here but there might be some stuff missing. Apologies.

## Upstream App: Setting up dev environment

Clone the repository:

```bash
git clone https://github.com/linuskang/up
```

Enter and install dependencies:

```bash
cd up/apps/upstream
npm i
```

Declare `.env` inside of `/apps/upstream`:

```bash
cp .env.example ~/apps/upstream # edit the values to be yours
```

Run prisma migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

And lastly, start the server:

```bash
npm run dev
```

Upstream will be available at http://localhost:3001

## Packages

1. Clone the repo
2. `npm install`
3. Start tinkering
4. When your done, run `npm run build` and `npm run lint` to check for errors.
5. Your done! create a pr if you wish.
