import { RedisClient } from '@devvit/public-api';
import { GraphQLClient } from 'graphql-request';
import { BookFormatter } from './formatters/BookFormatter';
import { FormatterFactory } from './formatters/FormatterFactory';
import {
  FuzzySearchBookByTitleDocument,
  FuzzySearchBookByTitleQuery,
} from './gql/generated/graphql';
import { ExtendedBook } from './types';
import { BookCache } from './BookCache';

export class CommentGenerator {
  private hardcoverApiClient: GraphQLClient;
  private bookCache: BookCache;

  constructor(hardcoverApiClient: GraphQLClient, redisClient: RedisClient) {
    this.hardcoverApiClient = hardcoverApiClient;
    this.bookCache = new BookCache(redisClient);
  }

  public async processText(
    comment: string,
    subredditName: string | undefined
  ): Promise<string | undefined> {
    const matches = comment.match(/h\{\{([^}]+)\}\}|h\{([^}]+)\}/g);
    if (!matches) {
      return undefined;
    }
    let commentContent = '';
    let totalBooksSuggested;

    for (const match of matches) {
      const [, longFormat, shortFormat] = match.match(/h\{\{([^}]+)\}\}|h\{([^}]+)\}/) || [];
      const content = longFormat || shortFormat;
      if (!content) {
        continue;
      }
      const { title, author } = this.extractTitleAndAuthor(content);

      const book = await this.getBookData(title, author);
      if (book) {
        let bookSuggested: number;
        try {
          bookSuggested = await this.bookCache.incrBookSuggested(book.id);
          totalBooksSuggested = await this.bookCache.incrTotalBooksSuggested();
        } catch (error) {
          console.error('Failed to update book suggestion counts:', error);
          bookSuggested = await this.bookCache.getTimesBookSuggested(book.id);
          totalBooksSuggested = await this.bookCache.getTotalBooksSuggested();
        }

        commentContent = commentContent?.concat(
          this.generateResponse(book, bookSuggested, subredditName, !!longFormat)
        );
      }
    }

    if (commentContent) {
      totalBooksSuggested = totalBooksSuggested ?? 1;
      commentContent += '***' + BookFormatter.prototype.getSectionSeparator();
      commentContent += this.generateFooter(totalBooksSuggested);
    }
    return commentContent;
  }

  private extractTitleAndAuthor(match: string): {
    title: string;
    author: string;
  } {
    const parts = match.split(' by ');
    const title = parts[0]?.trim() || '';
    const author = parts[1]?.trim() || '';
    return { title, author };
  }

  private async getBookData(title: string, author: string): Promise<ExtendedBook | undefined> {
    const query = `${title} ${author}`.trim();
    // is it in the cache?
    const cachedBook = await this.bookCache.getBook(query);
    if (cachedBook) {
      return cachedBook;
    }
    const response = await this.hardcoverApiClient.request<FuzzySearchBookByTitleQuery>(
      FuzzySearchBookByTitleDocument,
      { title: query }
    );
    // don't wait for this to complete
    this.bookCache.cacheBook(query, response.search?.results?.hits[0]?.document as ExtendedBook);
    return response.search?.results?.hits[0]?.document as ExtendedBook;
  }

  private generateResponse(
    book: ExtendedBook,
    bookSuggestions: number,
    subredditName: string | undefined,
    includeDescription: boolean = false
  ): string {
    const formatter = FormatterFactory.forSubreddit(subredditName, book, bookSuggestions);
    const separator = formatter.getSectionSeparator();

    const parts = [formatter.formatLink(), formatter.formatHeader()];

    if (includeDescription && formatter.supportsLongVersion() && book.description) {
      parts.push(formatter.formatDescription());
    }

    parts.push(formatter.formatBookFooter());

    const nonEmptyParts = parts.filter((part) => part && part.trim() !== '');
    return nonEmptyParts.join(separator) + separator;
  }

  private generateFooter(totalSuggestions: number): string {
    const s = totalSuggestions != 1 ? 's' : '';
    return `^(${totalSuggestions} book${s} suggested | )[^(Source)](https://github.com/xtina/unofficial-hardcover-reddit-bot)`;
  }
}
