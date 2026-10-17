export const WORKCHAIN_ABI = [
  {
    type: "event",
    name: "AgreementCreated",
    inputs: [
      { name: "id", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "worker", type: "address", indexed: true },
      { name: "termsHash", type: "bytes32", indexed: false }
    ]
  },
  {
    type: "function",
    name: "createAgreement",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_worker", type: "address" },
      { name: "_termsHash", type: "bytes32" },
      { name: "_offerExpiry", type: "uint256" },
      { name: "_milestoneCount", type: "uint8" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "acceptAgreement",
    stateMutability: "nonpayable",
    inputs: [{ name: "_id", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "submitMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_id", type: "uint256" },
      { name: "_idx", type: "uint8" },
      { name: "_manifestHash", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "approveMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_id", type: "uint256" },
      { name: "_idx", type: "uint8" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "attestPayment",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_id", type: "uint256" },
      { name: "_idx", type: "uint8" },
      { name: "_paymentRef", type: "bytes32" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "confirmPayment",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_id", type: "uint256" },
      { name: "_idx", type: "uint8" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "agreementCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "agreements",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "client", type: "address" },
      { name: "worker", type: "address" },
      { name: "termsHash", type: "bytes32" },
      { name: "offerExpiry", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "cancelReason", type: "uint8" },
      { name: "currentMilestone", type: "uint8" },
      { name: "milestoneCount", type: "uint8" },
      { name: "acceptedAt", type: "uint256" },
      { name: "completedAt", type: "uint256" },
      { name: "cancelledAt", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "milestones",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }, { name: "", type: "uint8" }],
    outputs: [
      { name: "status", type: "uint8" },
      { name: "deliverableHash", type: "bytes32" },
      { name: "paymentRef", type: "bytes32" },
      { name: "paymentConfirmed", type: "bool" }
    ]
  }
] as const;