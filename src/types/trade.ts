export type CurrencyPair = 
  | 'EUR/USD' | 'GBP/USD' | 'USD/JPY' | 'USD/CHF' 
  | 'USD/CAD' | 'AUD/USD' | 'NZD/USD' | 'EUR/GBP' 
  | 'EUR/JPY' | 'GBP/JPY' | 'XAU/USD' | 'Other';

export type Timeframe = 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1' | 'MN';

export type TradeType = 'Buy' | 'Sell';

export type MarketSentiment = 
  | 'Strong Bullish' 
  | 'Moderate Bullish' 
  | 'Neutral' 
  | 'Moderate Bearish' 
  | 'Strong Bearish';

export interface Trade {
  id: string;
  pair: CurrencyPair;
  timeframe: Timeframe;
  type: TradeType;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number;
  take_profit: number;
  entry_date: string;
  exit_date: string | null;
  profit_loss: number | null;
  risk_reward_ratio: number;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
  macd_line: number | null;
  macd_signal: number | null;
  macd_histogram: number | null;
  stochastic_k: number | null;
  stochastic_d: number | null;
  market_sentiment: MarketSentiment | null;
  notes: string | null;
  screenshot_url: string | null;
  created_at: string;
}

export interface TradeFormData {
  pair: CurrencyPair;
  timeframe: Timeframe;
  type: TradeType;
  entry_price: number;
  exit_price?: number;
  stop_loss: number;
  take_profit: number;
  entry_date: string;
  exit_date?: string;
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
  macd_line?: number;
  macd_signal?: number;
  macd_histogram?: number;
  stochastic_k?: number;
  stochastic_d?: number;
  market_sentiment?: MarketSentiment;
  notes?: string;
  screenshot?: File;
}