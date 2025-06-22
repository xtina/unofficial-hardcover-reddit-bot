import type { Books } from './gql/generated/graphql';

// Extend the Books type with custom fields
export interface ExtendedBook extends Books {
  genres?: string[];
}
