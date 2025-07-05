import { ExtendedBook } from '../types';
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
    const { pages, genres, description } = this.bookInfo;
    this.pages = pages;
    // escape () and [] in genres
    this.genres = genres?.slice(0, 5)?.map((genre) => genre.replace(/([()[\]])/g, '\\$1')) ?? [];
    this.description = description;
  }

  override formatHeader(): string {
    return `^(By: ${this.authors.map((c) => c.author?.name).join(', ')} | ${this.pages || '?'} pages | Published: ${this.releaseYear || '?'}${(this.genres?.length ?? 0 > 0) ? ` | Top Genres: ${this.genres.join(', ')}` : ''})`;
  }

  override formatDescription(): string {
    if (!this.description) {
      return '';
    }
    // Remove HTML tags, replace <br /> with newlines, and escape () and []
    const cleanDescription = this.description
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<.*?>/g, '')
      .replace(/([()[\]])/g, '\\$1');

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
