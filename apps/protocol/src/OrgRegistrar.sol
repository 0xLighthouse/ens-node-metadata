// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./OrgResolver.sol";
import "./SubdomainManager.sol";
import "./lib/Input.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "ens-contracts/registry/ENS.sol";

/**
 * @title Organization Registrar
 * @dev Central registrar for managing organizational ENS domains and resolvers
 *
 * This contract serves as the main entry point for organizations to:
 * - Register their ENS domains with custom resolvers
 * - Configure governance-controlled metadata updates
 * - Deploy and manage subdomain managers for working groups
 * - Set up multi-chain address resolution
 */
contract OrgRegistrar is AccessControl, ReentrancyGuard {
    using Clones for address;

    // Role definitions
    bytes32 public constant REGISTRAR_ADMIN_ROLE = keccak256("REGISTRAR_ADMIN");
    bytes32 public constant ORG_MANAGER_ROLE = keccak256("ORG_MANAGER");

    // ENS registry interface
    ENS public immutable ens;

    // Template contracts for cloning
    address public immutable orgResolverTemplate;
    address public immutable subdomainManagerTemplate;

    // Organization registration data
    struct OrgRegistration {
        address resolver; // Custom resolver contract
        address governance; // Governance contract
        address admin; // Organization admin
        bytes32 node; // ENS node hash
        string name; // ENS name (e.g., "myorg.eth")
        uint256 registeredAt; // Registration timestamp
        bool active; // Whether the org is active
    }

    // Use the Attribute struct from our validation library
    using Input for Input.Attribute[];

    // Storage
    mapping(bytes32 => OrgRegistration) public organizations;
    mapping(address => bytes32[]) public orgsByAdmin;
    mapping(bytes32 => address[]) public subdomainManagers;

    // Schema definitions - stored as hash of required fields for validation
    mapping(string => bytes32) public schemaHashes; // schemaId => hash of required fields

    // Statistics
    uint256 public totalOrganizations;
    uint256 public totalSubdomains;

    // Events
    event OrganizationRegistered(
        bytes32 indexed node, string name, address indexed admin, address indexed resolver, address governance
    );

    event OrganizationUpdated(bytes32 indexed node, address indexed newAdmin, address indexed newGovernance);

    event SubdomainManagerDeployed(
        bytes32 indexed parentNode, string teamName, address indexed manager, address indexed teamAdmin
    );

    event OrganizationDeactivated(bytes32 indexed node);

    constructor(address _ens, address _orgResolverTemplate, address _subdomainManagerTemplate, address _admin) {
        require(_ens != address(0), "OrgRegistrar: Invalid ENS registry");
        require(_orgResolverTemplate != address(0), "OrgRegistrar: Invalid resolver template");
        require(_subdomainManagerTemplate != address(0), "OrgRegistrar: Invalid subdomain template");

        ens = ENS(_ens);
        orgResolverTemplate = _orgResolverTemplate;
        subdomainManagerTemplate = _subdomainManagerTemplate;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(REGISTRAR_ADMIN_ROLE, _admin);
    }

    // ============ Organization Registration ============

    /**
     * @dev Register organization with generic schema-based approach
     * @param node ENS node hash
     * @param schemaId Schema identifier for validation (e.g., "org-profile-v1")
     * @param attributes Array of [key, value, type] tuples as Input.Attribute structs
     * @return resolver Address of the deployed custom resolver
     */
    function registerOrganization(bytes32 node, string calldata schemaId, Input.Attribute[] calldata attributes)
        public
        nonReentrant
        returns (address resolver)
    {
        return _registerOrganizationInternal(node, schemaId, attributes);
    }

    function _registerOrganizationInternal(bytes32 node, string memory schemaId, Input.Attribute[] memory attributes)
        internal
        returns (address resolver)
    {
        // Basic validation
        require(node != bytes32(0), "OrgRegistrar: Invalid node");
        require(!organizations[node].active, "OrgRegistrar: Organization already registered");
        require(attributes.length > 0, "OrgRegistrar: No attributes provided");

        // Verify that the caller owns the ENS node or is approved
        address nodeOwner = ens.owner(node);
        require(
            nodeOwner == msg.sender || ens.isApprovedForAll(nodeOwner, msg.sender)
                || hasRole(REGISTRAR_ADMIN_ROLE, msg.sender),
            "OrgRegistrar: Not authorized to manage this ENS node"
        );

        // Validate schema and attributes using library
        Input.validateSchemaAndAttributes(schemaId, attributes);

        // Extract required organizational data from attributes
        (string memory name, address admin, address governance) = _extractOrgData(attributes);
        require(admin != address(0), "OrgRegistrar: Admin address required");
        require(bytes(name).length > 0, "OrgRegistrar: Name required");

        // Deploy custom resolver using minimal proxy pattern
        resolver = orgResolverTemplate.clone();
        OrgResolver(resolver).initialize(admin);

        // Grant necessary roles to the admin
        OrgResolver(resolver).grantRole(OrgResolver(resolver).ORG_ADMIN_ROLE(), admin);

        // Grant ORG_ADMIN_ROLE to registrar temporarily for setup
        OrgResolver orgResolver = OrgResolver(resolver);
        orgResolver.grantRole(orgResolver.ORG_ADMIN_ROLE(), address(this));

        // Set governance if provided
        if (governance != address(0)) {
            orgResolver.setGovernanceContract(node, governance);
        }

        // Note: The ENS node owner (msg.sender) should set our resolver after registration
        // We cannot set the resolver directly as we don't own the node
        // The owner can call: ens.setResolver(node, resolver) after registration

        // Write all attributes directly to ENS text records
        _writeAttributesToENS(orgResolver, node, attributes);

        // Compute and store integrity hash
        bytes32 dataHash = _computeAttributesHash(attributes);
        orgResolver.setText(node, "profile.hash", _bytes32ToString(dataHash));
        orgResolver.setText(node, "schema.id", schemaId);

        // Store registration data
        organizations[node] = OrgRegistration({
            resolver: resolver,
            governance: governance,
            admin: admin,
            node: node,
            name: name,
            registeredAt: block.timestamp,
            active: true
        });

        // Update admin tracking
        orgsByAdmin[admin].push(node);
        totalOrganizations++;

        emit OrganizationRegistered(node, name, admin, resolver, governance);

        return resolver;
    }

    /**
     * @dev Update organization admin and governance
     */
    function updateOrganization(bytes32 node, address newAdmin, address newGovernance) external {
        OrgRegistration storage org = organizations[node];
        require(org.active, "OrgRegistrar: Organization not found");
        require(msg.sender == org.admin || hasRole(REGISTRAR_ADMIN_ROLE, msg.sender), "OrgRegistrar: Not authorized");

        if (newAdmin != address(0) && newAdmin != org.admin) {
            // Update admin tracking
            _removeFromAdminOrgs(org.admin, node);
            orgsByAdmin[newAdmin].push(node);

            // Update resolver permissions
            OrgResolver resolver = OrgResolver(org.resolver);
            resolver.grantRole(resolver.ORG_ADMIN_ROLE(), newAdmin);
            resolver.revokeRole(resolver.ORG_ADMIN_ROLE(), org.admin);

            org.admin = newAdmin;
        }

        if (newGovernance != org.governance) {
            OrgResolver(org.resolver).setGovernanceContract(node, newGovernance);
            org.governance = newGovernance;
        }

        emit OrganizationUpdated(node, newAdmin, newGovernance);
    }

    // ============ Subdomain Management ============

    /**
     * @dev Deploy a subdomain manager for a working group
     */
    function deploySubdomainManager(bytes32 parentNode, string calldata teamName, address teamAdmin)
        external
        returns (address manager)
    {
        OrgRegistration storage org = organizations[parentNode];
        require(org.active, "OrgRegistrar: Organization not found");
        require(msg.sender == org.admin || hasRole(REGISTRAR_ADMIN_ROLE, msg.sender), "OrgRegistrar: Not authorized");
        require(teamAdmin != address(0), "OrgRegistrar: Invalid team admin");

        // Deploy subdomain manager using minimal proxy
        manager = subdomainManagerTemplate.clone();
        SubdomainManager(manager).initialize(parentNode, org.resolver, teamName, teamAdmin);

        // Register the subdomain manager with the parent resolver
        OrgResolver(org.resolver).delegateSubdomain(parentNode, teamName, manager);

        // Track the subdomain manager
        subdomainManagers[parentNode].push(manager);
        totalSubdomains++;

        emit SubdomainManagerDeployed(parentNode, teamName, manager, teamAdmin);

        return manager;
    }

    /**
     * @dev Get all subdomain managers for an organization
     */
    function getSubdomainManagers(bytes32 node) external view returns (address[] memory) {
        return subdomainManagers[node];
    }

    // ============ Organization Management ============

    /**
     * @dev Deactivate an organization (emergency function)
     */
    function deactivateOrganization(bytes32 node) external onlyRole(REGISTRAR_ADMIN_ROLE) {
        OrgRegistration storage org = organizations[node];
        require(org.active, "OrgRegistrar: Organization not found");

        org.active = false;
        totalOrganizations--;

        emit OrganizationDeactivated(node);
    }

    // ============ View Functions ============

    /**
     * @dev Get organization details
     */
    function getOrganization(bytes32 node) external view returns (OrgRegistration memory) {
        return organizations[node];
    }

    /**
     * @dev Get organizations managed by an admin
     */
    function getOrgsByAdmin(address admin) external view returns (bytes32[] memory) {
        return orgsByAdmin[admin];
    }

    /**
     * @dev Check if an organization is registered and active
     */
    function isOrganizationActive(bytes32 node) external view returns (bool) {
        return organizations[node].active;
    }

    /**
     * @dev Get organization resolver address
     */
    function getResolver(bytes32 node) external view returns (address) {
        require(organizations[node].active, "OrgRegistrar: Organization not found");
        return organizations[node].resolver;
    }

    /**
     * @dev Get registrar statistics
     */
    function getStats() external view returns (uint256 _totalOrganizations, uint256 _totalSubdomains) {
        return (totalOrganizations, totalSubdomains);
    }

    /**
     * @dev Check if a node exists in ENS registry
     */
    function ensNodeExists(bytes32 node) external view returns (bool) {
        return ens.recordExists(node);
    }

    /**
     * @dev Get the owner of an ENS node
     */
    function getEnsNodeOwner(bytes32 node) external view returns (address) {
        return ens.owner(node);
    }

    /**
     * @dev Helper function to set ENS resolver (must be called by node owner)
     * This is a convenience function - owners can also call ENS directly
     */
    function setEnsResolver(bytes32 node) external {
        require(organizations[node].active, "OrgRegistrar: Organization not registered");
        require(
            ens.owner(node) == msg.sender || ens.isApprovedForAll(ens.owner(node), msg.sender),
            "OrgRegistrar: Not authorized to set resolver"
        );

        ens.setResolver(node, organizations[node].resolver);
    }

    // ============ Schema Management ============

    /**
     * @dev Register a new schema definition
     * @param schemaId Unique schema identifier
     * @param requiredFields Array of required field keys
     */
    function registerSchema(string calldata schemaId, string[] calldata requiredFields)
        external
        onlyRole(REGISTRAR_ADMIN_ROLE)
    {
        require(bytes(schemaId).length > 0, "OrgRegistrar: Empty schema ID");
        require(requiredFields.length > 0, "OrgRegistrar: No required fields");

        // Compute hash of required fields for validation
        bytes memory data;
        for (uint256 i = 0; i < requiredFields.length; i++) {
            data = abi.encodePacked(data, requiredFields[i]);
        }
        bytes32 hash = keccak256(data);
        schemaHashes[schemaId] = hash;
    }


    /**
     * @dev Extract required organizational data from attributes
     * @param attributes Array of attribute data
     * @return name Organization name
     * @return admin Admin address
     * @return governance Governance contract address (can be zero)
     */
    function _extractOrgData(Input.Attribute[] memory attributes)
        internal
        pure
        returns (string memory name, address admin, address governance)
    {
        for (uint256 i = 0; i < attributes.length; i++) {
            Input.Attribute memory attribute = attributes[i];
            bytes32 keyHash = keccak256(bytes(attribute.key));

            if (keyHash == keccak256("name")) {
                name = attribute.value;
            } else if (keyHash == keccak256("admin")) {
                admin = Input.parseAddress(attribute.value);
            } else if (keyHash == keccak256("governance")) {
                governance = Input.parseAddress(attribute.value);
            }
        }
    }

    /**
     * @dev Write all attributes directly to ENS text records
     * @param orgResolver The organization resolver contract
     * @param node The ENS node
     * @param attributes Array of attribute data to write
     */
    function _writeAttributesToENS(OrgResolver orgResolver, bytes32 node, Input.Attribute[] memory attributes) internal {
        for (uint256 i = 0; i < attributes.length; i++) {
            Input.Attribute memory attribute = attributes[i];

            // Skip organizational metadata attributes (already handled)
            bytes32 keyHash = keccak256(bytes(attribute.key));
            if (keyHash == keccak256("name") || keyHash == keccak256("admin") || keyHash == keccak256("governance")) {
                continue;
            }

            // Write attribute to ENS text record
            orgResolver.setText(node, attribute.key, attribute.value);
        }
    }

    /**
     * @dev Compute hash of all attribute data for integrity verification
     * @param attributes Array of attribute data
     * @return Hash of all attribute keys and values
     */
    function _computeAttributesHash(Input.Attribute[] memory attributes) internal pure returns (bytes32) {
        bytes memory data;

        for (uint256 i = 0; i < attributes.length; i++) {
            data = abi.encodePacked(data, attributes[i].key, attributes[i].value, uint8(attributes[i].kind));
        }

        return keccak256(data);
    }





    /**
     * @dev Convert bytes32 to hex string
     * @param value The bytes32 value
     * @return Hex string representation
     */
    function _bytes32ToString(bytes32 value) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(66); // "0x" + 64 hex chars
        str[0] = "0";
        str[1] = "x";

        for (uint256 i = 0; i < 32; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i] & 0x0f)];
        }

        return string(str);
    }


    // ============ Internal Functions ============

    /**
     * @dev Remove organization from admin's list
     */
    function _removeFromAdminOrgs(address admin, bytes32 node) internal {
        bytes32[] storage adminOrgs = orgsByAdmin[admin];

        for (uint256 i = 0; i < adminOrgs.length; i++) {
            if (adminOrgs[i] == node) {
                adminOrgs[i] = adminOrgs[adminOrgs.length - 1];
                adminOrgs.pop();
                break;
            }
        }
    }

    // ============ Upgrade Functions ============

    /**
     * @dev Update resolver template (for future deployments)
     */
    function updateResolverTemplate(address newTemplate) external onlyRole(REGISTRAR_ADMIN_ROLE) {
        require(newTemplate != address(0), "OrgRegistrar: Invalid template");
        // Note: This only affects new deployments, existing resolvers are not upgraded
        // Consider implementing upgrade mechanisms if needed
    }

    /**
     * @dev Emergency pause functionality
     */
    function pause() external onlyRole(REGISTRAR_ADMIN_ROLE) {
        // Implement pause functionality if needed
        // Could pause new registrations while allowing existing operations
    }
}
