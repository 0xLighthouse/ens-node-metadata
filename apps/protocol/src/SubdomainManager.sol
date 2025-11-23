// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "ens-contracts/resolvers/profiles/IExtendedResolver.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./interfaces/IGovernance.sol";

/**
 * @title SubdomainManager
 * @dev Manages subdomains for working groups within an organization
 *
 * This contract allows working groups (e.g., engineering.myorg.eth, finance.myorg.eth)
 * to manage their own ENS records independently while being part of the parent organization.
 */
contract SubdomainManager is ISubdomainManager, IExtendedResolver, AccessControl {
    // Role definitions
    bytes32 public constant TEAM_ADMIN_ROLE = keccak256("TEAM_ADMIN");
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER");

    // Parent organization info
    bytes32 public parentNode;
    address public parentResolver;
    string public teamName;

    // Team-specific storage
    mapping(string => string) public teamTexts;
    mapping(uint256 => bytes) public teamAddresses;
    mapping(address => bool) public teamMembers;

    // Team metadata
    struct TeamProfile {
        string description;
        string lead;
        string[] members;
        string budget;
        string[] projects;
        uint256 memberCount;
        uint256 lastUpdate;
    }

    TeamProfile public teamProfile;

    // Events
    event MemberAdded(address indexed member, string name);
    event MemberRemoved(address indexed member);
    event TeamProfileUpdated(string description, string lead);
    event TeamTextChanged(string indexed key, string value);
    event TeamAddressChanged(uint256 coinType, bytes newAddress);

    constructor(bytes32 _parentNode, address _parentResolver, string memory _teamName, address _teamAdmin) {
        parentNode = _parentNode;
        parentResolver = _parentResolver;
        teamName = _teamName;

        _grantRole(DEFAULT_ADMIN_ROLE, _teamAdmin);
        _grantRole(TEAM_ADMIN_ROLE, _teamAdmin);
    }

    // Add initialize function for minimal proxy pattern
    function initialize(bytes32 _parentNode, address _parentResolver, string memory _teamName, address _teamAdmin)
        external
    {
        require(bytes(teamName).length == 0, "Already initialized");
        parentNode = _parentNode;
        parentResolver = _parentResolver;
        teamName = _teamName;
        _grantRole(DEFAULT_ADMIN_ROLE, _teamAdmin);
        _grantRole(TEAM_ADMIN_ROLE, _teamAdmin);
    }

    // ============ ISubdomainManager Implementation ============

    /**
     * @dev Resolve requests for this subdomain
     */
    function resolve(bytes memory name, bytes memory data)
        external
        view
        override(ISubdomainManager, IExtendedResolver)
        returns (bytes memory)
    {
        bytes4 selector = bytes4(data);

        if (selector == bytes4(keccak256("addr(bytes32)"))) {
            return abi.encode(teamAddresses[60]); // Default to Ethereum
        } else if (selector == bytes4(keccak256("addr(bytes32,uint256)"))) {
            bytes memory remaining = new bytes(data.length - 4);
            for (uint256 i = 0; i < data.length - 4; i++) {
                remaining[i] = data[i + 4];
            }
            (, uint256 coinType) = abi.decode(remaining, (bytes32, uint256));
            return abi.encode(teamAddresses[coinType]);
        } else if (selector == bytes4(keccak256("text(bytes32,string)"))) {
            bytes memory remaining2 = new bytes(data.length - 4);
            for (uint256 i = 0; i < data.length - 4; i++) {
                remaining2[i] = data[i + 4];
            }
            (, string memory key) = abi.decode(remaining2, (bytes32, string));
            return abi.encode(_getTeamText(key));
        }

        revert("SubdomainManager: Unsupported function");
    }

    /**
     * @dev Check if this manager can handle a specific label
     */
    function canManage(string memory label) external view override returns (bool) {
        return keccak256(bytes(label)) == keccak256(bytes(teamName));
    }

    // ============ Team Management ============

    /**
     * @dev Add a member to the team
     */
    function addMember(address member, string calldata memberName) external onlyRole(TEAM_ADMIN_ROLE) {
        require(member != address(0), "SubdomainManager: Invalid member");
        require(!teamMembers[member], "SubdomainManager: Member already exists");

        teamMembers[member] = true;
        _grantRole(MEMBER_ROLE, member);

        teamProfile.members.push(memberName);
        teamProfile.memberCount++;
        teamProfile.lastUpdate = block.timestamp;

        emit MemberAdded(member, memberName);
    }

    /**
     * @dev Remove a member from the team
     */
    function removeMember(address member) external onlyRole(TEAM_ADMIN_ROLE) {
        require(teamMembers[member], "SubdomainManager: Member not found");

        teamMembers[member] = false;
        _revokeRole(MEMBER_ROLE, member);

        teamProfile.memberCount--;
        teamProfile.lastUpdate = block.timestamp;

        emit MemberRemoved(member);
    }

    /**
     * @dev Update team profile information
     */
    function updateTeamProfile(string calldata description, string calldata lead, string calldata budget)
        external
        onlyRole(TEAM_ADMIN_ROLE)
    {
        teamProfile.description = description;
        teamProfile.lead = lead;
        teamProfile.budget = budget;
        teamProfile.lastUpdate = block.timestamp;

        // Update text records
        teamTexts["description"] = description;
        teamTexts["lead"] = lead;
        teamTexts["budget"] = budget;

        emit TeamProfileUpdated(description, lead);
        emit TeamTextChanged("description", description);
        emit TeamTextChanged("lead", lead);
        emit TeamTextChanged("budget", budget);
    }

    /**
     * @dev Add a project to the team
     */
    function addProject(string calldata project) external onlyRole(TEAM_ADMIN_ROLE) {
        teamProfile.projects.push(project);
        teamProfile.lastUpdate = block.timestamp;
    }

    // ============ ENS Record Management ============

    /**
     * @dev Set a text record for the team
     */
    function setTeamText(string calldata key, string calldata value) external onlyRole(TEAM_ADMIN_ROLE) {
        teamTexts[key] = value;
        emit TeamTextChanged(key, value);
    }

    /**
     * @dev Set an address for the team
     */
    function setTeamAddress(uint256 coinType, bytes calldata addr) external onlyRole(TEAM_ADMIN_ROLE) {
        teamAddresses[coinType] = addr;
        emit TeamAddressChanged(coinType, addr);
    }

    /**
     * @dev Set multiple addresses for the team
     */
    function setTeamAddresses(uint256[] calldata coinTypes, bytes[] calldata addresses)
        external
        onlyRole(TEAM_ADMIN_ROLE)
    {
        require(coinTypes.length == addresses.length, "SubdomainManager: Length mismatch");

        for (uint256 i = 0; i < coinTypes.length; i++) {
            teamAddresses[coinTypes[i]] = addresses[i];
            emit TeamAddressChanged(coinTypes[i], addresses[i]);
        }
    }

    // ============ View Functions ============

    /**
     * @dev Get team member count
     */
    function getMemberCount() external view returns (uint256) {
        return teamProfile.memberCount;
    }

    /**
     * @dev Get team projects
     */
    function getProjects() external view returns (string[] memory) {
        return teamProfile.projects;
    }

    /**
     * @dev Get team members list
     */
    function getMembers() external view returns (string[] memory) {
        return teamProfile.members;
    }

    /**
     * @dev Check if an address is a team member
     */
    function isMember(address account) external view returns (bool) {
        return teamMembers[account];
    }

    /**
     * @dev Get team text record
     */
    function getTeamText(string calldata key) external view returns (string memory) {
        return _getTeamText(key);
    }

    /**
     * @dev Get team address for coin type
     */
    function getTeamAddress(uint256 coinType) external view returns (bytes memory) {
        return teamAddresses[coinType];
    }

    // ============ Internal Functions ============

    /**
     * @dev Internal function to get team text with dynamic data
     */
    function _getTeamText(string memory key) internal view returns (string memory) {
        bytes32 keyHash = keccak256(bytes(key));

        // Handle dynamic keys
        if (keyHash == keccak256("members.count")) {
            return _uint2str(teamProfile.memberCount);
        } else if (keyHash == keccak256("projects.count")) {
            return _uint2str(teamProfile.projects.length);
        } else if (keyHash == keccak256("last.update")) {
            return _uint2str(teamProfile.lastUpdate);
        }

        // Return stored text
        return teamTexts[key];
    }

    /**
     * @dev Convert uint to string
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // ============ Interface Support ============

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == type(ISubdomainManager).interfaceId || interfaceId == type(IExtendedResolver).interfaceId
            || super.supportsInterface(interfaceId);
    }
}
