import { ExtendedBook } from '../types';
import { BookFormatter } from './BookFormatter';
import type { Contributions } from '../gql/generated/graphql';
import { LiteFormatter } from './LiteFormatter';

export class DefaultFormatter extends LiteFormatter {
  private bookSuggestions: number;
  private pages: number | null | undefined;
  private genres: string[];
  private description: string | null | undefined;

  constructor(bookInfo: ExtendedBook, bookSuggestions: number) {
    super(bookInfo);
    this.bookSuggestions = bookSuggestions ?? 1;

    // Destructure commonly used properties into private fields
    const { pages, genres, contributions, description } = this.bookInfo;
    this.pages = pages;
    this.genres = genres ?? [];
    this.description = description;
  }

  override formatHeader(): string {
    return `^(By: ${this.authors.map((c) => c.author?.name).join(', ')} | ${this.pages || '?'} pages | Published: ${this.releaseYear || '?'}${(this.genres?.length ?? 0 > 0) ? ` | Top Genres: ${this.genres.join(', ')}` : ''})`;
  }

  override formatDescription(): string {
    if (!this.description) {
      return '';
    }
    const cleanDescription = this.description.replace(/<.*?>/g, '').replace(/<br \/>/g, '\n');
    return cleanDescription
      .split('\n')
      .map((chunk) => `>${chunk}`)
      .join('\n');
  }

  override formatBookFooter(): string {
    const s = this.bookSuggestions > 1 ? 's' : '';
    return `^(This book has been suggested ${this.bookSuggestions} time${s})`;
  }

  override supportsLongVersion(): boolean {
    return true;
  }
}
