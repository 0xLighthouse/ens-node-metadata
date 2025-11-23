// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "../../src/lib/SchemaRegistry.sol";
import {Input, InputType} from "../../src/lib/Input.sol";

contract SchemaRegistryTest is Test {
    SchemaRegistry public registry;
    
    bytes32 public constant ORG_V1_SCHEMA = keccak256("OrgV1");
    bytes32 public constant ORG_V2_SCHEMA = keccak256("OrgV2");
    bytes32 public constant PROPOSAL_SCHEMA = keccak256("ProposalV1");

    event SchemaRegistered(bytes32 indexed schemaId, uint256 attributeCount);
    event SchemaUpdated(bytes32 indexed schemaId, uint256 attributeCount);

    function setUp() public {
        registry = new SchemaRegistry();
    }

    // ============ Schema Registration Tests ============

    function test_registerSchema_BasicOrganization_Success() public {
        Input.Attribute[] memory schemaAttrs = new Input.Attribute[](4);
        schemaAttrs[0] = Input.createTextInput("name", "");
        schemaAttrs[1] = Input.createAddressInput("admin", address(0));
        schemaAttrs[2] = Input.createUrlInput("website", "");
        schemaAttrs[3] = Input.createEmailInput("email", "");

        bool[] memory required = new bool[](4);
        required[0] = true;  // name required
        required[1] = true;  // admin required
        required[2] = false; // website optional
        required[3] = false; // email optional

        vm.expectEmit(true, false, false, true);
        emit SchemaRegistered(ORG_V1_SCHEMA, 4);
        
        registry.registerSchema(ORG_V1_SCHEMA, schemaAttrs, required);

        assertTrue(registry.hasSchema(ORG_V1_SCHEMA));
        
        string[] memory requiredKeys = registry.getRequiredAttributes(ORG_V1_SCHEMA);
        assertEq(requiredKeys.length, 2);
        assertEq(requiredKeys[0], "name");
        assertEq(requiredKeys[1], "admin");
    }

    function test_registerSchema_EmptySchemaId_Reverts() public {
        Input.Attribute[] memory schemaAttrs = new Input.Attribute[](1);
        schemaAttrs[0] = Input.createTextAttribute("name", "");
        
        bool[] memory required = new bool[](1);
        required[0] = true;

        vm.expectRevert(SchemaRegistry.EmptySchemaId.selector);
        registry.registerSchema(bytes32(0), schemaAttrs, required);
    }

    function test_registerSchema_DuplicateSchema_Reverts() public {
        Input.Attribute[] memory schemaAttrs = new Input.Attribute[](1);
        schemaAttrs[0] = Input.createTextAttribute("name", "");
        
        bool[] memory required = new bool[](1);
        required[0] = true;

        registry.registerSchema(ORG_V1_SCHEMA, schemaAttrs, required);

        vm.expectRevert(abi.encodeWithSelector(SchemaRegistry.SchemaAlreadyExists.selector, ORG_V1_SCHEMA));
        registry.registerSchema(ORG_V1_SCHEMA, schemaAttrs, required);
    }

    function test_registerSchema_LengthMismatch_Reverts() public {
        Input.Attribute[] memory schemaAttrs = new Input.Attribute[](2);
        schemaAttrs[0] = Input.createTextAttribute("name", "");
        schemaAttrs[1] = Input.createAddressAttribute("admin", address(0));
        
        bool[] memory required = new bool[](1); // Wrong length
        required[0] = true;

        vm.expectRevert(SchemaRegistry.AttributeArrayLengthMismatch.selector);
        registry.registerSchema(ORG_V1_SCHEMA, schemaAttrs, required);
    }

    function test_registerSchema_EmptyAttributeKey_Reverts() public {
        Input.Attribute[] memory schemaAttrs = new Input.Attribute[](1);
        schemaAttrs[0] = Input.Attribute({key: "", value: "", kind: InputType.Text}); // Empty key
        
        bool[] memory required = new bool[](1);
        required[0] = true;

        vm.expectRevert(SchemaRegistry.EmptyAttributeKey.selector);
        registry.registerSchema(ORG_V1_SCHEMA, schemaAttrs, required);
    }

    // ============ Schema Update Tests ============

    function test_updateSchema_ValidInputs_Success() public {
        // First register a schema
        Input.Attribute[] memory schemaAttrs = new Input.Attribute[](2);
        schemaAttrs[0] = Input.createTextAttribute("name", "");
        schemaAttrs[1] = Input.createAddressAttribute("admin", address(0));
        
        bool[] memory required = new bool[](2);
        required[0] = true;
        required[1] = true;

        registry.registerSchema(ORG_V1_SCHEMA, schemaAttrs, required);

        // Now update it with different attributes
        Input.Attribute[] memory newSchemaAttrs = new Input.Attribute[](3);
        newSchemaAttrs[0] = Input.createTextAttribute("name", "");
        newSchemaAttrs[1] = Input.createAddressAttribute("admin", address(0));
        newSchemaAttrs[2] = Input.createAddressAttribute("treasury", address(0));
        
        bool[] memory newRequired = new bool[](3);
        newRequired[0] = true;
        newRequired[1] = true;
        newRequired[2] = false;

        vm.expectEmit(true, false, false, true);
        emit SchemaUpdated(ORG_V1_SCHEMA, 3);

        registry.updateSchema(ORG_V1_SCHEMA, newSchemaAttrs, newRequired);

        string[] memory requiredKeys = registry.getRequiredAttributes(ORG_V1_SCHEMA);
        assertEq(requiredKeys.length, 2);
    }

    function test_updateSchema_NonexistentSchema_Reverts() public {
        Input.Attribute[] memory schemaAttrs = new Input.Attribute[](1);
        schemaAttrs[0] = Input.createTextAttribute("name", "");
        
        bool[] memory required = new bool[](1);
        required[0] = true;

        vm.expectRevert(abi.encodeWithSelector(SchemaRegistry.SchemaNotFound.selector, ORG_V1_SCHEMA));
        registry.updateSchema(ORG_V1_SCHEMA, schemaAttrs, required);
    }

    // ============ Validation Tests ============

    function test_validateAttributes_ValidSubmission_ReturnsTrue() public {
        // Register org schema
        _registerOrgV1Schema();

        // Create valid submission
        Input.Attribute[] memory submission = new Input.Attribute[](4);
        submission[0] = Input.createTextAttribute("name", "My Organization");
        submission[1] = Input.createAddressAttribute("admin", 0x742d35Cc6634c0532925a3b8d40C53269b32E16E);
        submission[2] = Input.createUrlAttribute("website", "https://myorg.com");
        submission[3] = Input.createEmailAttribute("email", "contact@myorg.com");

        (bool valid, string memory reason) = registry.validateAttributes(ORG_V1_SCHEMA, submission);
        assertTrue(valid);
        assertEq(reason, "Valid");
    }

    function test_validateAttributes_MinimalRequired_ReturnsTrue() public {
        _registerOrgV1Schema();

        // Submit only required attributes
        Input.Attribute[] memory submission = new Input.Attribute[](2);
        submission[0] = Input.createTextAttribute("name", "My Organization");
        submission[1] = Input.createAddressAttribute("admin", 0x742d35Cc6634c0532925a3b8d40C53269b32E16E);

        (bool valid, string memory reason) = registry.validateAttributes(ORG_V1_SCHEMA, submission);
        assertTrue(valid);
        assertEq(reason, "Valid");
    }

    function test_validateAttributes_InvalidSchemaId_ReturnsFalse() public {
        Input.Attribute[] memory submission = new Input.Attribute[](1);
        submission[0] = Input.createTextAttribute("name", "Test");

        (bool valid, string memory reason) = registry.validateAttributes(bytes32(0), submission);
        assertFalse(valid);
        assertEq(reason, "Empty schema ID");
    }

    function test_validateAttributes_SchemaNotFound_ReturnsFalse() public {
        Input.Attribute[] memory submission = new Input.Attribute[](1);
        submission[0] = Input.createTextAttribute("name", "Test");

        (bool valid, string memory reason) = registry.validateAttributes(ORG_V1_SCHEMA, submission);
        assertFalse(valid);
        assertEq(reason, "Schema not found");
    }

    function test_validateAttributes_UnexpectedKey_ReturnsFalse() public {
        _registerOrgV1Schema();

        Input.Attribute[] memory submission = new Input.Attribute[](3);
        submission[0] = Input.createTextAttribute("name", "My Organization");
        submission[1] = Input.createAddressAttribute("admin", 0x742d35Cc6634c0532925a3b8d40C53269b32E16E);
        submission[2] = Input.createTextAttribute("unknown", "value"); // Unknown key

        (bool valid, string memory reason) = registry.validateAttributes(ORG_V1_SCHEMA, submission);
        assertFalse(valid);
        assertTrue(bytes(reason).length > 0);
        // Should contain "Unexpected attribute key"
    }

    function test_validateAttributes_TypeMismatch_ReturnsFalse() public {
        _registerOrgV1Schema();

        Input.Attribute[] memory submission = new Input.Attribute[](2);
        submission[0] = Input.createTextAttribute("name", "My Organization");
        submission[1] = Input.createTextAttribute("admin", "0x742d35Cc6634c0532925a3b8d40C53269b32E16E"); // Wrong type

        (bool valid, string memory reason) = registry.validateAttributes(ORG_V1_SCHEMA, submission);
        assertFalse(valid);
        assertTrue(bytes(reason).length > 0);
        // Should contain "Type mismatch"
    }

    function test_validateAttributes_MissingRequired_ReturnsFalse() public {
        _registerOrgV1Schema();

        // Missing required "admin" attribute
        Input.Attribute[] memory submission = new Input.Attribute[](1);
        submission[0] = Input.createTextAttribute("name", "My Organization");

        (bool valid, string memory reason) = registry.validateAttributes(ORG_V1_SCHEMA, submission);
        assertFalse(valid);
        assertTrue(bytes(reason).length > 0);
        // Should contain "Missing required attribute"
    }

    function test_validateAttributes_InvalidValue_ReturnsFalse() public {
        _registerOrgV1Schema();

        Input.Attribute[] memory submission = new Input.Attribute[](3);
        submission[0] = Input.createTextAttribute("name", "My Organization");
        submission[1] = Input.createAddressAttribute("admin", 0x742d35Cc6634c0532925a3b8d40C53269b32E16E);
        submission[2] = Input.createEmailAttribute("email", "invalid-email"); // Invalid email

        (bool valid, string memory reason) = registry.validateAttributes(ORG_V1_SCHEMA, submission);
        assertFalse(valid);
        assertTrue(bytes(reason).length > 0);
        // Should contain "Invalid value"
    }

    // ============ Helper Function Tests ============

    function test_generateSchemaId_ValidName_ReturnsHash() public {
        bytes32 schemaId = registry.generateSchemaId("OrgV1");
        assertEq(schemaId, keccak256("OrgV1"));
        assertEq(schemaId, ORG_V1_SCHEMA);
    }

    function test_getSchemaEntry_ValidSchema_ReturnsEntry() public {
        _registerOrgV1Schema();

        SchemaRegistry.SchemaEntry memory entry = registry.getSchemaEntry(ORG_V1_SCHEMA, "name");
        assertTrue(entry.exists);
        assertTrue(entry.attrType == InputType.Text);
        assertTrue(entry.required);

        entry = registry.getSchemaEntry(ORG_V1_SCHEMA, "website");
        assertTrue(entry.exists);
        assertTrue(entry.attrType == InputType.Url);
        assertFalse(entry.required);
    }

    function test_getSchemaEntry_NonexistentSchema_Reverts() public {
        vm.expectRevert(abi.encodeWithSelector(SchemaRegistry.SchemaNotFound.selector, ORG_V1_SCHEMA));
        registry.getSchemaEntry(ORG_V1_SCHEMA, "name");
    }

    function test_getRequiredAttributes_NonexistentSchema_Reverts() public {
        vm.expectRevert(abi.encodeWithSelector(SchemaRegistry.SchemaNotFound.selector, ORG_V1_SCHEMA));
        registry.getRequiredAttributes(ORG_V1_SCHEMA);
    }

    function test_hasSchema_ExistingAndNonExisting_ReturnsCorrectly() public {
        assertFalse(registry.hasSchema(ORG_V1_SCHEMA));
        
        _registerOrgV1Schema();
        
        assertTrue(registry.hasSchema(ORG_V1_SCHEMA));
        assertFalse(registry.hasSchema(ORG_V2_SCHEMA));
    }

    // ============ Multiple Schema Tests ============

    function test_registerSchema_MultipleSchemas_Success() public {
        // Register OrgV1
        _registerOrgV1Schema();

        // Register ProposalV1
        Input.Attribute[] memory proposalAttrs = new Input.Attribute[](3);
        proposalAttrs[0] = Input.createTextAttribute("title", "");
        proposalAttrs[1] = Input.createAddressAttribute("proposer", address(0));
        proposalAttrs[2] = Input.createTextAttribute("description", "");
        
        bool[] memory proposalRequired = new bool[](3);
        proposalRequired[0] = true;
        proposalRequired[1] = true;
        proposalRequired[2] = false;

        registry.registerSchema(PROPOSAL_SCHEMA, proposalAttrs, proposalRequired);

        assertTrue(registry.hasSchema(ORG_V1_SCHEMA));
        assertTrue(registry.hasSchema(PROPOSAL_SCHEMA));

        // Validate against different schemas
        Input.Attribute[] memory orgSubmission = new Input.Attribute[](2);
        orgSubmission[0] = Input.createTextAttribute("name", "My Organization");
        orgSubmission[1] = Input.createAddressAttribute("admin", 0x742d35Cc6634c0532925a3b8d40C53269b32E16E);

        Input.Attribute[] memory proposalSubmission = new Input.Attribute[](2);
        proposalSubmission[0] = Input.createTextAttribute("title", "My Proposal");
        proposalSubmission[1] = Input.createAddressAttribute("proposer", 0x742d35Cc6634c0532925a3b8d40C53269b32E16E);

        (bool orgValid,) = registry.validateAttributes(ORG_V1_SCHEMA, orgSubmission);
        (bool proposalValid,) = registry.validateAttributes(PROPOSAL_SCHEMA, proposalSubmission);
        
        assertTrue(orgValid);
        assertTrue(proposalValid);
    }

    // ============ Edge Cases ============

    function test_validateAttributes_EmptySubmission_ReturnsTrue() public {
        _registerOrgV1Schema();

        Input.Attribute[] memory emptySubmission = new Input.Attribute[](0);
        
        (bool valid, string memory reason) = registry.validateAttributes(ORG_V1_SCHEMA, emptySubmission);
        assertFalse(valid);
        // Should fail due to missing required attributes
    }

    function test_registerSchema_NoRequiredAttributes_Success() public {
        Input.Attribute[] memory schemaAttrs = new Input.Attribute[](2);
        schemaAttrs[0] = Input.createTextAttribute("optional1", "");
        schemaAttrs[1] = Input.createUrlAttribute("optional2", "");
        
        bool[] memory required = new bool[](2);
        required[0] = false;
        required[1] = false;

        registry.registerSchema(ORG_V2_SCHEMA, schemaAttrs, required);

        // Empty submission should be valid
        Input.Attribute[] memory emptySubmission = new Input.Attribute[](0);
        (bool valid, string memory reason) = registry.validateAttributes(ORG_V2_SCHEMA, emptySubmission);
        assertTrue(valid);
        assertEq(reason, "Valid");
    }

    // ============ Helper Functions ============

    function _registerOrgV1Schema() internal {
        Input.Attribute[] memory schemaAttrs = new Input.Attribute[](4);
        schemaAttrs[0] = Input.createTextInput("name", "");
        schemaAttrs[1] = Input.createAddressInput("admin", address(0));
        schemaAttrs[2] = Input.createUrlInput("website", "");
        schemaAttrs[3] = Input.createEmailInput("email", "");

        bool[] memory required = new bool[](4);
        required[0] = true;  // name required
        required[1] = true;  // admin required
        required[2] = false; // website optional
        required[3] = false; // email optional

        registry.registerSchema(ORG_V1_SCHEMA, schemaAttrs, required);
    }
}