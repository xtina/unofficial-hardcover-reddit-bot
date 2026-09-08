# u/hardcoverbot

Inspired by [reddit-goodreads-bot](https://github.com/rodohanna/reddit-goodreads-bot) and adapted to use the [Hardcover](https://hardcover.app/) GQL API. This is built on top of Reddit's [Devvit](https://developers.reddit.com/docs/) platform. PRs and issues are welcome!

[Add this bot to your subreddit!](https://developers.reddit.com/apps/hardcoverbot)

## I don't work for Hardcover

I made this because I like the hardcover app a lot; but hardcover devs, if you're reading this, feel free to reach out :)

## What it does

A Reddit bot that comments Hardcover data when summoned.
As an homage to the original bot, this bot will respond to comments that are prepended with `h{{` and ending with `}}`.

Example:

If someone makes a comment like:

`I think you would like h{The Hobbit}`

The bot will add a comment with a Hardcover link, author, number of pages, year published, top genres, and a link to a prepopulated search for "The Hobbit".

If someone makes a comment like:

`Maybe you should check out h{{Dark Matter}}`

The bot will add a comment with all of the information listed above AND the Hardcover description.

If you want to specify the author, you would do it like:

`Look at h{Recursion by Blake Crouch}`

or

`Look at h{{Recursion by Blake Crouch}}`

## Links

[Source](https://github.com/xtina/unofficial-hardcover-reddit-bot/tree/main)

[Privacy Policy](https://github.com/xtina/unofficial-hardcover-reddit-bot/blob/main/PRIVACY.md)

[Terms and Conditions](https://github.com/xtina/unofficial-hardcover-reddit-bot/blob/main/TERMS.md)

### Why hardcover.app?

They have a public API and nice [docs](https://docs.hardcover.app/api/getting-started/).

Storygraph does not have a public API and Goodreads has shut down its public API.

## Development

The bot uses Devvit Web with an Express server. Comment and post subscriptions,
permissions, and app settings are declared in `devvit.json`.

1. Run `pnpm install`.
2. On a fresh checkout, set `HARDCOVER_KEY` and `HARDCOVER_API_URL` in a local
   `.env` file and run `pnpm codegen` to generate the GraphQL client. These values
   are only for local code generation; `.env` is not deployed.
3. Run `pnpm build` to type-check and bundle `dist/server/index.cjs`.
4. Run `pnpm dlx devvit@0.14.2 playtest <test-subreddit>`. The CLI runs the
   configured `pnpm dev` command to rebuild the server when source files change.
5. Set the app-level `hardcoverApiKey` using Devvit's app settings. The
   `hardcover-api-url` setting defaults to `https://api.hardcover.app/v1/graphql`.
6. Submit a new comment such as `h{The Hobbit}` in the playtest subreddit.
   Look for `TRIGGER FIRED:` in the playtest logs. Missing credentials and failed
   trigger processing return HTTP 500 and log an error without printing secrets.

`pnpm typecheck` uses TypeScript 7 (`typescript-native`). Jest uses the
TypeScript 6 JavaScript compiler API through the `typescript` package alias.

Run the focused migration regressions with:

```sh
pnpm test --runInBand test/server.test.ts test/hardcover.test.ts
```
