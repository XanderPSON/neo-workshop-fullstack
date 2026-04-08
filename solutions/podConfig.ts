export type PodMarket = {
  owner: string;
  marketAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
};

export const POD_MARKETS: PodMarket[] = [
  {
    owner: "Alice",
    marketAddress: "0x88bf2df5c3f6e55831c1d827dbc0b485777f625d",
    tokenAddress: "0x6d22921D7a72C9329d3963E73E44690b768D0f1B",
  },
  {
    owner: "Bob",
    marketAddress: "0x669508ff94b7a9599776d95f3d81207061254c39",
    tokenAddress: "0xac88656cb76ec32e7ead8d72ed949f06c95cc466",
  },
  {
    owner: "Carol",
    marketAddress: "0x3dbec0d273885787d9573a47864639f42b767d00",
    tokenAddress: "0x47a7ce75c888259da7f9c93a43f349c4f544e859",
  },
];
