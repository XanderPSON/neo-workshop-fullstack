export type PodMarket = {
  owner: string;
  marketAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
};

export const POD_MARKETS: PodMarket[] = [
  {
    owner: "Alice",
    marketAddress: "0x90663E0748012b80bE07edef446aA6b4E73d57C1",
    tokenAddress: "0x6d22921D7a72C9329d3963E73E44690b768D0f1B",
  },
  {
    owner: "Bob",
    marketAddress: "0x21c78ede8089227c569971ffeece9faaaaf64ef6",
    tokenAddress: "0xac88656cb76ec32e7ead8d72ed949f06c95cc466",
  },
  {
    owner: "Carol",
    marketAddress: "0x6d62e235fe31e4efba88a555932c101f7c38ce7c",
    tokenAddress: "0x47a7ce75c888259da7f9c93a43f349c4f544e859",
  },
];
