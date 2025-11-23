// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./OrgResolver.sol";
import "./SubdomainManager.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @title ENSOrgRegistry
 * @dev Central registry for managing organizational ENS domains and resolvers
 *
 * This contract serves as the main entry point for organizations to:
 * - Register their ENS domains with custom resolvers
 * - Configure governance-controlled metadata updates
 * - Deploy and manage subdomain managers for working groups
 * - Set up multi-chain address resolution
 */
contract ENSOrgRegistry is AccessControl, ReentrancyGuard {
    using Clones for address;

    // Role definitions
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN");
    bytes32 public constant ORG_MANAGER_ROLE = keccak256("ORG_MANAGER");

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

    // Storage
    mapping(bytes32 => OrgRegistration) public organizations;
    mapping(address => bytes32[]) public orgsByAdmin;
    mapping(bytes32 => address[]) public subdomainManagers;

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

    constructor(address _orgResolverTemplate, address _subdomainManagerTemplate, address _admin) {
        require(_orgResolverTemplate != address(0), "ENSOrgRegistry: Invalid resolver template");
        require(_subdomainManagerTemplate != address(0), "ENSOrgRegistry: Invalid subdomain template");

        orgResolverTemplate = _orgResolverTemplate;
        subdomainManagerTemplate = _subdomainManagerTemplate;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(REGISTRY_ADMIN_ROLE, _admin);
    }

    // ============ Organization Registration ============

    /**
     * @dev Register a new organization with ENS
     */
    function registerOrganization(
        bytes32 node,
        string calldata name,
        address admin,
        address governance,
        string calldata displayName,
        string calldata description,
        string calldata avatar,
        string calldata website,
        string calldata email
    ) public nonReentrant returns (address resolver) {
        return _registerOrganizationInternal(
            node, name, admin, governance, displayName, description, avatar, website, email
        );
    }

    function _registerOrganizationInternal(
        bytes32 node,
        string memory name,
        address admin,
        address governance,
        string memory displayName,
        string memory description,
        string memory avatar,
        string memory website,
        string memory email
    ) internal returns (address resolver) {
        require(node != bytes32(0), "ENSOrgRegistry: Invalid node");
        require(admin != address(0), "ENSOrgRegistry: Invalid admin");
        require(bytes(name).length > 0, "ENSOrgRegistry: Empty name");
        require(!organizations[node].active, "ENSOrgRegistry: Organization already registered");

        // Deploy custom resolver using minimal proxy pattern
        resolver = orgResolverTemplate.clone();
        OrgResolver(resolver).initialize(admin);

        // Grant necessary roles to the admin (registry already has permission from initialize)
        OrgResolver(resolver).grantRole(OrgResolver(resolver).ORG_ADMIN_ROLE(), admin);

        // Grant ORG_ADMIN_ROLE to registry temporarily for setup
        OrgResolver orgResolver = OrgResolver(resolver);
        orgResolver.grantRole(orgResolver.ORG_ADMIN_ROLE(), address(this));

        // Set governance if provided
        if (governance != address(0)) {
            orgResolver.setGovernanceContract(node, governance);
        }

        // Set initial organizational profile
        orgResolver.setOrgProfile(node, displayName, description, avatar, website, email);

        // Keep ORG_ADMIN_ROLE for registry to manage organization updates
        // Don't revoke it so the registry can manage admin changes

        // Keep registry admin permission for future updates but revoke ORG_ADMIN_ROLE
        // The registry needs to maintain DEFAULT_ADMIN_ROLE to manage organization updates

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
        require(org.active, "ENSOrgRegistry: Organization not found");
        require(msg.sender == org.admin || hasRole(REGISTRY_ADMIN_ROLE, msg.sender), "ENSOrgRegistry: Not authorized");

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
        require(org.active, "ENSOrgRegistry: Organization not found");
        require(msg.sender == org.admin || hasRole(REGISTRY_ADMIN_ROLE, msg.sender), "ENSOrgRegistry: Not authorized");
        require(teamAdmin != address(0), "ENSOrgRegistry: Invalid team admin");

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
    function deactivateOrganization(bytes32 node) external onlyRole(REGISTRY_ADMIN_ROLE) {
        OrgRegistration storage org = organizations[node];
        require(org.active, "ENSOrgRegistry: Organization not found");

        org.active = false;
        totalOrganizations--;

        emit OrganizationDeactivated(node);
    }

    /**
     * @dev Batch register multiple organizations
     */
    function batchRegisterOrganizations(
        bytes32[] calldata nodes,
        string[] calldata names,
        address[] calldata admins,
        address[] calldata governances,
        string[] calldata displayNames
    ) external onlyRole(REGISTRY_ADMIN_ROLE) returns (address[] memory resolvers) {
        require(
            nodes.length == names.length && names.length == admins.length && admins.length == governances.length
                && governances.length == displayNames.length,
            "ENSOrgRegistry: Array length mismatch"
        );

        resolvers = new address[](nodes.length);

        for (uint256 i = 0; i < nodes.length; i++) {
            resolvers[i] = _registerOrganizationInternal(
                nodes[i],
                names[i],
                admins[i],
                governances[i],
                displayNames[i],
                "", // description
                "", // avatar
                "", // website
                "" // email
            );
        }

        return resolvers;
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
        require(organizations[node].active, "ENSOrgRegistry: Organization not found");
        return organizations[node].resolver;
    }

    /**
     * @dev Get registry statistics
     */
    function getStats() external view returns (uint256 _totalOrganizations, uint256 _totalSubdomains) {
        return (totalOrganizations, totalSubdomains);
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
    function updateResolverTemplate(address newTemplate) external view onlyRole(REGISTRY_ADMIN_ROLE) {
        require(newTemplate != address(0), "ENSOrgRegistry: Invalid template");
        // Note: This only affects new deployments, existing resolvers are not upgraded
        // Consider implementing upgrade mechanisms if needed
    }

    /**
     * @dev Emergency pause functionality
     */
    function pause() external onlyRole(REGISTRY_ADMIN_ROLE) {
        // Implement pause functionality if needed
        // Could pause new registrations while allowing existing operations
    }
}
