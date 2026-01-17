import { gql } from 'graphql-request'

export const QUERY_PAGINATE_MY_SPACES = gql`
  query PaginateMySpaces($options: PaginationOptions) {
    submitted(options: $options) {
      hasNextPage
      items {
        ... on Project {
          spaceId
          title
          ens
          website
          twitter
          # github
          avatar
          isFollowing
          topics {
            topicId
          }
        }
      }
    }
  }
`
