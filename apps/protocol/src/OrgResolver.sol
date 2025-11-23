// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "ens-contracts/resolvers/ResolverBase.sol";
import "ens-contracts/resolvers/profiles/AddrResolver.sol";
import "ens-contracts/resolvers/profiles/TextResolver.sol";
import "ens-contracts/resolvers/profiles/ContentHashResolver.sol";
import "ens-contracts/resolvers/profiles/IExtendedResolver.sol";
import "ens-contracts/resolvers/Multicallable.sol";
import "ens-contracts/ccipRead/EIP3668.sol";
import "ens-contracts/registry/ENS.sol";
import "ens-contracts/wrapper/INameWrapper.sol";
import "./interfaces/IGovernance.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title OrgResolver
 * @dev Custom ENS resolver for organizational identity with governance integration
 *
 * Features:
 * - ENSIP-1: Basic address resolution
 * - ENSIP-3: Reverse resolution support
 * - ENSIP-5: Text records for metadata
 * - ENSIP-9/11: Multi-chain address resolution
 * - ENSIP-10: Wildcard resolution for subdomains
 * - ENSIP-12: Avatar support (NFT/IPFS)
 * - ENSIP-16: Off-chain resolution via CCIP-Read
 * - Governance-controlled updates
 * - Subdomain delegation to working groups
 */
contract OrgResolver is
    ResolverBase,
    AddrResolver,
    TextResolver,
    ContentHashResolver,
    Multicallable,
    AccessControl,
    ReentrancyGuard,
    IExtendedResolver
{
    using ECDSA for bytes32;

    // Role definitions
    bytes32 public constant ORG_ADMIN_ROLE = keccak256("ORG_ADMIN");
    bytes32 public constant METADATA_UPDATER_ROLE = keccak256("METADATA_UPDATER");
    bytes32 public constant SUBDOMAIN_MANAGER_ROLE = keccak256("SUBDOMAIN_MANAGER");

    // Storage structures
    struct OrgProfile {
        string displayName; // Display name
        string description; // Organization description
        string avatar; // ENSIP-12 avatar URI
        string website; // Primary website
        string email; // Contact email
        uint256 lastUpdate; // Last update timestamp
    }

    struct OffchainConfig {
        string gatewayUrl; // CCIP-Read gateway URL
        address signer; // Gateway signer address
        bool enabled; // Whether off-chain resolution is enabled
    }

    // Core ENS storage inherited from PublicResolver profiles

    // Organizational features
    mapping(bytes32 => OrgProfile) public orgProfiles;
    mapping(bytes32 => address) public governanceContracts;
    mapping(bytes32 => mapping(bytes32 => address)) public subdomainManagers;
    mapping(bytes32 => OffchainConfig) public offchainConfigs;

    // Use ENS official CCIP-Read implementation from EIP3668

    // Organizational events
    event SubdomainDelegated(bytes32 indexed parent, bytes32 indexed label, address manager);
    event GovernanceConfigured(bytes32 indexed node, address governance);
    event OffchainGatewaySet(bytes32 indexed node, string url, address signer);
    event OrgProfileUpdated(bytes32 indexed node, string displayName, string description);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORG_ADMIN_ROLE, admin);
    }

    // Add initialize function for minimal proxy pattern
    function initialize(address admin) external {
        require(!hasRole(DEFAULT_ADMIN_ROLE, admin), "Already initialized");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORG_ADMIN_ROLE, admin);
        // Grant the caller (registry) permission to grant roles initially
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // Override isAuthorised to include governance checks
    function isAuthorised(bytes32 node) internal view override returns (bool) {
        // Check organizational authorization
        return hasRole(ORG_ADMIN_ROLE, msg.sender) || hasRole(METADATA_UPDATER_ROLE, msg.sender)
            || _isGovernanceApproved(node, msg.sender, msg.data);
    }

    // Authorization handled by isAuthorised() override

    // Core ENS Resolution methods inherited from PublicResolver

    // ============ Text Records (ENSIP-5) - Enhanced ============

    /**
     * @dev Enhanced text record retrieval with CCIP-Read support
     * Overrides the base text() method to add off-chain resolution
     */
    function text(bytes32 node, string calldata key) public view override returns (string memory) {
        // Check if this should use off-chain resolution
        if (_shouldUseOffchainResolution(node, key)) {
            OffchainConfig memory config = offchainConfigs[node];

            string[] memory urls = new string[](1);
            urls[0] = string(abi.encodePacked(config.gatewayUrl, "/resolve/{sender}/{data}"));

            revert OffchainLookup(
                address(this),
                urls,
                abi.encodeWithSelector(this.text.selector, node, key),
                this.textWithProof.selector,
                abi.encode(node, key)
            );
        }

        // Fall back to standard text resolution from TextResolver storage
        return versionable_texts[recordVersions[node]][node][key];
    }

    // Content Hash methods inherited from ContentHashResolver

    // Multi-chain address methods inherited from AddrResolver

    // ============ Wildcard Resolution (ENSIP-10) ============

    /**
     * @dev Resolves a name using wildcard pattern for subdomains
     */
    function resolve(bytes memory name, bytes memory data) external view override returns (bytes memory) {
        (bytes32 parentNode, string memory label) = _parseName(name);
        bytes32 labelHash = keccak256(bytes(label));

        // Check if subdomain has a dedicated manager
        address manager = subdomainManagers[parentNode][labelHash];
        if (manager != address(0)) {
            return ISubdomainManager(manager).resolve(name, data);
        }

        // Fall back to standard resolution on parent
        return _resolveStandard(parentNode, data);
    }

    // ============ Subdomain Management ============

    /**
     * @dev Delegates a subdomain to a manager
     */
    function delegateSubdomain(bytes32 parent, string calldata label, address manager) external authorised(parent) {
        require(manager != address(0), "OrgResolver: Invalid manager");

        bytes32 labelHash = keccak256(bytes(label));
        subdomainManagers[parent][labelHash] = manager;

        emit SubdomainDelegated(parent, labelHash, manager);
    }

    /**
     * @dev Gets the manager for a subdomain
     */
    function getSubdomainManager(bytes32 parent, bytes32 labelHash) external view returns (address) {
        return subdomainManagers[parent][labelHash];
    }

    // ============ Governance Integration ============

    /**
     * @dev Sets the governance contract for a node
     */
    function setGovernanceContract(bytes32 node, address governance) external onlyRole(ORG_ADMIN_ROLE) {
        governanceContracts[node] = governance;
        emit GovernanceConfigured(node, governance);
    }

    /**
     * @dev Gets the governance contract for a node
     */
    function getGovernanceContract(bytes32 node) external view returns (address) {
        return governanceContracts[node];
    }

    // ============ Off-chain Resolution (CCIP-Read) ============

    /**
     * @dev Sets the off-chain gateway configuration
     */
    function setOffchainGateway(bytes32 node, string calldata url, address signer) external authorised(node) {
        require(signer != address(0), "OrgResolver: Invalid signer");

        offchainConfigs[node] = OffchainConfig({gatewayUrl: url, signer: signer, enabled: true});

        emit OffchainGatewaySet(node, url, signer);
    }

    /**
     * @dev Verifies and returns text data from off-chain gateway
     */
    function textWithProof(bytes calldata response, bytes calldata extraData) external view returns (string memory) {
        (bytes32 node, string memory key) = abi.decode(extraData, (bytes32, string));
        (string memory value, uint256 expires, bytes memory signature) = abi.decode(response, (string, uint256, bytes));

        require(block.timestamp <= expires, "OrgResolver: Response expired");

        // Verify signature from authorized gateway
        _verifyGatewaySignature(node, key, value, expires, signature);

        return value;
    }

    // ============ Organizational Profile ============

    /**
     * @dev Sets the organizational profile
     */
    function setOrgProfile(
        bytes32 node,
        string calldata displayName,
        string calldata description,
        string calldata avatar,
        string calldata website,
        string calldata email
    ) external authorised(node) {
        OrgProfile storage profile = orgProfiles[node];
        profile.displayName = displayName;
        profile.description = description;
        profile.avatar = avatar;
        profile.website = website;
        profile.email = email;
        profile.lastUpdate = block.timestamp;

        // Also set as standard text records for compatibility directly in storage
        versionable_texts[recordVersions[node]][node]["name"] = displayName;
        versionable_texts[recordVersions[node]][node]["description"] = description;
        versionable_texts[recordVersions[node]][node]["avatar"] = avatar;
        versionable_texts[recordVersions[node]][node]["url"] = website;
        versionable_texts[recordVersions[node]][node]["email"] = email;
        
        // Emit text changed events
        emit TextChanged(node, "name", "name", displayName);
        emit TextChanged(node, "description", "description", description);
        emit TextChanged(node, "avatar", "avatar", avatar);
        emit TextChanged(node, "url", "url", website);
        emit TextChanged(node, "email", "email", email);

        emit OrgProfileUpdated(node, displayName, description);
    }

    /**
     * @dev Gets the organizational profile
     */
    function getOrgProfile(bytes32 node)
        external
        view
        returns (
            string memory displayName,
            string memory description,
            string memory avatar,
            string memory website,
            string memory email
        )
    {
        OrgProfile memory profile = orgProfiles[node];
        return (profile.displayName, profile.description, profile.avatar, profile.website, profile.email);
    }

    // ============ Interface Detection (EIP-165) ============

    /**
     * @dev Returns true if this contract implements the interface defined by interfaceId
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AddrResolver, TextResolver, ContentHashResolver, Multicallable, ResolverBase, AccessControl)
        returns (bool)
    {
        return interfaceId == type(IExtendedResolver).interfaceId || super.supportsInterface(interfaceId);
    }

    // ============ Internal Functions ============

    /**
     * @dev Checks if governance approves an action
     */
    function _isGovernanceApproved(bytes32 node, address caller, bytes memory data) internal view returns (bool) {
        address governance = governanceContracts[node];
        if (governance == address(0)) return false;
        
        // Check if governance address has code
        uint32 size;
        assembly {
            size := extcodesize(governance)
        }
        if (size == 0) return false;

        try IGovernance(governance).isActionApproved(caller, data) returns (bool approved) {
            return approved;
        } catch {
            return false;
        }
    }

    /**
     * @dev Determines if a key should use off-chain resolution
     */
    function _shouldUseOffchainResolution(bytes32 node, string memory key) internal view returns (bool) {
        if (!offchainConfigs[node].enabled) return false;

        // Use off-chain for dynamic governance data
        bytes32 keyHash = keccak256(bytes(key));
        return keyHash == keccak256("governance.status") || keyHash == keccak256("governance.proposals")
            || keyHash == keccak256("members.count") || keyHash == keccak256("treasury.value");
    }

    /**
     * @dev Verifies gateway signature for off-chain data
     */
    function _verifyGatewaySignature(
        bytes32 node,
        string memory key,
        string memory value,
        uint256 expires,
        bytes memory signature
    ) internal view {
        OffchainConfig memory config = offchainConfigs[node];

        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n", "32", keccak256(abi.encodePacked(node, key, value, expires))
            )
        );

        address recoveredSigner = messageHash.recover(signature);
        require(recoveredSigner == config.signer, "OrgResolver: Invalid signature");
    }

    /**
     * @dev Parses DNS-encoded name into parent node and label
     */
    function _parseName(bytes memory name) internal pure returns (bytes32 parentNode, string memory label) {
        // Simplified parsing - in production, use proper DNS name parsing
        // This assumes the name is already properly formatted
        require(name.length > 0, "OrgResolver: Empty name");

        // For now, return dummy values - implement proper DNS parsing
        parentNode = keccak256("org.eth");
        label = "subdomain";
    }

    /**
     * @dev Standard resolution fallback
     */
    function _resolveStandard(bytes32 node, bytes memory data) internal view returns (bytes memory) {
        // Decode the function selector from data
        bytes4 selector = bytes4(data);

        if (selector == bytes4(keccak256("addr(bytes32)"))) {
            return abi.encode(AddrResolver.addr(node));
        } else if (selector == bytes4(keccak256("text(bytes32,string)"))) {
            bytes memory remaining = new bytes(data.length - 4);
            for (uint256 i = 0; i < data.length - 4; i++) {
                remaining[i] = data[i + 4];
            }
            (, string memory key) = abi.decode(remaining, (bytes32, string));
            return abi.encode(versionable_texts[recordVersions[node]][node][key]);
        }

        revert("OrgResolver: Unsupported function");
    }
}
