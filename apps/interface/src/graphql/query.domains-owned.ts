import { gql } from 'graphql-request'

export const QUERY_DOMAINS_OWNED = gql`
  query QueryDomainsOwned($address: String!) {
    domains(where: {or: [
        { owner: $address },
        { wrappedOwnerId: $address }
      ]}) {
      __typename
      id
      name
      labelName
      labelhash
      parentId
      subdomainCount
      resolvedAddressId
      resolverId
      ttl
      isMigrated
      createdAt
      ownerId
      registrantId
      wrappedOwnerId
      expiryDate
      resolvedAddress {
        __typename
        id
      }
      owner {
        id
      }
    }
  }
`
