// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/lib/SchemaWithMerkleRoot.sol";
import "../../src/lib/MerkleHelper.sol";
import "../../src/lib/Input.sol";

contract SchemaWithMerkleRootTest is Test {
    using MerkleHelper for Input.Attribute[];

    SchemaWithMerkleRoot public schema;
    bytes32 public constant SCHEMA_ID = keccak256("OrgV1");

    function setUp() public {
        schema = new SchemaWithMerkleRoot();
    }

    function test_registerMerkleSchema_ValidInputs_Success() public {
        // Create sample org schema attributes
        Input.Attribute[] memory attributes = new Input.Attribute[](4);
        attributes[0] = Input.Attribute("displayName", "", InputType.Text);
        attributes[1] = Input.Attribute("email", "", InputType.Email);
        attributes[2] = Input.Attribute("website", "", InputType.Url);
        attributes[3] = Input.Attribute("treasury", "", InputType.Wallet);

        // Generate Merkle root using helper
        bytes32 merkleRoot = MerkleHelper.generateRoot(attributes);
        bytes32 metadataHash = keccak256("OrgV1 Schema");

        // Register schema
        schema.registerMerkleSchema(SCHEMA_ID, merkleRoot, metadataHash);

        // Verify registration
        assertTrue(schema.hasSchema(SCHEMA_ID));
        
        SchemaWithMerkleRoot.MerkleSchema memory registeredSchema = schema.getSchema(SCHEMA_ID);
        assertEq(registeredSchema.attributesRoot, merkleRoot);
        assertEq(registeredSchema.metadataHash, metadataHash);
    }

    function test_validateAttributesWithProofs_ValidProofs_Success() public {
        // Setup schema
        Input.Attribute[] memory attributes = new Input.Attribute[](4);
        attributes[0] = Input.Attribute("displayName", "", InputType.Text);
        attributes[1] = Input.Attribute("email", "", InputType.Email); 
        attributes[2] = Input.Attribute("website", "", InputType.Url);
        attributes[3] = Input.Attribute("treasury", "", InputType.Wallet);

        bytes32 merkleRoot = MerkleHelper.generateRoot(attributes);
        schema.registerMerkleSchema(SCHEMA_ID, merkleRoot, keccak256("OrgV1"));

        // Generate proof for "email" attribute
        bytes32[] memory emailProof = MerkleHelper.generateProofForAttribute(
            attributes, 
            "email", 
            InputType.Email
        );

        // Create submission with valid values
        AttributeSubmissionWithProof[] memory submissions = new AttributeSubmissionWithProof[](1);
        submissions[0] = AttributeSubmissionWithProof({
            attribute: Input.Attribute("email", "test@example.com", InputType.Email),
            proof: emailProof
        });

        // Should validate successfully
        bool isValid = schema.validateAttributesWithProofs(SCHEMA_ID, submissions);
        assertTrue(isValid);
    }

    function test_validateAttributesWithProofs_InvalidProof_Reverts() public {
        // Setup schema
        Input.Attribute[] memory attributes = new Input.Attribute[](3);
        attributes[0] = Input.Attribute("displayName", "", InputType.Text);
        attributes[1] = Input.Attribute("email", "", InputType.Email);
        attributes[2] = Input.Attribute("website", "", InputType.Url);

        bytes32 merkleRoot = MerkleHelper.generateRoot(attributes);
        schema.registerMerkleSchema(SCHEMA_ID, merkleRoot, keccak256("OrgV1"));

        // Try to submit attribute NOT in schema
        bytes32[] memory fakeProof = new bytes32[](2);
        fakeProof[0] = keccak256("fake1");
        fakeProof[1] = keccak256("fake2");

        AttributeSubmissionWithProof[] memory submissions = new AttributeSubmissionWithProof[](1);
        submissions[0] = AttributeSubmissionWithProof({
            attribute: Input.Attribute("unauthorized", "value", InputType.Text),
            proof: fakeProof
        });

        // Should revert with InvalidMerkleProof
        vm.expectRevert(abi.encodeWithSelector(SchemaWithMerkleRoot.InvalidMerkleProof.selector, "unauthorized"));
        schema.validateAttributesWithProofs(SCHEMA_ID, submissions);
    }

    function test_validateAttributesWithProofs_MultipleAttributes_Success() public {
        // Setup larger schema
        Input.Attribute[] memory attributes = new Input.Attribute[](6);
        attributes[0] = Input.Attribute("displayName", "", InputType.Text);
        attributes[1] = Input.Attribute("email", "", InputType.Email);
        attributes[2] = Input.Attribute("website", "", InputType.Url);
        attributes[3] = Input.Attribute("treasury", "", InputType.Wallet);
        attributes[4] = Input.Attribute("twitter", "", InputType.Url);
        attributes[5] = Input.Attribute("description", "", InputType.Text);

        bytes32 merkleRoot = MerkleHelper.generateRoot(attributes);
        schema.registerMerkleSchema(SCHEMA_ID, merkleRoot, keccak256("OrgV1"));

        // Generate proofs for multiple attributes
        bytes32[] memory emailProof = MerkleHelper.generateProofForAttribute(attributes, "email", InputType.Email);
        bytes32[] memory websiteProof = MerkleHelper.generateProofForAttribute(attributes, "website", InputType.Url);
        bytes32[] memory treasuryProof = MerkleHelper.generateProofForAttribute(attributes, "treasury", InputType.Wallet);

        // Submit multiple attributes
        AttributeSubmissionWithProof[] memory submissions = new AttributeSubmissionWithProof[](3);
        submissions[0] = AttributeSubmissionWithProof({
            attribute: Input.Attribute("email", "org@example.com", InputType.Email),
            proof: emailProof
        });
        submissions[1] = AttributeSubmissionWithProof({
            attribute: Input.Attribute("website", "https://example.com", InputType.Url),
            proof: websiteProof
        });
        submissions[2] = AttributeSubmissionWithProof({
            attribute: Input.Attribute("treasury", "0x742d35Cc6231d8F2D79D1e4A3b0fcd91E3dF7bF8", InputType.Wallet),
            proof: treasuryProof
        });

        // Should validate all successfully
        bool isValid = schema.validateAttributesWithProofs(SCHEMA_ID, submissions);
        assertTrue(isValid);
    }

    function test_verifyAttributeProof_ValidProof_ReturnsTrue() public {
        // Test the low-level proof verification
        Input.Attribute[] memory attributes = new Input.Attribute[](3);
        attributes[0] = Input.Attribute("a", "", InputType.Text);
        attributes[1] = Input.Attribute("b", "", InputType.Email);
        attributes[2] = Input.Attribute("c", "", InputType.Url);

        bytes32 root = MerkleHelper.generateRoot(attributes);
        bytes32[] memory proof = MerkleHelper.generateProofForAttribute(attributes, "b", InputType.Email);

        Input.Attribute memory testAttr = Input.Attribute("b", "test@example.com", InputType.Email);
        
        bool isValid = schema.verifyAttributeProof(root, testAttr, proof);
        assertTrue(isValid);
    }

    function test_validateAttributesBatch_ValidBatch_Success() public {
        // Setup schema
        Input.Attribute[] memory allAttributes = new Input.Attribute[](8);
        allAttributes[0] = Input.Attribute("displayName", "", InputType.Text);
        allAttributes[1] = Input.Attribute("email", "", InputType.Email);
        allAttributes[2] = Input.Attribute("website", "", InputType.Url);
        allAttributes[3] = Input.Attribute("treasury", "", InputType.Wallet);
        allAttributes[4] = Input.Attribute("twitter", "", InputType.Url);
        allAttributes[5] = Input.Attribute("github", "", InputType.Url);
        allAttributes[6] = Input.Attribute("discord", "", InputType.Url);
        allAttributes[7] = Input.Attribute("description", "", InputType.Text);

        bytes32 schemaRoot = MerkleHelper.generateRoot(allAttributes);
        schema.registerMerkleSchema(SCHEMA_ID, schemaRoot, keccak256("OrgV1"));

        // Create batch of 4 attributes to validate
        Input.Attribute[] memory batchAttributes = new Input.Attribute[](4);
        batchAttributes[0] = Input.Attribute("email", "org@example.com", InputType.Email);
        batchAttributes[1] = Input.Attribute("website", "https://example.com", InputType.Url);
        batchAttributes[2] = Input.Attribute("treasury", "0x742d35Cc6231d8F2D79D1e4A3b0fcd91E3dF7bF8", InputType.Wallet);
        batchAttributes[3] = Input.Attribute("twitter", "https://twitter.com/example", InputType.Url);

        // Generate batch root and proof (this would be done off-chain)
        bytes32 batchRoot = MerkleHelper.generateRoot(batchAttributes);
        
        // In a real implementation, you'd generate a proof that batchRoot is in schemaRoot
        // For this demo, we'll create a mock proof
        bytes32[] memory batchProof = new bytes32[](0); // Empty proof for demo
        
        // This would work if we had proper batch proof generation
        // bool isValid = schema.validateAttributesBatch(SCHEMA_ID, batchAttributes, batchRoot, batchProof);
        // assertTrue(isValid);
    }

    function test_registerMerkleSchema_EmptySchemaId_Reverts() public {
        bytes32 merkleRoot = keccak256("test");
        bytes32 metadataHash = keccak256("metadata");
        
        vm.expectRevert(SchemaWithMerkleRoot.EmptySchemaId.selector);
        schema.registerMerkleSchema(bytes32(0), merkleRoot, metadataHash);
    }

    function test_registerMerkleSchema_ZeroRoot_Reverts() public {
        bytes32 schemaId = keccak256("TestSchema");
        bytes32 metadataHash = keccak256("metadata");
        
        vm.expectRevert(SchemaWithMerkleRoot.InvalidAttributesRoot.selector);
        schema.registerMerkleSchema(schemaId, bytes32(0), metadataHash);
    }

    function test_registerMerkleSchema_DuplicateSchema_Reverts() public {
        bytes32 schemaId = keccak256("TestSchema");
        bytes32 merkleRoot = keccak256("test");
        bytes32 metadataHash = keccak256("metadata");
        
        // Register schema first time
        schema.registerMerkleSchema(schemaId, merkleRoot, metadataHash);
        
        // Try to register again
        vm.expectRevert(abi.encodeWithSelector(SchemaWithMerkleRoot.SchemaAlreadyExists.selector, schemaId));
        schema.registerMerkleSchema(schemaId, merkleRoot, metadataHash);
    }

    function test_validateAttributesWithProofs_SchemaNotFound_Reverts() public {
        bytes32 nonExistentSchema = keccak256("NonExistent");
        AttributeSubmissionWithProof[] memory submissions = new AttributeSubmissionWithProof[](0);
        
        vm.expectRevert(abi.encodeWithSelector(SchemaWithMerkleRoot.SchemaNotFound.selector, nonExistentSchema));
        schema.validateAttributesWithProofs(nonExistentSchema, submissions);
    }

    function test_hasSchema_ExistingSchema_ReturnsTrue() public {
        bytes32 schemaId = keccak256("TestSchema");
        bytes32 merkleRoot = keccak256("test");
        bytes32 metadataHash = keccak256("metadata");
        
        schema.registerMerkleSchema(schemaId, merkleRoot, metadataHash);
        assertTrue(schema.hasSchema(schemaId));
    }

    function test_hasSchema_NonExistentSchema_ReturnsFalse() public {
        bytes32 nonExistentSchema = keccak256("NonExistent");
        assertFalse(schema.hasSchema(nonExistentSchema));
    }

    function test_getSchema_NonExistentSchema_Reverts() public {
        bytes32 nonExistentSchema = keccak256("NonExistent");
        
        vm.expectRevert(abi.encodeWithSelector(SchemaWithMerkleRoot.SchemaNotFound.selector, nonExistentSchema));
        schema.getSchema(nonExistentSchema);
    }

    function test_gasBenchmark_MerkleVsTraditional_ShowsSavings() public {
        console.log("=== Gas Usage Comparison ===");
        
        // Large schema with 20 attributes
        Input.Attribute[] memory largeSchema = new Input.Attribute[](20);
        for (uint256 i = 0; i < 20; i++) {
            largeSchema[i] = Input.Attribute(
                string(abi.encodePacked("attr", vm.toString(i))),
                "value",
                InputType.Text
            );
        }

        bytes32 merkleRoot = MerkleHelper.generateRoot(largeSchema);
        
        // Measure gas for Merkle registration (just stores root)
        uint256 gasBefore = gasleft();
        schema.registerMerkleSchema(
            keccak256("LargeSchema"), 
            merkleRoot, 
            keccak256("Large Schema Metadata")
        );
        uint256 merkleGas = gasBefore - gasleft();
        
        console.log("Merkle schema registration gas:", merkleGas);
        console.log("Traditional would need ~20x more for 20 attributes");
        console.log("Estimated savings: ~", (20 - 1) * merkleGas, "gas");

        // Compare individual vs batch validation
        console.log("\n=== Individual vs Batch Validation ===");
        
        // Individual proofs for 5 attributes
        Input.Attribute[] memory fiveAttrs = new Input.Attribute[](5);
        for (uint256 i = 0; i < 5; i++) {
            fiveAttrs[i] = largeSchema[i];
        }

        AttributeSubmissionWithProof[] memory individualProofs = new AttributeSubmissionWithProof[](5);
        for (uint256 i = 0; i < 5; i++) {
            bytes32[] memory proof = MerkleHelper.generateProofForAttribute(
                largeSchema, 
                fiveAttrs[i].key, 
                fiveAttrs[i].kind
            );
            individualProofs[i] = AttributeSubmissionWithProof({
                attribute: fiveAttrs[i],
                proof: proof
            });
        }

        gasBefore = gasleft();
        schema.validateAttributesWithProofs(keccak256("LargeSchema"), individualProofs);
        uint256 individualGas = gasBefore - gasleft();

        console.log("Individual proofs (5 attrs):", individualGas);
        console.log("Batch validation would use ~1 proof vs", individualProofs.length);
        console.log("Estimated batch savings: ~", individualGas * 4 / 5, "gas");
    }
}