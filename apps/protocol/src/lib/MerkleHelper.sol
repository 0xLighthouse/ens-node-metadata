// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Input.sol";
import {MerkleProofLib} from "solady/utils/MerkleProofLib.sol";

/**
 * @title MerkleHelper
 * @dev Native Solidity utilities for Merkle tree operations - use in tests, scripts, and off-chain tools
 *
 * ## Purpose
 * Provides pure Solidity functions to build Merkle trees and generate proofs without
 * external dependencies. Perfect for:
 * - Forge test suites (no JS/TS dependencies)
 * - Foundry scripts for schema setup
 * - Off-chain proof generation tools
 * - Integration testing with SchemaWithMerkleRoot
 *
 * ## Key Functions
 * 1. `generateRoot()` - Build Merkle root from attribute array
 * 2. `generateProofForAttribute()` - Create proof for single attribute
 * 3. `generateProof()` - Create proof for leaf at specific index
 * 4. `sort()` - Deterministic sorting for consistent tree construction
 *
 * ## Usage Pattern
 * ```solidity
 * // 1. Define your schema attributes
 * Attribute[] memory schema = new Attribute[](3);
 * schema[0] = Attribute("email", "", InputType.Email);
 * schema[1] = Attribute("website", "", InputType.Url);
 * schema[2] = Attribute("treasury", "", InputType.Wallet);
 *
 * // 2. Generate schema root for registration
 * bytes32 schemaRoot = MerkleHelper.generateRoot(schema);
 * schemaRegistry.registerMerkleSchema(schemaId, schemaRoot, metadata);
 *
 * // 3. Generate proofs for user submissions
 * bytes32[] memory emailProof = MerkleHelper.generateProofForAttribute(
 *     schema, "email", InputType.Email
 * );
 * ```
 *
 * @notice Uses Solady's MerkleProofLib for gas-optimized proof verification
 * @notice All functions are pure - no state changes, safe for view contexts
 * @notice Deterministic sorting ensures consistent roots across different environments
 */
library MerkleHelper {
    /**
     * @dev Create leaf hash for an attribute
     * @param key Attribute key
     * @param kind Attribute type
     * @return Leaf hash
     */
    function createLeaf(string memory key, InputType kind) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(key, uint8(kind)));
    }

    /**
     * @dev Create leaf hash from Attribute struct
     * @param attr Attribute to hash
     * @return Leaf hash
     */
    function createLeaf(Input.Attribute memory attr) internal pure returns (bytes32) {
        return createLeaf(attr.key, attr.kind);
    }

    /**
     * @dev Hash two nodes together (used in tree construction)
     * @param left Left node
     * @param right Right node
     * @return Combined hash
     */
    function hashPair(bytes32 left, bytes32 right) internal pure returns (bytes32) {
        return left <= right ? keccak256(abi.encodePacked(left, right)) : keccak256(abi.encodePacked(right, left));
    }

    /**
     * @dev Sort array of bytes32 (for deterministic tree construction)
     * @param arr Array to sort
     * @return Sorted array
     */
    function sort(bytes32[] memory arr) internal pure returns (bytes32[] memory) {
        if (arr.length <= 1) return arr;

        // Simple bubble sort (fine for test data)
        for (uint256 i = 0; i < arr.length - 1; i++) {
            for (uint256 j = 0; j < arr.length - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    bytes32 temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
        return arr;
    }

    /**
     * @dev Build Merkle root from array of leaves
     * @param leaves Sorted array of leaf hashes
     * @return Root hash
     */
    function buildRoot(bytes32[] memory leaves) internal pure returns (bytes32) {
        if (leaves.length == 0) return bytes32(0);
        if (leaves.length == 1) return leaves[0];

        bytes32[] memory currentLevel = leaves;

        while (currentLevel.length > 1) {
            bytes32[] memory nextLevel = new bytes32[]((currentLevel.length + 1) / 2);
            uint256 nextIndex = 0;

            for (uint256 i = 0; i < currentLevel.length; i += 2) {
                if (i + 1 < currentLevel.length) {
                    nextLevel[nextIndex] = hashPair(currentLevel[i], currentLevel[i + 1]);
                } else {
                    nextLevel[nextIndex] = currentLevel[i];
                }
                nextIndex++;
            }

            currentLevel = nextLevel;
        }

        return currentLevel[0];
    }

    /**
     * @dev Generate Merkle root from attribute array - MAIN ENTRY POINT
     *
     * ## Purpose
     * Creates deterministic Merkle root for schema registration and validation.
     * Used by both schema owners (to register) and users (to create batch roots).
     *
     * ## Process
     * 1. Convert attributes to leaf hashes (key + type)
     * 2. Sort leaves deterministically (consistent across environments)
     * 3. Build balanced binary tree bottom-up
     * 4. Return root hash
     *
     * ## Example
     * ```solidity
     * Attribute[] memory orgSchema = new Attribute[](3);
     * orgSchema[0] = Attribute("email", "", InputType.Email);
     * orgSchema[1] = Attribute("website", "", InputType.Url);
     * orgSchema[2] = Attribute("treasury", "", InputType.Wallet);
     *
     * bytes32 root = MerkleHelper.generateRoot(orgSchema);
     * // Use this root to register schema or validate batches
     * ```
     *
     * @param attributes Array of attributes to build tree from
     * @return Root hash of the Merkle tree
     *
     * @notice Input order doesn't matter - leaves are sorted deterministically
     * @notice Empty array returns bytes32(0), single item returns its leaf hash
     */
    function generateRoot(Input.Attribute[] memory attributes) internal pure returns (bytes32) {
        if (attributes.length == 0) return bytes32(0);

        bytes32[] memory leaves = new bytes32[](attributes.length);
        for (uint256 i = 0; i < attributes.length; i++) {
            leaves[i] = createLeaf(attributes[i]);
        }

        leaves = sort(leaves);
        return buildRoot(leaves);
    }

    /**
     * @dev Find index of target leaf in sorted array
     * @param leaves Sorted array of leaves
     * @param target Target leaf to find
     * @return Index of target (-1 if not found, but will revert)
     */
    function findLeafIndex(bytes32[] memory leaves, bytes32 target) internal pure returns (uint256) {
        for (uint256 i = 0; i < leaves.length; i++) {
            if (leaves[i] == target) return i;
        }
        revert("Leaf not found");
    }

    /**
     * @dev Generate proof for target leaf
     * @param leaves Sorted array of all leaves
     * @param targetIndex Index of target leaf
     * @return Proof array
     */
    function generateProof(bytes32[] memory leaves, uint256 targetIndex) internal pure returns (bytes32[] memory) {
        require(targetIndex < leaves.length, "Invalid target index");

        if (leaves.length <= 1) return new bytes32[](0);

        // Calculate max proof length
        uint256 maxProofLength = 0;
        uint256 temp = leaves.length;
        while (temp > 1) {
            maxProofLength++;
            temp = (temp + 1) / 2;
        }

        bytes32[] memory proof = new bytes32[](maxProofLength);
        uint256 proofIndex = 0;
        uint256 currentIndex = targetIndex;
        bytes32[] memory currentLevel = leaves;

        while (currentLevel.length > 1) {
            bytes32[] memory nextLevel = new bytes32[]((currentLevel.length + 1) / 2);
            uint256 nextIndex = 0;

            for (uint256 i = 0; i < currentLevel.length; i += 2) {
                if (i == currentIndex || i + 1 == currentIndex) {
                    if (i + 1 < currentLevel.length) {
                        // Add sibling to proof
                        proof[proofIndex] = (i == currentIndex) ? currentLevel[i + 1] : currentLevel[i];
                        proofIndex++;
                        nextLevel[nextIndex] = hashPair(currentLevel[i], currentLevel[i + 1]);
                    } else {
                        nextLevel[nextIndex] = currentLevel[i];
                    }
                    currentIndex = nextIndex;
                } else {
                    if (i + 1 < currentLevel.length) {
                        nextLevel[nextIndex] = hashPair(currentLevel[i], currentLevel[i + 1]);
                    } else {
                        nextLevel[nextIndex] = currentLevel[i];
                    }
                }
                nextIndex++;
            }
            currentLevel = nextLevel;
        }

        // Resize to actual proof length
        bytes32[] memory finalProof = new bytes32[](proofIndex);
        for (uint256 i = 0; i < proofIndex; i++) {
            finalProof[i] = proof[i];
        }

        return finalProof;
    }

    /**
     * @dev Generate proof for specific attribute
     * @param attributes All attributes in schema (will be sorted)
     * @param targetKey Key of attribute to generate proof for
     * @param targetKind Type of attribute to generate proof for
     * @return Proof array
     */
    function generateProofForAttribute(
        Input.Attribute[] memory attributes,
        string memory targetKey,
        InputType targetKind
    ) internal pure returns (bytes32[] memory) {
        bytes32[] memory leaves = new bytes32[](attributes.length);
        for (uint256 i = 0; i < attributes.length; i++) {
            leaves[i] = createLeaf(attributes[i]);
        }

        leaves = sort(leaves);
        bytes32 targetLeaf = createLeaf(targetKey, targetKind);
        uint256 targetIndex = findLeafIndex(leaves, targetLeaf);

        return generateProof(leaves, targetIndex);
    }

    /**
     * @dev Verify a Merkle proof using Solady's gas-optimized implementation
     * @param proof Merkle proof array
     * @param root Expected root hash
     * @param leaf Leaf to verify
     * @return Whether proof is valid
     * 
     * @notice This is a wrapper around Solady's MerkleProofLib.verify for consistency
     */
    function verifyProof(bytes32[] memory proof, bytes32 root, bytes32 leaf) 
        internal pure returns (bool) {
        return MerkleProofLib.verify(proof, root, leaf);
    }
}
