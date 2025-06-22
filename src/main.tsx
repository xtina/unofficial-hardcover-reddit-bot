// Learn more at developers.reddit.com/docs
import { Devvit, TriggerEventType } from '@devvit/public-api';
import * as dotenv from 'dotenv';
import { GraphQLClient } from 'graphql-request';
import { processUserComment } from './CommentGenerator.js';

dotenv.config();

Devvit.configure({
  redditAPI: true,
  redis: true,
  http: {
    domains: ['api.hardcover.app'],
  },
});

Devvit.addSettings({
  name: 'hardcover-api-key-1',
  label: 'Hardcover API Key part 1',
  type: 'string',
  isSecret: true,
  scope: 'app',
});

Devvit.addSettings({
  name: 'hardcover-api-key-2',
  label: 'Hardcover API Key part 2',
  type: 'string',
  isSecret: true,
  scope: 'app',
});

Devvit.addSettings({
  name: 'hardcover-api-key-3',
  label: 'Hardcover API Key part 3',
  type: 'string',
  isSecret: true,
  scope: 'app',
});

Devvit.addSettings({
  name: 'hardcover-api-url',
  label: 'Hardcover API URL',
  type: 'string',
  scope: 'app',
});
dotenv.config();

function validateComment(event: TriggerEventType['CommentCreate']): string | null {
  if (!event.comment?.body) {
    return null;
  }
  return event.comment.body;
}

Devvit.addTrigger({
  event: 'CommentCreate',
  onEvent: async (event, context) => {
    const hardcoverApiKey =
      (((await context.settings.get('hardcover-api-key-1')) as string) || '') +
      (((await context.settings.get('hardcover-api-key-2')) as string) || '') +
      (((await context.settings.get('hardcover-api-key-3')) as string) || '');
    const maybeApiKey = hardcoverApiKey || process.env.HARDCOVER_KEY;
    const hardcoverApiUrl =
      ((await context.settings.get('hardcover-api-url')) as string) ||
      process.env.HARDCOVER_API_URL ||
      '';

    const hardcoverApiClient = new GraphQLClient(hardcoverApiUrl, {
      headers: {
        Authorization: `Bearer ${maybeApiKey}`,
      },
    });

    const commentBody = validateComment(event);
    if (!commentBody || !event.comment?.id) {
      return;
    }

    const commentResponse = await processUserComment(
      commentBody,
      hardcoverApiClient,
      event?.subreddit?.name,
      context.redis
    );
    if (commentResponse) {
      await context.reddit.submitComment({
        id: event.comment.id,
        text: commentResponse,
      });
    }
  },
});

export default Devvit;
