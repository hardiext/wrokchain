// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IWorkChainProtocol {
    function agreements(uint256 id) external view returns (
        address client,
        address worker,
        bytes32 termsHash,
        uint256 offerExpiry,
        uint8 status,
        uint8 cancelReason,
        uint8 currentMilestone,
        uint8 milestoneCount,
        uint256 acceptedAt,
        uint256 completedAt,
        uint256 cancelledAt
    );
}

contract WorkChainReputation is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId;
    address public protocolContract;

    enum Role { WORKER, CLIENT }

    struct BadgeData {
        uint256 agreementId;
        string projectTitle;
        uint256 totalValueIdr;
        uint8 milestoneCount;
        Role role;
        uint256 completedAt;
    }

    mapping(uint256 => BadgeData) public badgeDetails;
    mapping(uint256 => mapping(Role => bool)) public isMinted;

    event BadgeMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 indexed agreementId,
        Role role
    );

    error SoulboundNonTransferable();
    error NotAuthorizedCaller();
    error AlreadyMintedForAgreement();
    error AgreementNotCompletedOnChain();

    constructor() ERC721("WorkChain Proof of Reputation", "WCREP") Ownable(msg.sender) {}

    function setProtocolContract(address _protocol) external onlyOwner {
        protocolContract = _protocol;
    }

    /**
     * @notice Pengguna (Worker / Klien) dapat mencetak sendiri badge reputasi mereka
     */
    function mintBadge(
        address recipient,
        uint256 agreementId,
        string calldata projectTitle,
        uint256 totalValueIdr,
        uint8 milestoneCount,
        Role role
    ) external returns (uint256) {
        // Penerima harus pengirim transaksi (atau owner/protocol contract)
        if (msg.sender != recipient && msg.sender != owner() && msg.sender != protocolContract) {
            revert NotAuthorizedCaller();
        }

        if (isMinted[agreementId][role]) {
            revert AlreadyMintedForAgreement();
        }

        // Jika alamat protocolContract sudah diset, validasi alamat penerima sesuai peran di on-chain
        if (protocolContract != address(0)) {
            (
                address clientAddr,
                address workerAddr,
                ,,,,,,,,
            ) = IWorkChainProtocol(protocolContract).agreements(agreementId);

            if (role == Role.WORKER && recipient != workerAddr) revert NotAuthorizedCaller();
            if (role == Role.CLIENT && recipient != clientAddr) revert NotAuthorizedCaller();
        }

        _nextTokenId++;
        uint256 tokenId = _nextTokenId;

        badgeDetails[tokenId] = BadgeData({
            agreementId: agreementId,
            projectTitle: projectTitle,
            totalValueIdr: totalValueIdr,
            milestoneCount: milestoneCount,
            role: role,
            completedAt: block.timestamp
        });

        isMinted[agreementId][role] = true;
        _safeMint(recipient, tokenId);

        emit BadgeMinted(tokenId, recipient, agreementId, role);
        return tokenId;
    }

    // SOULBOUND RESTRICTIONS (ANTI-TRANSFER)
    function transferFrom(address, address, uint256) public pure override {
        revert SoulboundNonTransferable();
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert SoulboundNonTransferable();
    }

    // ON-CHAIN DYNAMIC CARTOON SVG & METADATA GENERATOR
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        BadgeData memory b = badgeDetails[tokenId];

        string memory roleStr = b.role == Role.WORKER ? "WORKER" : "CLIENT";
        string memory accentColor = b.role == Role.WORKER ? "#ff4625" : "#34d399";
        string memory bgGlow = b.role == Role.WORKER ? "#ff462533" : "#34d39933";

        // Karakter Maskot Kartun On-Chain
        string memory avatarSvg = b.role == Role.WORKER
            // Worker Avatar: Cyber Bot with Visor & Antenna
            ? string(abi.encodePacked(
                '<g transform="translate(130, 60)">',
                  '<circle cx="70" cy="70" r="68" fill="', bgGlow, '"/>',
                  '<path d="M 70 20 L 70 2" stroke="', accentColor, '" stroke-width="4" stroke-linecap="round"/>',
                  '<circle cx="70" cy="2" r="5" fill="', accentColor, '"/>',
                  '<rect x="20" y="20" width="100" height="90" rx="28" fill="#181a20" stroke="', accentColor, '" stroke-width="3"/>',
                  '<rect x="30" y="42" width="80" height="26" rx="12" fill="', accentColor, '"/>',
                  '<circle cx="50" cy="55" r="5" fill="#ffffff"/>',
                  '<circle cx="90" cy="55" r="5" fill="#ffffff"/>',
                  '<path d="M 50 82 Q 70 96 90 82" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round"/>',
                  '<circle cx="34" cy="75" r="4" fill="', accentColor, '" opacity="0.6"/>',
                  '<circle cx="106" cy="75" r="4" fill="', accentColor, '" opacity="0.6"/>',
                '</g>'
            ))
            // Client Avatar: King Cat Patron with Crown
            : string(abi.encodePacked(
                '<g transform="translate(130, 60)">',
                  '<circle cx="70" cy="70" r="68" fill="', bgGlow, '"/>',
                  '<path d="M 45 22 L 55 8 L 70 18 L 85 8 L 95 22 Z" fill="', accentColor, '"/>',
                  '<circle cx="70" cy="70" r="45" fill="#181a20" stroke="', accentColor, '" stroke-width="3"/>',
                  '<polygon points="35,35 48,15 58,32" fill="#181a20" stroke="', accentColor, '" stroke-width="2"/>',
                  '<polygon points="105,35 92,15 82,32" fill="#181a20" stroke="', accentColor, '" stroke-width="2"/>',
                  '<ellipse cx="56" cy="65" rx="6" ry="8" fill="#ffffff"/>',
                  '<ellipse cx="84" cy="65" rx="6" ry="8" fill="#ffffff"/>',
                  '<circle cx="58" cy="63" r="2.5" fill="#000000"/>',
                  '<circle cx="86" cy="63" r="2.5" fill="#000000"/>',
                  '<polygon points="68,76 72,76 70,79" fill="', accentColor, '"/>',
                  '<path d="M 64 82 Q 70 87 70 82 Q 70 87 76 82" stroke="#ffffff" stroke-width="2" fill="none"/>',
                '</g>'
            ));

        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="100%" height="100%">',
                '<defs>',
                  '<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">',
                    '<stop offset="0%" stop-color="#11131a"/>',
                    '<stop offset="100%" stop-color="#08090d"/>',
                  '</linearGradient>',
                '</defs>',
                '<rect width="100%" height="100%" fill="url(#cardBg)" rx="28" stroke="', accentColor, '" stroke-width="2"/>',
                '<rect x="25" y="24" width="130" height="22" rx="6" fill="#ffffff08" stroke="#ffffff15" stroke-width="1"/>',
                '<text x="34" y="39" font-family="monospace" font-size="9" fill="', accentColor, '" letter-spacing="1">SOULBOUND #' , tokenId.toString(), '</text>',
                '<rect x="285" y="24" width="90" height="22" rx="6" fill="', bgGlow, '"/>',
                '<text x="303" y="39" font-family="monospace" font-size="10" font-weight="bold" fill="', accentColor, '">', roleStr, '</text>',
                avatarSvg,
                '<g transform="translate(25, 220)">',
                  '<rect width="350" height="270" rx="18" fill="#00000066" stroke="#ffffff0d" stroke-width="1"/>',
                  '<text x="20" y="35" font-family="sans-serif" font-size="11" fill="#71717a">PROJECT</text>',
                  '<text x="20" y="62" font-family="sans-serif" font-weight="bold" font-size="18" fill="#ffffff">', b.projectTitle, '</text>',
                  '<line x1="20" y1="85" x2="330" y2="85" stroke="#ffffff12" stroke-width="1"/>',
                  '<text x="20" y="115" font-family="sans-serif" font-size="11" fill="#71717a">SETTLEMENT VALUE</text>',
                  '<text x="20" y="142" font-family="monospace" font-weight="bold" font-size="20" fill="', accentColor, '">Rp ', b.totalValueIdr.toString(), '</text>',
                  '<text x="20" y="185" font-family="sans-serif" font-size="11" fill="#71717a">VERIFIED MILESTONES</text>',
                  '<text x="20" y="210" font-family="monospace" font-size="14" fill="#f4f4f5">', uint256(b.milestoneCount).toString(), ' Tahap Selesai (100% Lunas)</text>',
                  '<text x="20" y="248" font-family="monospace" font-size="9" fill="#52525b">PROOF ANCHORED ON SEPOLIA L1</text>',
                '</g>',
                '</svg>'
            )
        );

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "WorkChain Soulbound #', tokenId.toString(), ' - ', b.projectTitle, '", ',
                        '"description": "Sertifikat NFT reputasi on-chain anti-transfer yang membuktikan penyelesaian kerja dan pelunasan IDR secara sah.", ',
                        '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '", ',
                        '"attributes": [',
                        '{"trait_type": "Role", "value": "', roleStr, '"},',
                        '{"trait_type": "Agreement ID", "value": ', b.agreementId.toString(), '},',
                        '{"trait_type": "Total IDR", "value": ', b.totalValueIdr.toString(), '}',
                        ']}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }
}