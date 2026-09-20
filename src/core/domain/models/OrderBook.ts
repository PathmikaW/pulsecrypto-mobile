export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface OrderBook {
  bids: OrderBookLevel[]; // sorted descending by price, top 20
  asks: OrderBookLevel[]; // sorted ascending by price, top 20
}
