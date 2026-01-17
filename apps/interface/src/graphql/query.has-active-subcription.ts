import { gql } from 'graphql-request'

export const HAS_ACTIVE_SUBSCRIPTION = gql`
  query HasActiveSub {
    hasActiveSubscription
  }
`
