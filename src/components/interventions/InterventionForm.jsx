import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  User, 
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Card from '../common/Card';

const InterventionForm = ({ 
  onSubmit, 
  onCancel, 
  vehicles = [], 
  loading = false,
  initialData = null
}) => {
  const [formData, setFormData] = useState({
    vehicleId: initialData?.vehicleId || '',
    type: initialData?.type || '',
    description: initialData?.description || '',
    cost: initialData?.cost || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    technicianId: initialData?.technicianId || '',
    parts: initialData?.parts || [],
    duration: initialData?.duration || '',
    priority: initialData?.priority || 'medium',
    notes: initialData?.notes || ''
  });

  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  // Types d'interventions avec détails
  const interventionTypes = [
    { 
      id: 'tires', 
      label: 'Changement de pneus', 
      icon: '🛞', 
      color: 'from-blue-500 to-blue-600', 
      avgCost: 280, 
      avgDuration: 120,
      description: 'Remplacement des pneumatiques usagés',
      commonParts: ['Pneus avant', 'Pneus arrière', 'Valves']
    },
    { 
      id: 'oil', 
      label: 'Vidange', 
      icon: '🛢️', 
      color: 'from-green-500 to-green-600', 
      avgCost: 65, 
      avgDuration: 60,
      description: 'Changement de l\'huile moteur et du filtre',
      commonParts: ['Huile moteur', 'Filtre à huile', 'Joint de bouchon']
    },
    { 
      id: 'battery', 
      label: 'Batterie', 
      icon: '🔋', 
      color: 'from-yellow-500 to-orange-500', 
      avgCost: 120, 
      avgDuration: 45,
      description: 'Remplacement de la batterie',
      commonParts: ['Batterie', 'Cosses', 'Graisse de contact']
    },
    { 
      id: 'lights', 
      label: 'Ampoules', 
      icon: '💡', 
      color: 'from-purple-500 to-pink-500', 
      avgCost: 25, 
      avgDuration: 30,
      description: 'Changement des ampoules défectueuses',
      commonParts: ['Ampoules avant', 'Ampoules arrière', 'Fusibles']
    },
    { 
      id: 'coolant', 
      label: 'Liquide de refroidissement', 
      icon: '❄️', 
      color: 'from-cyan-500 to-blue-500', 
      avgCost: 45, 
      avgDuration: 40,
      description: 'Vidange et remplacement du liquide de refroidissement',
      commonParts: ['Liquide de refroidissement', 'Joint de bouchon']
    },
    { 
      id: 'adblue', 
      label: 'AdBlue', 
      icon: '💧', 
      color: 'from-indigo-500 to-purple-500', 
      avgCost: 35, 
      avgDuration: 20,
      description: 'Complément AdBlue pour moteurs diesel',
      commonParts: ['AdBlue']
    },
    { 
      id: 'brakes', 
      label: 'Freins', 
      icon: '🛑', 
      color: 'from-red-500 to-red-600', 
      avgCost: 180, 
      avgDuration: 90,
      description: 'Entretien du système de freinage',
      commonParts: ['Plaquettes avant', 'Plaquettes arrière', 'Liquide de frein']
    },
    { 
      id: 'other', 
      label: 'Autre', 
      icon: '🔧', 
      color: 'from-gray-500 to-gray-600', 
      avgCost: 100, 
      avgDuration: 60,
      description: 'Autre type d\'intervention',
      commonParts: []
    }
  ];

  // Techniciens disponibles
  const technicians = [
    { id: 1, name: 'Marc Dupont', speciality: 'Mécanique générale', rating: 4.8 },
    { id: 2, name: 'Julie Martin', speciality: 'Électrique', rating: 4.9 },
    { id: 3, name: 'Paul Bernard', speciality: 'Pneumatiques', rating: 4.7 },
    { id: 4, name: 'Sophie Rousseau', speciality: 'Carrosserie', rating: 4.6 }
  ];

  // Niveaux de priorité
  const priorities = [
    { id: 'low', label: 'Basse', color: 'text-green-600 bg-green-100', description: 'Maintenance préventive' },
    { id: 'medium', label: 'Normale', color: 'text-blue-600 bg-blue-100', description: 'Entretien régulier' },
    { id: 'high', label: 'Urgente', color: 'text-orange-600 bg-orange-100', description: 'Réparation importante' },
    { id: 'critical', label: 'Critique', color: 'text-red-600 bg-red-100', description: 'Sécurité compromise' }
  ];

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.vehicleId) newErrors.vehicleId = 'Sélectionnez un véhicule';
    if (!formData.type) newErrors.type = 'Choisissez le type d\'intervention';
    if (!formData.description) newErrors.description = 'La description est requise';
    if (!formData.date) newErrors.date = 'La date est requise';

    // Validation de la date (pas dans le passé sauf aujourd'hui)
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      newErrors.date = 'La date ne peut pas être dans le passé';
    }

    // Validation du coût
    if (formData.cost && (isNaN(formData.cost) || parseFloat(formData.cost) < 0)) {
      newErrors.cost = 'Le coût doit être un nombre positif';
    }

    // Validation de la durée
    if (formData.duration && (isNaN(formData.duration) || parseInt(formData.duration) < 0)) {
      newErrors.duration = 'La durée doit être un nombre positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion du changement de type
  const handleTypeChange = (typeId) => {
    const selectedType = interventionTypes.find(t => t.id === typeId);
    if (selectedType) {
      setFormData({
        ...formData,
        type: typeId,
        cost: selectedType.avgCost,
        duration: selectedType.avgDuration,
        description: formData.description || selectedType.description,
        parts: selectedType.commonParts
      });
    }
  };

  // Gestion de la soumission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Navigation entre les étapes
  const nextStep = () => {
    if (currentStep === 1) {
      // Validation minimale pour passer à l'étape suivante
      if (!formData.vehicleId || !formData.type) {
        setErrors({
          vehicleId: !formData.vehicleId ? 'Sélectionnez un véhicule' : '',
          type: !formData.type ? 'Choisissez le type d\'intervention' : ''
        });
        return;
      }
    }
    setCurrentStep(currentStep + 1);
    setErrors({});
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  // Récupération des informations du type sélectionné
  const selectedTypeInfo = interventionTypes.find(t => t.id === formData.type);
  const selectedVehicle = vehicles.find(v => v.id === parseInt(formData.vehicleId));

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold gradient-text">
            {initialData ? 'Modifier l\'Intervention' : 'Nouvelle Intervention'}
          </h3>
          <p className="text-gray-600 font-medium mt-1">
            Étape {currentStep} sur 3
          </p>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
        >
          ×
        </button>
      </div>

      {/* Indicateur de progression */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
              ${step <= currentStep 
                ? 'bg-gradient-primary text-white' 
                : 'bg-gray-200 text-gray-500'
              }
            `}>
              {step < currentStep ? <CheckCircle size={16} /> : step}
            </div>
            {step < 3 && (
              <div className={`flex-1 h-1 mx-4 rounded ${
                step < currentStep ? 'bg-gradient-primary' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Étape 1: Sélection véhicule et type */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4">
              Sélection du véhicule et type d'intervention
            </h4>

            {/* Sélection véhicule */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Véhicule concerné *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map(vehicle => (
                  <div
                    key={vehicle.id}
                    onClick={() => setFormData({...formData, vehicleId: vehicle.id})}
                    className={`
                      p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${formData.vehicleId === vehicle.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-100">
                        <span className="text-blue-600 font-bold text-sm">{vehicle.plate}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-gray-600 text-sm">{vehicle.km?.toLocaleString()} km</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.vehicleId && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {errors.vehicleId}
                </p>
              )}
            </div>

            {/* Types d'intervention */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Type d'intervention *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {interventionTypes.map(type => (
                  <div
                    key={type.id}
                    onClick={() => handleTypeChange(type.id)}
                    className={`
                      p-4 rounded-xl border-2 cursor-pointer transition-all text-center
                      ${formData.type === type.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className={`p-3 rounded-2xl bg-gradient-to-r ${type.color} inline-block mb-3`}>
                      <span className="text-xl">{type.icon}</span>
                    </div>
                    <h5 className="font-bold text-sm text-gray-800 mb-1">{type.label}</h5>
                    <p className="text-xs text-gray-600">{type.avgCost}€ • {type.avgDuration}min</p>
                  </div>
                ))}
              </div>
              {errors.type && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {errors.type}
                </p>
              )}
            </div>

            {/* Aperçu de la sélection */}
            {selectedVehicle && selectedTypeInfo && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                <h5 className="font-bold text-blue-800 mb-2">Récapitulatif de la sélection</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Véhicule:</span>
                    <p className="text-gray-800">{selectedVehicle.plate} - {selectedVehicle.brand} {selectedVehicle.model}</p>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Intervention:</span>
                    <p className="text-gray-800">{selectedTypeInfo.label}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Étape 2: Détails de l'intervention */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4">
              Détails de l'intervention
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description détaillée *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input-modern"
                  rows="4"
                  placeholder="Décrivez précisément l'intervention à effectuer..."
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date prévue *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="input-modern"
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.date && (
                  <p className="text-red-600 text-sm mt-1">{errors.date}</p>
                )}
              </div>

              {/* Priorité */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="input-modern"
                >
                  {priorities.map(priority => (
                    <option key={priority.id} value={priority.id}>
                      {priority.label} - {priority.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Technicien */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Technicien assigné
                </label>
                <select
                  value={formData.technicianId}
                  onChange={(e) => setFormData({...formData, technicianId: e.target.value})}
                  className="input-modern"
                >
                  <option value="">Assignation automatique</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} - {tech.speciality} (★{tech.rating})
                    </option>
                  ))}
                </select>
              </div>

              {/* Durée estimée */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Durée estimée (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className="input-modern"
                  placeholder="60"
                  min="0"
                />
                {errors.duration && (
                  <p className="text-red-600 text-sm mt-1">{errors.duration}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Étape 3: Coût et finalisation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4">
              Coût et finalisation
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coût */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Coût estimé (€)
                </label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  className="input-modern"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {errors.cost && (
                  <p className="text-red-600 text-sm mt-1">{errors.cost}</p>
                )}
              </div>

              {/* Pièces */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pièces nécessaires
                </label>
                <textarea
                  value={formData.parts.join(', ')}
                  onChange={(e) => setFormData({...formData, parts: e.target.value.split(', ').filter(p => p.trim())})}
                  className="input-modern"
                  rows="3"
                  placeholder="Liste des pièces séparées par des virgules"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes supplémentaires
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="input-modern"
                  rows="3"
                  placeholder="Instructions spéciales, recommandations..."
                />
              </div>
            </div>

            {/* Récapitulatif final */}
            {selectedVehicle && selectedTypeInfo && (
              <div className="p-6 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
                <h5 className="font-bold text-green-800 mb-4">Récapitulatif final</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium text-green-600">Véhicule:</span> {selectedVehicle.plate}</p>
                    <p><span className="font-medium text-green-600">Type:</span> {selectedTypeInfo.label}</p>
                    <p><span className="font-medium text-green-600">Date:</span> {formData.date}</p>
                  </div>
                  <div>
                    <p><span className="font-medium text-green-600">Coût:</span> {formData.cost}€</p>
                    <p><span className="font-medium text-green-600">Durée:</span> {formData.duration}min</p>
                    <p><span className="font-medium text-green-600">Priorité:</span> {priorities.find(p => p.id === formData.priority)?.label}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Boutons de navigation */}
        <div className="flex justify-between mt-8">
          <div>
            {currentStep > 1 && (
              <button 
                type="button"
                onClick={prevStep}
                className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all font-semibold text-gray-700"
              >
                Précédent
              </button>
            )}
          </div>
          
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all font-semibold text-gray-700"
            >
              Annuler
            </button>
            
            {currentStep < 3 ? (
              <button 
                type="button"
                onClick={nextStep}
                className="modern-button"
              >
                Suivant
              </button>
            ) : (
              <button 
                type="submit"
                disabled={loading}
                className="modern-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création en cours...' : (initialData ? 'Modifier' : 'Programmer l\'intervention')}
              </button>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
};

InterventionForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  vehicles: PropTypes.array,
  loading: PropTypes.bool,
  initialData: PropTypes.object
};

export default InterventionForm;