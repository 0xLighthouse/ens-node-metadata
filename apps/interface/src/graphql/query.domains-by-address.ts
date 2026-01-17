import { gql } from 'graphql-request'

export const QUERY_DOMAINS_BY_ADDRESS = gql`
  query QueryDomainsByAddress($address: String!) {
    domains(where: {owner: $address}) {
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
