import { gql } from 'graphql-request'

export const QUERY_DOMAIN_BY_NAME = gql`
  query QueryDomainByName($name: String!) {
    domains(where: { name: $name }) {
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
