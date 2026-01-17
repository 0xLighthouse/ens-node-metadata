import { gql } from 'graphql-request'

export const QUERY_SIGN_IN_MESSAGE = gql`
  query GetSignInMessage($input: SignInMessageInput!) {
    signInMessage(input: $input) {
      domain
      types
      value
    }
  }
`
