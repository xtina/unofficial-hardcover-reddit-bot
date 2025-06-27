import { GraphQLClient } from 'graphql-request';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CommentGenerator } from '../src/CommentGenerator.js';
import { RedisClient } from '@devvit/public-api';
import * as dotenv from 'dotenv';
import gatsbyResponse from './gatsby-response.json';
import fountainResponse from './fountain.json';

jest.mock('graphql-request');
dotenv.config();

describe('Hardcover', () => {
  let mockClient: jest.Mocked<GraphQLClient>;
  let mockRedis: jest.Mocked<RedisClient>;
  let commentGenerator: CommentGenerator;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      incrBy: jest.fn(),
      watch: jest.fn(),
      exec: jest.fn(),
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
      expect(result).toEqual(
        '[**The Great Gatsby**](https://hardcover.app/books/the-great-gatsby)\n\n^(By: F. Scott Fitzgerald | 180 pages | Published: 1920 | Top Genres: Classics, Fiction, Young Adult, Graphic novels, Spanish, Man-woman relationships, Literary Fiction, Romance, General, Biography)\n\n^(This book has been suggested 1 time)\n\n***\n\n^(1 book suggested | )[^(Source)](https://github.com/xtina/unofficial-hardcover-reddit-bot)'
      );
    });

    it('should print long desc for a comment with a title and author', async () => {
      const comment = 'You might like h{{The Great Gatsby by F. Scott Fitzgerald}}';
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toEqual(
        '[**The Great Gatsby**](https://hardcover.app/books/the-great-gatsby)\n\n^(By: F. Scott Fitzgerald | 180 pages | Published: 1920 | Top Genres: Classics, Fiction, Young Adult, Graphic novels, Spanish, Man-woman relationships, Literary Fiction, Romance, General, Biography)\n\n>The Great Gatsby, F. Scott Fitzgerald’s third book, stands as the supreme achievement of his career. First published in 1925, this quintessential novel of the Jazz Age has been acclaimed by generations of readers.\n>\n>The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, of lavish parties on Long Island at a time when The New York Times noted “gin was the national drink and sex the national obsession,” it is an exquisitely crafted tale of America in the 1920s.\n\n^(This book has been suggested 1 time)\n\n***\n\n^(1 book suggested | )[^(Source)](https://github.com/xtina/unofficial-hardcover-reddit-bot)'
      );
    });

    it('should print long desc for a comment with a title and author', async () => {
      mockClient.request.mockResolvedValue(fountainResponse);
      const comment =
        'h{{Regarding the Fountain by Kate Klise}} This starts a whole hilarious series featuring a fifth grade class, told in epistolary style through letters, memos and documents.';
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toEqual(
        '[**Regarding the Fountain: A Tale, in Letters, of Liars and Leaks**](https://hardcover.app/books/regarding-the-fountain-a-tale-in-letters-of-liars-and-leaks)\n\n^(By: Kate Klise, M. Sarah Klise | ? pages | Published: 1998)\n\n^(This book has been suggested 1 time)\n\n***\n\n^(1 book suggested | )[^(Source)](https://github.com/xtina/unofficial-hardcover-reddit-bot)'
      );
    });
    it('should print 2 long desc books if the comment requests 2 books', async () => {
      const comment =
        'You might like h{{The Great Gatsby by F. Scott Fitzgerald}} and h{{The Great Gatsby by F. Scott Fitzgerald}}';
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toEqual(
        '[**The Great Gatsby**](https://hardcover.app/books/the-great-gatsby)\n\n^(By: F. Scott Fitzgerald | 180 pages | Published: 1920 | Top Genres: Classics, Fiction, Young Adult, Graphic novels, Spanish, Man-woman relationships, Literary Fiction, Romance, General, Biography)\n\n>The Great Gatsby, F. Scott Fitzgerald’s third book, stands as the supreme achievement of his career. First published in 1925, this quintessential novel of the Jazz Age has been acclaimed by generations of readers.\n>\n>The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, of lavish parties on Long Island at a time when The New York Times noted “gin was the national drink and sex the national obsession,” it is an exquisitely crafted tale of America in the 1920s.\n\n^(This book has been suggested 1 time)\n\n[**The Great Gatsby**](https://hardcover.app/books/the-great-gatsby)\n\n^(By: F. Scott Fitzgerald | 180 pages | Published: 1920 | Top Genres: Classics, Fiction, Young Adult, Graphic novels, Spanish, Man-woman relationships, Literary Fiction, Romance, General, Biography)\n\n>The Great Gatsby, F. Scott Fitzgerald’s third book, stands as the supreme achievement of his career. First published in 1925, this quintessential novel of the Jazz Age has been acclaimed by generations of readers.\n>\n>The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan, of lavish parties on Long Island at a time when The New York Times noted “gin was the national drink and sex the national obsession,” it is an exquisitely crafted tale of America in the 1920s.\n\n^(This book has been suggested 1 time)\n\n***\n\n^(1 book suggested | )[^(Source)](https://github.com/xtina/unofficial-hardcover-reddit-bot)'
      );
    });
    it('should print 2 short desc books if the comment requests 2 books', async () => {
      const comment =
        'You might like h{The Great Gatsby by F. Scott Fitzgerald} and h{The Great Gatsby by F. Scott Fitzgerald}';
      const result = await commentGenerator.processText(comment, 'books');
      expect(result).toEqual(
        '[**The Great Gatsby**](https://hardcover.app/books/the-great-gatsby)\n\n^(By: F. Scott Fitzgerald | 180 pages | Published: 1920 | Top Genres: Classics, Fiction, Young Adult, Graphic novels, Spanish, Man-woman relationships, Literary Fiction, Romance, General, Biography)\n\n^(This book has been suggested 1 time)\n\n[**The Great Gatsby**](https://hardcover.app/books/the-great-gatsby)\n\n^(By: F. Scott Fitzgerald | 180 pages | Published: 1920 | Top Genres: Classics, Fiction, Young Adult, Graphic novels, Spanish, Man-woman relationships, Literary Fiction, Romance, General, Biography)\n\n^(This book has been suggested 1 time)\n\n***\n\n^(1 book suggested | )[^(Source)](https://github.com/xtina/unofficial-hardcover-reddit-bot)'
      );
    });
  });

  describe('generate comment for lite formatter', () => {
    it('should print short desc for a comment', async () => {
      const comment = 'You might like h{The Great Gatsby by F. Scott Fitzgerald}';
      const result = await commentGenerator.processText(comment, 'test');
      console.log(result);
      expect(result).toEqual(
        '[**The Great Gatsby**](https://hardcover.app/books/the-great-gatsby)\n\n^(By: F. Scott Fitzgerald | Published: 1920)\n\n***\n\n^(1 book suggested | )[^(Source)](https://github.com/xtina/unofficial-hardcover-reddit-bot)'
      );
    });
    it('should print short desc even if the comment requests a long version', async () => {
      const comment = 'You might like h{{The Great Gatsby by F. Scott Fitzgerald}}';
      const result = await commentGenerator.processText(comment, 'test');
      console.log(result);
      expect(result).toEqual(
        '[**The Great Gatsby**](https://hardcover.app/books/the-great-gatsby)\n\n^(By: F. Scott Fitzgerald | Published: 1920)\n\n***\n\n^(1 book suggested | )[^(Source)](https://github.com/xtina/unofficial-hardcover-reddit-bot)'
      );
    });
  });

  it('ignores comments that dont have the right regex', async () => {
    const comment = 'random comment';
    const result = await commentGenerator.processText(comment, 'books');
    expect(result).toBeUndefined();
  });
});
