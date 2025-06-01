import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import { useTheme } from '../contexts/ThemeContext';
import { useSupabase } from '../contexts/SupabaseContext';

interface SettingsState {
  riskPercentage: number;
}

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    riskPercentage: 2, // Default value
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        // In a real app, filter by user_id
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setSettings({
            riskPercentage: data[0].risk_percentage,
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        // In a real app, show error toast
      } finally {
        setLoading(false);
      }
    };

    // Uncomment to fetch real data
    // fetchSettings();
    
    // For development, simulate delay
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }, []);

  const handleRiskPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.1 && value <= 10) {
      setSettings(prev => ({ ...prev, riskPercentage: value }));
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would be from auth context
      const userId = 'user-id-placeholder';
      
      // Check if settings exist for this user
      const { data, error: fetchError } = await supabase
        .from('settings')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (fetchError) throw fetchError;
      
      if (data && data.length > 0) {
        // Update existing settings
        const { error } = await supabase
          .from('settings')
          .update({
            risk_percentage: settings.riskPercentage,
          })
          .eq('id', data[0].id);
        
        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('settings')
          .insert({
            user_id: userId,
            risk_percentage: settings.riskPercentage,
          });
        
        if (error) throw error;
      }
      
      // In a real app, show success toast
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      // In a real app, show error toast
      alert('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle 
        title="Settings" 
        description="Customize your trading journal settings"
      />
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card title="Appearance" className="mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Theme</label>
              <div className="flex bg-background rounded-md p-1 w-fit">
                <button
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                    theme === 'light' 
                      ? 'bg-foreground shadow-sm' 
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                    theme === 'dark' 
                      ? 'bg-foreground shadow-sm' 
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                </button>
              </div>
              <p className="text-sm text-text-muted mt-2">
                Choose your preferred theme for the application.
              </p>
            </div>
          </div>
        </Card>
        
        <Card title="Risk Management" className="mb-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="risk-percentage" className="block text-sm font-medium mb-1">
                Risk Percentage Per Trade
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="risk-percentage"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={settings.riskPercentage}
                  onChange={handleRiskPercentageChange}
                  className="input w-20 text-center"
                  disabled={loading}
                />
                <span className="ml-2 text-text-muted">% of account balance</span>
              </div>
              <p className="text-sm text-text-muted mt-2">
                This setting determines how much of your account balance you're willing to risk on each trade.
              </p>
              
              {/* Risk level indicator */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-1">Risk Level</p>
                <div className="w-full bg-background h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      settings.riskPercentage <= 1 
                        ? 'bg-success' 
                        : settings.riskPercentage <= 3
                          ? 'bg-warning'
                          : 'bg-error'
                    }`}
                    style={{ width: `${Math.min(settings.riskPercentage * 10, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {settings.riskPercentage <= 1 
                    ? 'Conservative (1% or less)' 
                    : settings.riskPercentage <= 3
                      ? 'Moderate (1-3%)'
                      : 'Aggressive (more than 3%)'}
                </p>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={saveSettings}
                className="btn btn-primary px-4 py-2"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default Settings;