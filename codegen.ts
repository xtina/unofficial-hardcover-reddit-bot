import type { CodegenConfig } from '@graphql-codegen/cli';
import * as dotenv from 'dotenv';

dotenv.config();

const config: CodegenConfig = {
  overwrite: true,
  schema: {
    [process.env.HARDCOVER_API_URL as string]: {
      headers: {
        Authorization: `Bearer ${process.env.HARDCOVER_KEY}`,
      },
    },
  },
  generates: {
    './src/gql/generated/hardcover.graphql': {
      plugins: ['schema-ast'],
      overwrite: true,
    },
    './src/gql/generated/': {
      preset: 'client',
      documents: ['./src/gql/generated/*.graphql', './src/gql/queries/*.graphql'],
      overwrite: true,
      config: {
        immutableTypes: true,
        skipTypename: true,
        dedupeFragments: true,
        exportFragmentSpreadSubTypes: true,
        namingConvention: {
          typeNames: 'change-case-all#pascalCase',
          enumValues: 'change-case-all#upperCase',
        },
      },
    },
  },
};

export default config;
