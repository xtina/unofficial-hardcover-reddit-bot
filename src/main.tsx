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
    name: 'hardcoverApiKey',
    label: 'Hardcover API Key',
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
  event: TriggerEventType['CommentSubmit'] | TriggerEventType['PostSubmit']
): string | undefined {
  if (event.type === 'CommentSubmit') {
    return event?.comment?.body;
  } else if (event.type === 'PostSubmit') {
    return event.post?.selftext;
  }
  return undefined;
}

Devvit.addTrigger({
  events: ['CommentSubmit', 'PostSubmit'],
  onEvent: async (event, context) => {
    console.log('TRIGGER FIRED:', event.type);

    const hardcoverApiKey = ((await context.settings.get('hardcoverApiKey')) as string) || '';
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
    console.log(text);
    const id = event.type === 'CommentSubmit' ? event?.comment?.id : event.post?.id;
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
