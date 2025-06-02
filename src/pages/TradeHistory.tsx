import React from 'react';
import { History } from 'lucide-react';
import PageTitle from '../components/ui/PageTitle';

const TradeHistory: React.FC = () => {
  return (
    <div className="p-6">
      <PageTitle 
        title="Trade History" 
        icon={<History className="w-6 h-6" />}
        description="View and analyze your complete trading history"
      />
      
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="text-gray-600 dark:text-gray-300">
            Your trading history will be displayed here. The component needs to be implemented with your specific trading data and requirements.
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeHistory;