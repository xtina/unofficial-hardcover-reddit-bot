import express, { type Request, type Response } from 'express';
import { reddit, redis, settings } from '@devvit/web/server';
import {
  isT1,
  isT3,
  type OnCommentSubmitRequest,
  type OnPostSubmitRequest,
} from '@devvit/web/shared';
import { GraphQLClient } from 'graphql-request';
import { CommentGenerator } from '../CommentGenerator.js';

type SubmitEvent = OnCommentSubmitRequest | OnPostSubmitRequest;

export const app = express();
app.use(express.json());

async function handleSubmit(req: Request<object, object, SubmitEvent>, res: Response) {
  const event = req.body;
  let id: string | undefined;
  let text: string | undefined;
  if ('comment' in event) {
    id = event.comment?.id;
    text = event.comment?.body;
  } else if ('post' in event) {
    id = event.post?.id;
    text = event.post?.selftext;
  }
  console.log('TRIGGER FIRED:', req.path, id);

  if ((!isT1(id) && !isT3(id)) || !text || event.author?.name?.toLowerCase() === 'hardcoverbot') {
    res.json({ status: 'ok' });
    return;
  }

  try {
    const [apiKey, configuredUrl] = await Promise.all([
      settings.get<string>('hardcoverApiKey'),
      settings.get<string>('hardcover-api-url'),
    ]);
    if (!apiKey) {
      console.error('Missing hardcoverApiKey app setting');
      res.status(500).json({ status: 'error' });
      return;
    }

    const client = new GraphQLClient(configuredUrl || 'https://api.hardcover.app/v1/graphql', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const generator = new CommentGenerator(client, redis);
    const reply = await generator.processText(text, event.subreddit?.name);
    if (reply) {
      await reddit.submitComment({ id, text: reply });
    }
    res.json({ status: 'ok' });
  } catch {
    // GraphQL errors can contain request headers, including the API key.
    console.error('Failed to process trigger:', req.path, id);
    res.status(500).json({ status: 'error' });
  }
}

app.post('/internal/triggers/on-comment-submit', handleSubmit);
app.post('/internal/triggers/on-post-submit', handleSubmit);
