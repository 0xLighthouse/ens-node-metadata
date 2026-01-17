import { gql } from 'graphql-request'

export const QUERY_SPACE_AUDIENCE = gql`
  query QuerySpaceAudience($spaceId: String!, $options: PaginationOptions) {
    space(spaceId: $spaceId) {
      spaceId
      ens
      audienceCount
      totalSubscribers
      audience(options: $options) {
        hasNextPage
        # cursor
        items {
          ... on Audience {
            holderAddress
            status
            count
            isFollowing
            hasNotificationsEnabled
            firstIndexedAt
            campaignsSent
            firstCampaignSentAt
            lastCampaignSentAt
            firstOpenedAt
            lastOpenedAt
            account {
              accountId
              address
            }
          }
        }
      }
    }
  }
`
