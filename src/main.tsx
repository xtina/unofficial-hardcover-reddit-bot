// Learn more at developers.reddit.com/docs
import { Devvit, TriggerEventType } from '@devvit/public-api';
import * as dotenv from 'dotenv';
import { GraphQLClient } from 'graphql-request';
import { CommentGenerator } from './CommentGenerator.js';

dotenv.config();

Devvit.configure({
  redditAPI: true,
  redis: true,
  http: {
    domains: ['api.hardcover.app'],
  },
});

Devvit.addSettings([
  {
    name: 'hardcover-api-key-1',
    label: 'Hardcover API Key part 1',
    type: 'string',
    isSecret: true,
    scope: 'app',
  },
  {
    name: 'hardcover-api-key-2',
    label: 'Hardcover API Key part 2',
    type: 'string',
    isSecret: true,
    scope: 'app',
  },
  {
    name: 'hardcover-api-key-3',
    label: 'Hardcover API Key part 3',
    type: 'string',
    isSecret: true,
    scope: 'app',
  },
  {
    name: 'hardcover-api-url',
    label: 'Hardcover API URL',
    type: 'string',
    scope: 'app',
  },
]);

dotenv.config();

function getText(
  event: TriggerEventType['CommentCreate'] | TriggerEventType['PostCreate']
): string | undefined {
  if (event.type === 'CommentCreate') {
    return event?.comment?.body;
  } else if (event.type === 'PostCreate') {
    return event.post?.selftext;
  }
  return undefined;
}

Devvit.addTrigger({
  events: ['CommentCreate', 'PostCreate'],
  onEvent: async (event, context) => {
    // i have to do this because the devvit api restricts the number of characters in a setting to 250
    // and my bearer token is quite long. therefore i have to concatenate the three parts of the key.
    // this is messy but it works within the current limits of the devvit api.
    const hardcoverApiKey =
      (((await context.settings.get('hardcover-api-key-1')) as string) || '') +
      (((await context.settings.get('hardcover-api-key-2')) as string) || '') +
      (((await context.settings.get('hardcover-api-key-3')) as string) || '');
    const maybeApiKey = hardcoverApiKey || process.env.HARDCOVER_KEY;
    const hardcoverApiUrl =
      ((await context.settings.get('hardcover-api-url')) as string) ||
      process.env.HARDCOVER_API_URL ||
      '';

    if (!maybeApiKey || !hardcoverApiUrl) {
      console.error('No API key or URL found');
      return;
    }

    const hardcoverApiClient = new GraphQLClient(hardcoverApiUrl, {
      headers: {
        Authorization: `Bearer ${maybeApiKey}`,
      },
    });

    const text = getText(event);
    const id = event.type === 'CommentCreate' ? event?.comment?.id : event.post?.id;
    if (!text || !id) {
      return;
    }

    const generator = new CommentGenerator(hardcoverApiClient, context.redis);
    const commentResponse = await generator.processText(text, event?.subreddit?.name);
    if (commentResponse) {
      await context.reddit.submitComment({
        id,
        text: commentResponse,
      });
    }
  },
});

export default Devvit;
