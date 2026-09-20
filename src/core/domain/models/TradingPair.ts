export type TradingPairSymbol = string; // e.g. "BTCUSDT"

export type TradingStatus = 'TRADING' | 'HALTED' | 'UNAVAILABLE';

export interface TradingPair {
  symbol: TradingPairSymbol;
  displayName: string; // e.g. "BTC/USDT"
  tradingStatus: TradingStatus;
  high24h: number;
  low24h: number;
  volume24h: number;
}
