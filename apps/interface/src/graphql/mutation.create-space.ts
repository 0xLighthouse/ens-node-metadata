import { gql } from 'graphql-request'

export const MUTATION_CREATE_SPACE = gql`
  mutation createSpace($input: CreateSpaceInput!) {
    createSpace(input: $input) {
      spaceId
      ens
      title
      tokens {
        contract {
          address
          chainId
        }
      }
    }
  }
`
