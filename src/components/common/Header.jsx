import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Bell, 
  Settings, 
  Search, 
  Filter, 
  Download,
  Plus,
  Menu,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';

const Header = ({ 
  title, 
  subtitle, 
  actions,
  showSearch = false,
  onSearch,
  searchPlaceholder = "Rechercher...",
  showNotifications = true,
  notificationCount = 0,
  onMenuToggle,
  user = { name: 'Admin', email: 'admin@pronet.fr', avatar: null }
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (e) => {
    setSearchValue(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <div className="header-glass p-6 mb-8">
      <div className="flex items-center justify-between">
        {/* Left side - Title and subtitle */}
        <div className="flex items-center gap-4">
          {onMenuToggle && (
            <button 
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-xl bg-white/50 hover:bg-white/70 transition-all"
            >
              <Menu size={20} className="text-gray-700" />
            </button>
          )}
          
          <div>
            <h1 className="text-3xl font-bold gradient-text">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 font-medium mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Center - Search bar (if enabled) */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/60 border border-white/30 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Right side - Actions and user menu */}
        <div className="flex items-center gap-3">
          {/* Custom actions */}
          {actions && (
            <div className="hidden sm:flex items-center gap-2">
              {actions}
            </div>
          )}

          {/* Notifications */}
          {showNotifications && (
            <button className="relative p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-all group">
              <Bell size={20} className="text-gray-700 group-hover:text-blue-600 transition-colors" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}

          {/* Settings */}
          <button className="p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-all group">
            <Settings size={20} className="text-gray-700 group-hover:text-blue-600 transition-colors" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <User size={16} className="text-white" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
              <ChevronDown size={16} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white/90 backdrop-blur-md rounded-2xl shadow-glass border border-white/20 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200/50">
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                
                <div className="py-2">
                  <button className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3">
                    <User size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Mon Profil</span>
                  </button>
                  
                  <button className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3">
                    <Settings size={16} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Paramètres</span>
                  </button>
                  
                  <div className="border-t border-gray-200/50 mt-2 pt-2">
                    <button className="w-full px-4 py-2 text-left hover:bg-red-50 transition-all flex items-center gap-3 text-red-600">
                      <LogOut size={16} />
                      <span className="text-sm font-medium">Déconnexion</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {showSearch && (
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/60 border border-white/30 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      )}

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
};

Header.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  showSearch: PropTypes.bool,
  onSearch: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  showNotifications: PropTypes.bool,
  notificationCount: PropTypes.number,
  onMenuToggle: PropTypes.func,
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    avatar: PropTypes.string
  })
};

// Header action components pour réutilisation
export const HeaderAction = ({ children, onClick, className = '', variant = 'default' }) => {
  const variants = {
    default: 'bg-white/50 hover:bg-white/70 text-gray-700',
    primary: 'modern-button',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    success: 'bg-green-100 hover:bg-green-200 text-green-700',
    warning: 'bg-orange-100 hover:bg-orange-200 text-orange-700',
    danger: 'bg-red-100 hover:bg-red-200 text-red-700'
  };

  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-xl transition-all flex items-center gap-2 font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// Header avec actions prédéfinies courantes
export const HeaderWithActions = ({ title, subtitle, onAdd, onFilter, onExport, ...props }) => {
  const actions = (
    <>
      {onFilter && (
        <HeaderAction onClick={onFilter} variant="secondary">
          <Filter size={18} />
          <span className="hidden sm:inline">Filtrer</span>
        </HeaderAction>
      )}
      
      {onExport && (
        <HeaderAction onClick={onExport} variant="secondary">
          <Download size={18} />
          <span className="hidden sm:inline">Exporter</span>
        </HeaderAction>
      )}
      
      {onAdd && (
        <HeaderAction onClick={onAdd} variant="primary">
          <Plus size={18} />
          <span className="hidden sm:inline">Ajouter</span>
        </HeaderAction>
      )}
    </>
  );

  return (
    <Header 
      title={title} 
      subtitle={subtitle} 
      actions={actions}
      {...props} 
    />
  );
};

export default Header;