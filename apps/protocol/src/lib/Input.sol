// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

struct Email {
    string email;
}

struct Url {
    string url;
}

struct Wallet {
    address wallet;
}

struct Text {
    string text;
}

enum InputType {
    Email,
    Url,
    Wallet,
    Text
}

/**
 * @title Input
 *
 * @dev Library for validating organizational inputs with type checking
 *
 * Supports validation for:
 * - string: Basic string validation (non-empty)
 * - email: RFC-compliant email format validation
 * - url: URL format validation (http/https/ipfs protocols)
 * - address: Ethereum address format validation
 */
library Input {
    // Generic input structure
    struct Attribute {
        /**
         * @dev Input key (e.g., "displayName", "email")
         */
        string key;
        /**
         * @dev Input value
         */
        string value;
        /**
         * @dev Input type ("string", "url", "email", "address")
         */
        InputType kind;
    }

    // Custom errors for better gas efficiency and clarity
    error EmptySchemaId();
    error EmptyInputKey();
    error InvalidEmailFormat();
    error InvalidUrlFormat();
    error InvalidAddressFormat();
    error InvalidStringValue();

    /**
     * @dev Validate schema and inputs against type definitions
     * @param schemaId Schema identifier to validate against
     * @param inputs Array of input data to validate
     */
    function validateSchemaAndInputs(string memory schemaId, Attribute[] memory inputs) internal pure {
        if (bytes(schemaId).length == 0) revert EmptySchemaId();

        // Validate each input based on its type
        for (uint256 i = 0; i < inputs.length; i++) {
            validateSingleInputType(inputs[i]);
        }
    }

    /**
     * @dev Validate a single input's value against its declared type
     * @param input The input to validate
     */
    function validateSingleInputType(Attribute memory input) internal pure {
        if (bytes(input.key).length == 0) revert EmptyInputKey();

        // Type-specific validation using enum
        if (input.kind == InputType.Email) {
            if (!isValidEmail(input.value)) revert InvalidEmailFormat();
        } else if (input.kind == InputType.Url) {
            if (!isValidUrl(input.value)) revert InvalidUrlFormat();
        } else if (input.kind == InputType.Wallet) {
            if (!isValidAddress(input.value)) revert InvalidAddressFormat();
        } else if (input.kind == InputType.Text) {
            // For text, we can optionally validate they're not empty
            // Currently allowing empty strings as they might be optional
        }
        // Unknown types are allowed and treated as strings (no additional validation)
    }

    /**
     * @dev Basic email validation following RFC 5322 simplified rules
     * @param email Email address to validate
     * @return True if email appears to be valid format
     */
    function isValidEmail(string memory email) internal pure returns (bool) {
        bytes memory emailBytes = bytes(email);
        if (emailBytes.length < 5 || emailBytes.length > 320) return false;

        bool hasAt = false;
        bool hasDot = false;
        uint256 atPosition = 0;

        for (uint256 i = 0; i < emailBytes.length; i++) {
            bytes1 char = emailBytes[i];

            if (char == "@") {
                if (hasAt || i == 0 || i == emailBytes.length - 1) return false;
                hasAt = true;
                atPosition = i;
            } else if (char == "." && hasAt && i > atPosition + 1) {
                hasDot = true;
            }
        }

        return hasAt && hasDot;
    }

    /**
     * @dev Basic URL validation for common protocols
     * @param url URL to validate
     * @return True if URL appears to be valid format
     */
    function isValidUrl(string memory url) internal pure returns (bool) {
        bytes memory urlBytes = bytes(url);
        if (urlBytes.length < 8) return false; // Minimum: "http://a"

        // Check for http:// or https:// or ipfs://
        bool validProtocol = false;
        if (urlBytes.length >= 7) {
            if (urlBytes[0] == "h" && urlBytes[1] == "t" && urlBytes[2] == "t" && urlBytes[3] == "p") {
                if (urlBytes[4] == ":" && urlBytes[5] == "/" && urlBytes[6] == "/") {
                    validProtocol = true;
                } else if (
                    urlBytes.length >= 8 && urlBytes[4] == "s" && urlBytes[5] == ":" && urlBytes[6] == "/"
                        && urlBytes[7] == "/"
                ) {
                    validProtocol = true;
                }
            } else if (
                urlBytes.length >= 7 && urlBytes[0] == "i" && urlBytes[1] == "p" && urlBytes[2] == "f"
                    && urlBytes[3] == "s" && urlBytes[4] == ":" && urlBytes[5] == "/" && urlBytes[6] == "/"
            ) {
                validProtocol = true;
            }
        }

        return validProtocol;
    }

    /**
     * @dev Ethereum address validation (checks if string looks like hex address)
     * @param addr Address string to validate
     * @return True if address appears to be valid format
     */
    function isValidAddress(string memory addr) internal pure returns (bool) {
        bytes memory addrBytes = bytes(addr);
        if (addrBytes.length != 42) return false; // Must be "0x" + 40 hex chars

        if (addrBytes[0] != "0" || addrBytes[1] != "x") return false;

        for (uint256 i = 2; i < 42; i++) {
            bytes1 char = addrBytes[i];
            if (!((char >= "0" && char <= "9") || (char >= "a" && char <= "f") || (char >= "A" && char <= "F"))) {
                return false;
            }
        }

        return true;
    }

    /**
     * @dev Parse address from string
     * @param addr Address string to parse
     * @return Parsed address (returns zero address if invalid)
     */
    function parseAddress(string memory addr) internal pure returns (address) {
        if (!isValidAddress(addr)) return address(0);

        bytes memory addrBytes = bytes(addr);
        uint160 result = 0;

        for (uint256 i = 2; i < 42; i++) {
            result *= 16;
            bytes1 char = addrBytes[i];

            if (char >= "0" && char <= "9") {
                result += uint160(uint8(char)) - 48;
            } else if (char >= "a" && char <= "f") {
                result += uint160(uint8(char)) - 87;
            } else if (char >= "A" && char <= "F") {
                result += uint160(uint8(char)) - 55;
            }
        }

        return address(result);
    }

    /**
     * @dev Convert address to hex string with 0x prefix
     * @param addr The address to convert
     * @return Hex string representation
     */
    function addressToString(address addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42); // "0x" + 40 hex chars
        str[0] = "0";
        str[1] = "x";

        uint256 value = uint256(uint160(addr));
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[(value >> (8 * (19 - i) + 4)) & 0xf];
            str[3 + i * 2] = alphabet[(value >> (8 * (19 - i))) & 0xf];
        }

        return string(str);
    }

    /**
     * @dev Create an Attribute from a native address
     * @param key Input key
     * @param addr Native address value
     * @return Attribute struct with address converted to string
     */
    function createAddressInput(string memory key, address addr) internal pure returns (Attribute memory) {
        return Attribute({key: key, value: addressToString(addr), kind: InputType.Wallet});
    }

    /**
     * @dev Create an Attribute from an email
     * @param key Input key
     * @param email Email value
     * @return Attribute struct with email
     */
    function createEmailInput(string memory key, string memory email) internal pure returns (Attribute memory) {
        return Attribute({key: key, value: email, kind: InputType.Email});
    }

    /**
     * @dev Create an Attribute from a URL
     * @param key Input key
     * @param url URL value
     * @return Attribute struct with URL
     */
    function createUrlInput(string memory key, string memory url) internal pure returns (Attribute memory) {
        return Attribute({key: key, value: url, kind: InputType.Url});
    }

    /**
     * @dev Create an Attribute from text
     * @param key Input key
     * @param text Text value
     * @return Attribute struct with text
     */
    function createTextInput(string memory key, string memory text) internal pure returns (Attribute memory) {
        return Attribute({key: key, value: text, kind: InputType.Text});
    }

    // Legacy compatibility - keep old function names but mark deprecated
    /**
     * @dev DEPRECATED: Use validateSchemaAndInputs instead
     */
    function validateSchemaAndAttributes(string memory schemaId, Attribute[] memory attributes) internal pure {
        validateSchemaAndInputs(schemaId, attributes);
    }

    /**
     * @dev DEPRECATED: Use createAddressInput instead
     */
    function createAddressAttribute(string memory key, address addr) internal pure returns (Attribute memory) {
        return createAddressInput(key, addr);
    }

    /**
     * @dev DEPRECATED: Use createEmailInput instead
     */
    function createEmailAttribute(string memory key, string memory email) internal pure returns (Attribute memory) {
        return createEmailInput(key, email);
    }

    /**
     * @dev DEPRECATED: Use createUrlInput instead
     */
    function createUrlAttribute(string memory key, string memory url) internal pure returns (Attribute memory) {
        return createUrlInput(key, url);
    }

    /**
     * @dev DEPRECATED: Use createTextInput instead
     */
    function createTextAttribute(string memory key, string memory text) internal pure returns (Attribute memory) {
        return createTextInput(key, text);
    }
}