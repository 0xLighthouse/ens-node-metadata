import { gql } from 'graphql-request'

export const MUTATION_CONNECT = gql`
  mutation connect($input: ConnectAccountInput!) {
    connect(input: $input) {
      token
    }
  }
`
