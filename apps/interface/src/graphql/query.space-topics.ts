import { gql } from 'graphql-request'

export const QUERY_SPACE_TOPICS = gql`
  query SpaceTopics($spaceId: String!) {
    space(spaceId: $spaceId) {
      title
      ens
      topics {
        topicId
        vendor
        type
        isEnabled
        integration {
					options {
						key
						value
					}
				}
        # options {
        #   name
        #   type
        # }
      }
    }
  }
`
