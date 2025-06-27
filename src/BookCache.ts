import { RedisClient } from '@devvit/public-api';
import { ExtendedBook } from './types';

export class BookCache {
  private redisClient: RedisClient;
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  async getBook(query: string): Promise<ExtendedBook | undefined> {
    const cachedBook = await this.redisClient.get(`book:${query}`);
    if (cachedBook) {
      return JSON.parse(cachedBook as string) as ExtendedBook;
    }
    return undefined;
  }

  async cacheBook(query: string, book: ExtendedBook | undefined): Promise<void> {
    await this.redisClient.set(`book:${query}`, JSON.stringify(book));
  }

  async incrBookSuggested(bookId: number): Promise<number> {
    return this.redisClient.incrBy(`book_suggested:${bookId}`, 1);
  }

  /**
   * Get the number of times a book has been suggested
   * @param bookId - The ID of the book
   * @returns The number of times the book has been suggested
   */
  async getTimesBookSuggested(bookId: number): Promise<number> {
    return (await this.redisClient.get(`book_suggested:${bookId}`)) as unknown as number ?? 1;
  }

  async incrTotalBooksSuggested(): Promise<number> {
    return this.redisClient.incrBy(`total_books_suggested`, 1);
  }

  async getTotalBooksSuggested(): Promise<number> {
    return (await this.redisClient.get(`total_books_suggested`)) as unknown as number ?? 1;
  }
}
