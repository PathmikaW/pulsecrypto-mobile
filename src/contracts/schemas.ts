import { z } from 'zod';

// Mirrored from pulsecrypto-backend's contracts/schemas.ts (ADR-X1). CI diff-checks this
// file against that repo's raw GitHub URL on every build — do not hand-edit without also
// updating the backend copy, or the mirror check will fail the build.

export const OrderBookLevelSchema = z.object({
  price: z.number(),
  quantity: z.number(),
});

/** The WebSocket broadcast payload — one per pair, per tick (specs/api-contract.md). */
export const MarketUpdateSchema = z.object({
  pair: z.string(),
  timestamp: z.number(),
  lastUpdatedAt: z.number(),
  price: z.number(),
  change24h: z.number(),
  spread: z.number(),
  buyPressure: z.number(),
  sellPressure: z.number(),
  bids: z.array(OrderBookLevelSchema),
  asks: z.array(OrderBookLevelSchema),
});

export const TradingStatusSchema = z.enum(['TRADING', 'HALTED', 'UNAVAILABLE']);

export const PairMetaSchema = z.object({
  symbol: z.string(),
  displayName: z.string(),
  tradingStatus: TradingStatusSchema,
  high24h: z.number(),
  low24h: z.number(),
  volume24h: z.number(),
});

/** GET /pairs/meta response envelope (specs/api-contract.md). */
export const SupportedPairsMetaSchema = z.object({
  pairs: z.array(PairMetaSchema),
  resolvedAt: z.string(),
});

export type OrderBookLevel = z.infer<typeof OrderBookLevelSchema>;
export type MarketUpdate = z.infer<typeof MarketUpdateSchema>;
export type TradingStatus = z.infer<typeof TradingStatusSchema>;
export type PairMeta = z.infer<typeof PairMetaSchema>;
export type SupportedPairsMeta = z.infer<typeof SupportedPairsMetaSchema>;
