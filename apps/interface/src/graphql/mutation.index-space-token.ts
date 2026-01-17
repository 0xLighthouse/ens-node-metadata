import { gql } from 'graphql-request'

export const INDEX_SPACE_TOKEN = gql`
  mutation IndexSpaceToken($contractId: String!, $spaceId: String!) {
    indexSpaceToken(contractId: $contractId, spaceId: $spaceId)
  }
`
