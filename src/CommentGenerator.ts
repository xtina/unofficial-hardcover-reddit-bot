import { RedisClient } from '@devvit/public-api';
import { GraphQLClient } from 'graphql-request';
import { BookFormatter } from './formatters/BookFormatter';
import { FormatterFactory } from './formatters/FormatterFactory';
import {
  FuzzySearchBookByTitleDocument,
  FuzzySearchBookByTitleQuery,
} from './gql/generated/graphql';
import { ExtendedBook } from './types';

export async function processUserComment(
  comment: string,
  hardcoverApiClient: GraphQLClient,
  subredditName: string | undefined,
  redisClient: RedisClient
): Promise<string | undefined> {
  const matches = comment.match(/h\{\{([^}]+)\}\}|h\{([^}]+)\}/g);
  if (!matches) {
    return undefined;
  }
  let commentContent = '';

  for (const match of matches) {
    const [, longFormat, shortFormat] = match.match(/h\{\{([^}]+)\}\}|h\{([^}]+)\}/) || [];
    const content = longFormat || shortFormat;
    if (!content) {
      continue;
    }
    const { title, author } = extractTitleAndAuthor(content);

    const book = await getBookData(title, author, hardcoverApiClient);
    if (book) {
      let bookSuggested = 1;
      let totalBooksSuggested = 1;
      try {
        bookSuggested = await redisClient.incrBy(`book_suggested:${book.id}`, 1);
        totalBooksSuggested = await redisClient.incrBy(`total_books_suggested`, 1);
      } catch (error) {
        console.error('Failed to update book suggestion counts:', error);
        bookSuggested = (await redisClient.get(`book_suggested:${book.id}`)) as unknown as number;
        totalBooksSuggested = (await redisClient.get(`total_books_suggested`)) as unknown as number;
      }

      commentContent = commentContent?.concat(
        generateResponse(book, bookSuggested, subredditName, !!longFormat)
      );
    }
  }

  if (commentContent) {
    commentContent += '***' + BookFormatter.prototype.getSectionSeparator();
    commentContent += generateFooter(
      ((await redisClient.get('total_books_suggested')) as unknown as number) ?? 1
    );
  }
  return commentContent;
}

function extractTitleAndAuthor(match: string): {
  title: string;
  author: string;
} {
  const parts = match.split(' by ');

  const title = parts[0]?.trim() || '';
  const author = parts[1]?.trim() || '';

  return { title, author };
}

async function getBookData(
  title: string,
  author: string,
  hardcoverApiClient: GraphQLClient
): Promise<ExtendedBook | undefined> {
  const query = `${title} ${author}`.trim();
  const response = await hardcoverApiClient.request<FuzzySearchBookByTitleQuery>(
    FuzzySearchBookByTitleDocument,
    { title: query }
  );
  return response.search?.results?.hits[0]?.document as ExtendedBook;
}

function generateResponse(
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

function generateFooter(totalSuggestions: number): string {
  const s = totalSuggestions != 1 ? 's' : '';
  return `^(${totalSuggestions} book${s} suggested | )[^(Source)](https://github.com/rodohanna/reddit-goodreads-bot)`;
}
