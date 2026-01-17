import { gql } from 'graphql-request'

export const ADD_INTEGRATION = gql`
  mutation AddIntegration($input: AddIntegrationInput!) {
    addIntegration(input: $input) {
      spaceIntegrationId
    }
  }
`
