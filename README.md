# u/hardcover-bot

Inspired by [reddit-goodreads-bot](https://github.com/rodohanna/reddit-goodreads-bot) and adapted to use the [Hardcover](https://hardcover.app/) GQL API.

## I don't work for Hardcover

I made this because I like the hardcover app a lot; but hardcover devs, if you're reading this, send me a coffee!

## What it does

A Reddit bot that comments Hardcover data when summoned.
As an homage to the original bot, this bot will respond to comments that are prepended with `h`.

Example:

If someone makes a comment like:

`I think you would like h{The Hobbit}`

The bot will add a comment with a Hardcover link, author, number of pages, year published, popular shelves (up to 5), and a link to a prepopulated search for "The Hobbit".

If someone makes a comment like:

`Maybe you should check out h{{Dark Matter}}`

The bot will add a comment with all of the information listed above AND the Hardcover description.
