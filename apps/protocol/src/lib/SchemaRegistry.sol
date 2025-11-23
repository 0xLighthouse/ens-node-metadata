// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Input.sol";

/**
 * @title SchemaRegistry
 * @dev Registry for versioned attribute schemas with dynamic validation
 * 
 * Supports:
 * - Versioned schemas (e.g., "OrgV1", "OrgV2", "ProposalV1")
 * - Required/optional attribute definitions
 * - Type enforcement at runtime
 * - Dynamic schema registration and validation
 */
contract SchemaRegistry {
    using Input for Input.Attribute;

    struct SchemaEntry {
        InputType attrType; // Expected type: Email, Url, Wallet, Text
        bool required;      // Whether this attribute is required
        bool exists;        // Whether this schema entry exists
    }

    // schemaId => attributeKey => schema definition
    mapping(bytes32 => mapping(string => SchemaEntry)) public schemaDefinitions;
    
    // schemaId => array of required attribute keys
    mapping(bytes32 => string[]) public requiredKeys;
    
    // schemaId => whether schema exists
    mapping(bytes32 => bool) public schemaExists;

    // Events
    event SchemaRegistered(bytes32 indexed schemaId, uint256 attributeCount);
    event SchemaUpdated(bytes32 indexed schemaId, uint256 attributeCount);

    // Custom errors
    error SchemaAlreadyExists(bytes32 schemaId);
    error SchemaNotFound(bytes32 schemaId);
    error AttributeArrayLengthMismatch();
    error UnexpectedAttributeKey(string key, bytes32 schemaId);
    error AttributeTypeMismatch(string key, string expected, string actual);
    error MissingRequiredAttribute(string key, bytes32 schemaId);
    error EmptySchemaId();
    error EmptyAttributeKey();

    /**
     * @dev Register a new schema with attribute definitions
     * @param schemaId Unique identifier for the schema (e.g., keccak256("OrgV1"))
     * @param schemaAttributes Array of attribute definitions with keys and expected types
     * @param isRequired Array indicating which attributes are required
     */
    function registerSchema(
        bytes32 schemaId,
        Input.Attribute[] memory schemaAttributes,
        bool[] memory isRequired
    ) external {
        if (schemaId == 0) revert EmptySchemaId();
        if (schemaExists[schemaId]) revert SchemaAlreadyExists(schemaId);
        if (schemaAttributes.length != isRequired.length) revert AttributeArrayLengthMismatch();

        // Clear any existing required keys array (though it should be empty for new schemas)
        delete requiredKeys[schemaId];

        // Register each attribute definition
        for (uint256 i = 0; i < schemaAttributes.length; i++) {
            string memory key = schemaAttributes[i].key;
            if (bytes(key).length == 0) revert EmptyAttributeKey();

            schemaDefinitions[schemaId][key] = SchemaEntry({
                attrType: schemaAttributes[i].kind,
                required: isRequired[i],
                exists: true
            });

            // Add to required keys if necessary
            if (isRequired[i]) {
                requiredKeys[schemaId].push(key);
            }
        }

        schemaExists[schemaId] = true;
        emit SchemaRegistered(schemaId, schemaAttributes.length);
    }

    /**
     * @dev Update an existing schema (replaces all attribute definitions)
     * @param schemaId Schema identifier to update
     * @param schemaAttributes New attribute definitions
     * @param isRequired New required flags
     */
    function updateSchema(
        bytes32 schemaId,
        Input.Attribute[] memory schemaAttributes,
        bool[] memory isRequired
    ) external {
        if (schemaId == 0) revert EmptySchemaId();
        if (!schemaExists[schemaId]) revert SchemaNotFound(schemaId);
        if (schemaAttributes.length != isRequired.length) revert AttributeArrayLengthMismatch();

        // Clear existing required keys
        delete requiredKeys[schemaId];

        // Update attribute definitions
        for (uint256 i = 0; i < schemaAttributes.length; i++) {
            string memory key = schemaAttributes[i].key;
            if (bytes(key).length == 0) revert EmptyAttributeKey();

            schemaDefinitions[schemaId][key] = SchemaEntry({
                attrType: schemaAttributes[i].kind,
                required: isRequired[i],
                exists: true
            });

            if (isRequired[i]) {
                requiredKeys[schemaId].push(key);
            }
        }

        emit SchemaUpdated(schemaId, schemaAttributes.length);
    }

    /**
     * @dev Validate attributes against a registered schema
     * @param schemaId Schema to validate against
     * @param submission Attributes to validate
     * @return valid Whether validation passed
     * @return reason Error message if validation failed
     */
    function validateAttributes(
        bytes32 schemaId,
        Input.Attribute[] memory submission
    ) external view returns (bool valid, string memory reason) {
        if (schemaId == 0) {
            return (false, "Empty schema ID");
        }
        
        if (!schemaExists[schemaId]) {
            return (false, "Schema not found");
        }

        // Validate each submitted attribute
        for (uint256 i = 0; i < submission.length; i++) {
            string memory key = submission[i].key;
            InputType submittedType = submission[i].kind;
            
            SchemaEntry memory schemaEntry = schemaDefinitions[schemaId][key];

            // Check if attribute key exists in schema
            if (!schemaEntry.exists) {
                return (false, string(abi.encodePacked("Unexpected attribute key: ", key)));
            }

            // Check type match
            if (schemaEntry.attrType != submittedType) {
                return (false, string(abi.encodePacked(
                    "Type mismatch for key '", key, "': expected type ", 
                    _inputTypeToString(schemaEntry.attrType), ", got type ", _inputTypeToString(submittedType)
                )));
            }

            // Validate the actual value using AttributeValidator
            try this.validateSingleAttribute(submission[i]) {
                // Value validation passed
            } catch {
                return (false, string(abi.encodePacked("Invalid value for key: ", key)));
            }
        }

        // Check that all required attributes are present
        string[] memory required = requiredKeys[schemaId];
        for (uint256 i = 0; i < required.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < submission.length; j++) {
                if (keccak256(bytes(submission[j].key)) == keccak256(bytes(required[i]))) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                return (false, string(abi.encodePacked("Missing required attribute: ", required[i])));
            }
        }

        return (true, "Valid");
    }

    /**
     * @dev External wrapper for AttributeValidator to enable try/catch
     * @param attribute Single attribute to validate
     */
    function validateSingleAttribute(Input.Attribute memory attribute) external pure {
        // Create single-item array for compatibility with existing validator
        Input.Attribute[] memory singleAttr = new Input.Attribute[](1);
        singleAttr[0] = attribute;
        
        // Use existing validation logic but ignore schema validation
        Input.validateSchemaAndAttributes("temp", singleAttr);
    }

    /**
     * @dev Check if a schema exists
     * @param schemaId Schema identifier to check
     * @return Whether the schema exists
     */
    function hasSchema(bytes32 schemaId) external view returns (bool) {
        return schemaExists[schemaId];
    }

    /**
     * @dev Get required attributes for a schema
     * @param schemaId Schema identifier
     * @return Array of required attribute keys
     */
    function getRequiredAttributes(bytes32 schemaId) external view returns (string[] memory) {
        if (!schemaExists[schemaId]) revert SchemaNotFound(schemaId);
        return requiredKeys[schemaId];
    }

    /**
     * @dev Get schema entry for a specific attribute
     * @param schemaId Schema identifier
     * @param attributeKey Attribute key to look up
     * @return SchemaEntry data for the attribute
     */
    function getSchemaEntry(bytes32 schemaId, string memory attributeKey) 
        external view returns (SchemaEntry memory) {
        if (!schemaExists[schemaId]) revert SchemaNotFound(schemaId);
        return schemaDefinitions[schemaId][attributeKey];
    }

    /**
     * @dev Generate schema ID from string
     * @param schemaName Human-readable schema name (e.g., "OrgV1")
     * @return Schema ID as bytes32
     */
    function generateSchemaId(string memory schemaName) external pure returns (bytes32) {
        return keccak256(bytes(schemaName));
    }

    /**
     * @dev Convert InputType enum to string for error messages
     * @param inputType The InputType to convert
     * @return String representation of the input type
     */
    function _inputTypeToString(InputType inputType) internal pure returns (string memory) {
        if (inputType == InputType.Email) return "Email";
        if (inputType == InputType.Url) return "Url";
        if (inputType == InputType.Wallet) return "Wallet";
        if (inputType == InputType.Text) return "Text";
        return "Unknown";
    }
}