import { gql } from 'graphql-request'

export const QUERY_SPACE_HOMEPAGE = gql`
  query SpaceHomepage($ens: String!) {
    space(ens: $ens) {
      title
      ens
      avatar
      twitter
      website
    }
  }
`
