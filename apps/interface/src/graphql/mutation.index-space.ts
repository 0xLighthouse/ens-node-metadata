import { gql } from 'graphql-request'

export const INDEX_SPACE = gql`
  mutation indexSpace($input: IndexSpaceInput!) {
    indexSpace(input: $input) {
      title
      indexedAddresses
      totalAddresses
    }
  }
`
