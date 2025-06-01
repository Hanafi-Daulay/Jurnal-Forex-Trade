import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Eye, ArrowUp, ArrowDown, X } from 'lucide-react';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import { Trade, CurrencyPair, Timeframe } from '../types/trade';
import { useSupabase } from '../contexts/SupabaseContext';
import { format } from 'date-fns';

const TradeHistory: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Trade;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    pair: '' as CurrencyPair | '',
    timeframe: '' as Timeframe | '',
    type: '' as 'Buy' | 'Sell' | '',
    dateFrom: '',
    dateTo: '',
    profitOnly: false,
    lossOnly: false,
  });
  
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
  
  // Filter trades
  const filteredTrades = trades.filter(trade => {
    // Search term filter
    if (searchTerm && !trade.pair.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !trade.notes?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Pair filter
    if (filters.pair && trade.pair !== filters.pair) {
      return false;
    }
    
    // Timeframe filter
    if (filters.timeframe && trade.timeframe !== filters.timeframe) {
      return false;
    }
    
    // Type filter
    if (filters.type && trade.type !== filters.type) {
      return false;
    }
    
    // Date range filter - from
    if (filters.dateFrom && new Date(trade.entry_date) < new Date(filters.dateFrom)) {
      return false;
    }
    
    // Date range filter - to
    if (filters.dateTo && new Date(trade.entry_date) > new Date(filters.dateTo)) {
      return false;
    }
    
    // Profit/Loss filters
    if (filters.profitOnly && (trade.profit_loss || 0) <= 0) {
      return false;
    }
    
    if (filters.lossOnly && (trade.profit_loss || 0) >= 0) {
      return false;
    }
    
    return true;
  });
  
  // Sort trades
  const sortedTrades = React.useMemo(() => {
    if (!sortConfig) {
      return filteredTrades;
    }
    
    return [...filteredTrades].sort((a, b) => {
      if (a[sortConfig.key] === null) return 1;
      if (b[sortConfig.key] === null) return -1;
      
      if (a[sortConfig.key]! < b[sortConfig.key]!) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key]! > b[sortConfig.key]!) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredTrades, sortConfig]);
  
  const requestSort = (key: keyof Trade) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: keyof Trade) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" /> 
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };
  
  const resetFilters = () => {
    setFilters({
      pair: '',
      timeframe: '',
      type: '',
      dateFrom: '',
      dateTo: '',
      profitOnly: false,
      lossOnly: false,
    });
    setSearchTerm('');
  };
  
  const currencyPairs: CurrencyPair[] = [
    'XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 
    'USD/CAD', 'AUD/USD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'Other'
  ];
  
  const timeframes: Timeframe[] = ['M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-text-muted">Loading trade history...</div>
      </div>
    );
  }

  return (
    <>
      <PageTitle 
        title="Trade History" 
        description="View and analyze your past trades"
      />
      
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search trades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9"
            />
          </div>
          
          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline px-4 py-2 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {Object.values(filters).some(value => 
                value !== '' && value !== false
              ) && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs">
                  {Object.values(filters).filter(value => value !== '' && value !== false).length}
                </span>
              )}
            </button>
            
            {Object.values(filters).some(value => value !== '' && value !== false) && (
              <button
                onClick={resetFilters}
                className="btn btn-ghost p-2 text-text-muted hover:text-error"
                title="Clear all filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-background rounded-md animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="pair-filter" className="block text-sm font-medium mb-1">Currency Pair</label>
                <select 
                  id="pair-filter"
                  className="input"
                  value={filters.pair}
                  onChange={(e) => setFilters({ ...filters, pair: e.target.value as CurrencyPair | '' })}
                >
                  <option value="">All Pairs</option>
                  {currencyPairs.map(pair => (
                    <option key={pair} value={pair}>{pair}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="timeframe-filter" className="block text-sm font-medium mb-1">Timeframe</label>
                <select 
                  id="timeframe-filter"
                  className="input"
                  value={filters.timeframe}
                  onChange={(e) => setFilters({ ...filters, timeframe: e.target.value as Timeframe | '' })}
                >
                  <option value="">All Timeframes</option>
                  {timeframes.map(tf => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="type-filter" className="block text-sm font-medium mb-1">Trade Type</label>
                <select 
                  id="type-filter"
                  className="input"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as 'Buy' | 'Sell' | '' })}
                >
                  <option value="">All Types</option>
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="result-filter" className="block text-sm font-medium mb-1">Trade Result</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filters.profitOnly}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        profitOnly: e.target.checked,
                        lossOnly: e.target.checked ? false : filters.lossOnly
                      })}
                      className="mr-2" 
                    />
                    <span className="text-sm">Profit Only</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={filters.lossOnly}
                      onChange={(e) => setFilters({ 
                        ...filters, 
                        lossOnly: e.target.checked,
                        profitOnly: e.target.checked ? false : filters.profitOnly
                      })}
                      className="mr-2" 
                    />
                    <span className="text-sm">Loss Only</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label htmlFor="date-from" className="block text-sm font-medium mb-1">Date From</label>
                <input 
                  type="date" 
                  id="date-from"
                  className="input"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              
              <div>
                <label htmlFor="date-to" className="block text-sm font-medium mb-1">Date To</label>
                <input 
                  type="date" 
                  id="date-to"
                  className="input"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Trades Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-sm font-medium">
                  <button 
                    className="flex items-center text-left"
                    onClick={() => requestSort('pair')}
                  >
                    Pair {getSortIndicator('pair')}
                  </button>
                </th>
                <th className="px-4 py-3 text-sm font-medium">
                  <button 
                    className="flex items-center text-left"
                    onClick={() => requestSort('type')}
                  >
                    Type {getSortIndicator('type')}
                  </button>
                </th>
                <th className="px-4 py-3 text-sm font-medium">
                  <button 
                    className="flex items-center text-left"
                    onClick={() => requestSort('entry_date')}
                  >
                    Date {getSortIndicator('entry_date')}
                  </button>
                </th>
                <th className="px-4 py-3 text-sm font-medium">
                  <button 
                    className="flex items-center text-left"
                    onClick={() => requestSort('entry_price')}
                  >
                    Entry {getSortIndicator('entry_price')}
                  </button>
                </th>
                <th className="px-4 py-3 text-sm font-medium">
                  <button 
                    className="flex items-center text-left"
                    onClick={() => requestSort('exit_price')}
                  >
                    Exit {getSortIndicator('exit_price')}
                  </button>
                </th>
                <th className="px-4 py-3 text-sm font-medium">
                  <button 
                    className="flex items-center text-left"
                    onClick={() => requestSort('profit_loss')}
                  >
                    P/L {getSortIndicator('profit_loss')}
                  </button>
                </th>
                <th className="px-4 py-3 text-sm font-medium">
                  <button 
                    className="flex items-center text-left"
                    onClick={() => requestSort('risk_reward_ratio')}
                  >
                    R:R {getSortIndicator('risk_reward_ratio')}
                  </button>
                </th>
                <th className="px-4 py-3 text-sm font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrades.map((trade) => (
                <tr 
                  key={trade.id} 
                  className="border-b border-border hover:bg-background/50 cursor-pointer"
                  onClick={() => setSelectedTrade(trade)}
                >
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span>{trade.pair}</span>
                      <span className="text-xs text-text-muted">{trade.timeframe}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      trade.type === 'Buy' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                    }`}>
                      {trade.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {format(new Date(trade.entry_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm">{trade.entry_price.toFixed(5)}</td>
                  <td className="px-4 py-3 text-sm">
                    {trade.exit_price ? trade.exit_price.toFixed(5) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-medium ${
                      (trade.profit_loss || 0) >= 0 ? 'text-success' : 'text-error'
                    }`}>
                      ${(trade.profit_loss || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{trade.risk_reward_ratio.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTrade(trade);
                      }}
                      className="p-2 text-text-muted hover:text-primary"
                      title="View trade details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {sortedTrades.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-text-muted">
                    No trades found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Trade Detail Modal */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-foreground rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-bold">
                {selectedTrade.pair} {selectedTrade.timeframe} - {selectedTrade.type} Trade
              </h3>
              <button
                onClick={() => setSelectedTrade(null)}
                className="text-text-muted hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-4">Trade Information</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Entry Date:</dt>
                      <dd>{format(new Date(selectedTrade.entry_date), 'MMM dd, yyyy HH:mm')}</dd>
                    </div>
                    {selectedTrade.exit_date && (
                      <div className="flex justify-between">
                        <dt className="text-text-muted">Exit Date:</dt>
                        <dd>{format(new Date(selectedTrade.exit_date), 'MMM dd, yyyy HH:mm')}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Type:</dt>
                      <dd className={selectedTrade.type === 'Buy' ? 'text-success' : 'text-error'}>
                        {selectedTrade.type}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Entry Price:</dt>
                      <dd>{selectedTrade.entry_price.toFixed(5)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Exit Price:</dt>
                      <dd>{selectedTrade.exit_price ? selectedTrade.exit_price.toFixed(5) : '-'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Stop Loss:</dt>
                      <dd>{selectedTrade.stop_loss.toFixed(5)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Take Profit:</dt>
                      <dd>{selectedTrade.take_profit.toFixed(5)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Profit/Loss:</dt>
                      <dd className={(selectedTrade.profit_loss || 0) >= 0 ? 'text-success' : 'text-error'}>
                        ${(selectedTrade.profit_loss || 0).toFixed(2)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Risk:Reward Ratio:</dt>
                      <dd>{selectedTrade.risk_reward_ratio.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Market Sentiment:</dt>
                      <dd>{selectedTrade.market_sentiment || 'Not specified'}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium mb-4">Technical Indicators</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Bollinger Bands</h5>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-text-muted">Upper:</dt>
                          <dd>{selectedTrade.bb_upper?.toFixed(5) || '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-text-muted">Middle:</dt>
                          <dd>{selectedTrade.bb_middle?.toFixed(5) || '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-text-muted">Lower:</dt>
                          <dd>{selectedTrade.bb_lower?.toFixed(5) || '-'}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-2">MACD</h5>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-text-muted">MACD Line:</dt>
                          <dd>{selectedTrade.macd_line?.toFixed(2) || '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-text-muted">Signal Line:</dt>
                          <dd>{selectedTrade.macd_signal?.toFixed(2) || '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-text-muted">Histogram:</dt>
                          <dd>{selectedTrade.macd_histogram?.toFixed(2) || '-'}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-2">Stochastic</h5>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-text-muted">%K:</dt>
                          <dd>{selectedTrade.stochastic_k?.toFixed(2) || '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-text-muted">%D:</dt>
                          <dd>{selectedTrade.stochastic_d?.toFixed(2) || '-'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedTrade.notes && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Trade Notes</h4>
                  <div className="p-4 bg-background rounded-md">
                    <p className="whitespace-pre-line">{selectedTrade.notes}</p>
                  </div>
                </div>
              )}
              
              {selectedTrade.screenshot_url && (
                <div>
                  <h4 className="font-medium mb-2">Chart Screenshot</h4>
                  <div className="border border-border rounded-md overflow-hidden">
                    <img 
                      src={selectedTrade.screenshot_url} 
                      alt="Chart screenshot" 
                      className="w-full h-auto max-h-[400px] object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-6 border-t border-border">
              <button
                onClick={() => setSelectedTrade(null)}
                className="btn btn-outline px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Mock data (same as in Dashboard.tsx)
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
  }
] as Trade[];

export default TradeHistory;