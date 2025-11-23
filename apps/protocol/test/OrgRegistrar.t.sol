// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "../src/OrgRegistrar.sol";
import "../src/OrgResolver.sol";
import "../src/SubdomainManager.sol";
import "../src/lib/Input.sol";
import "ens-contracts/registry/ENS.sol";
import "ens-contracts/registry/ENSRegistry.sol";
import "ens-contracts/wrapper/INameWrapper.sol";

// Global test constants
/// @dev ENS node hash for "allsafe.eth" - calculated as keccak256(keccak256(0x00 + keccak256("eth")) + keccak256("allsafe"))
bytes32 constant ORG_NODE =
    keccak256(abi.encodePacked(keccak256(abi.encodePacked(bytes32(0), keccak256("eth"))), keccak256("allsafe")));

/// @dev Test organization display name used in registration
string constant ORG_NAME = "allsafe.eth";

/// @dev Test subdomain/team name for ENS subdomain creation (e.g., "engineering.allsafe.eth")
string constant ORG_ENS = "engineering";

contract OrgRegistrarTest is Test {
    OrgRegistrar public registrar;
    OrgResolver public resolverTemplate;
    SubdomainManager public subdomainTemplate;
    ENSRegistry public ensRegistry;
    address public governance;

    address public admin = address(0x1);
    address public orgAdmin = address(0x2);
    address public teamAdmin = address(0x3);
    address public user = address(0x4);

    event OrganizationRegistered(
        bytes32 indexed node, string name, address indexed admin, address indexed resolver, address governance
    );

    event SubdomainManagerDeployed(
        bytes32 indexed parentNode, string teamName, address indexed manager, address indexed teamAdmin
    );

    function setUp() public {
        // Deploy ENS registry
        ensRegistry = new ENSRegistry();

        // Deploy templates
        resolverTemplate = new OrgResolver(admin);
        subdomainTemplate = new SubdomainManager(bytes32(0), address(0), "", address(0));

        // Set governance address to zero for simple testing
        governance = address(0);

        // Deploy registrar with ENS registry
        registrar = new OrgRegistrar(address(ensRegistry), address(resolverTemplate), address(subdomainTemplate), admin);

        // Set up ENS ownership for our test org node
        // First we need to create the node through the root (this test setup owns root by default)
        bytes32 ethNode = keccak256(abi.encodePacked(bytes32(0), keccak256("eth")));
        bytes32 orgLabel = keccak256("allsafe");

        // Create the .eth node first if needed
        if (!ensRegistry.recordExists(ethNode)) {
            ensRegistry.setSubnodeOwner(bytes32(0), keccak256("eth"), address(this));
        }

        // Create allsafe.eth and assign to orgAdmin
        ensRegistry.setSubnodeOwner(ethNode, orgLabel, orgAdmin);
    }


    function test_ensSetup_ValidConfiguration_Success() public {
        // Test that our ENS setup is working
        assertEq(ensRegistry.owner(ORG_NODE), orgAdmin);
        assertTrue(ensRegistry.recordExists(ORG_NODE));
    }

    function test_directSetResolver_ValidResolver_Success() public {
        // Test setting resolver directly with ENS
        address testResolver = address(0x999);

        vm.prank(orgAdmin);
        ensRegistry.setResolver(ORG_NODE, testResolver);

        assertEq(ensRegistry.resolver(ORG_NODE), testResolver);
    }

    function test_registerOrganization_ValidInputs_Success() public {
        // Create attribute array using the generic format
        Input.Attribute[] memory attributes = new Input.Attribute[](6);
        attributes[0] = Input.createTextAttribute("name", ORG_NAME);
        attributes[1] = Input.createAddressAttribute("admin", orgAdmin);
        attributes[2] = Input.createAddressAttribute("governance", address(governance));
        attributes[3] = Input.createTextAttribute("displayName", "My Organization");
        attributes[4] = Input.createTextAttribute("description", "A decentralized organization");
        attributes[5] = Input.createUrlAttribute("website", "https://myorg.com");

        // Register as the ENS node owner
        vm.prank(orgAdmin);
        address resolver = registrar.registerOrganization(ORG_NODE, "org-profile-v1", attributes);

        // Set the ENS resolver (must be done by node owner directly)
        vm.prank(orgAdmin);
        ensRegistry.setResolver(ORG_NODE, resolver);

        // Verify registration
        OrgRegistrar.OrgRegistration memory org = registrar.getOrganization(ORG_NODE);
        assertEq(org.resolver, resolver);
        assertEq(org.admin, orgAdmin);
        assertEq(org.governance, governance);
        assertEq(org.name, ORG_NAME);
        assertTrue(org.active);

        // Verify resolver setup
        OrgResolver orgResolver = OrgResolver(resolver);
        assertTrue(orgResolver.hasRole(orgResolver.ORG_ADMIN_ROLE(), orgAdmin));
        assertEq(orgResolver.getGovernanceContract(ORG_NODE), governance);

        // Verify ENS node ownership
        assertEq(ensRegistry.owner(ORG_NODE), orgAdmin);

        // Verify resolver is registered with ENS
        assertEq(ensRegistry.resolver(ORG_NODE), resolver);

        // Verify profile data is stored as ENS text records
        assertEq(orgResolver.text(ORG_NODE, "displayName"), "My Organization");
        assertEq(orgResolver.text(ORG_NODE, "description"), "A decentralized organization");
        assertEq(orgResolver.text(ORG_NODE, "website"), "https://myorg.com");
    }

    function test_registerOrganization_InvalidInputs_Reverts() public {
        // Test invalid node
        Input.Attribute[] memory attributes = new Input.Attribute[](3);
        attributes[0] = Input.createTextAttribute("name", ORG_NAME);
        attributes[1] = Input.createAddressAttribute("admin", orgAdmin);
        attributes[2] = Input.createTextAttribute("displayName", "Test");

        vm.prank(orgAdmin);
        vm.expectRevert("OrgRegistrar: Invalid node");
        registrar.registerOrganization(bytes32(0), "org-profile-v1", attributes);

        // Test no attributes
        Input.Attribute[] memory emptyAttributes = new Input.Attribute[](0);
        vm.prank(orgAdmin);
        vm.expectRevert("OrgRegistrar: No attributes provided");
        registrar.registerOrganization(ORG_NODE, "org-profile-v1", emptyAttributes);

        // Test missing admin
        Input.Attribute[] memory noAdminAttributes = new Input.Attribute[](2);
        noAdminAttributes[0] = Input.createTextAttribute("name", ORG_NAME);
        noAdminAttributes[1] = Input.createTextAttribute("displayName", "Test");

        vm.prank(orgAdmin);
        vm.expectRevert("OrgRegistrar: Admin address required");
        registrar.registerOrganization(ORG_NODE, "org-profile-v1", noAdminAttributes);
    }

    function test_registerOrganization_DuplicateOrg_Reverts() public {
        // Create field data
        Input.Attribute[] memory attributes = new Input.Attribute[](3);
        attributes[0] = Input.createTextAttribute("name", ORG_NAME);
        attributes[1] = Input.createAddressAttribute("admin", orgAdmin);
        attributes[2] = Input.createTextAttribute("displayName", "Test");

        // Register first organization
        vm.prank(orgAdmin);
        registrar.registerOrganization(ORG_NODE, "org-profile-v1", attributes);

        // Try to register again (expecting revert)
        vm.expectRevert("OrgRegistrar: Organization already registered");
        vm.prank(orgAdmin);
        registrar.registerOrganization(ORG_NODE, "org-profile-v1", attributes);
    }

    function test_updateOrganization_ValidInputs_Success() public {
        // Create field data and register organization
        Input.Attribute[] memory attributes = new Input.Attribute[](3);
        attributes[0] = Input.createTextAttribute("name", ORG_NAME);
        attributes[1] = Input.createAddressAttribute("admin", orgAdmin);
        attributes[2] = Input.createTextAttribute("displayName", "Test");
        vm.prank(orgAdmin);
        registrar.registerOrganization(ORG_NODE, "org-profile-v1", attributes);

        address newAdmin = address(0x5);
        address newGovernance = address(0x200);

        // Update organization as admin
        vm.prank(orgAdmin);
        registrar.updateOrganization(ORG_NODE, newAdmin, newGovernance);

        // Verify update
        OrgRegistrar.OrgRegistration memory org = registrar.getOrganization(ORG_NODE);
        assertEq(org.admin, newAdmin);
        assertEq(org.governance, newGovernance);

        // Verify new admin has resolver permissions
        OrgResolver resolver = OrgResolver(org.resolver);
        assertTrue(resolver.hasRole(resolver.ORG_ADMIN_ROLE(), newAdmin));
        assertFalse(resolver.hasRole(resolver.ORG_ADMIN_ROLE(), orgAdmin));
    }

    function test_updateOrganization_Unauthorized_Reverts() public {
        // Create field data and register organization
        Input.Attribute[] memory attributes = new Input.Attribute[](3);
        attributes[0] = Input.createTextAttribute("name", ORG_NAME);
        attributes[1] = Input.createAddressAttribute("admin", orgAdmin);
        attributes[2] = Input.createTextAttribute("displayName", "Test");
        vm.prank(orgAdmin);
        registrar.registerOrganization(ORG_NODE, "org-profile-v1", attributes);

        // Try to update as unauthorized user
        vm.prank(user);
        vm.expectRevert("OrgRegistrar: Not authorized");
        registrar.updateOrganization(ORG_NODE, user, address(0));
    }

    function test_deploySubdomainManager_ValidInputs_Success() public {
        // Create field data and register organization first
        Input.Attribute[] memory attributes = new Input.Attribute[](3);
        attributes[0] = Input.createTextAttribute("name", ORG_NAME);
        attributes[1] = Input.createAddressAttribute("admin", orgAdmin);
        attributes[2] = Input.createTextAttribute("displayName", "Test");
        vm.prank(orgAdmin);
        registrar.registerOrganization(ORG_NODE, "org-profile-v1", attributes);

        // Don't expect exact manager address since it's a clone
        vm.expectEmit(true, false, false, true);
        emit SubdomainManagerDeployed(ORG_NODE, ORG_ENS, address(0), teamAdmin);

        // Deploy subdomain manager
        vm.prank(orgAdmin);
        address manager = registrar.deploySubdomainManager(ORG_NODE, ORG_ENS, teamAdmin);

        // Verify deployment
        assertTrue(manager != address(0));

        address[] memory managers = registrar.getSubdomainManagers(ORG_NODE);
        assertEq(managers.length, 1);
        assertEq(managers[0], manager);

        // Verify subdomain manager setup
        SubdomainManager subdomainManager = SubdomainManager(manager);
        assertEq(subdomainManager.parentNode(), ORG_NODE);
        assertEq(subdomainManager.teamName(), ORG_ENS);
        assertTrue(subdomainManager.hasRole(subdomainManager.TEAM_ADMIN_ROLE(), teamAdmin));

        // Verify delegation in resolver
        OrgRegistrar.OrgRegistration memory org = registrar.getOrganization(ORG_NODE);
        OrgResolver resolver = OrgResolver(org.resolver);
        bytes32 labelHash = keccak256(bytes(ORG_ENS));
        assertEq(resolver.getSubdomainManager(ORG_NODE, labelHash), manager);
    }

    function test_deploySubdomainManager_Unauthorized_Reverts() public {
        // Create field data and register organization
        Input.Attribute[] memory attributes = new Input.Attribute[](3);
        attributes[0] = Input.createTextAttribute("name", ORG_NAME);
        attributes[1] = Input.createAddressAttribute("admin", orgAdmin);
        attributes[2] = Input.createTextAttribute("displayName", "Test");
        vm.prank(orgAdmin);
        registrar.registerOrganization(ORG_NODE, "org-profile-v1", attributes);

        // Try to deploy subdomain manager as unauthorized user
        vm.prank(user);
        vm.expectRevert("OrgRegistrar: Not authorized");
        registrar.deploySubdomainManager(ORG_NODE, ORG_ENS, teamAdmin);
    }

    function test_deploySubdomainManager_InvalidOrg_Reverts() public {
        // Try to deploy subdomain manager for non-existent organization
        vm.expectRevert("OrgRegistrar: Organization not found");
        registrar.deploySubdomainManager(ORG_NODE, ORG_ENS, teamAdmin);
    }

    function test_deactivateOrganization_ValidInputs_Success() public {
        // Create field data and register organization
        Input.Attribute[] memory attributes = new Input.Attribute[](3);
        attributes[0] = Input.createTextAttribute("name", ORG_NAME);
        attributes[1] = Input.createAddressAttribute("admin", orgAdmin);
        attributes[2] = Input.createTextAttribute("displayName", "Test");
        vm.prank(orgAdmin);
        registrar.registerOrganization(ORG_NODE, "org-profile-v1", attributes);

        assertTrue(registrar.isOrganizationActive(ORG_NODE));

        // Deactivate organization
        vm.prank(admin);
        registrar.deactivateOrganization(ORG_NODE);

        assertFalse(registrar.isOrganizationActive(ORG_NODE));
    }

    function test_getOrgsByAdmin_MultipleOrgs_ReturnsCorrectList() public {
        bytes32 ethNode = keccak256(abi.encodePacked(bytes32(0), keccak256("eth")));
        bytes32 org1 = keccak256(abi.encodePacked(ethNode, keccak256("org1")));
        bytes32 org2 = keccak256(abi.encodePacked(ethNode, keccak256("org2")));

        // Set up ENS ownership for test nodes
        ensRegistry.setSubnodeOwner(ethNode, keccak256("org1"), orgAdmin);
        ensRegistry.setSubnodeOwner(ethNode, keccak256("org2"), orgAdmin);

        // Create field data for first org
        Input.Attribute[] memory attributes1 = new Input.Attribute[](3);
        attributes1[0] = Input.createTextAttribute("name", "org1.eth");
        attributes1[1] = Input.createAddressAttribute("admin", orgAdmin);
        attributes1[2] = Input.createTextAttribute("displayName", "Test1");

        // Create field data for second org
        Input.Attribute[] memory attributes2 = new Input.Attribute[](3);
        attributes2[0] = Input.createTextAttribute("name", "org2.eth");
        attributes2[1] = Input.createAddressAttribute("admin", orgAdmin);
        attributes2[2] = Input.createTextAttribute("displayName", "Test2");

        // Register multiple organizations with same admin
        vm.prank(orgAdmin);
        registrar.registerOrganization(org1, "org-profile-v1", attributes1);
        vm.prank(orgAdmin);
        registrar.registerOrganization(org2, "org-profile-v1", attributes2);

        bytes32[] memory orgs = registrar.getOrgsByAdmin(orgAdmin);
        assertEq(orgs.length, 2);
        assertTrue((orgs[0] == org1 && orgs[1] == org2) || (orgs[0] == org2 && orgs[1] == org1));
    }

    function test_getStats_AfterRegistrations_ReturnsCorrectCounts() public {
        assertEq(registrar.totalOrganizations(), 0);
        assertEq(registrar.totalSubdomains(), 0);

        // Create field data and register organization
        Input.Attribute[] memory attributes = new Input.Attribute[](3);
        attributes[0] = Input.createTextAttribute("name", ORG_NAME);
        attributes[1] = Input.createAddressAttribute("admin", orgAdmin);
        attributes[2] = Input.createTextAttribute("displayName", "Test");
        vm.prank(orgAdmin);
        registrar.registerOrganization(ORG_NODE, "org-profile-v1", attributes);

        assertEq(registrar.totalOrganizations(), 1);

        // Deploy subdomain
        vm.prank(orgAdmin);
        registrar.deploySubdomainManager(ORG_NODE, ORG_ENS, teamAdmin);

        (uint256 totalOrgs, uint256 totalSubs) = registrar.getStats();
        assertEq(totalOrgs, 1);
        assertEq(totalSubs, 1);
    }
}
