import { ExtendedBook } from '../types';

export abstract class BookFormatter {
  protected bookInfo: ExtendedBook;

  constructor(bookInfo: ExtendedBook) {
    this.bookInfo = bookInfo;
  }

  formatLink(): string {
    const { title, slug } = this.bookInfo;
    const url = `https://hardcover.app/books/${slug}`;
    return `[**${title}**](${url})`;
  }

  formatHeader(): string {
    const { release_year, contributions } = this.bookInfo;
    return (
      this.getSectionSeparator() +
      `^(By: ${contributions.map((c) => c.author?.name).join(', ')} | Published: ${release_year || '?'})`
    );
  }

  formatBookFooter(): string {
    return '';
  }

  supportsLongVersion(): boolean {
    return false;
  }

  getSectionSeparator(): string {
    return '\n\n';
  }

  formatDescription(): string {
    return '';
  }
}
