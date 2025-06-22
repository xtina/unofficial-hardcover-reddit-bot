import { Books, Contributions } from '../gql/generated/graphql';
import { BookFormatter } from './BookFormatter';

export class LiteFormatter extends BookFormatter {
  protected title: string | null | undefined;
  protected slug: string | null | undefined;
  protected releaseYear: number | string | null | undefined;
  protected authors: Contributions[];

  constructor(bookInfo: Books) {
    super(bookInfo);

    const { title, slug, release_year, contributions } = this.bookInfo;
    this.title = title;
    this.slug = slug;
    this.releaseYear = release_year ?? '?';
    this.authors = contributions ?? [];
  }

  override formatHeader(): string {
    return `^(By: ${this.authors.map((c) => c.author?.name).join(', ')} | Published: ${this.releaseYear || '?'})`;
  }

  override formatBookFooter(): string {
    return '';
  }

  override supportsLongVersion(): boolean {
    return false;
  }

  override formatDescription(): string {
    return '';
  }
}
