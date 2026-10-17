export const SBT_ABI = [
  {
    type: "function",
    name: "mintBadge",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "agreementId", type: "uint256" },
      { name: "projectTitle", type: "string" },
      { name: "totalValueIdr", type: "uint256" },
      { name: "milestoneCount", type: "uint8" },
      { name: "role", type: "uint8" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "isMinted",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint8" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }]
  },
  {
    type: "event",
    name: "BadgeMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "agreementId", type: "uint256", indexed: true },
      { name: "role", type: "uint8", indexed: false }
    ]
  }
] as const;