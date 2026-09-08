import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import { readFileSync } from 'node:fs';

const getSetting = jest.fn<(name: string) => Promise<string | undefined>>();
const submitComment = jest.fn<(comment: { id: string; text: string }) => Promise<void>>();
const processText =
  jest.fn<(text: string, subreddit: string | undefined) => Promise<string | undefined>>();

jest.unstable_mockModule('@devvit/web/server', () => ({
  settings: { get: getSetting },
  redis: {},
  reddit: { submitComment },
}));
jest.unstable_mockModule('../src/CommentGenerator.js', () => ({
  CommentGenerator: jest.fn().mockImplementation(() => ({ processText })),
}));

const { app } = await import('../src/server/app.js');
const config = JSON.parse(readFileSync(new URL('../devvit.json', import.meta.url), 'utf8'));

beforeEach(() => {
  jest.clearAllMocks();
  getSetting.mockImplementation(async (name) => {
    if (name === 'hardcoverApiKey') {
      return 'test-key';
    }
    return undefined;
  });
  processText.mockResolvedValue('A book reply');
  submitComment.mockResolvedValue(undefined);
});

describe('triggers', () => {
  it('repliesToComment', async () => {
    const response = await request(app)
      .post(config.triggers.onCommentSubmit)
      .send({
        comment: { id: 't1_comment', body: 'h{The Hobbit}' },
        subreddit: { name: 'playtest' },
        author: { name: 'reader' },
      });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(processText).toHaveBeenCalledWith('h{The Hobbit}', 'playtest');
    expect(submitComment).toHaveBeenCalledWith({ id: 't1_comment', text: 'A book reply' });
  });

  it('repliesToPost', async () => {
    const response = await request(app)
      .post(config.triggers.onPostSubmit)
      .send({
        post: { id: 't3_post', selftext: 'h{{The Hobbit}}' },
        subreddit: { name: 'playtest' },
      });
    expect(response.status).toBe(200);
    expect(processText).toHaveBeenCalledWith('h{{The Hobbit}}', 'playtest');
    expect(submitComment).toHaveBeenCalledWith({ id: 't3_post', text: 'A book reply' });
  });

  it('ignoresBot', async () => {
    await request(app)
      .post(config.triggers.onCommentSubmit)
      .send({
        comment: { id: 't1_comment', body: 'h{The Hobbit}' },
        author: { name: 'HardcoverBot' },
      })
      .expect(200);
    expect(processText).not.toHaveBeenCalled();
    expect(submitComment).not.toHaveBeenCalled();
  });

  it('ignoresMissingContent', async () => {
    await request(app).post(config.triggers.onCommentSubmit).send({}).expect(200);
    expect(getSetting).not.toHaveBeenCalled();
    expect(submitComment).not.toHaveBeenCalled();
  });

  it('skipsEmptyReply', async () => {
    processText.mockResolvedValue(undefined);
    await request(app)
      .post(config.triggers.onCommentSubmit)
      .send({
        comment: { id: 't1_comment', body: 'Just a comment' },
      })
      .expect(200);
    expect(submitComment).not.toHaveBeenCalled();
  });

  it('reportsMissingKey', async () => {
    getSetting.mockResolvedValue(undefined);
    await request(app)
      .post(config.triggers.onCommentSubmit)
      .send({
        comment: { id: 't1_comment', body: 'h{The Hobbit}' },
      })
      .expect(500);
    expect(processText).not.toHaveBeenCalled();
    expect(submitComment).not.toHaveBeenCalled();
  });

  it('reportsLookupFailure', async () => {
    processText.mockRejectedValue(new Error('lookup failed'));
    await request(app)
      .post(config.triggers.onCommentSubmit)
      .send({
        comment: { id: 't1_comment', body: 'h{The Hobbit}' },
      })
      .expect(500);
    expect(submitComment).not.toHaveBeenCalled();
  });

  it('reportsReplyFailure', async () => {
    submitComment.mockRejectedValue(new Error('reddit failed'));
    await request(app)
      .post(config.triggers.onCommentSubmit)
      .send({
        comment: { id: 't1_comment', body: 'h{The Hobbit}' },
      })
      .expect(500);
  });
});
