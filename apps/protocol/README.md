# Bond Hook

A Uniswap v4 hook for creating bond markets.

## Features

- LPs can provide single-sided liquidity to a bond market
- Bonds can be sold into the pool
- Bonds can be purchased from the pool
- LPs can claim their profits

## Project Structure

- `src/Escrow.sol` - A standalone contract which issues ERC20 tokens backed by collateral at a 1:1 ratio
- `src/EscrowWithHooks.sol` - An extended version of the Escrow with Uniswap v4 hook functions added, and logic for rebalancing a Uniswap pool after swap
- `src/BondMarket.sol` - A standalone contract which has permission to deposit and withdraw NFTs from the escrow, which handles pricing, NFT buy/sell logic, and generates profit 
- `src/HarborDeployer.sol` - On-chian deployment logic for creating an EscrowWithHooks contract, a BondMarket contract, and a corresponding Uniswap Pool
- `src/Registry.sol` - Parent contract which stores settings and does factory deployment of Harbors as a HarborDeployer

- `src/interfaces/` - Contains interface definitions
  - `IEscrow.sol` - Interface for Escrow contract
  - `IEscrowHooks.sol` - Interface for the additional functions added by EscrowWithHooks.sol
  - `IBondMarket.sol` - Interface for BondMarket contract
  - `IHarborDeployer.sol` - Interface for HardborDeployer.sol
  
  - `IBondIssuer.sol` - Interface for bond issuing contracts
  - `IBondPricing.sol` - Interface for bond pricing strategies

- `src/pricing/` - Contains bond pricing implementations
  - `ExampleLinearPricing.sol` - Linear pricing model for bonds

## Development

### Build

```shell
forge build
```

### Test

```shell
forge test
```

### Format

```shell
forge fmt
```

## Documentation

For more information on Foundry:
<https://book.getfoundry.sh/>
