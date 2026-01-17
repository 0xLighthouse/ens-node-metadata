import { gql } from 'graphql-request'

export const ASSERT_CONTRACT_EXISTS = gql`
  query QueryAssertContractExists($input: AssertContractExistsInput!) {
    assertContractExists(input: $input)
  }
`
