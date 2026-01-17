import { gql } from 'graphql-request'

export const QUERY_ONBOARDING_SPACE = gql`
  query OnboardingSpace($spaceId: String!, $options: PaginationOptions) {
    listCampaigns(options: $options, spaceId: $spaceId) {
      items {
        ... on Campaign {
          campaignId
        }
      }
    }
    space(spaceId: $spaceId) {
      spaceId
      totalSubscribers
      tokens {
        contract {
          indexedAccountsCount
        }
      }
    }
  }
`
