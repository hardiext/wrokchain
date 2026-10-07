export const WORKCHAIN_ABI = [
  {
    type: "function",
    name: "createProject",
    stateMutability: "payable",
    inputs: [
      { name: "_worker", type: "address" },
      { name: "_agreementHash", type: "string" },
      { name: "_titles", type: "string[]" },
      { name: "_amounts", type: "uint256[]" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "acceptAgreement",
    stateMutability: "nonpayable",
    inputs: [{ name: "_projectId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "projectCounter",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "submitMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_projectId", type: "uint256" },
      { name: "_milestoneIndex", type: "uint256" },
      { name: "_proofHash", type: "string" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "approveMilestone",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_projectId", type: "uint256" },
      { name: "_milestoneIndex", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "projects",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "client", type: "address" },
      { name: "worker", type: "address" },
      { name: "agreementHash", type: "string" },
      { name: "totalBudget", type: "uint256" },
      { name: "milestoneCount", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "workerAccepted", type: "bool" },
      { name: "createdAt", type: "uint256" },
      { name: "completedAt", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "getMilestone",
    stateMutability: "view",
    inputs: [
      { name: "_projectId", type: "uint256" },
      { name: "_index", type: "uint256" }
    ],
    outputs: [
      { name: "title", type: "string" },
      { name: "amount", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "submissionProofHash", type: "string" }
    ]
  },
  {
    type: "event",
    name: "ProjectCreated",
    inputs: [
      { name: "projectId", type: "uint256", indexed: true },
      { name: "client", type: "address", indexed: true },
      { name: "worker", type: "address", indexed: true },
      { name: "agreementHash", type: "string", indexed: false }
    ]
  }
] as const;