import React, { useState, useEffect } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { DollarSign, BarChart2, TrendingUp, Percent } from 'lucide-react';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import { Trade } from '../types/trade';
import { useSupabase } from '../contexts/SupabaseContext';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
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
        // In a real app, show error toast/notification
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

  // Calculate summary metrics
  const totalProfitLoss = trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
  const winningTrades = trades.filter(trade => (trade.profit_loss || 0) > 0);
  const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
  const avgRiskReward = trades.length > 0 
    ? trades.reduce((sum, trade) => sum + trade.risk_reward_ratio, 0) / trades.length 
    : 0;

  // Prepare chart data
  const profitLossChartData = {
    labels: trades.map(trade => new Date(trade.entry_date).toLocaleDateString()),
    datasets: [
      {
        label: 'Cumulative P/L',
        data: trades.reduce<number[]>((acc, trade, index) => {
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

  const winLossChartData = {
    labels: ['Winning Trades', 'Losing Trades'],
    datasets: [
      {
        data: [
          winningTrades.length, 
          trades.length - winningTrades.length
        ],
        backgroundColor: [
          'rgb(var(--color-success))', 
          'rgb(var(--color-error))'
        ],
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
        <div className="text-text-muted">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <>
      <PageTitle 
        title="Dashboard" 
        description="Overview of your trading performance"
      />
      
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="animate-slide-up">
          <div className="flex items-center">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Total P/L</p>
              <h4 className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-success' : 'text-error'}`}>
                ${totalProfitLoss.toFixed(2)}
              </h4>
            </div>
          </div>
        </Card>
        
        <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <Percent className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Win Rate</p>
              <h4 className="text-2xl font-bold">{winRate.toFixed(1)}%</h4>
            </div>
          </div>
        </Card>
        
        <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <BarChart2 className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Total Trades</p>
              <h4 className="text-2xl font-bold">{trades.length}</h4>
            </div>
          </div>
        </Card>
        
        <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center">
            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-text-muted">Avg Risk/Reward</p>
              <h4 className="text-2xl font-bold">{avgRiskReward.toFixed(2)}</h4>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2" title="Profit/Loss Over Time">
          <div className="h-72">
            <Line data={profitLossChartData} options={chartOptions} />
          </div>
        </Card>
        
        <Card title="Win/Loss Ratio">
          <div className="h-72 flex items-center justify-center">
            <Pie data={winLossChartData} options={chartOptions} />
          </div>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card title="Recent Trades">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-sm font-medium">Pair</th>
                <th className="px-4 py-3 text-sm font-medium">Type</th>
                <th className="px-4 py-3 text-sm font-medium">Entry Date</th>
                <th className="px-4 py-3 text-sm font-medium">P/L</th>
                <th className="px-4 py-3 text-sm font-medium">R:R</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(0, 5).map((trade) => (
                <tr key={trade.id} className="border-b border-border hover:bg-background/50">
                  <td className="px-4 py-3 text-sm">{trade.pair}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      trade.type === 'Buy' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                    }`}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(trade.entry_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-medium ${
                      (trade.profit_loss || 0) >= 0 ? 'text-success' : 'text-error'
                    }`}>
                      ${(trade.profit_loss || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{trade.risk_reward_ratio.toFixed(2)}</td>
                </tr>
              ))}
              {trades.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                    No trades recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
};

// Mock data for development
const mockTrades: Trade[] = [
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
  }
];

export default Dashboard;