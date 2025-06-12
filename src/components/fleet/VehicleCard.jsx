import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Car, 
  Gauge, 
  Calendar, 
  Fuel, 
  AlertTriangle, 
  CheckCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Wrench,
  Droplets,
  FileText,
  MapPin,
  Clock,
  Shield,
  Award
} from 'lucide-react';
import Card from '../common/Card';

const VehicleCard = ({ 
  vehicle, 
  onEdit, 
  onDelete, 
  onViewDetails, 
  onScheduleIntervention, 
  onScheduleWashing,
  onViewHistory,
  className = ''
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Calcul de l'urgence de maintenance
  const getMaintenanceUrgency = () => {
    if (!vehicle.nextMaintenance) return 'none';
    
    const today = new Date();
    const maintenanceDate = new Date(vehicle.nextMaintenance);
    const daysUntil = Math.ceil((maintenanceDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 0) return 'overdue';
    if (daysUntil <= 7) return 'urgent';
    if (daysUntil <= 30) return 'soon';
    return 'scheduled';
  };

  // Couleurs selon le statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'repair': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Couleurs selon l'urgence de maintenance
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'urgent': return 'text-orange-600 bg-orange-100';
      case 'soon': return 'text-yellow-600 bg-yellow-100';
      case 'scheduled': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Labels de statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'maintenance': return 'Maintenance';
      case 'inactive': return 'Inactif';
      case 'repair': return 'Réparation';
      default: return 'Inconnu';
    }
  };

  // Labels d'urgence
  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'overdue': return 'En retard';
      case 'urgent': return 'Urgent';
      case 'soon': return 'Bientôt';
      case 'scheduled': return 'Planifiée';
      default: return 'Non planifiée';
    }
  };

  // Calcul de l'âge du véhicule
  const getVehicleAge = () => {
    if (!vehicle.year) return 'Non spécifié';
    const currentYear = new Date().getFullYear();
    const age = currentYear - vehicle.year;
    return age === 0 ? 'Neuf' : `${age} an${age > 1 ? 's' : ''}`;
  };

  // Estimation de la valeur selon l'âge et le kilométrage
  const getVehicleCondition = () => {
    const age = new Date().getFullYear() - (vehicle.year || 0);
    const km = vehicle.km || 0;
    
    if (age <= 2 && km <= 30000) return { label: 'Excellent', color: 'text-green-600', score: 95 };
    if (age <= 5 && km <= 80000) return { label: 'Très bon', color: 'text-blue-600', score: 85 };
    if (age <= 8 && km <= 150000) return { label: 'Bon', color: 'text-yellow-600', score: 70 };
    if (age <= 12 && km <= 250000) return { label: 'Correct', color: 'text-orange-600', score: 55 };
    return { label: 'À surveiller', color: 'text-red-600', score: 40 };
  };

  const maintenanceUrgency = getMaintenanceUrgency();
  const condition = getVehicleCondition();

  return (
    <Card className={`vehicle-card group ${className}`}>
      <div className="p-6">
        {/* Header avec statut */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
              <Car className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold gradient-text">{vehicle.plate}</h3>
              <p className="text-gray-600 font-medium text-sm">
                {vehicle.brand} {vehicle.model}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`status-badge ${getStatusColor(vehicle.status || 'active')}`}>
              {getStatusLabel(vehicle.status || 'active')}
            </span>
            
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl bg-white/50 hover:bg-white/70 transition-all"
              >
                <MoreHorizontal size={16} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-glass border border-white/20 py-2 z-20">
                  <button 
                    onClick={() => { onViewDetails?.(vehicle); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                  >
                    <Eye size={14} />
                    Voir détails
                  </button>
                  <button 
                    onClick={() => { onEdit?.(vehicle); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                  >
                    <Edit size={14} />
                    Modifier
                  </button>
                  <button 
                    onClick={() => { onScheduleIntervention?.(vehicle); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                  >
                    <Wrench size={14} />
                    Programmer intervention
                  </button>
                  <button 
                    onClick={() => { onScheduleWashing?.(vehicle); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                  >
                    <Droplets size={14} />
                    Programmer lavage
                  </button>
                  <button 
                    onClick={() => { onViewHistory?.(vehicle); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                  >
                    <FileText size={14} />
                    Historique
                  </button>
                  <hr className="my-2 border-gray-200/50" />
                  <button 
                    onClick={() => { onDelete?.(vehicle); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-red-50 transition-all flex items-center gap-3 text-sm text-red-600"
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
            <span className="text-gray-700 flex items-center gap-2 font-medium text-sm">
              <Gauge size={16} />
              Kilométrage
            </span>
            <span className="font-bold text-gray-800">
              {vehicle.km?.toLocaleString() || '0'} km
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
            <span className="text-gray-700 flex items-center gap-2 font-medium text-sm">
              <Calendar size={16} />
              Âge
            </span>
            <span className="font-bold text-gray-800">
              {getVehicleAge()}
            </span>
          </div>
        </div>

        {/* État et maintenance */}
        <div className="space-y-3 mb-4">
          {/* Condition du véhicule */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
            <span className="text-gray-700 flex items-center gap-2 font-medium text-sm">
              <Award size={16} />
              État général
            </span>
            <div className="text-right">
              <span className={`font-bold ${condition.color}`}>
                {condition.label}
              </span>
              <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                <div 
                  className={`h-1 rounded-full bg-gradient-to-r ${
                    condition.score >= 90 ? 'from-green-400 to-green-600' :
                    condition.score >= 70 ? 'from-blue-400 to-blue-600' :
                    condition.score >= 50 ? 'from-yellow-400 to-yellow-600' :
                    'from-red-400 to-red-600'
                  }`}
                  style={{ width: `${condition.score}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Carburant */}
          {vehicle.fuelType && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
              <span className="text-gray-700 flex items-center gap-2 font-medium text-sm">
                <Fuel size={16} />
                Carburant
              </span>
              <span className="font-bold text-gray-800">
                {vehicle.fuelType}
              </span>
            </div>
          )}
          
          {/* Prochaine maintenance */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
            <span className="text-gray-700 flex items-center gap-2 font-medium text-sm">
              <Calendar size={16} />
              Maintenance
            </span>
            <div className="text-right">
              {vehicle.nextMaintenance ? (
                <>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${getUrgencyColor(maintenanceUrgency)}`}>
                    {getUrgencyLabel(maintenanceUrgency)}
                  </span>
                  <p className="text-xs text-gray-600 mt-1">{vehicle.nextMaintenance}</p>
                </>
              ) : (
                <span className="text-xs text-gray-500">Non planifiée</span>
              )}
            </div>
          </div>
        </div>

        {/* Alertes */}
        {maintenanceUrgency === 'overdue' && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={16} />
              <span className="text-sm font-semibold">Maintenance en retard !</span>
            </div>
          </div>
        )}

        {maintenanceUrgency === 'urgent' && (
          <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 mb-4">
            <div className="flex items-center gap-2 text-orange-600">
              <Clock size={16} />
              <span className="text-sm font-semibold">Maintenance urgente</span>
            </div>
          </div>
        )}

        {/* Détails supplémentaires (collapsible) */}
        {showDetails && (
          <div className="space-y-3 mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-3">Détails du véhicule</h4>
            
            {vehicle.insuranceExpiry && (
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 font-medium flex items-center gap-2">
                  <Shield size={14} />
                  Assurance
                </span>
                <span className="text-gray-800">{vehicle.insuranceExpiry}</span>
              </div>
            )}
            
            {vehicle.technicalControlExpiry && (
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 font-medium flex items-center gap-2">
                  <CheckCircle size={14} />
                  Contrôle technique
                </span>
                <span className="text-gray-800">{vehicle.technicalControlExpiry}</span>
              </div>
            )}
            
            {vehicle.notes && (
              <div className="text-sm">
                <span className="text-blue-600 font-medium block mb-1">Notes :</span>
                <p className="text-gray-700 italic">{vehicle.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions principales */}
        <div className="flex gap-2">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 p-3 rounded-xl bg-white/70 hover:bg-white transition-all font-semibold text-gray-700 text-sm"
          >
            {showDetails ? 'Masquer' : 'Détails'}
          </button>
          
          <button 
            onClick={() => onScheduleIntervention?.(vehicle)}
            className="flex-1 p-3 rounded-xl bg-orange-100 hover:bg-orange-200 transition-all font-semibold text-orange-700 text-sm"
          >
            Intervention
          </button>
          
          <button 
            onClick={() => onScheduleWashing?.(vehicle)}
            className="flex-1 p-3 rounded-xl bg-blue-100 hover:bg-blue-200 transition-all font-semibold text-blue-700 text-sm"
          >
            Lavage
          </button>
        </div>
      </div>

      {/* Click outside pour fermer le menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </Card>
  );
};

VehicleCard.propTypes = {
  vehicle: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    plate: PropTypes.string.isRequired,
    brand: PropTypes.string,
    model: PropTypes.string,
    year: PropTypes.number,
    km: PropTypes.number,
    status: PropTypes.oneOf(['active', 'maintenance', 'inactive', 'repair']),
    fuelType: PropTypes.string,
    nextMaintenance: PropTypes.string,
    insuranceExpiry: PropTypes.string,
    technicalControlExpiry: PropTypes.string,
    notes: PropTypes.string
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onViewDetails: PropTypes.func,
  onScheduleIntervention: PropTypes.func,
  onScheduleWashing: PropTypes.func,
  onViewHistory: PropTypes.func,
  className: PropTypes.string
};

export default VehicleCard;