import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import { Trade, CurrencyPair, Timeframe } from '../types/trade';
import { useSupabase } from '../contexts/SupabaseContext';
import { format, parseISO } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend
);

const Analytics: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'all' | '1m' | '3m' | '6m' | '1y'>('all');
  const { supabase } = useSupabase();

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        // In a real app, filter by user_id
        const { data, error } = await supabase.from('trades').select('*');
        
        if (error) throw error;
        
        setTrades(data || []);
      } catch (error) {
        console.error('Error fetching trades:', error);
        // In a real app, show error toast
      } finally {
        setLoading(false);
      }
    };

    // Uncomment to fetch real data
    // fetchTrades();
    
    // For development, use mock data
    setTimeout(() => {
      setTrades(mockTrades);
      setLoading(false);
    }, 500);
  }, []);

  // Filter trades by time range
  const filteredTrades = React.useMemo(() => {
    if (timeRange === 'all') return trades;
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeRange) {
      case '1m':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return trades.filter(trade => new Date(trade.entry_date) >= cutoffDate);
  }, [trades, timeRange]);

  // Calculate summary metrics
  const totalProfitLoss = filteredTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
  const winningTrades = filteredTrades.filter(trade => (trade.profit_loss || 0) > 0);
  const losingTrades = filteredTrades.filter(trade => (trade.profit_loss || 0) < 0);
  const winRate = filteredTrades.length > 0 ? (winningTrades.length / filteredTrades.length) * 100 : 0;
  const avgRiskReward = filteredTrades.length > 0 
    ? filteredTrades.reduce((sum, trade) => sum + trade.risk_reward_ratio, 0) / filteredTrades.length 
    : 0;
  
  // Group trades by currency pair
  const tradesByPair = filteredTrades.reduce<Record<string, Trade[]>>((acc, trade) => {
    if (!acc[trade.pair]) {
      acc[trade.pair] = [];
    }
    acc[trade.pair].push(trade);
    return acc;
  }, {});
  
  // Calculate profit/loss by pair
  const pnlByPair = Object.entries(tradesByPair).map(([pair, trades]) => ({
    pair,
    pnl: trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0),
    count: trades.length
  }));
  
  // Group trades by timeframe
  const tradesByTimeframe = filteredTrades.reduce<Record<string, Trade[]>>((acc, trade) => {
    if (!acc[trade.timeframe]) {
      acc[trade.timeframe] = [];
    }
    acc[trade.timeframe].push(trade);
    return acc;
  }, {});
  
  // Calculate profit/loss by timeframe
  const pnlByTimeframe = Object.entries(tradesByTimeframe).map(([timeframe, trades]) => ({
    timeframe,
    pnl: trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0),
    count: trades.length,
    winRate: trades.filter(t => (t.profit_loss || 0) > 0).length / trades.length * 100
  }));
  
  // Sort trades chronologically
  const sortedTrades = [...filteredTrades].sort((a, b) => 
    new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
  );
  
  // Prepare P/L over time chart data
  const cumulativePnlData = {
    labels: sortedTrades.map(trade => format(parseISO(trade.entry_date), 'MMM dd')),
    datasets: [
      {
        label: 'Cumulative P/L',
        data: sortedTrades.reduce<number[]>((acc, trade, index) => {
          const previousValue = index > 0 ? acc[index - 1] : 0;
          acc.push(previousValue + (trade.profit_loss || 0));
          return acc;
        }, []),
        borderColor: 'rgb(var(--color-primary))',
        backgroundColor: 'rgba(var(--color-primary) / 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };
  
  // Prepare pair performance chart data
  const pairPnlData = {
    labels: pnlByPair.map(item => item.pair),
    datasets: [
      {
        label: 'Profit/Loss',
        data: pnlByPair.map(item => item.pnl),
        backgroundColor: pnlByPair.map(item => 
          item.pnl >= 0 
            ? 'rgba(var(--color-success) / 0.7)' 
            : 'rgba(var(--color-error) / 0.7)'
        ),
        borderColor: pnlByPair.map(item => 
          item.pnl >= 0 
            ? 'rgb(var(--color-success))' 
            : 'rgb(var(--color-error))'
        ),
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare timeframe performance chart data
  const timeframePnlData = {
    labels: pnlByTimeframe.map(item => item.timeframe),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: pnlByTimeframe.map(item => item.winRate),
        backgroundColor: 'rgba(var(--color-primary) / 0.7)',
        borderColor: 'rgb(var(--color-primary))',
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare win/loss ratio chart data
  const winLossData = {
    labels: ['Winning Trades', 'Losing Trades'],
    datasets: [
      {
        data: [winningTrades.length, losingTrades.length],
        backgroundColor: [
          'rgba(var(--color-success) / 0.7)',
          'rgba(var(--color-error) / 0.7)',
        ],
        borderColor: [
          'rgb(var(--color-success))',
          'rgb(var(--color-error))',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Risk/Reward distribution chart data
  const riskRewardRanges = [
    { label: '< 1', count: 0 },
    { label: '1 - 1.5', count: 0 },
    { label: '1.5 - 2', count: 0 },
    { label: '2 - 3', count: 0 },
    { label: '> 3', count: 0 },
  ];
  
  filteredTrades.forEach(trade => {
    const rr = trade.risk_reward_ratio;
    
    if (rr < 1) riskRewardRanges[0].count++;
    else if (rr < 1.5) riskRewardRanges[1].count++;
    else if (rr < 2) riskRewardRanges[2].count++;
    else if (rr < 3) riskRewardRanges[3].count++;
    else riskRewardRanges[4].count++;
  });
  
  const riskRewardDistributionData = {
    labels: riskRewardRanges.map(range => range.label),
    datasets: [
      {
        label: 'Number of Trades',
        data: riskRewardRanges.map(range => range.count),
        backgroundColor: 'rgba(var(--color-secondary) / 0.7)',
        borderColor: 'rgb(var(--color-secondary))',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-text-muted">Loading analytics data...</div>
      </div>
    );
  }

  return (
    <>
      <PageTitle 
        title="Analytics" 
        description="Visualize and analyze your trading performance"
      />
      
      {/* Time Range Selector */}
      <div className="flex flex-wrap justify-end mb-6">
        <div className="bg-foreground rounded-md flex p-1 shadow-sm">
          {[
            { value: 'all', label: 'All Time' },
            { value: '1m', label: '1 Month' },
            { value: '3m', label: '3 Months' },
            { value: '6m', label: '6 Months' },
            { value: '1y', label: '1 Year' },
          ].map(range => (
            <button
              key={range.value}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === range.value
                  ? 'bg-primary text-white'
                  : 'text-text hover:bg-background'
              }`}
              onClick={() => setTimeRange(range.value as any)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Performance Summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="animate-slide-up">
          <div>
            <h4 className="text-sm text-text-muted mb-1">Total Profit/Loss</h4>
            <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-success' : 'text-error'}`}>
              ${totalProfitLoss.toFixed(2)}
            </p>
          </div>
        </Card>
        
        <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div>
            <h4 className="text-sm text-text-muted mb-1">Win Rate</h4>
            <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
          </div>
        </Card>
        
        <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div>
            <h4 className="text-sm text-text-muted mb-1">Number of Trades</h4>
            <p className="text-2xl font-bold">{filteredTrades.length}</p>
          </div>
        </Card>
        
        <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div>
            <h4 className="text-sm text-text-muted mb-1">Avg Risk/Reward</h4>
            <p className="text-2xl font-bold">{avgRiskReward.toFixed(2)}</p>
          </div>
        </Card>
      </div>
      
      {/* Profit/Loss Chart */}
      <Card title="Profit/Loss Over Time" className="mb-6">
        <div className="h-72">
          <Line data={cumulativePnlData} options={chartOptions} />
        </div>
      </Card>
      
      {/* Charts Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-6">
        <Card title="Win/Loss Ratio">
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={winLossData} options={chartOptions} />
          </div>
        </Card>
        
        <Card title="Risk/Reward Distribution">
          <div className="h-64">
            <Bar data={riskRewardDistributionData} options={chartOptions} />
          </div>
        </Card>
      </div>
      
      {/* Performance by Pair/Timeframe */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-6">
        <Card title="Performance by Currency Pair">
          <div className="h-72">
            <Bar data={pairPnlData} options={chartOptions} />
          </div>
        </Card>
        
        <Card title="Win Rate by Timeframe">
          <div className="h-72">
            <Bar data={timeframePnlData} options={chartOptions} />
          </div>
        </Card>
      </div>
    </>
  );
};

// Mock data (same as in other components)
const mockTrades = [
  {
    id: '1',
    pair: 'XAU/USD',
    timeframe: 'H4',
    type: 'Buy',
    entry_price: 1950.50,
    exit_price: 1980.25,
    stop_loss: 1940.00,
    take_profit: 1990.00,
    entry_date: '2023-05-10T10:30:00Z',
    exit_date: '2023-05-12T14:15:00Z',
    profit_loss: 297.50,
    risk_reward_ratio: 2.85,
    bb_upper: 1960.25,
    bb_middle: 1948.50,
    bb_lower: 1936.75,
    macd_line: 5.23,
    macd_signal: 2.56,
    macd_histogram: 2.67,
    stochastic_k: 75.34,
    stochastic_d: 68.21,
    market_sentiment: 'Moderate Bullish',
    notes: 'Price broke above key resistance with strong momentum.',
    screenshot_url: null,
    created_at: '2023-05-10T10:35:00Z'
  },
  {
    id: '2',
    pair: 'EUR/USD',
    timeframe: 'H1',
    type: 'Sell',
    entry_price: 1.0850,
    exit_price: 1.0820,
    stop_loss: 1.0870,
    take_profit: 1.0800,
    entry_date: '2023-05-15T09:45:00Z',
    exit_date: '2023-05-15T15:30:00Z',
    profit_loss: 30.00,
    risk_reward_ratio: 1.5,
    bb_upper: 1.0860,
    bb_middle: 1.0840,
    bb_lower: 1.0820,
    macd_line: -2.12,
    macd_signal: -1.56,
    macd_histogram: -0.56,
    stochastic_k: 28.45,
    stochastic_d: 32.67,
    market_sentiment: 'Moderate Bearish',
    notes: 'Bearish engulfing pattern at resistance zone.',
    screenshot_url: null,
    created_at: '2023-05-15T09:50:00Z'
  },
  {
    id: '3',
    pair: 'GBP/USD',
    timeframe: 'D1',
    type: 'Buy',
    entry_price: 1.2650,
    exit_price: 1.2580,
    stop_loss: 1.2600,
    take_profit: 1.2750,
    entry_date: '2023-05-18T08:15:00Z',
    exit_date: '2023-05-19T10:45:00Z',
    profit_loss: -70.00,
    risk_reward_ratio: 2.0,
    bb_upper: 1.2700,
    bb_middle: 1.2650,
    bb_lower: 1.2600,
    macd_line: 0.45,
    macd_signal: 0.32,
    macd_histogram: 0.13,
    stochastic_k: 65.78,
    stochastic_d: 58.23,
    market_sentiment: 'Neutral',
    notes: 'Failed breakout above resistance turned support.',
    screenshot_url: null,
    created_at: '2023-05-18T08:20:00Z'
  },
  {
    id: '4',
    pair: 'XAU/USD',
    timeframe: 'H4',
    type: 'Sell',
    entry_price: 1975.25,
    exit_price: 1950.50,
    stop_loss: 1985.00,
    take_profit: 1945.00,
    entry_date: '2023-05-22T11:20:00Z',
    exit_date: '2023-05-23T16:45:00Z',
    profit_loss: 247.50,
    risk_reward_ratio: 2.54,
    bb_upper: 1980.50,
    bb_middle: 1970.25,
    bb_lower: 1960.00,
    macd_line: -3.45,
    macd_signal: -1.23,
    macd_histogram: -2.22,
    stochastic_k: 25.67,
    stochastic_d: 32.45,
    market_sentiment: 'Strong Bearish',
    notes: 'Double top formation with bearish divergence on RSI.',
    screenshot_url: null,
    created_at: '2023-05-22T11:25:00Z'
  },
  {
    id: '5',
    pair: 'USD/JPY',
    timeframe: 'H1',
    type: 'Buy',
    entry_price: 134.50,
    exit_price: 135.25,
    stop_loss: 134.00,
    take_profit: 135.50,
    entry_date: '2023-05-25T08:30:00Z',
    exit_date: '2023-05-25T14:15:00Z',
    profit_loss: 75.00,
    risk_reward_ratio: 1.5,
    bb_upper: 134.75,
    bb_middle: 134.25,
    bb_lower: 133.75,
    macd_line: 0.15,
    macd_signal: 0.05,
    macd_histogram: 0.10,
    stochastic_k: 78.34,
    stochastic_d: 72.56,
    market_sentiment: 'Moderate Bullish',
    notes: 'Bounce from key support level with increasing volume.',
    screenshot_url: null,
    created_at: '2023-05-25T08:35:00Z'
  },
  {
    id: '6',
    pair: 'EUR/USD',
    timeframe: 'M15',
    type: 'Sell',
    entry_price: 1.0880,
    exit_price: 1.0865,
    stop_loss: 1.0890,
    take_profit: 1.0860,
    entry_date: '2023-05-26T13:45:00Z',
    exit_date: '2023-05-26T15:15:00Z',
    profit_loss: 15.00,
    risk_reward_ratio: 1.5,
    bb_upper: 1.0885,
    bb_middle: 1.0875,
    bb_lower: 1.0865,
    macd_line: -0.56,
    macd_signal: -0.32,
    macd_histogram: -0.24,
    stochastic_k: 22.45,
    stochastic_d: 28.78,
    market_sentiment: 'Moderate Bearish',
    notes: 'Price rejected from upper Bollinger Band with bearish momentum.',
    screenshot_url: null,
    created_at: '2023-05-26T13:50:00Z'
  },
  {
    id: '7',
    pair: 'XAU/USD',
    timeframe: 'D1',
    type: 'Buy',
    entry_price: 1945.75,
    exit_price: 1935.25,
    stop_loss: 1935.00,
    take_profit: 1965.00,
    entry_date: '2023-05-28T09:30:00Z',
    exit_date: '2023-05-30T16:45:00Z',
    profit_loss: -105.00,
    risk_reward_ratio: 1.9,
    bb_upper: 1965.50,
    bb_middle: 1950.25,
    bb_lower: 1935.00,
    macd_line: 1.23,
    macd_signal: 0.45,
    macd_histogram: 0.78,
    stochastic_k: 62.34,
    stochastic_d: 55.67,
    market_sentiment: 'Neutral',
    notes: 'Stopped out just before price reversed higher.',
    screenshot_url: null,
    created_at: '2023-05-28T09:35:00Z'
  },
  {
    id: '8',
    pair: 'GBP/USD',
    timeframe: 'H4',
    type: 'Sell',
    entry_price: 1.2540,
    exit_price: 1.2480,
    stop_loss: 1.2575,
    take_profit: 1.2470,
    entry_date: '2023-06-01T11:30:00Z',
    exit_date: '2023-06-02T14:15:00Z',
    profit_loss: 60.00,
    risk_reward_ratio: 1.7,
    bb_upper: 1.2560,
    bb_middle: 1.2520,
    bb_lower: 1.2480,
    macd_line: -1.34,
    macd_signal: -0.78,
    macd_histogram: -0.56,
    stochastic_k: 28.56,
    stochastic_d: 35.67,
    market_sentiment: 'Moderate Bearish',
    notes: 'Break of key support level with increasing volume.',
    screenshot_url: null,
    created_at: '2023-06-01T11:35:00Z'
  }
] as Trade[];

export default Analytics;