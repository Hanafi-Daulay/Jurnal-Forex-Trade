export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      trades: {
        Row: {
          id: string
          created_at: string
          pair: string
          timeframe: string
          type: 'Buy' | 'Sell'
          entry_price: number
          exit_price: number
          stop_loss: number
          take_profit: number
          entry_date: string
          exit_date: string | null
          profit_loss: number
          risk_reward_ratio: number
          bb_upper: number | null
          bb_middle: number | null
          bb_lower: number | null
          macd_line: number | null
          macd_signal: number | null
          macd_histogram: number | null
          stochastic_k: number | null
          stochastic_d: number | null
          market_sentiment: string | null
          notes: string | null
          screenshot_url: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          pair: string
          timeframe: string
          type: 'Buy' | 'Sell'
          entry_price: number
          exit_price?: number
          stop_loss: number
          take_profit: number
          entry_date: string
          exit_date?: string | null
          profit_loss?: number
          risk_reward_ratio?: number
          bb_upper?: number | null
          bb_middle?: number | null
          bb_lower?: number | null
          macd_line?: number | null
          macd_signal?: number | null
          macd_histogram?: number | null
          stochastic_k?: number | null
          stochastic_d?: number | null
          market_sentiment?: string | null
          notes?: string | null
          screenshot_url?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          pair?: string
          timeframe?: string
          type?: 'Buy' | 'Sell'
          entry_price?: number
          exit_price?: number
          stop_loss?: number
          take_profit?: number
          entry_date?: string
          exit_date?: string | null
          profit_loss?: number
          risk_reward_ratio?: number
          bb_upper?: number | null
          bb_middle?: number | null
          bb_lower?: number | null
          macd_line?: number | null
          macd_signal?: number | null
          macd_histogram?: number | null
          stochastic_k?: number | null
          stochastic_d?: number | null
          market_sentiment?: string | null
          notes?: string | null
          screenshot_url?: string | null
          user_id?: string
        }
      }
      settings: {
        Row: {
          id: string
          user_id: string
          risk_percentage: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          risk_percentage: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          risk_percentage?: number
          created_at?: string
        }
      }
    }
  }
}