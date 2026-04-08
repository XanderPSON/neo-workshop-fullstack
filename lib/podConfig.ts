export type PodMarket = {
  owner: string;
  marketAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
};
export const POD_MARKETS: PodMarket[] = [
  {
    owner: "Alice",
    marketAddress: "0x1Bcc5e87A71f72762a825dbA19C92C6a5Dd38b7c",
    tokenAddress: "0xeE75673739481a24695DA1fc52313BDEe6d1336a",
  },
  {
    owner: "Bob",
    marketAddress: "0xe79921Fb8E71bb8598628323936763e4A97C2c8C",
    tokenAddress: "0xDBbEe2D1E6D3CE64C233687CC3B05A371ed7Ec20",
  },
  {
    owner: "Carol",
    marketAddress: "0xA4ce1Ecf6658D333c06f7BbFa765374b35ADE200",
    tokenAddress: "0x8a08035D5dA14FF8E552e3eA48e6ffe5Da00c988",
  },
];