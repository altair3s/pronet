import React, { useState, useEffect, Component } from 'react';

// Import des pages
import Dashboard from './pages/Dashboard';
import FleetManagement from './pages/Fleet';
import Interventions from './pages/Interventions';
import WashingService from './pages/Washing';
import Billing from './pages/Billing';

// Import des composants
import Layout from './components/common/Layout';

// NOUVEAU : Import du service Firebase au lieu de Google Sheets
import FirebaseService from './services/firebaseService';

// Import des styles
import './index.css';

// Error Boundary Component natif React (GARDEZ CETTE VERSION)
class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erreur capturée par l\'Error Boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Appel du callback si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Interface d'erreur simple intégrée
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mb-2">Oups ! Une erreur est survenue</h2>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || 'Une erreur inattendue s\'est produite. Veuillez réessayer.'}
            </p>
            
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-all"
              >
                Recharger la page
              </button>
              <button 
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  if (this.props.onReset) this.props.onReset();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl font-medium text-white transition-all"
              >
                Réessayer
              </button>
            </div>

            {/* Informations de debug Firebase */}
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                🔥 Informations Firebase
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
                <p><strong>Vérifications suggérées :</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Configuration Firebase dans firebase/config.js</li>
                  <li>Règles Firestore (utilisez le mode "test")</li>
                  <li>Connexion internet</li>
                  <li>Console navigateur pour plus de détails</li>
                </ul>
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Layout d'erreur pour les cas spécifiques
const ErrorLayout = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 max-w-md text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <span className="text-red-600 text-2xl">🔥</span>
      </div>
      
      <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur de connexion Firebase</h2>
      <p className="text-gray-600 mb-6">
        {error?.message || 'Impossible de se connecter à Firebase. Vérifiez votre configuration.'}
      </p>
      
      <div className="flex gap-3 justify-center">
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-all"
        >
          Recharger la page
        </button>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium text-white transition-all"
          >
            🔄 Réessayer Firebase
          </button>
        )}
      </div>
    </div>
  </div>
);

const App = () => {
  // État global de l'application
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({
    vehicles: [],
    interventions: [],
    washings: [],
    billing: [],
    lastUpdate: null,
    stats: {
      totalVehicles: 0,
      activeVehicles: 0,
      maintenanceVehicles: 0,
      totalServices: 0,
      pendingServices: 0,
      completedServices: 0,
      totalWashing: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chargement initial des données
  useEffect(() => {
    loadAllData();
  }, []);

  // NOUVELLE fonction de chargement des données avec Firebase
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Chargement des données depuis Firebase...');
      
      // Utiliser le nouveau service Firebase
      const allData = await FirebaseService.getMockData();
      
      setData({
        ...allData,
        lastUpdate: new Date().toISOString()
      });
      
      console.log('✅ Données Firebase chargées avec succès:', allData);
      
    } catch (err) {
      console.error('❌ Erreur lors du chargement des données Firebase:', err);
      setError(err);
      
      // Utiliser des données vides en cas d'erreur
      setData({
        vehicles: [],
        interventions: [],
        washings: [],
        billing: [],
        lastUpdate: null,
        stats: {
          totalVehicles: 0,
          activeVehicles: 0,
          maintenanceVehicles: 0,
          totalServices: 0,
          pendingServices: 0,
          completedServices: 0,
          totalWashing: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // NOUVELLE fonction de rafraîchissement des données
  const refreshData = async () => {
    try {
      console.log('🔄 Rafraîchissement des données Firebase...');
      const allData = await FirebaseService.getMockData();
      
      setData({
        ...allData,
        lastUpdate: new Date().toISOString()
      });
      
      setError(null); // Clear error on successful refresh
      console.log('✅ Données rafraîchies avec succès');
      
    } catch (err) {
      console.error('❌ Erreur lors du rafraîchissement Firebase:', err);
      setError(err);
    }
  };

  // Gestionnaire d'erreurs global
  const handleError = (error, errorInfo) => {
    console.error('Erreur capturée par l\'Error Boundary:', error, errorInfo);
    setError(error);
  };

  // Configuration des pages
  const pageConfigs = {
    dashboard: {
      title: 'Tableau de Bord',
      subtitle: 'Vue d\'ensemble de votre activité (Firebase)',
      showSearch: false
    },
    fleet: {
      title: 'Gestion de la Flotte',
      subtitle: 'Suivi et maintenance de vos véhicules (Firebase)',
      showSearch: true,
      searchPlaceholder: 'Rechercher un véhicule...'
    },
    interventions: {
      title: 'Interventions Techniques',
      subtitle: 'Maintenance et réparations de votre flotte (Firebase)',
      showSearch: true,
      searchPlaceholder: 'Rechercher une intervention...'
    },
    washing: {
      title: 'Services de Lavage',
      subtitle: 'Nettoyage professionnel de votre flotte (Firebase)',
      showSearch: true,
      searchPlaceholder: 'Rechercher un lavage...'
    },
    billing: {
      title: 'Facturation',
      subtitle: 'Gestion financière et comptabilité (Firebase)',
      showSearch: true,
      searchPlaceholder: 'Rechercher une facture...'
    }
  };

  // Fonction de recherche globale
  const handleSearch = (searchTerm) => {
    console.log(`🔍 Recherche globale Firebase: ${searchTerm}`);
    // Ici vous pouvez implémenter une recherche globale
    // qui filtre les données selon le terme de recherche
  };

  // Rendu du contenu principal selon l'onglet actif
  const renderContent = () => {
    const commonProps = {
      data,
      onRefresh: refreshData
    };

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard {...commonProps} />;
      case 'fleet':
        return <FleetManagement {...commonProps} />;
      case 'interventions':
        return <Interventions {...commonProps} />;
      case 'washing':
        return <WashingService {...commonProps} />;
      case 'billing':
        return <Billing {...commonProps} />;
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  // Configuration de la page actuelle
  const currentPageConfig = pageConfigs[activeTab] || pageConfigs.dashboard;

  // Affichage de l'erreur si elle existe et qu'aucune donnée n'est disponible
  if (error && !data.vehicles?.length && !loading) {
    return (
      <ErrorLayout 
        error={error} 
        onRetry={loadAllData}
      />
    );
  }

  return (
    <AppErrorBoundary
      onError={handleError}
      onReset={() => {
        setError(null);
        loadAllData();
      }}
    >
      <div className="App">
        <Layout
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pageTitle={currentPageConfig.title}
          pageSubtitle={currentPageConfig.subtitle}
          showSearch={currentPageConfig.showSearch}
          onSearch={handleSearch}
          loading={loading}
        >
          {renderContent()}
        </Layout>

        {/* Indicateur de chargement global */}
        {loading && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 flex items-center gap-3 shadow-lg border border-white/20">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-sm font-medium text-gray-700">
                🔥 Synchronisation Firebase...
              </span>
            </div>
          </div>
        )}

        {/* Notification d'erreur temporaire */}
        {error && data.vehicles?.length > 0 && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-red-50/90 backdrop-blur-md rounded-xl p-4 border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs">🔥</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Erreur Firebase
                  </p>
                  <p className="text-xs text-red-600">
                    Utilisation des données locales
                  </p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Informations de debug (uniquement en développement) 
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-40">
            <div className="bg-gray-800/80 backdrop-blur-md rounded-xl p-3 text-white text-xs">
              <p><span className="text-orange-400">🔥</span> Mode: {process.env.NODE_ENV} (Firebase)</p>
              <p>Dernière MAJ: {data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString() : 'Jamais'}</p>
              <p>Véhicules: {data.vehicles?.length || 0}</p>
              <p>Interventions: {data.interventions?.length || 0}</p>
              <p>Lavages: {data.washings?.length || 0}</p>
              <p>Factures: {data.billing?.length || 0}</p>
              <p className="text-blue-400">Statut: {error ? '❌ Erreur' : loading ? '🔄 Chargement' : '✅ Connecté'}</p>
            </div>
          </div>*/}
        )}
      </div>
    </AppErrorBoundary>
  );
};

export default App;