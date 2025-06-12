import React, { useState, useEffect, Component } from 'react';
import PropTypes from 'prop-types';
import Sidebar from './Sidebar';
import Header from './Header';

// Error Boundary natif pour le Layout
class LayoutErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Layout Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-background flex items-center justify-center">
          <div className="glass-card p-8 text-center max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Erreur de chargement</h2>
            <p className="text-gray-600 mb-6">Une erreur est survenue lors du chargement de l'interface.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Layout = ({ 
  children, 
  activeTab, 
  setActiveTab,
  pageTitle,
  pageSubtitle,
  headerActions,
  showSearch = false,
  onSearch,
  loading = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (loading) {
    return <LoadingLayout />;
  }

  return (
    <LayoutErrorBoundary>
      <div className="flex min-h-screen bg-gradient-background">
        {/* Background Pattern */}
        <div className="background-pattern" />
        
        {/* Desktop Sidebar - Fixed Position */}
        <div className="hidden lg:block">
          <div className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-80'}`}>
            <Sidebar 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              isMobile={false}
            />
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={closeMobileMenu}></div>
            <div className="relative w-80">
              <Sidebar 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isCollapsed={false}
                isMobile={true}
                onClose={closeMobileMenu}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          isMobile ? 'ml-0' : isCollapsed ? 'ml-20' : 'ml-80'
        }`}>
          {/* Header */}
          <Header 
            title={pageTitle}
            subtitle={pageSubtitle}
            actions={headerActions}
            showSearch={showSearch}
            onSearch={onSearch}
            onMenuToggle={isMobile ? toggleMobileMenu : undefined}
          />

          {/* Page Content */}
          <main className="flex-1 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="animate-fade-in-up">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </LayoutErrorBoundary>
  );
};

// Loading Layout Component
const LoadingLayout = () => (
  <div className="min-h-screen bg-gradient-background flex items-center justify-center">
    <div className="background-pattern" />
    <div className="glass-card p-8 text-center animate-fade-in-scale">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
      <h2 className="text-xl font-bold gradient-text mb-2">AutoCare Pro</h2>
      <p className="text-gray-600 font-medium">Chargement en cours...</p>
    </div>
  </div>
);

// Error Layout Component
export const ErrorLayout = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
    <div className="background-pattern" />
    <div className="glass-card p-8 text-center max-w-md animate-fade-in-scale">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <span className="text-red-600 text-2xl">⚠️</span>
      </div>
      
      <h2 className="text-xl font-bold text-gray-800 mb-2">Oups ! Une erreur est survenue</h2>
      <p className="text-gray-600 mb-6">
        {error?.message || 'Une erreur inattendue s\'est produite. Veuillez réessayer.'}
      </p>
      
      <div className="flex gap-3 justify-center">
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all font-semibold text-gray-700"
        >
          Recharger la page
        </button>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all"
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  </div>
);

// Layout avec actions prédéfinies
export const DashboardLayout = ({ children, activeTab, setActiveTab, pageData }) => (
  <Layout
    activeTab={activeTab}
    setActiveTab={setActiveTab}
    pageTitle={pageData?.title || 'Tableau de Bord'}
    pageSubtitle={pageData?.subtitle || 'Vue d\'ensemble de votre activité'}
    showSearch={pageData?.showSearch || false}
    onSearch={pageData?.onSearch}
    headerActions={pageData?.actions}
  >
    {children}
  </Layout>
);

// Layout pour les pages de gestion
export const ManagementLayout = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  title,
  subtitle,
  onAdd,
  onFilter,
  onExport,
  showSearch = true,
  onSearch
}) => {
  const actions = (
    <div className="flex items-center gap-2">
      {onFilter && (
        <button 
          onClick={onFilter}
          className="p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-all flex items-center gap-2 font-medium text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          <span className="hidden sm:inline">Filtrer</span>
        </button>
      )}
      
      {onExport && (
        <button 
          onClick={onExport}
          className="p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-all flex items-center gap-2 font-medium text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">Exporter</span>
        </button>
      )}
      
      {onAdd && (
        <button 
          onClick={onAdd}
          className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      )}
    </div>
  );

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      pageTitle={title}
      pageSubtitle={subtitle}
      headerActions={actions}
      showSearch={showSearch}
      onSearch={onSearch}
    >
      {children}
    </Layout>
  );
};

// Layout pour les pages de détail
export const DetailLayout = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  title,
  subtitle,
  onBack,
  onEdit,
  onDelete,
  onSave
}) => {
  const actions = (
    <div className="flex items-center gap-2">
      {onBack && (
        <button 
          onClick={onBack}
          className="p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-all flex items-center gap-2 font-medium text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Retour</span>
        </button>
      )}
      
      {onEdit && (
        <button 
          onClick={onEdit}
          className="p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-all flex items-center gap-2 font-medium text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="hidden sm:inline">Modifier</span>
        </button>
      )}
      
      {onDelete && (
        <button 
          onClick={onDelete}
          className="p-3 rounded-xl bg-red-100 hover:bg-red-200 transition-all flex items-center gap-2 font-medium text-red-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="hidden sm:inline">Supprimer</span>
        </button>
      )}
      
      {onSave && (
        <button 
          onClick={onSave}
          className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="hidden sm:inline">Enregistrer</span>
        </button>
      )}
    </div>
  );

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      pageTitle={title}
      pageSubtitle={subtitle}
      headerActions={actions}
      showSearch={false}
    >
      {children}
    </Layout>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  pageTitle: PropTypes.string,
  pageSubtitle: PropTypes.string,
  headerActions: PropTypes.node,
  showSearch: PropTypes.bool,
  onSearch: PropTypes.func,
  loading: PropTypes.bool
};

export default Layout;