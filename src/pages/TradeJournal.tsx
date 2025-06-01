import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Upload, AlertCircle } from 'lucide-react';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import { CurrencyPair, Timeframe, TradeType, MarketSentiment, TradeFormData } from '../types/trade';
import { useSupabase } from '../contexts/SupabaseContext';

const TradeJournal: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { supabase } = useSupabase();
  
  const { 
    register, 
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors } 
  } = useForm<TradeFormData>({
    defaultValues: {
      pair: 'XAU/USD',
      timeframe: 'H4',
      type: 'Buy',
      entry_date: new Date().toISOString().split('T')[0],
      market_sentiment: 'Neutral'
    }
  });

  // For real-time calculation of risk:reward ratio
  const stopLoss = watch('stop_loss');
  const takeProfit = watch('take_profit');
  const entryPrice = watch('entry_price');
  const tradeType = watch('type');
  
  // Calculate risk:reward ratio
  const calculateRiskReward = () => {
    if (!stopLoss || !takeProfit || !entryPrice) return 0;
    
    let risk = 0, reward = 0;
    
    if (tradeType === 'Buy') {
      risk = entryPrice - stopLoss;
      reward = takeProfit - entryPrice;
    } else {
      risk = stopLoss - entryPrice;
      reward = entryPrice - takeProfit;
    }
    
    if (risk <= 0) return 0;
    return (reward / risk).toFixed(2);
  };

  const onSubmit = async (data: TradeFormData) => {
    setIsSubmitting(true);
    
    try {
      let screenshot_url = null;
      
      // Handle screenshot upload if exists
      if (data.screenshot) {
        const file = data.screenshot;
        const fileExt = file.name.split('.').pop();
        const fileName = `${new Date().getTime()}.${fileExt}`;
        const filePath = `screenshots/${fileName}`;
        
        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('trading-journal')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase
          .storage
          .from('trading-journal')
          .getPublicUrl(filePath);
          
        screenshot_url = urlData.publicUrl;
      }
      
      // Calculate P/L if both entry and exit price are provided
      let profit_loss = null;
      if (data.entry_price && data.exit_price) {
        if (data.type === 'Buy') {
          profit_loss = (data.exit_price - data.entry_price) * 100; // Simplified calculation
        } else {
          profit_loss = (data.entry_price - data.exit_price) * 100; // Simplified calculation
        }
      }
      
      // Calculate risk/reward ratio
      const risk_reward_ratio = data.take_profit && data.stop_loss ? 
        parseFloat(calculateRiskReward()) : 0;
      
      // Insert trade data to Supabase
      const { error } = await supabase
        .from('trades')
        .insert({
          pair: data.pair,
          timeframe: data.timeframe,
          type: data.type,
          entry_price: data.entry_price,
          exit_price: data.exit_price || null,
          stop_loss: data.stop_loss,
          take_profit: data.take_profit,
          entry_date: data.entry_date,
          exit_date: data.exit_date || null,
          profit_loss,
          risk_reward_ratio,
          bb_upper: data.bb_upper || null,
          bb_middle: data.bb_middle || null,
          bb_lower: data.bb_lower || null,
          macd_line: data.macd_line || null,
          macd_signal: data.macd_signal || null,
          macd_histogram: data.macd_histogram || null,
          stochastic_k: data.stochastic_k || null,
          stochastic_d: data.stochastic_d || null,
          market_sentiment: data.market_sentiment || null,
          notes: data.notes || null,
          screenshot_url,
          user_id: 'user-id-placeholder' // In a real app, get from auth context
        });
        
      if (error) throw error;
      
      // Reset form
      reset();
      setPreviewImage(null);
      
      // Show success message - in a real app, use a toast
      alert('Trade saved successfully!');
      
    } catch (error) {
      console.error('Error saving trade:', error);
      // In a real app, show error toast
      alert('Failed to save trade. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const currencyPairs: CurrencyPair[] = [
    'XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 
    'USD/CAD', 'AUD/USD', 'NZD/USD', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'Other'
  ];
  
  const timeframes: Timeframe[] = ['M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];
  
  const sentiments: MarketSentiment[] = [
    'Strong Bullish', 'Moderate Bullish', 'Neutral', 'Moderate Bearish', 'Strong Bearish'
  ];

  return (
    <>
      <PageTitle 
        title="Trade Journal" 
        description="Record your trades with detailed analysis"
      />
      
      <Card title="New Trade Entry" className="mb-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Trade Basic Information */}
            <div className="space-y-4">
              <div>
                <label htmlFor="pair" className="block text-sm font-medium mb-1">Currency Pair</label>
                <select 
                  id="pair"
                  className="input"
                  {...register('pair', { required: 'Currency pair is required' })}
                >
                  {currencyPairs.map(pair => (
                    <option key={pair} value={pair}>{pair}</option>
                  ))}
                </select>
                {errors.pair && (
                  <p className="text-error text-xs mt-1">{errors.pair.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="timeframe" className="block text-sm font-medium mb-1">Timeframe</label>
                <select 
                  id="timeframe"
                  className="input"
                  {...register('timeframe', { required: 'Timeframe is required' })}
                >
                  {timeframes.map(tf => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
                {errors.timeframe && (
                  <p className="text-error text-xs mt-1">{errors.timeframe.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium mb-1">Trade Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      value="Buy" 
                      className="mr-2"
                      {...register('type', { required: 'Trade type is required' })} 
                    />
                    <span className="text-sm">Buy</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="radio" 
                      value="Sell" 
                      className="mr-2"
                      {...register('type')} 
                    />
                    <span className="text-sm">Sell</span>
                  </label>
                </div>
                {errors.type && (
                  <p className="text-error text-xs mt-1">{errors.type.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="entry_date" className="block text-sm font-medium mb-1">Entry Date</label>
                <input 
                  type="date" 
                  id="entry_date"
                  className="input"
                  {...register('entry_date', { required: 'Entry date is required' })}
                />
                {errors.entry_date && (
                  <p className="text-error text-xs mt-1">{errors.entry_date.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="exit_date" className="block text-sm font-medium mb-1">Exit Date (Optional)</label>
                <input 
                  type="date" 
                  id="exit_date"
                  className="input"
                  {...register('exit_date')}
                />
              </div>
            </div>
            
            {/* Trade Prices */}
            <div className="space-y-4">
              <div>
                <label htmlFor="entry_price" className="block text-sm font-medium mb-1">Entry Price</label>
                <input 
                  type="number" 
                  id="entry_price"
                  step="0.00001"
                  className="input"
                  {...register('entry_price', { 
                    required: 'Entry price is required',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Price must be positive' } 
                  })}
                />
                {errors.entry_price && (
                  <p className="text-error text-xs mt-1">{errors.entry_price.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="exit_price" className="block text-sm font-medium mb-1">Exit Price (Optional)</label>
                <input 
                  type="number" 
                  id="exit_price"
                  step="0.00001"
                  className="input"
                  {...register('exit_price', { 
                    valueAsNumber: true,
                    min: { value: 0, message: 'Price must be positive' } 
                  })}
                />
                {errors.exit_price && (
                  <p className="text-error text-xs mt-1">{errors.exit_price.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="stop_loss" className="block text-sm font-medium mb-1">Stop Loss</label>
                <input 
                  type="number" 
                  id="stop_loss"
                  step="0.00001"
                  className="input"
                  {...register('stop_loss', { 
                    required: 'Stop loss is required',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Price must be positive' } 
                  })}
                />
                {errors.stop_loss && (
                  <p className="text-error text-xs mt-1">{errors.stop_loss.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="take_profit" className="block text-sm font-medium mb-1">Take Profit</label>
                <input 
                  type="number" 
                  id="take_profit"
                  step="0.00001"
                  className="input"
                  {...register('take_profit', { 
                    required: 'Take profit is required',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Price must be positive' } 
                  })}
                />
                {errors.take_profit && (
                  <p className="text-error text-xs mt-1">{errors.take_profit.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Risk/Reward Ratio</label>
                <div className="input flex items-center justify-between">
                  <span className="font-medium">1:{calculateRiskReward()}</span>
                  {parseFloat(calculateRiskReward()) < 1 && (
                    <span className="flex items-center text-xs text-warning">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Low R:R ratio
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Technical Indicators */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Technical Indicators</h4>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="bb_upper" className="block text-xs font-medium mb-1">BB Upper</label>
                  <input 
                    type="number" 
                    id="bb_upper"
                    step="0.00001"
                    className="input h-8 text-xs"
                    {...register('bb_upper', { valueAsNumber: true })}
                  />
                </div>
                
                <div>
                  <label htmlFor="bb_middle" className="block text-xs font-medium mb-1">BB Middle</label>
                  <input 
                    type="number" 
                    id="bb_middle"
                    step="0.00001"
                    className="input h-8 text-xs"
                    {...register('bb_middle', { valueAsNumber: true })}
                  />
                </div>
                
                <div>
                  <label htmlFor="bb_lower" className="block text-xs font-medium mb-1">BB Lower</label>
                  <input 
                    type="number" 
                    id="bb_lower"
                    step="0.00001"
                    className="input h-8 text-xs"
                    {...register('bb_lower', { valueAsNumber: true })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="macd_line" className="block text-xs font-medium mb-1">MACD Line</label>
                  <input 
                    type="number" 
                    id="macd_line"
                    step="0.01"
                    className="input h-8 text-xs"
                    {...register('macd_line', { valueAsNumber: true })}
                  />
                </div>
                
                <div>
                  <label htmlFor="macd_signal" className="block text-xs font-medium mb-1">Signal Line</label>
                  <input 
                    type="number" 
                    id="macd_signal"
                    step="0.01"
                    className="input h-8 text-xs"
                    {...register('macd_signal', { valueAsNumber: true })}
                  />
                </div>
                
                <div>
                  <label htmlFor="macd_histogram" className="block text-xs font-medium mb-1">Histogram</label>
                  <input 
                    type="number" 
                    id="macd_histogram"
                    step="0.01"
                    className="input h-8 text-xs"
                    {...register('macd_histogram', { valueAsNumber: true })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="stochastic_k" className="block text-xs font-medium mb-1">Stochastic %K</label>
                  <input 
                    type="number" 
                    id="stochastic_k"
                    step="0.01"
                    min="0"
                    max="100"
                    className="input h-8 text-xs"
                    {...register('stochastic_k', { 
                      valueAsNumber: true,
                      min: { value: 0, message: 'Value must be between 0 and 100' },
                      max: { value: 100, message: 'Value must be between 0 and 100' }
                    })}
                  />
                  {errors.stochastic_k && (
                    <p className="text-error text-xs mt-1">{errors.stochastic_k.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="stochastic_d" className="block text-xs font-medium mb-1">Stochastic %D</label>
                  <input 
                    type="number" 
                    id="stochastic_d"
                    step="0.01"
                    min="0"
                    max="100"
                    className="input h-8 text-xs"
                    {...register('stochastic_d', { 
                      valueAsNumber: true,
                      min: { value: 0, message: 'Value must be between 0 and 100' },
                      max: { value: 100, message: 'Value must be between 0 and 100' }
                    })}
                  />
                  {errors.stochastic_d && (
                    <p className="text-error text-xs mt-1">{errors.stochastic_d.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="market_sentiment" className="block text-sm font-medium mb-1">Market Sentiment</label>
                <select 
                  id="market_sentiment"
                  className="input"
                  {...register('market_sentiment')}
                >
                  {sentiments.map(sentiment => (
                    <option key={sentiment} value={sentiment}>{sentiment}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Notes and Screenshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">Trade Notes</label>
              <textarea 
                id="notes"
                rows={5}
                className="input min-h-[120px]"
                placeholder="Document your trading strategy, reasons for entry/exit, and any observations..."
                {...register('notes')}
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Chart Screenshot</label>
              <div className="border border-dashed border-border rounded-md p-4 flex flex-col items-center justify-center">
                <Controller
                  control={control}
                  name="screenshot"
                  render={({ field: { onChange, onBlur, value, ref } }) => (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        onChange(e.target.files?.[0]);
                        handleImageChange(e);
                      }}
                      onBlur={onBlur}
                      ref={ref}
                      className="hidden"
                      id="screenshot-upload"
                    />
                  )}
                />
                
                {previewImage ? (
                  <div className="relative w-full">
                    <img 
                      src={previewImage} 
                      alt="Chart preview" 
                      className="w-full h-auto max-h-[200px] object-contain rounded-md"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-error/90 text-white rounded-full p-1"
                      onClick={() => {
                        setPreviewImage(null);
                        // Reset the file input
                        (document.getElementById('screenshot-upload') as HTMLInputElement).value = '';
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label htmlFor="screenshot-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="h-10 w-10 text-text-muted mb-2" />
                    <span className="text-sm text-text-muted">Upload chart screenshot</span>
                    <span className="text-xs text-text-muted mt-1">(PNG, JPG up to 5MB)</span>
                  </label>
                )}
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary px-6 py-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Trade'}
            </button>
          </div>
        </form>
      </Card>
    </>
  );
};

export default TradeJournal;