import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  BarChart3, 
  Car, 
  Wrench, 
  Droplets, 
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Gauge,
  TrendingUp,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Activity
} from 'lucide-react';

// IMPORTS FIREBASE
import { 
  collection, 
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed,
  isMobile = false,
  onClose
}) => {
  const [stats, setStats] = useState({
    efficiency: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    totalInterventions: 0,
    activeInterventions: 0,
    pendingInterventions: 0,
    completedInterventions: 0,
    totalWashings: 0,
    todayWashings: 0,
    scheduledWashings: 0,
    completedWashings: 0,
    thisMonthRevenue: 0,
    urgentMaintenances: 0,
    // Statistiques de facturation
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    thisMonthInvoices: 0,
    totalRevenue: 0,
    pendingAmount: 0,
    overdueAmount: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // CHARGEMENT DES DONNÉES DEPUIS FIREBASE
  useEffect(() => {
    const loadSidebarStats = () => {
      try {
        console.log('🔥 Chargement stats Sidebar depuis Firebase...');
        
        // Variables pour stocker les données
        let vehiclesData = [];
        let interventionsData = [];
        let washingsData = [];
        let invoicesData = [];

        // Fonction pour calculer les statistiques
        const calculateStats = () => {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          // === CALCULS VÉHICULES ===
          const totalVehicles = vehiclesData.length;
          
          // Véhicules actifs (ayant eu une activité ce mois)
          const activeVehicleIds = new Set([
            ...interventionsData
              .filter(i => {
                const date = i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt);
                return date >= thisMonth;
              })
              .map(i => i.vehicleId),
            ...washingsData
              .filter(w => {
                const date = w.createdAt?.toDate ? w.createdAt.toDate() : new Date(w.createdAt);
                return date >= thisMonth;
              })
              .map(w => w.vehicleId)
          ]);

          // Maintenances urgentes (véhicules nécessitant une maintenance dans les 7 jours)
          const urgentMaintenances = vehiclesData.filter(vehicle => {
            if (!vehicle.nextMaintenance) return false;
            const nextMaintenance = new Date(vehicle.nextMaintenance);
            const daysUntil = Math.ceil((nextMaintenance - now) / (1000 * 60 * 60 * 24));
            return daysUntil <= 7;
          }).length;

          // === CALCULS INTERVENTIONS ===
          const totalInterventions = interventionsData.length;
          const activeInterventions = interventionsData.filter(i => 
            i.status === 'in-progress' || i.status === 'scheduled'
          ).length;
          const pendingInterventions = interventionsData.filter(i => 
            i.status === 'pending' || i.status === 'scheduled'
          ).length;
          const completedInterventions = interventionsData.filter(i => 
            i.status === 'completed'
          ).length;

          // === CALCULS LAVAGES ===
          const totalWashings = washingsData.length;
          
          // Lavages d'aujourd'hui
          const todayWashings = washingsData.filter(washing => {
            const washingDate = washing.scheduledDate ? 
              new Date(washing.scheduledDate) : 
              (washing.createdAt?.toDate ? washing.createdAt.toDate() : new Date(washing.createdAt));
            return washingDate >= today && washingDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          }).length;

          const scheduledWashings = washingsData.filter(w => 
            w.status === 'scheduled'
          ).length;
          const completedWashings = washingsData.filter(w => 
            w.status === 'completed'
          ).length;

          // === CALCUL CHIFFRE D'AFFAIRES ===
          const thisMonthInterventions = interventionsData.filter(intervention => {
            const date = intervention.createdAt?.toDate ? intervention.createdAt.toDate() : new Date(intervention.createdAt);
            return date >= thisMonth;
          });

          const thisMonthWashings = washingsData.filter(washing => {
            const date = washing.createdAt?.toDate ? washing.createdAt.toDate() : new Date(washing.createdAt);
            return date >= thisMonth;
          });

          const interventionsRevenue = thisMonthInterventions.reduce((sum, intervention) => {
            return sum + (parseFloat(intervention.cost) || 0);
          }, 0);

          const washingsRevenue = thisMonthWashings.reduce((sum, washing) => {
            return sum + (parseFloat(washing.cost) || 0);
          }, 0);

          const thisMonthRevenue = interventionsRevenue + washingsRevenue;

          // === CALCULS FACTURATION ===
          const totalInvoices = invoicesData.length;
          
          // Factures par statut
          const paidInvoices = invoicesData.filter(invoice => 
            invoice.status === 'paid' || invoice.status === 'completed'
          ).length;
          
          const pendingInvoices = invoicesData.filter(invoice => 
            invoice.status === 'pending' || invoice.status === 'sent' || invoice.status === 'draft'
          ).length;
          
          // Factures en retard (dueDate dépassée)
          const overdueInvoices = invoicesData.filter(invoice => {
            if (!invoice.dueDate || invoice.status === 'paid') return false;
            const dueDate = new Date(invoice.dueDate);
            return dueDate < now;
          }).length;

          // Factures de ce mois
          const thisMonthInvoices = invoicesData.filter(invoice => {
            const date = invoice.createdAt?.toDate ? invoice.createdAt.toDate() : new Date(invoice.createdAt);
            return date >= thisMonth;
          }).length;

          // Montants
          const totalRevenue = invoicesData
            .filter(invoice => invoice.status === 'paid' || invoice.status === 'completed')
            .reduce((sum, invoice) => sum + (parseFloat(invoice.amount) || 0), 0);

          const pendingAmount = invoicesData
            .filter(invoice => invoice.status === 'pending' || invoice.status === 'sent')
            .reduce((sum, invoice) => sum + (parseFloat(invoice.amount) || 0), 0);

          const overdueAmount = invoicesData
            .filter(invoice => {
              if (!invoice.dueDate || invoice.status === 'paid') return false;
              const dueDate = new Date(invoice.dueDate);
              return dueDate < now;
            })
            .reduce((sum, invoice) => sum + (parseFloat(invoice.amount) || 0), 0);

          // === CALCUL EFFICACITÉ ===
          // Efficacité basée sur : véhicules actifs, interventions complétées, maintenances à jour
          let efficiency = 0;
          if (totalVehicles > 0) {
            const activeVehicleRatio = (activeVehicleIds.size / totalVehicles) * 100;
            const maintenanceRatio = totalVehicles > 0 ? ((totalVehicles - urgentMaintenances) / totalVehicles) * 100 : 100;
            const interventionSuccessRatio = totalInterventions > 0 ? (completedInterventions / totalInterventions) * 100 : 100;
            
            efficiency = Math.round((activeVehicleRatio + maintenanceRatio + interventionSuccessRatio) / 3);
          } else {
            efficiency = 100; // Pas de véhicules = pas de problèmes
          }

          const calculatedStats = {
            efficiency: Math.min(efficiency, 100),
            totalVehicles,
            activeVehicles: activeVehicleIds.size,
            totalInterventions,
            activeInterventions,
            pendingInterventions,
            completedInterventions,
            totalWashings,
            todayWashings,
            scheduledWashings,
            completedWashings,
            thisMonthRevenue,
            urgentMaintenances,
            // Statistiques de facturation
            totalInvoices,
            pendingInvoices,
            paidInvoices,
            overdueInvoices,
            thisMonthInvoices,
            totalRevenue,
            pendingAmount,
            overdueAmount
          };

          console.log('📊 Stats Sidebar calculées:', calculatedStats);
          setStats(calculatedStats);
          setLoading(false);
        };

        // === LISTENER VÉHICULES ===
        const vehiclesRef = collection(db, 'vehicles');
        const unsubscribeVehicles = onSnapshot(vehiclesRef, 
          (snapshot) => {
            vehiclesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('✅ Véhicules Sidebar:', vehiclesData.length);
            calculateStats();
            setError(null);
          }, 
          (error) => {
            console.error('❌ Erreur véhicules Sidebar:', error);
            setError('Impossible de charger les véhicules');
            setLoading(false);
          }
        );

        // === LISTENER INTERVENTIONS ===
        const interventionsRef = collection(db, 'interventions');
        const unsubscribeInterventions = onSnapshot(interventionsRef, 
          (snapshot) => {
            interventionsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('✅ Interventions Sidebar:', interventionsData.length);
            calculateStats();
          }, 
          (error) => {
            console.error('❌ Erreur interventions Sidebar:', error);
          }
        );

        // === LISTENER LAVAGES ===
        const washingsRef = collection(db, 'washing');
        const unsubscribeWashings = onSnapshot(washingsRef, 
          (snapshot) => {
            washingsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('✅ Lavages Sidebar:', washingsData.length);
            calculateStats();
          }, 
          (error) => {
            console.error('❌ Erreur lavages Sidebar:', error);
          }
        );

        // === LISTENER FACTURES ===
        const invoicesRef = collection(db, 'invoices');
        const unsubscribeInvoices = onSnapshot(invoicesRef, 
          (snapshot) => {
            invoicesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('✅ Factures Sidebar:', invoicesData.length);
            calculateStats();
          }, 
          (error) => {
            console.error('❌ Erreur factures Sidebar:', error);
            // Les factures ne sont pas critiques pour le fonctionnement
          }
        );

        return () => {
          console.log('🧹 Nettoyage listeners Sidebar');
          unsubscribeVehicles();
          unsubscribeInterventions();
          unsubscribeWashings();
          unsubscribeInvoices();
        };
      } catch (error) {
        console.error('❌ Erreur initialisation Sidebar:', error);
        setError('Erreur de connexion Firebase: ' + error.message);
        setLoading(false);
      }
    };

    loadSidebarStats();
  }, []);

  // Configuration des éléments de menu avec badges dynamiques
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Tableau de Bord', 
      icon: BarChart3,
      description: 'Vue d\'ensemble',
      badge: null
    },
    { 
      id: 'fleet', 
      label: 'Flotte', 
      icon: Car,
      description: 'Gestion véhicules',
      badge: stats.totalVehicles > 0 ? stats.totalVehicles : null,
      urgentBadge: stats.urgentMaintenances > 0 ? stats.urgentMaintenances : null
    },
    { 
      id: 'interventions', 
      label: 'Interventions', 
      icon: Wrench,
      description: 'Maintenance technique',
      badge: stats.activeInterventions > 0 ? stats.activeInterventions : null,
      pendingBadge: stats.pendingInterventions > 0 ? stats.pendingInterventions : null
    },
    { 
      id: 'washing', 
      label: 'Lavage', 
      icon: Droplets,
      description: 'Services nettoyage',
      badge: stats.todayWashings > 0 ? stats.todayWashings : null,
      scheduledBadge: stats.scheduledWashings > 0 ? stats.scheduledWashings : null
    },
    { 
      id: 'billing', 
      label: 'Facturation', 
      icon: FileText,
      description: 'Gestion financière',
      badge: stats.totalInvoices > 0 ? stats.totalInvoices : null,
      urgentBadge: stats.overdueInvoices > 0 ? stats.overdueInvoices : null,
      pendingBadge: stats.pendingInvoices > 0 ? stats.pendingInvoices : null,
      revenueInfo: stats.totalRevenue > 0 ? `${Math.round(stats.totalRevenue/1000)}k€` : null
    }
  ];

  const bottomMenuItems = [
    { 
      id: 'settings', 
      label: 'Paramètres', 
      icon: Settings,
      description: 'Configuration'
    },
    { 
      id: 'help', 
      label: 'Aide', 
      icon: HelpCircle,
      description: 'Support'
    }
  ];

  const NavigationItem = ({ item, isBottom = false }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    
    return (
      <button
        onClick={() => {
          setActiveTab(item.id);
          if (isMobile && onClose) {
            onClose();
          }
        }}
        className={`nav-item w-full group relative ${isActive ? 'active' : ''}`}
        title={isCollapsed ? item.label : ''}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <Icon size={22} />
            
            {/* Badge principal */}
            {item.badge && !isCollapsed && (
              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {typeof item.badge === 'string' ? item.badge : (item.badge > 9 ? '9+' : item.badge)}
              </span>
            )}
            
            {/* Badge urgent (rouge) */}
            {item.urgentBadge && !isCollapsed && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                !
              </span>
            )}
            
            {/* Badge en attente (orange) */}
            {item.pendingBadge && !isCollapsed && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {item.pendingBadge > 9 ? '9+' : item.pendingBadge}
              </span>
            )}
          </div>
          
          {!isCollapsed && (
            <div className="flex-1 text-left">
              <span className="font-semibold block">{item.label}</span>
              <span className="text-xs text-gray-300 block">{item.description}</span>
            </div>
          )}
          
          {/* Badges texte à droite */}
          {!isCollapsed && (
            <div className="flex flex-col items-end gap-1">
              {item.badge && (
                <span className="bg-white/20 text-white text-xs font-bold rounded-full px-2 py-1">
                  {item.badge}
                </span>
              )}
              {item.urgentBadge && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 animate-pulse">
                  {item.urgentBadge} {item.id === 'billing' ? 'en retard' : 'urgent'}{item.urgentBadge > 1 ? 's' : ''}
                </span>
              )}
              {item.scheduledBadge && (
                <span className="bg-orange-500/80 text-white text-xs font-bold rounded-full px-2 py-1">
                  {item.scheduledBadge} planifié{item.scheduledBadge > 1 ? 's' : ''}
                </span>
              )}
              {item.pendingBadge && item.id === 'billing' && (
                <span className="bg-orange-500/80 text-white text-xs font-bold rounded-full px-2 py-1">
                  {item.pendingBadge} en attente
                </span>
              )}
              {item.revenueInfo && (
                <span className="bg-green-500/80 text-white text-xs font-bold rounded-full px-2 py-1">
                  {item.revenueInfo} encaissés
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Active indicator */}
        {isActive && (
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
        )}
      </button>
    );
  };

  // Fonction pour obtenir la couleur d'efficacité
  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-green-500';
    if (efficiency >= 70) return 'text-yellow-500';
    if (efficiency >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  // Fonction pour obtenir le message d'efficacité
  const getEfficiencyMessage = (efficiency) => {
    if (efficiency >= 95) return 'Excellent';
    if (efficiency >= 85) return 'Très bien';
    if (efficiency >= 70) return 'Bien';
    if (efficiency >= 50) return 'Moyen';
    return 'À améliorer';
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        glass-sidebar transition-all duration-300 relative z-50 h-full
        ${isCollapsed ? 'w-20' : 'w-80'} 
        ${isMobile ? 'fixed top-0 left-0' : ''} 
        overflow-y-auto scrollbar-thin flex flex-col
      `}>
        
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex-1">
                <h1 className="sidebar-brand text-2xl font-bold">
                  ProNet
                </h1>
                <p className="text-gray-300 text-sm mt-1 font-medium">
                  Gestion de flotte premium
                </p>
                {error && (
                  <p className="text-red-300 text-xs mt-1">
                    🔥 Erreur Firebase
                  </p>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {/* Collapse button for desktop */}
              {!isMobile && (
                <button 
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                >
                  {isCollapsed ? (
                    <ChevronRight className="text-white" size={18} />
                  ) : (
                    <ChevronLeft className="text-white" size={18} />
                  )}
                </button>
              )}
              
              {/* Close button for mobile */}
              {isMobile && (
                <button 
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                >
                  <X className="text-white" size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {loading ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <div key={i} className="nav-item w-full animate-pulse">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-6 h-6 bg-white/20 rounded"></div>
                    {!isCollapsed && (
                      <div className="flex-1">
                        <div className="w-24 h-4 bg-white/20 rounded mb-1"></div>
                        <div className="w-16 h-3 bg-white/10 rounded"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              menuItems.map(item => (
                <NavigationItem key={item.id} item={item} />
              ))
            )}
          </div>
        </nav>

        {/* Performance Metrics (only when expanded and loaded) */}
        {!isCollapsed && !loading && (
          <div className="p-6 mx-4 mb-4">
            <div className="glass-card p-6 text-center bg-white/10 border-white/20">
              <div className="metric-circle mx-auto mb-4">
                <div className="metric-circle-inner bg-white/90">
                  <span className={`text-2xl font-bold ${getEfficiencyColor(stats.efficiency)}`}>
                    {stats.efficiency}%
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    {getEfficiencyMessage(stats.efficiency)}
                  </span>
                </div>
              </div>
              
              <h3 className="text-white font-bold mb-2">Performance Globale</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-300">
                  <span>Véhicules actifs</span>
                  <span className="font-semibold text-white">
                    {stats.activeVehicles}/{stats.totalVehicles}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Interventions en cours</span>
                  <span className="font-semibold text-white">
                    {stats.activeInterventions}
                    {stats.pendingInterventions > 0 && (
                      <span className="text-orange-300 ml-1">
                        (+{stats.pendingInterventions})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Lavages aujourd'hui</span>
                  <span className="font-semibold text-white">{stats.todayWashings}</span>
                </div>
                {stats.totalInvoices > 0 && (
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Factures en attente</span>
                    <span className="font-semibold text-white">
                      {stats.pendingInvoices}
                      {stats.overdueInvoices > 0 && (
                        <span className="text-red-300 ml-1">
                          ({stats.overdueInvoices} retard)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {stats.urgentMaintenances > 0 && (
                  <div className="flex items-center justify-between text-red-300">
                    <span>⚠️ Maintenances urgentes</span>
                    <span className="font-semibold text-red-200">{stats.urgentMaintenances}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/20">
                {stats.totalRevenue > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <TrendingUp size={16} />
                    <span className="text-sm font-medium">
                      {stats.totalRevenue.toLocaleString()}€ encaissés
                    </span>
                  </div>
                ) : stats.thisMonthRevenue > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <TrendingUp size={16} />
                    <span className="text-sm font-medium">
                      {stats.thisMonthRevenue.toLocaleString()}€ ce mois
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-blue-400">
                    <Activity size={16} />
                    <span className="text-sm font-medium">En attente d'activité</span>
                  </div>
                )}
                
                {stats.pendingAmount > 0 && (
                  <div className="flex items-center justify-center gap-2 text-orange-400 mt-2">
                    <Clock size={16} />
                    <span className="text-xs font-medium">
                      {stats.pendingAmount.toLocaleString()}€ en attente
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions (only when expanded and loaded) */}
        {!isCollapsed && !loading && (
          <div className="p-4 mx-4 mb-4">
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
              Actions Rapides
            </h4>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('interventions')}
                className="w-full p-3 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-200 hover:bg-orange-500/30 transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                <Wrench size={16} />
                Nouvelle Intervention
                {stats.pendingInterventions > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.pendingInterventions}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('washing')}
                className="w-full p-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-200 hover:bg-blue-500/30 transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                <Droplets size={16} />
                Programmer Lavage
                {stats.scheduledWashings > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.scheduledWashings}
                  </span>
                )}
              </button>
              {stats.urgentMaintenances > 0 && (
                <button 
                  onClick={() => setActiveTab('fleet')}
                  className="w-full p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 hover:bg-red-500/30 transition-all text-sm font-medium flex items-center justify-center gap-2 animate-pulse"
                >
                  <AlertTriangle size={16} />
                  Maintenances Urgentes
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.urgentMaintenances}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading state for metrics */}
        {!isCollapsed && loading && (
          <div className="p-6 mx-4 mb-4">
            <div className="glass-card p-6 text-center bg-white/10 border-white/20 animate-pulse">
              <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4"></div>
              <div className="w-32 h-4 bg-white/20 rounded mx-auto mb-2"></div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-white/10 rounded"></div>
                <div className="w-full h-3 bg-white/10 rounded"></div>
                <div className="w-full h-3 bg-white/10 rounded"></div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="border-t border-white/10 p-4">
          <div className="space-y-2">
            {bottomMenuItems.map(item => (
              <NavigationItem key={item.id} item={item} isBottom />
            ))}
          </div>
        </div>

        {/* Version info (only when expanded) */}
        {!isCollapsed && (
          <div className="p-4 text-center border-t border-white/10">
            <p className="text-gray-400 text-xs">
              ProNet v1.1.0 {loading && '• 🔥 Synchronisation...'}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              © Altair Airport Solutions 2025. Tous droits réservés
            </p>
            
          </div>
        )}
      </div>
    </>
  );
};

Sidebar.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  isCollapsed: PropTypes.bool,
  setIsCollapsed: PropTypes.func,
  isMobile: PropTypes.bool,
  onClose: PropTypes.func
};

export default Sidebar;