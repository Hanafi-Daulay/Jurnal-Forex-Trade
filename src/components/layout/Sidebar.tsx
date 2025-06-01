import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart4, 
  BookText, 
  ChevronLeft, 
  Home, 
  ListFilter, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Trade Journal', path: '/journal', icon: <BookText className="w-5 h-5" /> },
    { name: 'Trade History', path: '/history', icon: <ListFilter className="w-5 h-5" /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart4 className="w-5 h-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-foreground border-r border-border transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <BarChart4 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-primary">FX Journal</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="inline-flex items-center justify-center rounded-md p-2 text-text hover:bg-background md:hidden"
            aria-label="Close menu"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary text-white'
                  : 'text-text hover:bg-background'
              }`}
              onClick={() => {
                if (window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;