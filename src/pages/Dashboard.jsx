import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Wrench, 
  Droplets, 
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  MapPin,
  Gauge,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Eye,
  ArrowRight,
  Users,
  FileText,
  Settings,
  Bell,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  Target,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import Card, { StatCard, MetricCard } from '../components/common/Card';

// IMPORTS FIREBASE
import { 
  collection, 
  getDocs, 
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const Dashboard = ({ data, onNavigate }) => {
  const [stats, setStats] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [washings, setWashings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [refreshing, setRefreshing] = useState(false);

  // CHARGEMENT DES DONNÉES DEPUIS FIREBASE
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        console.log('🔥 Chargement Dashboard depuis Firebase...');
        
        // Charger les véhicules
        const vehiclesRef = collection(db, 'vehicles');
        const unsubscribeVehicles = onSnapshot(vehiclesRef, 
          (snapshot) => {
            const vehiclesList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('✅ Véhicules Dashboard:', vehiclesList.length);
            setVehicles(vehiclesList);
          }, 
          (error) => {
            console.error('❌ Erreur véhicules Dashboard:', error);
            setError('Impossible de charger les véhicules');
          }
        );

        // Charger les interventions
        const interventionsRef = collection(db, 'interventions');
        const interventionsQuery = query(interventionsRef, orderBy('createdAt', 'desc'), limit(50));
        const unsubscribeInterventions = onSnapshot(interventionsQuery, 
          (snapshot) => {
            const interventionsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('✅ Interventions Dashboard:', interventionsList.length);
            setInterventions(interventionsList);
          }, 
          (error) => {
            console.error('❌ Erreur interventions Dashboard:', error);
          }
        );

        // Charger les lavages
        const washingsRef = collection(db, 'washing');
        const washingsQuery = query(washingsRef, orderBy('createdAt', 'desc'), limit(50));
        const unsubscribeWashings = onSnapshot(washingsQuery, 
          (snapshot) => {
            const washingsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('✅ Lavages Dashboard:', washingsList.length);
            setWashings(washingsList);
            setLoading(false);
          }, 
          (error) => {
            console.error('❌ Erreur lavages Dashboard:', error);
            setLoading(false);
          }
        );

        return () => {
          console.log('🧹 Nettoyage listeners Dashboard');
          unsubscribeVehicles();
          unsubscribeInterventions();
          unsubscribeWashings();
        };
      } catch (error) {
        console.error('❌ Erreur initialisation Dashboard:', error);
        setError('Erreur de connexion Firebase: ' + error.message);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // CALCUL DES STATISTIQUES
  useEffect(() => {
    if (vehicles.length > 0 || interventions.length > 0 || washings.length > 0) {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Filtrer par période
      const thisMonthInterventions = interventions.filter(intervention => {
        const date = intervention.createdAt?.toDate ? intervention.createdAt.toDate() : new Date(intervention.createdAt);
        return date >= thisMonth;
      });

      const thisMonthWashings = washings.filter(washing => {
        const date = washing.createdAt?.toDate ? washing.createdAt.toDate() : new Date(washing.createdAt);
        return date >= thisMonth;
      });

      // Calculer le CA
      const interventionsRevenue = thisMonthInterventions.reduce((sum, intervention) => {
        return sum + (parseFloat(intervention.cost) || 0);
      }, 0);

      const washingsRevenue = thisMonthWashings.reduce((sum, washing) => {
        return sum + (parseFloat(washing.cost) || 0);
      }, 0);

      const totalRevenue = interventionsRevenue + washingsRevenue;

      // Véhicules actifs (ayant eu une activité ce mois)
      const activeVehicleIds = new Set([
        ...thisMonthInterventions.map(i => i.vehicleId),
        ...thisMonthWashings.map(w => w.vehicleId)
      ]);

      const calculatedStats = {
        totalVehicles: vehicles.length,
        activeVehicles: activeVehicleIds.size,
        totalInterventions: interventions.length,
        completedInterventions: interventions.filter(i => i.status === 'completed').length,
        thisMonthInterventions: thisMonthInterventions.length,
        totalWashings: washings.length,
        completedWashings: washings.filter(w => w.status === 'completed').length,
        thisMonthWashings: thisMonthWashings.length,
        thisMonthRevenue: totalRevenue,
        interventionsRevenue,
        washingsRevenue
      };

      console.log('📊 Stats calculées:', calculatedStats);
      setStats(calculatedStats);
    }
  }, [vehicles, interventions, washings]);

  // GÉNÉRATION DES ACTIVITÉS RÉCENTES
  useEffect(() => {
    if (interventions.length > 0 || washings.length > 0) {
      const allActivities = [];

      // Ajouter les interventions récentes
      interventions.slice(0, 5).forEach(intervention => {
        allActivities.push({
          id: `intervention-${intervention.id}`,
          type: 'intervention',
          action: intervention.type || 'Intervention',
          description: intervention.description || 'Maintenance véhicule',
          vehicle: intervention.vehiclePlate || 'Véhicule',
          vehicleId: intervention.vehicleId,
          time: getTimeAgo(intervention.createdAt),
          timestamp: intervention.createdAt,
          status: intervention.status || 'pending',
          employee: intervention.employeeName || 'Non assigné',
          cost: intervention.cost
        });
      });

      // Ajouter les lavages récents
      washings.slice(0, 5).forEach(washing => {
        allActivities.push({
          id: `washing-${washing.id}`,
          type: 'washing',
          action: getWashingTypeLabel(washing.type),
          description: washing.description || 'Service de lavage',
          vehicle: washing.vehiclePlate || 'Véhicule',
          vehicleId: washing.vehicleId,
          time: getTimeAgo(washing.createdAt),
          timestamp: washing.createdAt,
          status: washing.status || 'scheduled',
          employee: washing.employeeName || 'Non assigné',
          cost: washing.cost
        });
      });

      // Trier par timestamp et prendre les 6 plus récents
      const sortedActivities = allActivities
        .sort((a, b) => {
          const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
          const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 6);

      setRecentActivities(sortedActivities);
    }
  }, [interventions, washings]);

  // CALCUL DES MAINTENANCES À VENIR
  useEffect(() => {
    if (vehicles.length > 0) {
      const maintenanceItems = vehicles
        .filter(vehicle => vehicle.nextMaintenance)
        .map(vehicle => {
          const nextDate = new Date(vehicle.nextMaintenance);
          const today = new Date();
          const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
          
          return {
            ...vehicle,
            daysUntil,
            urgency: daysUntil <= 0 ? 'critical' : daysUntil <= 7 ? 'high' : daysUntil <= 30 ? 'medium' : 'low'
          };
        })
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 5);

      setUpcomingMaintenance(maintenanceItems);
    }
  }, [vehicles]);

  // FONCTIONS UTILITAIRES
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Date inconnue';
    
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    return date.toLocaleDateString();
  };

  const getWashingTypeLabel = (type) => {
    const types = {
      'complete': 'Lavage Complet',
      'interior': 'Intérieur',
      'exterior': 'Extérieur',
      'premium': 'Premium + Cire',
      'express': 'Express',
      'deep': 'Nettoyage Approfondi'
    };
    return types[type] || 'Lavage';
  };

  // ACTIONS RAPIDES
  const handleQuickAction = (action) => {
    console.log('🚀 Action rapide:', action);
    switch (action) {
      case 'new-vehicle':
        if (onNavigate) onNavigate('fleet-management', { showForm: true });
        break;
      case 'new-intervention':
        if (onNavigate) onNavigate('interventions', { showForm: true });
        break;
      case 'new-washing':
        if (onNavigate) onNavigate('washing', { showForm: true });
        break;
      case 'planning':
        if (onNavigate) onNavigate('planning');
        break;
      case 'view-all-activities':
        if (onNavigate) onNavigate('activities');
        break;
      case 'plan-maintenance':
        if (onNavigate) onNavigate('interventions', { filter: 'maintenance' });
        break;
      default:
        console.log('Action non définie:', action);
    }
  };

  // REFRESH MANUEL
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simuler un refresh
    setTimeout(() => {
      setRefreshing(false);
      console.log('🔄 Dashboard rechargé');
    }, 1000);
  };

  // FONCTIONS D'AFFICHAGE
  const getActivityIcon = (type) => {
    switch (type) {
      case 'washing': return Droplets;
      case 'intervention': return Wrench;
      default: return Clock;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in-progress': return 'text-blue-600';
      case 'scheduled': return 'text-orange-600';
      case 'pending': return 'text-orange-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in-progress': return Clock;
      case 'scheduled': return Calendar;
      case 'pending': return AlertCircle;
      case 'cancelled': return XCircle;
      default: return AlertCircle;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in-progress': return 'En cours';
      case 'scheduled': return 'Planifié';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return 'Inconnu';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'border-red-500 bg-red-50 shadow-red-100';
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-orange-300 bg-orange-50';
      default: return 'border-blue-300 bg-blue-50';
    }
  };

  // DONNÉES POUR LES QUICK STATS
  const quickStats = [
    { 
      title: 'Véhicules Total', 
      value: vehicles.length || 0, 
      icon: Car, 
      color: 'blue',
      change: `${stats.activeVehicles || 0} actifs`,
      changeType: 'neutral',
      onClick: () => handleQuickAction('view-fleet')
    },
    { 
      title: 'Interventions', 
      value: stats.thisMonthInterventions || 0, 
      icon: Wrench, 
      color: 'orange',
      change: `${stats.completedInterventions || 0} terminées`,
      changeType: 'positive',
      onClick: () => handleQuickAction('view-interventions')
    },
    { 
      title: 'Lavages', 
      value: stats.thisMonthWashings || 0, 
      icon: Droplets, 
      color: 'green',
      change: `${stats.completedWashings || 0} réalisés`,
      changeType: 'positive',
      onClick: () => handleQuickAction('view-washings')
    },
    { 
      title: 'CA du Mois', 
      value: stats.thisMonthRevenue ? `${stats.thisMonthRevenue.toLocaleString()}€` : '0€', 
      icon: DollarSign, 
      color: 'purple',
      change: stats.interventionsRevenue ? `${stats.interventionsRevenue.toLocaleString()}€ maintenance` : '',
      changeType: 'positive',
      onClick: () => handleQuickAction('view-billing')
    }
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} loading />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card loading />
          <Card loading />
        </div>
        <div className="text-center p-8">
          <div className="animate-spin mx-auto mb-4 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-600">🔥 Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header avec actions */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Tableau de Bord</h1>
          <p className="text-gray-600 font-medium">
            Vue d'ensemble de votre flotte • {vehicles.length} véhicules • {stats.thisMonthRevenue ? `${stats.thisMonthRevenue.toLocaleString()}€` : '0€'} ce mois
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-modern"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-all text-gray-700"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
          
          <button className="p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-all text-gray-700">
            <Download size={20} />
          </button>
          
          <button className="p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-all text-gray-700 relative">
            <Bell size={20} />
            {upcomingMaintenance.filter(m => m.urgency === 'critical' || m.urgency === 'high').length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
          <div className="font-bold mb-2">🔥 Erreur Firebase</div>
          <div>{error}</div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div 
            key={index}
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={stat.onClick}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              change={stat.change}
              changeType={stat.changeType}
              color={stat.color}
            />
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Véhicules Actifs"
          value={stats.activeVehicles || 0}
          target={stats.totalVehicles || 0}
          icon={Car}
          color="green"
        />
        
        <MetricCard
          title="Interventions Complétées"
          value={stats.completedInterventions || 0}
          target={stats.totalInterventions || 0}
          icon={Wrench}
          color="blue"
        />
        
        <MetricCard
          title="Lavages Réalisés"
          value={stats.completedWashings || 0}
          target={stats.totalWashings || 0}
          icon={Droplets}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Activities */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Activity className="text-blue-600" size={24} />
              Activités Récentes
              {recentActivities.length > 0 && (
                <span className="text-sm bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                  {recentActivities.length}
                </span>
              )}
            </h3>
            <button 
              onClick={() => handleQuickAction('view-all-activities')}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 transition-colors"
            >
              Voir tout
              <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const StatusIcon = getStatusIcon(activity.status);
                
                return (
                  <div 
                    key={activity.id} 
                    className="flex items-center justify-between p-4 rounded-xl bg-white/50 hover:bg-white/70 transition-all border border-white/30 cursor-pointer group"
                    onClick={() => {
                      if (activity.type === 'intervention') {
                        handleQuickAction('view-interventions');
                      } else {
                        handleQuickAction('view-washings');
                      }
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-xl bg-gradient-to-r ${
                        activity.type === 'washing' 
                          ? 'from-blue-500 to-cyan-500' 
                          : 'from-orange-500 to-red-500'
                      } shadow-lg`}>
                        <Icon className="text-white" size={18} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {activity.action}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          {activity.vehicle} • {activity.employee} • {activity.time}
                        </p>
                        {activity.description && (
                          <p className="text-gray-500 text-xs mt-1">{activity.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {activity.cost && (
                        <span className="text-green-600 font-bold text-sm">
                          {activity.cost}€
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <StatusIcon 
                          size={16} 
                          className={getStatusColor(activity.status)} 
                        />
                        <span className={`text-sm font-medium ${getStatusColor(activity.status)}`}>
                          {getStatusLabel(activity.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto mb-4 text-gray-400" size={32} />
                <p>Aucune activité récente</p>
                <p className="text-sm">Les nouvelles interventions et lavages apparaîtront ici</p>
              </div>
            )}
          </div>
        </Card>

        {/* Upcoming Maintenance */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <AlertTriangle className="text-orange-600" size={24} />
              Maintenances à Prévoir
              {upcomingMaintenance.filter(m => m.urgency === 'critical' || m.urgency === 'high').length > 0 && (
                <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                  {upcomingMaintenance.filter(m => m.urgency === 'critical' || m.urgency === 'high').length} urgent{upcomingMaintenance.filter(m => m.urgency === 'critical' || m.urgency === 'high').length > 1 ? 's' : ''}
                </span>
              )}
            </h3>
            <button 
              onClick={() => handleQuickAction('plan-maintenance')}
              className="text-orange-600 hover:text-orange-800 font-medium text-sm flex items-center gap-1 transition-colors"
            >
              Planifier
              <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="space-y-4">
            {upcomingMaintenance.length > 0 ? (
              upcomingMaintenance.map((vehicle) => (
                <div 
                  key={vehicle.id}
                  className={`p-4 rounded-xl border-2 ${getUrgencyColor(vehicle.urgency)} transition-all hover:shadow-lg cursor-pointer group`}
                  onClick={() => handleQuickAction('view-vehicle', vehicle.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-white/70">
                        <Car className="text-gray-700" size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {vehicle.plate}
                        </h4>
                        <p className="text-gray-600 text-sm">{vehicle.brand} {vehicle.model}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        vehicle.urgency === 'critical' ? 'text-red-600 animate-pulse' :
                        vehicle.urgency === 'high' ? 'text-red-600' :
                        vehicle.urgency === 'medium' ? 'text-orange-600' : 'text-blue-600'
                      }`}>
                        {vehicle.daysUntil <= 0 ? '🚨 Maintenance due' :
                         vehicle.daysUntil === 1 ? 'Demain' :
                         `Dans ${vehicle.daysUntil} jours`}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {new Date(vehicle.nextMaintenance).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Gauge size={14} />
                        <span>{vehicle.km?.toLocaleString() || '0'} km</span>
                      </div>
                      {vehicle.urgency === 'critical' && (
                        <span className="text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded-full">
                          URGENT
                        </span>
                      )}
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAction('new-intervention');
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Programmer
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="mx-auto mb-4 text-green-400" size={32} />
                <p>Aucune maintenance urgente</p>
                <p className="text-sm">Tous vos véhicules sont à jour</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Weekly Overview Chart */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <BarChart3 className="text-green-600" size={24} />
            Aperçu Hebdomadaire
          </h3>
          <div className="flex items-center gap-2">
            <button 
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'week' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setTimeRange('week')}
            >
              Cette semaine
            </button>
            <button 
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'month' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setTimeRange('month')}
            >
              Ce mois
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-4">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => {
            const isToday = index === ((new Date().getDay() - 1 + 7) % 7);
            
            // Calculer les activités réelles du jour (simulation basée sur les données)
            const dayInterventions = Math.min(
              Math.floor(Math.random() * 3) + (isToday ? 2 : 0), 
              interventions.length
            );
            const dayWashings = Math.min(
              Math.floor(Math.random() * 6) + (isToday ? 3 : 1), 
              washings.length
            );
            
            return (
              <div 
                key={day}
                className={`p-4 rounded-xl text-center transition-all cursor-pointer hover:scale-105 ${
                  isToday 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                onClick={() => console.log(`Voir détails du ${day}`)}
              >
                <p className={`font-semibold text-sm mb-3 ${isToday ? 'text-white' : 'text-gray-700'}`}>
                  {day}
                  {isToday && <span className="block text-xs opacity-90">Aujourd'hui</span>}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1">
                    <Wrench size={12} className={isToday ? 'text-white' : 'text-orange-600'} />
                    <span className={`text-xs font-medium ${isToday ? 'text-white' : 'text-gray-700'}`}>
                      {dayInterventions}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center gap-1">
                    <Droplets size={12} className={isToday ? 'text-white' : 'text-blue-600'} />
                    <span className={`text-xs font-medium ${isToday ? 'text-white' : 'text-gray-700'}`}>
                      {dayWashings}
                    </span>
                  </div>
                </div>
                
                {isToday && (
                  <div className="mt-2 text-xs opacity-90">
                    En cours
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Wrench size={14} className="text-orange-600" />
            <span>Interventions</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets size={14} className="text-blue-600" />
            <span>Lavages</span>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          interactive 
          className="text-center p-6 cursor-pointer group"
          onClick={() => handleQuickAction('new-vehicle')}
        >
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 inline-block mb-4 group-hover:scale-110 transition-transform shadow-lg">
            <Car className="text-white" size={24} />
          </div>
          <h4 className="font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
            Nouveau Véhicule
          </h4>
          <p className="text-gray-600 text-sm">Ajouter un véhicule à la flotte</p>
        </Card>
        
        <Card 
          interactive 
          className="text-center p-6 cursor-pointer group"
          onClick={() => handleQuickAction('new-intervention')}
        >
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 inline-block mb-4 group-hover:scale-110 transition-transform shadow-lg">
            <Wrench className="text-white" size={24} />
          </div>
          <h4 className="font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
            Intervention
          </h4>
          <p className="text-gray-600 text-sm">Planifier une maintenance</p>
        </Card>
        
        <Card 
          interactive 
          className="text-center p-6 cursor-pointer group"
          onClick={() => handleQuickAction('new-washing')}
        >
          <div className="p-4 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 inline-block mb-4 group-hover:scale-110 transition-transform shadow-lg">
            <Droplets className="text-white" size={24} />
          </div>
          <h4 className="font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">
            Lavage
          </h4>
          <p className="text-gray-600 text-sm">Programmer un nettoyage</p>
        </Card>
        
        <Card 
          interactive 
          className="text-center p-6 cursor-pointer group"
          onClick={() => handleQuickAction('planning')}
        >
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 inline-block mb-4 group-hover:scale-110 transition-transform shadow-lg">
            <Calendar className="text-white" size={24} />
          </div>
          <h4 className="font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
            Planning
          </h4>
          <p className="text-gray-600 text-sm">Voir le planning complet</p>
        </Card>
      </div>

      {/* Metrics additionnelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800">Efficacité Flotte</h4>
            <Target className="text-green-600" size={20} />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Véhicules actifs</span>
              <span className="font-bold text-green-600">
                {stats.totalVehicles > 0 ? Math.round((stats.activeVehicles / stats.totalVehicles) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Maintenance à jour</span>
              <span className="font-bold text-blue-600">
                {vehicles.length > 0 ? Math.round(((vehicles.length - upcomingMaintenance.filter(m => m.urgency === 'critical').length) / vehicles.length) * 100) : 100}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Interventions réussies</span>
              <span className="font-bold text-orange-600">
                {stats.totalInterventions > 0 ? Math.round((stats.completedInterventions / stats.totalInterventions) * 100) : 0}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800">Performance Équipe</h4>
            <Users className="text-blue-600" size={20} />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Interventions/jour</span>
              <span className="font-bold text-orange-600">
                {Math.round((stats.thisMonthInterventions || 0) / 30 * 10) / 10}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Lavages/jour</span>
              <span className="font-bold text-blue-600">
                {Math.round((stats.thisMonthWashings || 0) / 30 * 10) / 10}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">CA moyen/intervention</span>
              <span className="font-bold text-green-600">
                {stats.completedInterventions > 0 ? Math.round((stats.interventionsRevenue / stats.completedInterventions) * 10) / 10 : 0}€
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800">Alertes & Notifications</h4>
            <Bell className="text-red-600" size={20} />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Maintenances urgentes</span>
              <span className="font-bold text-red-600">
                {upcomingMaintenance.filter(m => m.urgency === 'critical' || m.urgency === 'high').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Interventions en retard</span>
              <span className="font-bold text-orange-600">
                {interventions.filter(i => i.status === 'pending' && new Date(i.scheduledDate) < new Date()).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Documents expirés</span>
              <span className="font-bold text-gray-600">0</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;