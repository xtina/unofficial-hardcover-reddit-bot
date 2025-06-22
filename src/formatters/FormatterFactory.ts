import { DefaultFormatter } from './DefaultFormatter';
import { Books } from '../gql/generated/graphql';
import { LiteFormatter } from './LiteFormatter';

export class FormatterFactory {
  static forSubreddit(
    subredditName: string | undefined,
    bookInfo: Books,
    bookSuggestions: number
  ): DefaultFormatter | LiteFormatter {
    switch (subredditName?.toLowerCase()) {
      case 'romancebooks':
      case 'test':
        return new LiteFormatter(bookInfo);
      default:
        return new DefaultFormatter(bookInfo, bookSuggestions);
    }
  }
}
