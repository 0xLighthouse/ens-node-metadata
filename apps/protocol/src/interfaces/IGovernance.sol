// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title IGovernance
 * @dev Interface for governance contracts that control organizational metadata updates
 */
interface IGovernance {
    /**
     * @dev Check if an action is approved by governance
     * @param caller The address calling the function
     * @param data The call data being executed
     * @return bool True if the action is approved
     */
    function isActionApproved(address caller, bytes memory data) external view returns (bool);
    
    /**
     * @dev Check if a caller has a specific role
     * @param role The role to check
     * @param caller The address to check
     * @return bool True if the caller has the role
     */
    function hasRole(bytes32 role, address caller) external view returns (bool);
    
    /**
     * @dev Get the current proposal threshold
     * @return uint256 The minimum tokens needed to create a proposal
     */
    function proposalThreshold() external view returns (uint256);
    
    /**
     * @dev Get the voting delay
     * @return uint256 The delay before voting starts (in blocks)
     */
    function votingDelay() external view returns (uint256);
    
    /**
     * @dev Get the voting period
     * @return uint256 The voting period duration (in blocks)
     */
    function votingPeriod() external view returns (uint256);
}

/**
 * @title ISubdomainManager
 * @dev Interface for subdomain management contracts
 */
interface ISubdomainManager {
    /**
     * @dev Resolve a subdomain request
     * @param name The DNS-encoded name being resolved
     * @param data The call data for the resolution
     * @return bytes The resolution result
     */
    function resolve(bytes memory name, bytes memory data) external view returns (bytes memory);
    
    /**
     * @dev Check if the manager can handle a specific subdomain
     * @param label The subdomain label
     * @return bool True if the manager handles this subdomain
     */
    function canManage(string memory label) external view returns (bool);
}