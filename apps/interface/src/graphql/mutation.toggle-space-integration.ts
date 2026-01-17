import { gql } from 'graphql-request'

export const TOGGLE_SPACE_INTEGRATION = gql`
  mutation ToggleIntegrationMutation($input: ToggleIntegrationInput!) {
    toggleIntegration(input: $input) {
      spaceIntegrationId
    }
  }
`
