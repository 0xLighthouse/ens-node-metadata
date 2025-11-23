// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "forge-std/Test.sol";
import "../../src/lib/Input.sol";

// Wrapper contract to test library functions
contract InputWrapper {
    function validateSchemaAndInputs(string memory schemaId, Input.Attribute[] memory inputs) external pure {
        Input.validateSchemaAndInputs(schemaId, inputs);
    }

    // Legacy compatibility
    function validateSchemaAndAttributes(string memory schemaId, Input.Attribute[] memory attributes) external pure {
        Input.validateSchemaAndAttributes(schemaId, attributes);
    }
}

contract InputTest is Test {
    using Input for Input.Attribute[];

    InputWrapper public wrapper;

    function setUp() public {
        wrapper = new InputWrapper();
    }

    function testFuzz_validateSchemaAndInputs_EmptySchemaId(string memory key, string memory value) public {
        vm.assume(bytes(key).length > 0); // Assume non-empty key to isolate schema ID test

        Input.Attribute[] memory inputs = new Input.Attribute[](1);
        inputs[0] = Input.createTextInput(key, value);

        vm.expectRevert(Input.EmptySchemaId.selector);
        wrapper.validateSchemaAndInputs("", inputs);
    }

    function testFuzz_validateSchemaAndInputs_EmptyInputKey(string memory schemaId, string memory value) public {
        vm.assume(bytes(schemaId).length > 0); // Assume non-empty schema to isolate key test

        Input.Attribute[] memory inputs = new Input.Attribute[](1);
        inputs[0] = Input.createTextInput("", value);

        vm.expectRevert(Input.EmptyInputKey.selector);
        wrapper.validateSchemaAndInputs(schemaId, inputs);
    }

    function testFuzz_validateSchemaAndInputs_TextInputs(string memory schemaId, string memory key, string memory value)
        public
    {
        vm.assume(bytes(schemaId).length > 0);
        vm.assume(bytes(key).length > 0);

        Input.Attribute[] memory inputs = new Input.Attribute[](1);
        inputs[0] = Input.createTextInput(key, value);

        // Text inputs should never revert (empty values allowed)
        wrapper.validateSchemaAndInputs(schemaId, inputs);
    }

    function testFuzz_validateSchemaAndInputs_EmailInputs(
        string memory schemaId,
        string memory key,
        string memory email
    ) public {
        vm.assume(bytes(schemaId).length > 0);
        vm.assume(bytes(key).length > 0);

        Input.Attribute[] memory inputs = new Input.Attribute[](1);
        inputs[0] = Input.createEmailInput(key, email);

        if (Input.isValidEmail(email)) {
            // Should not revert for valid emails
            wrapper.validateSchemaAndInputs(schemaId, inputs);
        } else {
            // Should revert for invalid emails
            vm.expectRevert(Input.InvalidEmailFormat.selector);
            wrapper.validateSchemaAndInputs(schemaId, inputs);
        }
    }

    function testFuzz_validateSchemaAndInputs_UrlInputs(string memory schemaId, string memory key, string memory url)
        public
    {
        vm.assume(bytes(schemaId).length > 0);
        vm.assume(bytes(key).length > 0);

        Input.Attribute[] memory inputs = new Input.Attribute[](1);
        inputs[0] = Input.createUrlInput(key, url);

        if (Input.isValidUrl(url)) {
            // Should not revert for valid URLs
            wrapper.validateSchemaAndInputs(schemaId, inputs);
        } else {
            // Should revert for invalid URLs
            vm.expectRevert(Input.InvalidUrlFormat.selector);
            wrapper.validateSchemaAndInputs(schemaId, inputs);
        }
    }

    function testFuzz_validateSchemaAndInputs_AddressInputs(string memory schemaId, string memory key, address addr)
        public
    {
        vm.assume(bytes(schemaId).length > 0);
        vm.assume(bytes(key).length > 0);

        Input.Attribute[] memory inputs = new Input.Attribute[](1);
        inputs[0] = Input.createAddressInput(key, addr);

        // Address inputs created via createAddressInput should always be valid
        wrapper.validateSchemaAndInputs(schemaId, inputs);
    }

    function testFuzz_validateSchemaAndInputs_ManualAddressInputs(
        string memory schemaId,
        string memory key,
        string memory addrStr
    ) public {
        vm.assume(bytes(schemaId).length > 0);
        vm.assume(bytes(key).length > 0);

        Input.Attribute[] memory inputs = new Input.Attribute[](1);
        inputs[0] = Input.Attribute(key, addrStr, InputType.Wallet);

        if (Input.isValidAddress(addrStr)) {
            // Should not revert for valid address strings
            wrapper.validateSchemaAndInputs(schemaId, inputs);
        } else {
            // Should revert for invalid address strings
            vm.expectRevert(Input.InvalidAddressFormat.selector);
            wrapper.validateSchemaAndInputs(schemaId, inputs);
        }
    }

    function testFuzz_isValidEmail(string memory email) public pure {
        bool result = Input.isValidEmail(email);
        bytes memory emailBytes = bytes(email);

        if (result) {
            // If marked as valid, verify it meets basic requirements
            assertTrue(emailBytes.length >= 5, "Valid email should be at least 5 chars");
            assertTrue(emailBytes.length <= 320, "Valid email should be at most 320 chars");

            // Should contain exactly one @
            uint256 atCount = 0;
            uint256 atPosition = 0;
            for (uint256 i = 0; i < emailBytes.length; i++) {
                if (emailBytes[i] == "@") {
                    atCount++;
                    atPosition = i;
                }
            }
            assertEq(atCount, 1, "Valid email should have exactly one @");
            assertTrue(atPosition > 0, "@ should not be at start");
            assertTrue(atPosition < emailBytes.length - 1, "@ should not be at end");

            // Should have a dot after @
            bool hasDotAfterAt = false;
            for (uint256 i = atPosition + 2; i < emailBytes.length; i++) {
                if (emailBytes[i] == ".") {
                    hasDotAfterAt = true;
                    break;
                }
            }
            assertTrue(hasDotAfterAt, "Valid email should have dot after @");
        }
    }

    function testFuzz_isValidUrl(string memory url) public pure {
        bool result = Input.isValidUrl(url);
        bytes memory urlBytes = bytes(url);

        if (result) {
            // If marked as valid, verify it meets requirements
            assertTrue(urlBytes.length >= 8, "Valid URL should be at least 8 chars");

            // Should start with valid protocol
            bool hasValidProtocol = false;
            if (urlBytes.length >= 7) {
                // Check for http://
                if (
                    urlBytes[0] == "h" && urlBytes[1] == "t" && urlBytes[2] == "t" && urlBytes[3] == "p"
                        && urlBytes[4] == ":" && urlBytes[5] == "/" && urlBytes[6] == "/"
                ) {
                    hasValidProtocol = true;
                }
                // Check for https://
                else if (
                    urlBytes.length >= 8 && urlBytes[0] == "h" && urlBytes[1] == "t" && urlBytes[2] == "t"
                        && urlBytes[3] == "p" && urlBytes[4] == "s" && urlBytes[5] == ":" && urlBytes[6] == "/"
                        && urlBytes[7] == "/"
                ) {
                    hasValidProtocol = true;
                }
                // Check for ipfs://
                else if (
                    urlBytes[0] == "i" && urlBytes[1] == "p" && urlBytes[2] == "f" && urlBytes[3] == "s"
                        && urlBytes[4] == ":" && urlBytes[5] == "/" && urlBytes[6] == "/"
                ) {
                    hasValidProtocol = true;
                }
            }
            assertTrue(hasValidProtocol, "Valid URL should have valid protocol");
        }
    }

    function testFuzz_isValidAddress(string memory addr) public pure {
        bool result = Input.isValidAddress(addr);
        bytes memory addrBytes = bytes(addr);

        if (result) {
            // If marked as valid, verify it meets requirements
            assertEq(addrBytes.length, 42, "Valid address should be exactly 42 chars");
            assertEq(addrBytes[0], "0", "Valid address should start with 0");
            assertEq(addrBytes[1], "x", "Valid address should have x as second char");

            // All remaining chars should be valid hex
            for (uint256 i = 2; i < 42; i++) {
                bytes1 char = addrBytes[i];
                bool isValidHex =
                    (char >= "0" && char <= "9") || (char >= "a" && char <= "f") || (char >= "A" && char <= "F");
                assertTrue(isValidHex, "Valid address should contain only hex chars");
            }
        } else {
            // If marked as invalid, should fail at least one requirement
            bool hasValidLength = addrBytes.length == 42;
            bool hasValidPrefix = addrBytes.length >= 2 && addrBytes[0] == "0" && addrBytes[1] == "x";
            bool hasValidHex = true;

            if (hasValidLength && hasValidPrefix) {
                for (uint256 i = 2; i < 42; i++) {
                    bytes1 char = addrBytes[i];
                    if (!((char >= "0" && char <= "9") || (char >= "a" && char <= "f") || (char >= "A" && char <= "F")))
                    {
                        hasValidHex = false;
                        break;
                    }
                }
            }

            assertTrue(
                !(hasValidLength && hasValidPrefix && hasValidHex), "Invalid address should fail at least one check"
            );
        }
    }

    function testFuzz_parseAddress(string memory addr) public pure {
        address result = Input.parseAddress(addr);

        if (Input.isValidAddress(addr)) {
            // If input is valid, result should not be zero (unless input represents zero address)
            // Convert result back to string and compare with lowercased input
            string memory resultStr = Input.addressToString(result);

            // Convert input to lowercase for comparison
            bytes memory addrBytes = bytes(addr);
            bytes memory lowerAddr = new bytes(addrBytes.length);
            for (uint256 i = 0; i < addrBytes.length; i++) {
                bytes1 char = addrBytes[i];
                if (char >= "A" && char <= "F") {
                    lowerAddr[i] = bytes1(uint8(char) + 32); // Convert to lowercase
                } else {
                    lowerAddr[i] = char;
                }
            }

            assertEq(resultStr, string(lowerAddr), "Parsed address should match input when converted back");
        } else {
            // If input is invalid, should return zero address
            assertEq(result, address(0), "Invalid address should parse to zero address");
        }
    }

    function testFuzz_validateSchemaAndInputs_MixedValidTypes(string memory schemaId, address addr) public {
        vm.assume(bytes(schemaId).length > 0);

        Input.Attribute[] memory inputs = new Input.Attribute[](4);
        inputs[0] = Input.createTextInput("name", "Test Organization");
        inputs[1] = Input.createEmailInput("contact", "test@example.com");
        inputs[2] = Input.createUrlInput("website", "https://example.com");
        inputs[3] = Input.createAddressInput("treasury", addr);

        // Should not revert with mixed valid types
        wrapper.validateSchemaAndInputs(schemaId, inputs);
    }

    function testFuzz_validateSchemaAndInputs_MultipleInputs(string memory schemaId, uint8 inputCount) public {
        vm.assume(bytes(schemaId).length > 0);
        vm.assume(inputCount > 0 && inputCount <= 10); // Reasonable bounds

        Input.Attribute[] memory inputs = new Input.Attribute[](inputCount);
        for (uint256 i = 0; i < inputCount; i++) {
            inputs[i] = Input.createTextInput(string(abi.encodePacked("field", i)), "value");
        }

        // Should handle multiple valid inputs
        wrapper.validateSchemaAndInputs(schemaId, inputs);
    }

    function testFuzz_createAddressInput(string memory key, address addr) public pure {
        Input.Attribute memory attr = Input.createAddressInput(key, addr);

        assertEq(attr.key, key, "Key should match input");
        assertEq(attr.value, Input.addressToString(addr), "Value should be address string");
        assertTrue(attr.kind == InputType.Wallet, "Kind should be Wallet");
        assertTrue(Input.isValidAddress(attr.value), "Generated address string should be valid");
    }

    function testFuzz_addressToString(address addr) public pure {
        string memory result = Input.addressToString(addr);

        // Result should always be valid address format
        assertTrue(Input.isValidAddress(result), "Address string should be valid format");

        // Should be exactly 42 characters
        assertEq(bytes(result).length, 42, "Address string should be 42 chars");

        // Should start with 0x
        bytes memory resultBytes = bytes(result);
        assertEq(resultBytes[0], "0", "Should start with 0");
        assertEq(resultBytes[1], "x", "Should have x as second char");

        // Parsing the result should give back the original address
        assertEq(Input.parseAddress(result), addr, "Parsing result should give original address");

        // Result should be lowercase hex
        for (uint256 i = 2; i < 42; i++) {
            bytes1 char = resultBytes[i];
            assertTrue(
                (char >= "0" && char <= "9") || (char >= "a" && char <= "f"), "Address string should be lowercase hex"
            );
        }
    }

    function testFuzz_createInputTypes(
        string memory key,
        string memory textValue,
        string memory emailValue,
        string memory urlValue,
        address addrValue
    ) public pure {
        // Test all create functions
        Input.Attribute memory textAttr = Input.createTextInput(key, textValue);
        assertEq(textAttr.key, key);
        assertEq(textAttr.value, textValue);
        assertTrue(textAttr.kind == InputType.Text);

        Input.Attribute memory emailAttr = Input.createEmailInput(key, emailValue);
        assertEq(emailAttr.key, key);
        assertEq(emailAttr.value, emailValue);
        assertTrue(emailAttr.kind == InputType.Email);

        Input.Attribute memory urlAttr = Input.createUrlInput(key, urlValue);
        assertEq(urlAttr.key, key);
        assertEq(urlAttr.value, urlValue);
        assertTrue(urlAttr.kind == InputType.Url);

        Input.Attribute memory addrAttr = Input.createAddressInput(key, addrValue);
        assertEq(addrAttr.key, key);
        assertEq(addrAttr.value, Input.addressToString(addrValue));
        assertTrue(addrAttr.kind == InputType.Wallet);
    }

    // Test legacy compatibility functions
    function test_legacyFunctions_StillWork() public {
        Input.Attribute[] memory inputs = new Input.Attribute[](2);
        inputs[0] = Input.createEmailAttribute("email", "test@example.com"); // Legacy function
        inputs[1] = Input.createTextAttribute("name", "Test Org"); // Legacy function

        // Legacy function should still work
        wrapper.validateSchemaAndAttributes("test-schema", inputs);
    }
}
