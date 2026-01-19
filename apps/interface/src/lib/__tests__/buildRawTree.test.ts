import { describe, expect, it } from '@jest/globals'
import { buildRawTree } from '../tree/buildRawTree'

const ENS_SUBGRAPH_URL = 'https://api.alpha.ensnode.io/subgraph'
const TEST_TIMEOUT_MS = 30000 // 30 seconds


describe('buildRawTree integration', () => {
  it('fetches a real domain tree from the ENS subgraph ', async () => {

    const tree = await buildRawTree('ens.eth', {
      endpoint: ENS_SUBGRAPH_URL,
      pageSize: 500,
      maxConcurrency: 5,
    })

    console.log(JSON.stringify(tree, null, 2))

    // Assertions
    expect(tree.children?.length ?? 0).toBeGreaterThan(0)
  },
    TEST_TIMEOUT_MS,
  )


})
