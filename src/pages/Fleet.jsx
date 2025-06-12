import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Gauge,
  Calendar,
  Fuel,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Wrench,
  Droplets,
  X,
  Save,
  User,
  Phone,
  Euro,
  Clock,
  FileText
} from 'lucide-react';
import Card, { CardWithHeader } from '../components/common/Card';

// IMPORTS FIREBASE
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const FleetManagement = ({ data, onRefresh }) => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('plate');

  // NOUVEAUX ÉTATS POUR LES MODALS
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showWashingModal, setShowWashingModal] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);

  // Formulaire pour nouveau véhicule
  const [newVehicle, setNewVehicle] = useState({
    plate: '',
    model: '',
    brand: '',
    year: new Date().getFullYear(),
    km: 0,
    fuelType: 'Diesel',
    nextMaintenance: '',
    insuranceExpiry: '',
    technicalControlExpiry: '',
    status: 'active',
    notes: ''
  });

  // NOUVEAUX FORMULAIRES
  const [editVehicle, setEditVehicle] = useState({});
  const [newIntervention, setNewIntervention] = useState({
    type: '',
    description: '',
    cost: '',
    scheduledDate: '',
    technician: '',
    priority: 'medium'
  });
  const [newWashing, setNewWashing] = useState({
    type: 'exterior',
    cost: '',
    notes: ''
  });

  // CHARGEMENT DES VÉHICULES DEPUIS FIREBASE
  useEffect(() => {
    const loadVehicles = () => {
      try {
        setLoading(true);
        console.log('Connexion à Firebase...');
        
        const vehiclesRef = collection(db, 'vehicles');
        
        const unsubscribe = onSnapshot(vehiclesRef, 
          (snapshot) => {
            const vehiclesList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('Véhicules chargés depuis Firebase:', vehiclesList);
            setVehicles(vehiclesList);
            setFilteredVehicles(vehiclesList);
            setLoading(false);
            setError(null);
          }, 
          (error) => {
            console.error('Erreur lors du chargement des véhicules:', error);
            setError('Impossible de charger les véhicules depuis Firebase: ' + error.message);
            setLoading(false);
          }
        );

        return () => {
          console.log('Nettoyage de l\'écoute Firebase');
          unsubscribe();
        };
      } catch (error) {
        console.error('Erreur lors de l\'initialisation Firebase:', error);
        setError('Erreur de connexion à Firebase: ' + error.message);
        setLoading(false);
      }
    };

    loadVehicles();
  }, []);

  // Filtrage et recherche - CORRIGÉ pour éviter les erreurs undefined
  useEffect(() => {
    let filtered = [...vehicles];

    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(vehicle => {
        const plate = vehicle.plate || '';
        const model = vehicle.model || '';
        const brand = vehicle.brand || '';
        const searchLower = searchTerm.toLowerCase();
        
        return plate.toLowerCase().includes(searchLower) ||
               model.toLowerCase().includes(searchLower) ||
               brand.toLowerCase().includes(searchLower);
      });
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === filterStatus);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'plate':
          const plateA = (a.plate || '').toString().trim();
          const plateB = (b.plate || '').toString().trim();
          return plateA.localeCompare(plateB);
          
        case 'km':
          const kmA = parseInt(a.km) || 0;
          const kmB = parseInt(b.km) || 0;
          return kmB - kmA;
          
        case 'maintenance':
          const dateA = a.nextMaintenance ? new Date(a.nextMaintenance) : new Date('9999-12-31');
          const dateB = b.nextMaintenance ? new Date(b.nextMaintenance) : new Date('9999-12-31');
          return dateA.getTime() - dateB.getTime();
          
        default:
          return 0;
      }
    });

    setFilteredVehicles(filtered);
  }, [vehicles, searchTerm, filterStatus, sortBy]);

  // FONCTION POUR AJOUTER UN VÉHICULE À FIREBASE
  const handleAddVehicle = async () => {
    setError(null);
    setLoading(true);
    
    try {
      console.log('Tentative d\'ajout du véhicule à Firebase:', newVehicle);
      
      if (!newVehicle.plate.trim()) {
        throw new Error('La plaque d\'immatriculation est obligatoire');
      }
      if (!newVehicle.brand.trim()) {
        throw new Error('La marque est obligatoire');
      }
      if (!newVehicle.model.trim()) {
        throw new Error('Le modèle est obligatoire');
      }
      
      const vehicleData = {
        plate: newVehicle.plate.trim().toUpperCase(),
        brand: newVehicle.brand.trim(),
        model: newVehicle.model.trim(),
        year: parseInt(newVehicle.year) || new Date().getFullYear(),
        km: parseInt(newVehicle.km) || 0,
        fuelType: newVehicle.fuelType,
        status: newVehicle.status || 'active',
        nextMaintenance: newVehicle.nextMaintenance || null,
        insuranceExpiry: newVehicle.insuranceExpiry || null,
        technicalControlExpiry: newVehicle.technicalControlExpiry || null,
        notes: newVehicle.notes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const vehiclesRef = collection(db, 'vehicles');
      const docRef = await addDoc(vehiclesRef, vehicleData);
      
      console.log('✅ Véhicule ajouté avec succès! ID:', docRef.id);
      
      setNewVehicle({
        plate: '',
        model: '',
        brand: '',
        year: new Date().getFullYear(),
        km: 0,
        fuelType: 'Diesel',
        nextMaintenance: '',
        insuranceExpiry: '',
        technicalControlExpiry: '',
        status: 'active',
        notes: ''
      });
      
      setShowAddForm(false);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du véhicule:', error);
      
      let errorMessage = 'Erreur lors de l\'ajout du véhicule';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permissions insuffisantes. Vérifiez les règles Firestore (utilisez le mode "test" pour commencer).';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service Firebase temporairement indisponible. Vérifiez votre connexion internet.';
      } else if (error.code === 'invalid-argument') {
        errorMessage = 'Données invalides. Vérifiez les champs remplis.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // NOUVELLE FONCTION : VOIR DÉTAILS
  const handleViewDetails = (vehicle) => {
    setCurrentVehicle(vehicle);
    setSelectedVehicle(null);
    setShowDetailsModal(true);
  };

  // NOUVELLE FONCTION : MODIFIER VÉHICULE
  const handleEditVehicle = (vehicle) => {
    setCurrentVehicle(vehicle);
    setEditVehicle({...vehicle});
    setSelectedVehicle(null);
    setShowEditModal(true);
  };

  // NOUVELLE FONCTION : SAUVEGARDER MODIFICATIONS
  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      const vehicleRef = doc(db, 'vehicles', currentVehicle.id);
      await updateDoc(vehicleRef, {
        ...editVehicle,
        updatedAt: new Date()
      });
      console.log('✅ Véhicule modifié avec succès');
      setShowEditModal(false);
      setCurrentVehicle(null);
    } catch (error) {
      console.error('❌ Erreur lors de la modification:', error);
      setError('Impossible de modifier le véhicule: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // NOUVELLE FONCTION : CRÉER INTERVENTION
  const handleCreateIntervention = (vehicle) => {
    setCurrentVehicle(vehicle);
    setNewIntervention({
      type: '',
      description: '',
      cost: '',
      scheduledDate: '',
      technician: '',
      priority: 'medium'
    });
    setSelectedVehicle(null);
    setShowInterventionModal(true);
  };

  // NOUVELLE FONCTION : SAUVEGARDER INTERVENTION
  const handleSaveIntervention = async () => {
    try {
      setLoading(true);
      
      const interventionData = {
        vehicleId: currentVehicle.id,
        vehiclePlate: currentVehicle.plate,
        vehicleBrand: currentVehicle.brand,
        vehicleModel: currentVehicle.model,
        type: newIntervention.type,
        description: newIntervention.description,
        cost: parseFloat(newIntervention.cost) || 0,
        scheduledDate: newIntervention.scheduledDate,
        technician: newIntervention.technician,
        priority: newIntervention.priority,
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const interventionsRef = collection(db, 'interventions');
      await addDoc(interventionsRef, interventionData);
      
      // Mettre à jour le statut du véhicule
      const vehicleRef = doc(db, 'vehicles', currentVehicle.id);
      await updateDoc(vehicleRef, {
        status: 'maintenance',
        updatedAt: new Date()
      });
      
      console.log('✅ Intervention créée avec succès');
      setShowInterventionModal(false);
      setCurrentVehicle(null);
      
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'intervention:', error);
      setError('Impossible de créer l\'intervention: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // NOUVELLE FONCTION : CRÉER LAVAGE
  const handleCreateWashing = (vehicle) => {
    setCurrentVehicle(vehicle);
    setNewWashing({
      type: 'exterior',
      cost: '',
      notes: ''
    });
    setSelectedVehicle(null);
    setShowWashingModal(true);
  };

  // NOUVELLE FONCTION : SAUVEGARDER LAVAGE
  const handleSaveWashing = async () => {
    try {
      setLoading(true);
      
      const washingData = {
        vehicleId: currentVehicle.id,
        vehiclePlate: currentVehicle.plate,
        vehicleBrand: currentVehicle.brand,
        vehicleModel: currentVehicle.model,
        type: newWashing.type,
        cost: parseFloat(newWashing.cost) || 0,
        notes: newWashing.notes,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const washingRef = collection(db, 'washing');
      await addDoc(washingRef, washingData);
      
      console.log('✅ Lavage créé avec succès');
      setShowWashingModal(false);
      setCurrentVehicle(null);
      
    } catch (error) {
      console.error('❌ Erreur lors de la création du lavage:', error);
      setError('Impossible de créer le lavage: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // FONCTION POUR SUPPRIMER UN VÉHICULE
  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'vehicles', vehicleId));
      console.log('✅ Véhicule supprimé avec succès');
      setSelectedVehicle(null);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      setError('Impossible de supprimer le véhicule: ' + error.message);
    }
  };

  // FONCTION POUR METTRE À JOUR UN VÉHICULE
  const handleUpdateVehicle = async (vehicleId, updates) => {
    try {
      console.log('Mise à jour du véhicule:', vehicleId, updates);
      const vehicleRef = doc(db, 'vehicles', currentVehicle.id); // CORRECT
      await updateDoc(vehicleRef, {
        ...updates,
        updatedAt: new Date()
      });
      console.log('✅ Véhicule mis à jour avec succès');
      setSelectedVehicle(null);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      setError('Impossible de mettre à jour le véhicule: ' + error.message);
    }
  };

  // Fonctions utilitaires
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getMaintenanceUrgency = (nextMaintenance) => {
    if (!nextMaintenance) return 'low';
    
    const today = new Date();
    const maintenanceDate = new Date(nextMaintenance);
    const daysUntil = Math.ceil((maintenanceDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 7) return 'high';
    if (daysUntil <= 30) return 'medium';
    return 'low';
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Gestion de la Flotte</h2>
          <p className="text-gray-600 font-medium">
            {filteredVehicles.length} véhicule{filteredVehicles.length > 1 ? 's' : ''} 
            {filterStatus !== 'all' && ` (${filterStatus})`}
            {loading && ' - Chargement...'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un véhicule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10 w-full sm:w-64"
            />
          </div>
          
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-modern"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="maintenance">En maintenance</option>
            <option value="inactive">Inactifs</option>
          </select>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-modern"
          >
            <option value="plate">Trier par plaque</option>
            <option value="km">Trier par kilométrage</option>
            <option value="maintenance">Trier par maintenance</option>
          </select>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="modern-button whitespace-nowrap"
            disabled={loading}
          >
            <Plus size={20} />
            Ajouter véhicule
          </button>
        </div>
      </div>

      {/* Message d'erreur global */}
      {error && !showAddForm && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
          <div className="font-bold mb-2">🔥 Erreur Firebase</div>
          <div>{error}</div>
          <div className="mt-2 text-sm">
            💡 Vérifications suggérées:
            <ul className="list-disc pl-5 mt-1">
              <li>Configuration Firebase dans firebase/config.js</li>
              <li>Règles Firestore (utilisez le mode "test" pour débuter)</li>
              <li>Connexion internet</li>
            </ul>
          </div>
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold gradient-text">Nouveau Véhicule</h3>
            <button 
              onClick={() => {
                setShowAddForm(false);
                setError(null);
              }}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Plaque d'immatriculation *
              </label>
              <input
                type="text"
                value={newVehicle.plate}
                onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value})}
                className="input-modern"
                placeholder="AB-123-CD"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Marque *
              </label>
              <input
                type="text"
                value={newVehicle.brand}
                onChange={(e) => setNewVehicle({...newVehicle, brand: e.target.value})}
                className="input-modern"
                placeholder="Renault"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Modèle *
              </label>
              <input
                type="text"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                className="input-modern"
                placeholder="Kangoo"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Année
              </label>
              <input
                type="number"
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({...newVehicle, year: parseInt(e.target.value)})}
                className="input-modern"
                min="1990"
                max={new Date().getFullYear() + 1}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kilométrage
              </label>
              <input
                type="number"
                value={newVehicle.km}
                onChange={(e) => setNewVehicle({...newVehicle, km: parseInt(e.target.value)})}
                className="input-modern"
                placeholder="0"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type de carburant
              </label>
              <select
                value={newVehicle.fuelType}
                onChange={(e) => setNewVehicle({...newVehicle, fuelType: e.target.value})}
                className="input-modern"
              >
                <option value="Diesel">Diesel</option>
                <option value="Essence">Essence</option>
                <option value="Electrique">Électrique</option>
                <option value="Hybride">Hybride</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={newVehicle.status}
                onChange={(e) => setNewVehicle({...newVehicle, status: e.target.value})}
                className="input-modern"
              >
                <option value="active">Actif</option>
                <option value="maintenance">En maintenance</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prochaine maintenance
              </label>
              <input
                type="date"
                value={newVehicle.nextMaintenance}
                onChange={(e) => setNewVehicle({...newVehicle, nextMaintenance: e.target.value})}
                className="input-modern"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expiration assurance
              </label>
              <input
                type="date"
                value={newVehicle.insuranceExpiry}
                onChange={(e) => setNewVehicle({...newVehicle, insuranceExpiry: e.target.value})}
                className="input-modern"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contrôle technique
              </label>
              <input
                type="date"
                value={newVehicle.technicalControlExpiry}
                onChange={(e) => setNewVehicle({...newVehicle, technicalControlExpiry: e.target.value})}
                className="input-modern"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={newVehicle.notes}
                onChange={(e) => setNewVehicle({...newVehicle, notes: e.target.value})}
                className="input-modern"
                rows="3"
                placeholder="Informations supplémentaires..."
              />
            </div>
          </div>
          
          {error && (
            <div className="p-4 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
              <div className="font-bold mb-2">🔥 Erreur Firebase</div>
              <div>{error}</div>
            </div>
          )}
          
          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => {
                setShowAddForm(false);
                setError(null);
              }}
              className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all font-semibold text-gray-700"
            >
              Annuler
            </button>
            <button 
              onClick={handleAddVehicle}
              disabled={loading || !newVehicle.plate || !newVehicle.brand || !newVehicle.model}
              className="modern-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Ajout en cours...' : '🚗 Ajouter le véhicule'}
            </button>
          </div>
        </Card>
      )}

      {/* Liste des véhicules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => {
          const maintenanceUrgency = getMaintenanceUrgency(vehicle.nextMaintenance);
          
          return (
            <Card key={vehicle.id} className="vehicle-card group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                    <Car className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold gradient-text">{vehicle.plate}</h3>
                    <p className="text-gray-600 font-medium">{vehicle.brand} {vehicle.model}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`status-badge ${getStatusColor(vehicle.status || 'active')}`}>
                    {vehicle.status === 'active' ? 'Actif' : 
                     vehicle.status === 'maintenance' ? 'Maintenance' : 'Inactif'}
                  </span>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setSelectedVehicle(selectedVehicle === vehicle.id ? null : vehicle.id)}
                      className="p-2 rounded-xl bg-white/50 hover:bg-white/70 transition-all"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    
                    {selectedVehicle === vehicle.id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-glass border border-white/20 py-2 z-10">
                        <button 
                          onClick={() => handleViewDetails(vehicle)}
                          className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                        >
                          <Eye size={14} />
                          Voir détails
                        </button>
                        <button 
                          onClick={() => handleEditVehicle(vehicle)}
                          className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                        >
                          <Edit size={14} />
                          Modifier
                        </button>
                        <button 
                          onClick={() => handleCreateIntervention(vehicle)}
                          className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                        >
                          <Wrench size={14} />
                          Intervention
                        </button>
                        <button 
                          onClick={() => handleCreateWashing(vehicle)}
                          className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                        >
                          <Droplets size={14} />
                          Lavage
                        </button>
                        <hr className="my-2 border-gray-200/50" />
                        <button 
                          onClick={() => handleDeleteVehicle(vehicle.id)}
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
              
              {/* Informations du véhicule */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                  <span className="text-gray-700 flex items-center gap-2 font-medium">
                    <Gauge size={16} />
                    Kilométrage
                  </span>
                  <span className="font-bold text-gray-800">
                    {vehicle.km?.toLocaleString() || '0'} km
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                  <span className="text-gray-700 flex items-center gap-2 font-medium">
                    <Fuel size={16} />
                    Carburant
                  </span>
                  <span className="font-bold text-gray-800">
                    {vehicle.fuelType || 'Non spécifié'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                  <span className="text-gray-700 flex items-center gap-2 font-medium">
                    <Calendar size={16} />
                    Maintenance
                  </span>
                  <div className="text-right">
                    <span className={`font-bold text-sm px-2 py-1 rounded-full ${getUrgencyColor(maintenanceUrgency)}`}>
                      {vehicle.nextMaintenance || 'Non planifiée'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Alertes */}
              {maintenanceUrgency === 'high' && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-semibold">Maintenance urgente</span>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => handleViewDetails(vehicle)}
                  className="flex-1 p-3 rounded-xl bg-white/70 hover:bg-white transition-all font-semibold text-gray-700 text-sm"
                >
                  Détails
                </button>
                <button 
                  onClick={() => handleCreateIntervention(vehicle)}
                  className="flex-1 p-3 rounded-xl bg-orange-100 hover:bg-orange-200 transition-all font-semibold text-orange-700 text-sm"
                >
                  Intervention
                </button>
                <button 
                  onClick={() => handleCreateWashing(vehicle)}
                  className="flex-1 p-3 rounded-xl bg-blue-100 hover:bg-blue-200 transition-all font-semibold text-blue-700 text-sm"
                >
                  Lavage
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* MODAL DÉTAILS VÉHICULE */}
      {showDetailsModal && currentVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold gradient-text">Détails du Véhicule</h2>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                  <Car className="text-white" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold gradient-text">{currentVehicle.plate}</h3>
                  <p className="text-lg text-gray-600">{currentVehicle.brand} {currentVehicle.model}</p>
                  <span className={`status-badge ${getStatusColor(currentVehicle.status)}`}>
                    {currentVehicle.status === 'active' ? 'Actif' : 
                     currentVehicle.status === 'maintenance' ? 'En maintenance' : 'Inactif'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-800 text-lg">Informations Véhicule</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 rounded-xl bg-gray-50">
                      <span className="text-gray-600">Année</span>
                      <span className="font-semibold">{currentVehicle.year}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-gray-50">
                      <span className="text-gray-600">Kilométrage</span>
                      <span className="font-semibold">{currentVehicle.km?.toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-gray-50">
                      <span className="text-gray-600">Carburant</span>
                      <span className="font-semibold">{currentVehicle.fuelType}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-gray-800 text-lg">Maintenance & Contrôles</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 rounded-xl bg-gray-50">
                      <span className="text-gray-600">Prochaine maintenance</span>
                      <span className="font-semibold text-sm">
                        {currentVehicle.nextMaintenance || 'Non planifiée'}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-gray-50">
                      <span className="text-gray-600">Assurance expire</span>
                      <span className="font-semibold text-sm">
                        {currentVehicle.insuranceExpiry || 'Non renseigné'}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 rounded-xl bg-gray-50">
                      <span className="text-gray-600">Contrôle technique</span>
                      <span className="font-semibold text-sm">
                        {currentVehicle.technicalControlExpiry || 'Non renseigné'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {currentVehicle.notes && (
                <div>
                  <h4 className="font-bold text-gray-800 text-lg mb-3">Notes</h4>
                  <div className="p-4 rounded-xl bg-gray-50">
                    <p className="text-gray-700">{currentVehicle.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditVehicle(currentVehicle);
                  }}
                  className="flex-1 modern-button"
                >
                  <Edit size={20} />
                  Modifier
                </button>
                <button 
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleCreateIntervention(currentVehicle);
                  }}
                  className="flex-1 p-3 rounded-xl bg-orange-100 hover:bg-orange-200 transition-all font-semibold text-orange-700"
                >
                  <Wrench size={20} className="inline mr-2" />
                  Intervention
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFICATION VÉHICULE */}
      {showEditModal && currentVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold gradient-text">Modifier le Véhicule</h2>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Plaque d'immatriculation
                  </label>
                  <input
                    type="text"
                    value={editVehicle.plate || ''}
                    onChange={(e) => setEditVehicle({...editVehicle, plate: e.target.value})}
                    className="input-modern"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Marque
                  </label>
                  <input
                    type="text"
                    value={editVehicle.brand || ''}
                    onChange={(e) => setEditVehicle({...editVehicle, brand: e.target.value})}
                    className="input-modern"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Modèle
                  </label>
                  <input
                    type="text"
                    value={editVehicle.model || ''}
                    onChange={(e) => setEditVehicle({...editVehicle, model: e.target.value})}
                    className="input-modern"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Année
                  </label>
                  <input
                    type="number"
                    value={editVehicle.year || ''}
                    onChange={(e) => setEditVehicle({...editVehicle, year: parseInt(e.target.value)})}
                    className="input-modern"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kilométrage
                  </label>
                  <input
                    type="number"
                    value={editVehicle.km || ''}
                    onChange={(e) => setEditVehicle({...editVehicle, km: parseInt(e.target.value)})}
                    className="input-modern"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type de carburant
                  </label>
                  <select
                    value={editVehicle.fuelType || ''}
                    onChange={(e) => setEditVehicle({...editVehicle, fuelType: e.target.value})}
                    className="input-modern"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Essence">Essence</option>
                    <option value="Electrique">Électrique</option>
                    <option value="Hybride">Hybride</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={editVehicle.status || ''}
                    onChange={(e) => setEditVehicle({...editVehicle, status: e.target.value})}
                    className="input-modern"
                  >
                    <option value="active">Actif</option>
                    <option value="maintenance">En maintenance</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prochaine maintenance
                  </label>
                  <input
                    type="date"
                    value={editVehicle.nextMaintenance || ''}
                    onChange={(e) => setEditVehicle({...editVehicle, nextMaintenance: e.target.value})}
                    className="input-modern"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expiration assurance
                  </label>
                  <input
                    type="date"
                    value={editVehicle.insuranceExpiry || ''}
                    onChange={(e) => setEditVehicle({...editVehicle, insuranceExpiry: e.target.value})}
                    className="input-modern"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contrôle technique
                  </label>
                  <input
                    type="date"
                    value={editVehicle.technicalControlExpiry || ''}
                    onChange={(e) => setEditVehicle({...editVehicle, technicalControlExpiry: e.target.value})}
                    className="input-modern"
                  />
                </div>
                
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={editVehicle.notes || ''}
                    onChange={(e) => setEditVehicle({...editVehicle, notes: e.target.value})}
                    className="input-modern"
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all font-semibold text-gray-700"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="modern-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INTERVENTION */}
      {showInterventionModal && currentVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold gradient-text">Nouvelle Intervention</h2>
                <button 
                  onClick={() => setShowInterventionModal(false)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Véhicule: {currentVehicle.plate} - {currentVehicle.brand} {currentVehicle.model}</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type d'intervention *
                  </label>
                  <select
                    value={newIntervention.type}
                    onChange={(e) => setNewIntervention({...newIntervention, type: e.target.value})}
                    className="input-modern"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Révision">Révision</option>
                    <option value="Vidange">Vidange</option>
                    <option value="Freins">Freins</option>
                    <option value="Pneus">Pneus</option>
                    <option value="Électronique">Électronique</option>
                    <option value="Carrosserie">Carrosserie</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priorité
                  </label>
                  <select
                    value={newIntervention.priority}
                    onChange={(e) => setNewIntervention({...newIntervention, priority: e.target.value})}
                    className="input-modern"
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date prévue
                  </label>
                  <input
                    type="date"
                    value={newIntervention.scheduledDate}
                    onChange={(e) => setNewIntervention({...newIntervention, scheduledDate: e.target.value})}
                    className="input-modern"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Coût estimé (€)
                  </label>
                  <input
                    type="number"
                    value={newIntervention.cost}
                    onChange={(e) => setNewIntervention({...newIntervention, cost: e.target.value})}
                    className="input-modern"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Technicien responsable
                  </label>
                  <input
                    type="text"
                    value={newIntervention.technician}
                    onChange={(e) => setNewIntervention({...newIntervention, technician: e.target.value})}
                    className="input-modern"
                    placeholder="Nom du technicien"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description détaillée
                  </label>
                  <textarea
                    value={newIntervention.description}
                    onChange={(e) => setNewIntervention({...newIntervention, description: e.target.value})}
                    className="input-modern"
                    rows="4"
                    placeholder="Décrivez l'intervention à effectuer..."
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowInterventionModal(false)}
                  className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all font-semibold text-gray-700"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSaveIntervention}
                  disabled={loading || !newIntervention.type}
                  className="modern-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wrench size={20} />
                  {loading ? 'Création...' : 'Créer l\'intervention'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LAVAGE */}
      {showWashingModal && currentVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold gradient-text">Nouveau Lavage</h2>
                <button 
                  onClick={() => setShowWashingModal(false)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Véhicule: {currentVehicle.plate} - {currentVehicle.brand} {currentVehicle.model}</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de lavage
                </label>
                <select
                  value={newWashing.type}
                  onChange={(e) => setNewWashing({...newWashing, type: e.target.value})}
                  className="input-modern"
                >
                  <option value="exterior">Extérieur seulement</option>
                  <option value="interior">Intérieur seulement</option>
                  <option value="complete">Complet (intérieur + extérieur)</option>
                  <option value="premium">Premium (complet + cire)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Coût (€)
                </label>
                <input
                  type="number"
                  value={newWashing.cost}
                  onChange={(e) => setNewWashing({...newWashing, cost: e.target.value})}
                  className="input-modern"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={newWashing.notes}
                  onChange={(e) => setNewWashing({...newWashing, notes: e.target.value})}
                  className="input-modern"
                  rows="3"
                  placeholder="Observations particulières..."
                />
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowWashingModal(false)}
                  className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all font-semibold text-gray-700"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSaveWashing}
                  disabled={loading}
                  className="modern-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Droplets size={20} />
                  {loading ? 'Enregistrement...' : 'Enregistrer le lavage'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message si aucun véhicule */}
      {filteredVehicles.length === 0 && !loading && (
        <Card className="text-center p-12">
          <Car className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'Aucun véhicule trouvé' : 'Aucun véhicule dans la flotte'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Essayez de modifier vos critères de recherche ou de filtrage.'
              : 'Commencez par ajouter votre premier véhicule à la flotte.'
            }
          </p>
          {(!searchTerm && filterStatus === 'all') && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="modern-button"
            >
              <Plus size={20} />
              Ajouter le premier véhicule
            </button>
          )}
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="text-center p-12">
          <div className="animate-spin mx-auto mb-4 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-600">🔥 Connexion à Firebase...</p>
        </Card>
      )}

      {/* Click outside pour fermer les menus */}
      {selectedVehicle && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
};

export default FleetManagement;