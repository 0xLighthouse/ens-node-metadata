import { checkBondCompatibility, type CompatibilityCheck } from '../bond-compatibility'
import { Bond } from '@harbor/shared'
import { HarborMarket } from '@/app/components/harbor/types'

// Mock data factory functions
const createMockBond = (overrides: Partial<Bond> = {}): Bond => ({
  __typename: 'Bond',
  id: 'bond-123',
  harborKey: 'harbor-456',
  chainId: 1,
  issuer: {
    __typename: 'Issuer',
    title: 'Test Issuer',
    issuerAddress: '0x1234567890123456789012345678901234567890',
    adapterAddress: '0x9876543210987654321098765432109876543210',
  },
  referenceData: {
    __typename: 'ReferenceData',
    faceValue: BigInt('1000000000000000000'), // 1 ETH
    claimedAmount: BigInt('0'),
    startDate: BigInt(Math.floor(Date.now() / 1000) - 86400), // 1 day ago
    maturityDate: BigInt(Math.floor(Date.now() / 1000) + 86400 * 30), // 30 days from now
    owner: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    underlying: {
      __typename: 'ERC20',
      name: 'Wrapped Ethereum',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
      symbol: 'WETH',
    },
  },
  ...overrides,
})

const createMockMarket = (overrides: Partial<HarborMarket> = {}): HarborMarket => ({
  harborKey: 'harbor-456',
  underlyingToken: {
    name: 'Wrapped Ethereum',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    logo: 'https://example.com/weth.png',
  },
  escrowToken: '0xescrow123',
  maxAgeFormatted: '90 days',
  acceptedIssuers: [
    {
      title: 'Test Issuer',
      issuerAddress: '0x1234567890123456789012345678901234567890',
      adapterAddress: '0x9876543210987654321098765432109876543210',
    },
  ],
  liquidity: 1000000,
  volume: 500000,
  bondsInEscrow: 10,
  averageTimeToMaturity: 45,
  ...overrides,
})

describe('checkBondCompatibility', () => {
  beforeEach(() => {
    // Mock Date.now to return a consistent timestamp for tests
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000) // 2022-01-01 00:00:00 UTC
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return error when market is undefined', () => {
    const bond = createMockBond()
    const result = checkBondCompatibility(undefined, bond)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: 'Market Data',
      isPassing: false,
      description: 'Market or bond data is missing',
    })
  })

  it('should return error when bond is undefined', () => {
    const market = createMockMarket()
    const result = checkBondCompatibility(market, undefined)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      name: 'Market Data',
      isPassing: false,
      description: 'Market or bond data is missing',
    })
  })

  it('should pass all checks for a compatible bond', () => {
    const bond = createMockBond()
    const market = createMockMarket()
    const result = checkBondCompatibility(market, bond)

    expect(result).toHaveLength(4)
    expect(result.every((check) => check.isPassing)).toBe(true)

    expect(result[0].name).toBe('Correct Asset Type')
    expect(result[1].name).toBe('Bond Still Active')
    expect(result[2].name).toBe('Accepted Issuer')
    expect(result[3].name).toBe('Duration Limit')
  })

  describe('Correct Asset Type', () => {
    it('should pass when bond and market have same underlying token', () => {
      const bond = createMockBond()
      const market = createMockMarket()
      const result = checkBondCompatibility(market, bond)

      const assetCheck = result.find((check) => check.name === 'Correct Asset Type')
      expect(assetCheck?.isPassing).toBe(true)
      expect(assetCheck?.description).toContain(
        'Your WETH bond is compatible with this WETH harbor',
      )
    })

    it('should fail when bond and market have different underlying tokens', () => {
      const bond = createMockBond({
        referenceData: {
          ...createMockBond().referenceData,
          underlying: {
            __typename: 'ERC20',
            name: 'USD Coin',
            address: '0xA0b86a33E6441479CbC6C6d2Cc0e3040E3d4b7F4',
            decimals: 6,
            symbol: 'USDC',
          },
        },
      })
      const market = createMockMarket() // Uses WETH
      const result = checkBondCompatibility(market, bond)

      const assetCheck = result.find((check) => check.name === 'Correct Asset Type')
      expect(assetCheck?.isPassing).toBe(false)
      expect(assetCheck?.description).toContain(
        'This harbor only accepts WETH bonds, but your bond is USDC',
      )
    })

    it('should handle case-insensitive address comparison', () => {
      const bond = createMockBond({
        referenceData: {
          ...createMockBond().referenceData,
          underlying: {
            ...createMockBond().referenceData.underlying,
            address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // lowercase
          },
        },
      })
      const market = createMockMarket({
        underlyingToken: {
          ...createMockMarket().underlyingToken,
          address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // mixed case
        },
      })
      const result = checkBondCompatibility(market, bond)

      const assetCheck = result.find((check) => check.name === 'Correct Asset Type')
      expect(assetCheck?.isPassing).toBe(true)
    })
  })

  describe('Bond Still Active', () => {
    it('should pass when bond has not matured', () => {
      const futureMaturity = Math.floor(Date.now() / 1000) + 86400 * 30 // 30 days from now
      const bond = createMockBond({
        referenceData: {
          ...createMockBond().referenceData,
          maturityDate: BigInt(futureMaturity),
        },
      })
      const market = createMockMarket()
      const result = checkBondCompatibility(market, bond)

      const maturityCheck = result.find((check) => check.name === 'Bond Still Active')
      expect(maturityCheck?.isPassing).toBe(true)
      expect(maturityCheck?.description).toBe('Your bond is still active and eligible for sale')
    })

    it('should fail when bond has matured', () => {
      const pastMaturity = Math.floor(Date.now() / 1000) - 86400 // 1 day ago
      const bond = createMockBond({
        referenceData: {
          ...createMockBond().referenceData,
          maturityDate: BigInt(pastMaturity),
        },
      })
      const market = createMockMarket()
      const result = checkBondCompatibility(market, bond)

      const maturityCheck = result.find((check) => check.name === 'Bond Still Active')
      expect(maturityCheck?.isPassing).toBe(false)
      expect(maturityCheck?.description).toBe(
        'Your bond has already matured and can no longer be traded',
      )
    })

    it('should fail when bond matures exactly now', () => {
      const currentTime = Math.floor(Date.now() / 1000)
      const bond = createMockBond({
        referenceData: {
          ...createMockBond().referenceData,
          maturityDate: BigInt(currentTime),
        },
      })
      const market = createMockMarket()
      const result = checkBondCompatibility(market, bond)

      const maturityCheck = result.find((check) => check.name === 'Bond Still Active')
      expect(maturityCheck?.isPassing).toBe(false)
    })
  })

  describe('Accepted Issuer', () => {
    it('should pass when issuer is in accepted list', () => {
      const bond = createMockBond()
      const market = createMockMarket()
      const result = checkBondCompatibility(market, bond)

      const issuerCheck = result.find((check) => check.name === 'Accepted Issuer')
      expect(issuerCheck?.isPassing).toBe(true)
      expect(issuerCheck?.description).toContain('Test Issuer is accepted by this harbor')
    })

    it('should fail when issuer is not in accepted list', () => {
      const bond = createMockBond({
        issuer: {
          ...createMockBond().issuer,
          title: 'Unauthorized Issuer',
          issuerAddress: '0xunauthorized1234567890123456789012345678',
        },
      })
      const market = createMockMarket()
      const result = checkBondCompatibility(market, bond)

      const issuerCheck = result.find((check) => check.name === 'Accepted Issuer')
      expect(issuerCheck?.isPassing).toBe(false)
      expect(issuerCheck?.description).toContain(
        "This harbor doesn't currently support bonds from Unauthorized Issuer",
      )
    })

    it('should handle case-insensitive issuer address comparison', () => {
      const bond = createMockBond({
        issuer: {
          ...createMockBond().issuer,
          issuerAddress: '0x1234567890123456789012345678901234567890', // lowercase
        },
      })
      const market = createMockMarket({
        acceptedIssuers: [
          {
            title: 'Test Issuer',
            issuerAddress: '0x1234567890123456789012345678901234567890', // uppercase
            adapterAddress: '0x9876543210987654321098765432109876543210',
          },
        ],
      })
      const result = checkBondCompatibility(market, bond)

      const issuerCheck = result.find((check) => check.name === 'Accepted Issuer')
      expect(issuerCheck?.isPassing).toBe(true)
    })
  })

  describe('Duration Limit', () => {
    it('should pass when bond duration is within limit', () => {
      const startTime = Math.floor(Date.now() / 1000) - 86400 * 30 // 30 days ago
      const maturityTime = Math.floor(Date.now() / 1000) + 86400 * 60 // 60 days from now
      // Total duration: 90 days, which matches the market limit

      const bond = createMockBond({
        referenceData: {
          ...createMockBond().referenceData,
          startDate: BigInt(startTime),
          maturityDate: BigInt(maturityTime),
        },
      })
      const market = createMockMarket({ maxAgeFormatted: '90 days' })
      const result = checkBondCompatibility(market, bond)

      const durationCheck = result.find((check) => check.name === 'Duration Limit')
      expect(durationCheck?.isPassing).toBe(true)
      expect(durationCheck?.description).toContain(
        "Bond duration is within harbor's maximum limit (90 days)",
      )
    })

    it('should fail when bond duration exceeds limit', () => {
      const startTime = Math.floor(Date.now() / 1000) - 86400 * 60 // 60 days ago
      const maturityTime = Math.floor(Date.now() / 1000) + 86400 * 60 // 60 days from now
      // Total duration: 120 days, which exceeds the 90-day limit

      const bond = createMockBond({
        referenceData: {
          ...createMockBond().referenceData,
          startDate: BigInt(startTime),
          maturityDate: BigInt(maturityTime),
        },
      })
      const market = createMockMarket({ maxAgeFormatted: '90 days' })
      const result = checkBondCompatibility(market, bond)

      const durationCheck = result.find((check) => check.name === 'Duration Limit')
      expect(durationCheck?.isPassing).toBe(false)
      expect(durationCheck?.description).toContain(
        "Bond duration exceeds harbor's maximum limit (90 days)",
      )
    })

    it('should handle different duration formats', () => {
      const bond = createMockBond()
      const market = createMockMarket({ maxAgeFormatted: '30 days' })
      const result = checkBondCompatibility(market, bond)

      const durationCheck = result.find((check) => check.name === 'Duration Limit')
      expect(durationCheck?.description).toContain('30 days')
    })
  })

  it('should return all four checks in correct order', () => {
    const bond = createMockBond()
    const market = createMockMarket()
    const result = checkBondCompatibility(market, bond)

    expect(result).toHaveLength(4)
    expect(result[0].name).toBe('Asset Type Match')
    expect(result[1].name).toBe('Bond Maturity')
    expect(result[2].name).toBe('Accepted Issuer')
    expect(result[3].name).toBe('Duration Limit')
  })

  it('should handle mixed compatibility results', () => {
    // Create a bond that fails some checks but passes others
    const bond = createMockBond({
      referenceData: {
        ...createMockBond().referenceData,
        underlying: {
          __typename: 'ERC20',
          name: 'USD Coin',
          address: '0xA0b86a33E6441479CbC6C6d2Cc0e3040E3d4b7F4', // Different from market
          decimals: 6,
          symbol: 'USDC',
        },
        maturityDate: BigInt(Math.floor(Date.now() / 1000) - 86400), // Already matured
      },
    })
    const market = createMockMarket()
    const result = checkBondCompatibility(market, bond)

    expect(result).toHaveLength(4)
    expect(result[0].isPassing).toBe(false) // Asset Type Match - fails
    expect(result[1].isPassing).toBe(false) // Bond Maturity - fails
    expect(result[2].isPassing).toBe(true) // Accepted Issuer - passes
    expect(result[3].isPassing).toBe(true) // Duration Limit - passes
  })
})
