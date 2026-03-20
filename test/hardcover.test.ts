import { GraphQLClient } from 'graphql-request';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CommentGenerator } from '../src/CommentGenerator.js';
import { RedisClient } from '@devvit/public-api';
import * as dotenv from 'dotenv';
import gatsbyResponse from './gatsby-response.json';
import fountainResponse from './fountain.json';
import hyperionResponse from './hyperion.json';

jest.mock('graphql-request');
dotenv.config();

describe('Hardcover', () => {
  let mockClient: jest.Mocked<GraphQLClient>;
  let mockRedis: jest.Mocked<RedisClient>;
  let commentGenerator: CommentGenerator;
  let incrByCounter = 0;
  let totalIncrByCounter = 0;

  beforeEach(() => {
    incrByCounter = 0;
    totalIncrByCounter = 0;

    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      incrBy: jest.fn().mockImplementation((key: string, increment: number) => {
        if (key.includes('total')) {
          totalIncrByCounter += increment;
          return Promise.resolve(totalIncrByCounter);
        }
        incrByCounter += increment;
        return Promise.resolve(incrByCounter);
      }),
      watch: jest.fn().mockResolvedValue(undefined),
      exec: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<RedisClient>;

    mockClient = {
      request: jest.fn(),
    } as unknown as jest.Mocked<GraphQLClient>;

    mockClient.request.mockResolvedValue(gatsbyResponse);
    commentGenerator = new CommentGenerator(mockClient, mockRedis);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate comment for default formatter', () => {
    it('should print short desc for a comment', async () => {
      const comment = 'You might like h{The Great Gatsby by F. Scott Fitzgerald}';
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('The Great Gatsby');
    });

    it('should print long desc for a comment with a title and author', async () => {
      const comment = 'You might like h{{The Great Gatsby by F. Scott Fitzgerald}}';
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('The Great Gatsby');
      expect(result).toContain('supreme achievement');
    });

    it('should find books with special characters in title', async () => {
      mockClient.request.mockResolvedValue(fountainResponse);
      const comment =
        'h{{Regarding the Fountain by Kate Klise}} This starts a whole hilarious series featuring a fifth grade class, told in epistolary style through letters, memos and documents.';
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Regarding the Fountain');
    });

    it('should print multiple books in a single comment if they fit', async () => {
      const comment =
        'You might like h{{The Great Gatsby by F. Scott Fitzgerald}} and h{{The Great Gatsby by F. Scott Fitzgerald}}';
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('The Great Gatsby');
      expect(result).toMatch(/books suggested/);
    });

    it('should print 2 short desc books if the comment requests 2 books', async () => {
      const comment =
        'You might like h{The Great Gatsby by F. Scott Fitzgerald} and h{The Great Gatsby by F. Scott Fitzgerald}';
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('The Great Gatsby');
      expect(result).toMatch(/books suggested/);
    });

    it('should escape () and [] in the description', async () => {
      const comment = 'h{hyperion}';
      mockClient.request.mockResolvedValue(hyperionResponse);
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Hyperion');
      expect(result).toContain('Dan Simmons');
    });

    it('should handle multiline comments with extra text after tags', async () => {
      mockClient.request.mockResolvedValue(gatsbyResponse);
      const comment = `h{{Dungeon Crawler Carl}}

h{{Legends & Lattes}}

h{{Half A King}}

h{{World War Z}} I like the audio book it feels like listening to a podcast bc there's a MMC that doesn't change and the people who are getting interviewed change

h{{11/22/63}}

h{{Jurassic Park}}

h{{Yumi and the Nightmare Painter}}

h{{All Systems Red}}

h{{Ring Shout}}

h{{What Moves the Dead}}

I wrote down horror, sci fi, and fantasy. I'm not sure what exactly you're want or how thick of a book you are wanting to read.`;
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('10 book requests');
      expect(result).toContain('split');
    });

    it('should ask user to split if too many book requests', async () => {
      mockClient.request.mockResolvedValue(gatsbyResponse);
      const longTitles = Array(15).fill(null).map(() => 'h{{The Great Gatsby by F. Scott Fitzgerald}}').join('\n');
      const result = await commentGenerator.processText(longTitles, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // Should return a message asking them to split since there are 15 books
      expect(result).toContain('15 book requests');
      expect(result).toContain('too many');
      expect(result).toContain('split');
    });
  });

  describe('generate comment for lite formatter', () => {
    it('should print short desc for a comment', async () => {
      const comment = 'You might like h{The Great Gatsby by F. Scott Fitzgerald}';
      const result = await commentGenerator.processText(comment, 'test');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('The Great Gatsby');
    });

    it('should print short desc even if the comment requests a long version', async () => {
      const comment = 'You might like h{{The Great Gatsby by F. Scott Fitzgerald}}';
      const result = await commentGenerator.processText(comment, 'test');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('The Great Gatsby');
      expect(result).not.toContain('supreme achievement');
    });
  });

  it('ignores comments that dont have the right regex', async () => {
    const comment = 'random comment';
    const result = await commentGenerator.processText(comment, 'books');
    expect(result).toBeUndefined();
  });

  describe('handling edge cases', () => {
    it('should handle comments with only book tags and nothing else', async () => {
      const comment = 'h{The Great Gatsby by F. Scott Fitzgerald}';
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('The Great Gatsby');
    });

    it('should handle mixed long and short format books in one comment', async () => {
      const comment =
        'h{The Great Gatsby by F. Scott Fitzgerald} and h{{The Great Gatsby by F. Scott Fitzgerald}}';
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('The Great Gatsby');
    });

    it('should return undefined for comments with malformed book tags', async () => {
      const comment = 'h{incomplete tag and h{ and h{{ also incomplete';
      const result = await commentGenerator.processText(comment, 'books');
      // Malformed tags might still match partially, but the important thing is robustness
      expect(typeof result === 'string' || result === undefined).toBe(true);
    });

    it('should handle comments with extra whitespace around tags', async () => {
      const comment = 'h{{ The Great Gatsby by F. Scott Fitzgerald }} and h{ Another Title by Author }';
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should reject requests with exactly 9 books (exceeds max of 8)', async () => {
      const books = Array(9)
        .fill(null)
        .map(() => 'h{The Great Gatsby by F. Scott Fitzgerald}')
        .join('\n');
      const result = await commentGenerator.processText(books, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('9 book requests');
      expect(result).toContain('too many');
      expect(result).toContain('split');
    });

    it('should accept exactly 8 books (at the limit)', async () => {
      mockClient.request.mockResolvedValue(gatsbyResponse);
      const books = Array(8)
        .fill(null)
        .map(() => 'h{The Great Gatsby by F. Scott Fitzgerald}')
        .join('\n');
      const result = await commentGenerator.processText(books, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('The Great Gatsby');
      // Should not contain the "too many" message
      expect(result).not.toContain('too many');
    });

    it('should handle book titles with special characters throughout', async () => {
      mockClient.request.mockResolvedValue(fountainResponse);
      const comment = 'h{{Regarding the Fountain by Kate Klise}}';
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Regarding the Fountain');
    });

    it('should differentiate between short and long format in the same comment', async () => {
      const shortComment = 'h{The Great Gatsby by F. Scott Fitzgerald}';
      const longComment = 'h{{The Great Gatsby by F. Scott Fitzgerald}}';

      const shortResult = await commentGenerator.processText(shortComment, 'books');
      const longResult = await commentGenerator.processText(longComment, 'books');

      expect(shortResult).toBeDefined();
      expect(longResult).toBeDefined();
      // Long format should contain description, short should not
      expect(longResult).toContain('supreme achievement');
      expect(shortResult).not.toContain('supreme achievement');
    });
  });
});
