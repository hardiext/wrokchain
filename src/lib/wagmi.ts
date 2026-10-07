import { http, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo_id";

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/alch_TImoDBhlK_g0t-HlIoq2N"),
  },
  ssr: true,
});