import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Car,
  Euro,
  FileText,
  Eye,
  Edit,
  Trash2,
  X,
  Save
} from 'lucide-react';
import Card from '../components/common/Card';

// IMPORTS FIREBASE
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  where 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const Interventions = ({ data, onRefresh }) => {
  const [interventions, setInterventions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filteredInterventions, setFilteredInterventions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [sortBy, setSortBy] = useState('scheduledDate');

  // États pour les modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentIntervention, setCurrentIntervention] = useState(null);
  const [editIntervention, setEditIntervention] = useState({});

  // Formulaire pour nouvelle intervention
  const [newIntervention, setNewIntervention] = useState({
    vehicleId: '',
    type: '',
    description: '',
    urgency: 'normal',
    scheduledDate: '',
    estimatedCost: '',
    technician: '',
    notes: ''
  });

  // CHARGEMENT DES DONNÉES DEPUIS FIREBASE
  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);
        console.log('🔥 Chargement des interventions depuis Firebase...');
        
        // Charger les interventions
        const interventionsRef = collection(db, 'interventions');
        const interventionsQuery = query(interventionsRef, orderBy('createdAt', 'desc'));
        
        const unsubscribeInterventions = onSnapshot(interventionsQuery, 
          (snapshot) => {
            const interventionsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('✅ Interventions chargées:', interventionsList);
            setInterventions(interventionsList);
            setError(null);
          }, 
          (error) => {
            console.error('❌ Erreur lors du chargement des interventions:', error);
            setError('Impossible de charger les interventions: ' + error.message);
          }
        );

        // Charger les véhicules pour le formulaire
        const vehiclesRef = collection(db, 'vehicles');
        const unsubscribeVehicles = onSnapshot(vehiclesRef, 
          (snapshot) => {
            const vehiclesList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('✅ Véhicules chargés:', vehiclesList);
            setVehicles(vehiclesList);
            setLoading(false);
          }, 
          (error) => {
            console.error('❌ Erreur lors du chargement des véhicules:', error);
            setLoading(false);
          }
        );

        return () => {
          console.log('🧹 Nettoyage des listeners Firebase');
          unsubscribeInterventions();
          unsubscribeVehicles();
        };
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation Firebase:', error);
        setError('Erreur de connexion à Firebase: ' + error.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrage et recherche
  useEffect(() => {
    let filtered = [...interventions];

    // Recherche par texte
    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(intervention => {
        const searchLower = searchTerm.toLowerCase();
        return (intervention.vehiclePlate || '').toLowerCase().includes(searchLower) ||
               (intervention.type || '').toLowerCase().includes(searchLower) ||
               (intervention.description || '').toLowerCase().includes(searchLower) ||
               (intervention.technician || '').toLowerCase().includes(searchLower);
      });
    }

    // Filtrage par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(intervention => intervention.status === filterStatus);
    }

    // Filtrage par urgence
    if (filterUrgency !== 'all') {
      filtered = filtered.filter(intervention => intervention.urgency === filterUrgency);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'scheduledDate':
          const dateA = a.scheduledDate ? new Date(a.scheduledDate) : new Date('9999-12-31');
          const dateB = b.scheduledDate ? new Date(b.scheduledDate) : new Date('9999-12-31');
          return dateA.getTime() - dateB.getTime();
          
        case 'urgency':
          const urgencyOrder = { critical: 4, high: 3, normal: 2, low: 1 };
          return (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0);
          
        case 'vehiclePlate':
          return (a.vehiclePlate || '').localeCompare(b.vehiclePlate || '');
          
        default:
          return 0;
      }
    });

    setFilteredInterventions(filtered);
  }, [interventions, searchTerm, filterStatus, filterUrgency, sortBy]);

  // FONCTION POUR AJOUTER UNE INTERVENTION
  const handleAddIntervention = async () => {
    setError(null);
    setLoading(true);
    
    try {
      console.log('🔥 Ajout intervention à Firebase:', newIntervention);
      
      // Validation
      if (!newIntervention.vehicleId) {
        throw new Error('Veuillez sélectionner un véhicule');
      }
      if (!newIntervention.type.trim()) {
        throw new Error('Le type d\'intervention est obligatoire');
      }
      if (!newIntervention.description.trim()) {
        throw new Error('La description est obligatoire');
      }
      
      // Trouver les infos du véhicule
      const selectedVehicle = vehicles.find(v => v.id === newIntervention.vehicleId);
      if (!selectedVehicle) {
        throw new Error('Véhicule introuvable');
      }
      
      const interventionData = {
        vehicleId: newIntervention.vehicleId,
        vehiclePlate: selectedVehicle.plate,
        vehicleBrand: selectedVehicle.brand,
        vehicleModel: selectedVehicle.model,
        type: newIntervention.type.trim(),
        description: newIntervention.description.trim(),
        urgency: newIntervention.urgency,
        scheduledDate: newIntervention.scheduledDate || null,
        estimatedCost: parseFloat(newIntervention.estimatedCost) || 0,
        technician: newIntervention.technician.trim(),
        notes: newIntervention.notes.trim(),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Ajouter à Firebase
      const interventionsRef = collection(db, 'interventions');
      const docRef = await addDoc(interventionsRef, interventionData);
      
      console.log('✅ Intervention ajoutée avec succès! ID:', docRef.id);
      
      // Mettre à jour le statut du véhicule
      if (selectedVehicle) {
        const vehicleRef = doc(db, 'vehicles', selectedVehicle.id);
        await updateDoc(vehicleRef, {
          status: 'maintenance',
          updatedAt: new Date()
        });
        console.log('✅ Statut véhicule mis à jour: maintenance');
      }
      
      // Reset du formulaire
      setNewIntervention({
        vehicleId: '',
        type: '',
        description: '',
        urgency: 'normal',
        scheduledDate: '',
        estimatedCost: '',
        technician: '',
        notes: ''
      });
      
      setShowAddForm(false);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'intervention:', error);
      setError(error.message || 'Erreur lors de l\'ajout de l\'intervention');
    } finally {
      setLoading(false);
    }
  };

  // FONCTION POUR VOIR LES DÉTAILS
  const handleViewDetails = (intervention) => {
    setCurrentIntervention(intervention);
    setShowDetailsModal(true);
    setSelectedIntervention(null);
  };

  // FONCTION POUR MODIFIER
  const handleEditIntervention = (intervention) => {
    setCurrentIntervention(intervention);
    setEditIntervention({ ...intervention });
    setShowEditModal(true);
    setSelectedIntervention(null);
  };

  // FONCTION POUR SAUVEGARDER MODIFICATION
  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      const interventionRef = doc(db, 'interventions', currentIntervention.id);
      await updateDoc(interventionRef, {
        ...editIntervention,
        updatedAt: new Date()
      });
      console.log('✅ Intervention modifiée avec succès');
      setShowEditModal(false);
      setCurrentIntervention(null);
    } catch (error) {
      console.error('❌ Erreur lors de la modification:', error);
      setError('Impossible de modifier l\'intervention: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // FONCTION POUR SUPPRIMER
  const handleDeleteIntervention = async (interventionId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'interventions', interventionId));
      console.log('✅ Intervention supprimée avec succès');
      setSelectedIntervention(null);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      setError('Impossible de supprimer l\'intervention: ' + error.message);
    }
  };

  // FONCTION POUR CHANGER LE STATUT
  const handleChangeStatus = async (interventionId, newStatus) => {
    try {
      const interventionRef = doc(db, 'interventions', interventionId);
      await updateDoc(interventionRef, {
        status: newStatus,
        updatedAt: new Date(),
        ...(newStatus === 'completed' && { endDate: new Date() })
      });
      console.log('✅ Statut mis à jour:', newStatus);
      setSelectedIntervention(null);
    } catch (error) {
      console.error('❌ Erreur lors du changement de statut:', error);
      setError('Impossible de changer le statut: ' + error.message);
    }
  };

  // Fonctions utilitaires
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'in-progress': return <Wrench size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'cancelled': return <X size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in-progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'critical': return 'Critique';
      case 'high': return 'Haute';
      case 'normal': return 'Normale';
      case 'low': return 'Faible';
      default: return urgency;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Interventions Techniques</h2>
          <p className="text-gray-600 font-medium">
            {filteredInterventions.length} intervention{filteredInterventions.length > 1 ? 's' : ''} 
            {(filterStatus !== 'all' || filterUrgency !== 'all') && ' (filtrées)'}
            {loading && ' - Chargement...'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une intervention..."
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
            <option value="pending">En attente</option>
            <option value="in-progress">En cours</option>
            <option value="completed">Terminées</option>
            <option value="cancelled">Annulées</option>
          </select>
          
          <select 
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="input-modern"
          >
            <option value="all">Toutes urgences</option>
            <option value="critical">Critique</option>
            <option value="high">Haute</option>
            <option value="normal">Normale</option>
            <option value="low">Faible</option>
          </select>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-modern"
          >
            <option value="scheduledDate">Trier par date</option>
            <option value="urgency">Trier par urgence</option>
            <option value="vehiclePlate">Trier par véhicule</option>
          </select>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="modern-button whitespace-nowrap"
            disabled={loading}
          >
            <Plus size={20} />
            Nouvelle intervention
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && !showAddForm && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
          <div className="font-bold mb-2">🔥 Erreur Firebase</div>
          <div>{error}</div>
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold gradient-text">Nouvelle Intervention</h3>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Véhicule *
              </label>
              <select
                value={newIntervention.vehicleId}
                onChange={(e) => setNewIntervention({...newIntervention, vehicleId: e.target.value})}
                className="input-modern"
                required
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} - {vehicle.brand} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
            
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
                <option value="">Sélectionner un type</option>
                <option value="maintenance">Maintenance préventive</option>
                <option value="reparation">Réparation</option>
                <option value="vidange">Vidange</option>
                <option value="pneus">Changement pneus</option>
                <option value="freins">Freins</option>
                <option value="climatisation">Climatisation</option>
                <option value="carrosserie">Carrosserie</option>
                <option value="controle_technique">Contrôle technique</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Urgence
              </label>
              <select
                value={newIntervention.urgency}
                onChange={(e) => setNewIntervention({...newIntervention, urgency: e.target.value})}
                className="input-modern"
              >
                <option value="low">Faible</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
                <option value="critical">Critique</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date programmée
              </label>
              <input
                type="date"
                value={newIntervention.scheduledDate}
                onChange={(e) => setNewIntervention({...newIntervention, scheduledDate: e.target.value})}
                className="input-modern"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Coût estimé (€)
              </label>
              <input
                type="number"
                value={newIntervention.estimatedCost}
                onChange={(e) => setNewIntervention({...newIntervention, estimatedCost: e.target.value})}
                className="input-modern"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Technicien assigné
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
                Description détaillée *
              </label>
              <textarea
                value={newIntervention.description}
                onChange={(e) => setNewIntervention({...newIntervention, description: e.target.value})}
                className="input-modern"
                rows="4"
                placeholder="Décrivez le problème ou l'intervention à effectuer..."
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes additionnelles
              </label>
              <textarea
                value={newIntervention.notes}
                onChange={(e) => setNewIntervention({...newIntervention, notes: e.target.value})}
                className="input-modern"
                rows="3"
                placeholder="Informations complémentaires..."
              />
            </div>
          </div>
          
          {error && (
            <div className="p-4 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
              <div className="font-bold mb-2">🔥 Erreur</div>
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
              onClick={handleAddIntervention}
              disabled={loading || !newIntervention.vehicleId || !newIntervention.type || !newIntervention.description}
              className="modern-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Création...' : '🔧 Créer l\'intervention'}
            </button>
          </div>
        </Card>
      )}

      {/* Liste des interventions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredInterventions.map((intervention) => (
          <Card key={intervention.id} className="intervention-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 shadow-lg">
                  <Wrench className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold gradient-text">{intervention.type}</h3>
                  <p className="text-gray-600 font-medium">
                    {intervention.vehiclePlate} - {intervention.vehicleBrand} {intervention.vehicleModel}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`status-badge ${getStatusColor(intervention.status)}`}>
                  {getStatusIcon(intervention.status)}
                  {getStatusText(intervention.status)}
                </span>
                
                <div className="relative">
                  <button 
                    onClick={() => setSelectedIntervention(selectedIntervention === intervention.id ? null : intervention.id)}
                    className="p-2 rounded-xl bg-white/50 hover:bg-white/70 transition-all"
                  >
                    <AlertCircle size={16} />
                  </button>
                  
                  {selectedIntervention === intervention.id && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-glass border border-white/20 py-2 z-10">
                      <button 
                        onClick={() => handleViewDetails(intervention)}
                        className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                      >
                        <Eye size={14} />
                        Voir détails
                      </button>
                      <button 
                        onClick={() => handleEditIntervention(intervention)}
                        className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                      >
                        <Edit size={14} />
                        Modifier
                      </button>
                      {intervention.status === 'pending' && (
                        <button 
                          onClick={() => handleChangeStatus(intervention.id, 'in-progress')}
                          className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                        >
                          <Wrench size={14} />
                          Démarrer
                        </button>
                      )}
                      {intervention.status === 'in-progress' && (
                        <button 
                          onClick={() => handleChangeStatus(intervention.id, 'completed')}
                          className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                        >
                          <CheckCircle size={14} />
                          Terminer
                        </button>
                      )}
                      <hr className="my-2 border-gray-200/50" />
                      <button 
                        onClick={() => handleDeleteIntervention(intervention.id)}
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
            
            {/* Informations de l'intervention */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                <span className="text-gray-700 flex items-center gap-2 font-medium">
                  <AlertCircle size={16} />
                  Urgence
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getUrgencyColor(intervention.urgency)}`}>
                  {getUrgencyText(intervention.urgency)}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                <span className="text-gray-700 flex items-center gap-2 font-medium">
                  <Calendar size={16} />
                  Programmée
                </span>
                <span className="font-bold text-gray-800">
                  {intervention.scheduledDate ? new Date(intervention.scheduledDate).toLocaleDateString() : 'Non planifiée'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                <span className="text-gray-700 flex items-center gap-2 font-medium">
                  <Euro size={16} />
                  Coût estimé
                </span>
                <span className="font-bold text-gray-800">
                  {intervention.estimatedCost ? `${intervention.estimatedCost}€` : 'Non estimé'}
                </span>
              </div>
              
              {intervention.technician && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                  <span className="text-gray-700 flex items-center gap-2 font-medium">
                    <User size={16} />
                    Technicien
                  </span>
                  <span className="font-bold text-gray-800">
                    {intervention.technician}
                  </span>
                </div>
              )}
            </div>
            
            {/* Description */}
            <div className="p-3 rounded-xl bg-gray-50 mb-4">
              <p className="text-gray-700 text-sm">
                {intervention.description}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button 
                onClick={() => handleViewDetails(intervention)}
                className="flex-1 p-3 rounded-xl bg-white/70 hover:bg-white transition-all font-semibold text-gray-700 text-sm"
              >
                Détails
              </button>
              {intervention.status === 'pending' && (
                <button 
                  onClick={() => handleChangeStatus(intervention.id, 'in-progress')}
                  className="flex-1 p-3 rounded-xl bg-blue-100 hover:bg-blue-200 transition-all font-semibold text-blue-700 text-sm"
                >
                  Démarrer
                </button>
              )}
              {intervention.status === 'in-progress' && (
                <button 
                  onClick={() => handleChangeStatus(intervention.id, 'completed')}
                  className="flex-1 p-3 rounded-xl bg-green-100 hover:bg-green-200 transition-all font-semibold text-green-700 text-sm"
                >
                  Terminer
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Message si aucune intervention */}
      {filteredInterventions.length === 0 && !loading && (
        <Card className="text-center p-12">
          <Wrench className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {searchTerm || filterStatus !== 'all' || filterUrgency !== 'all' 
              ? 'Aucune intervention trouvée' 
              : 'Aucune intervention programmée'
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all' || filterUrgency !== 'all'
              ? 'Essayez de modifier vos critères de recherche ou de filtrage.'
              : 'Commencez par programmer votre première intervention.'
            }
          </p>
          {(!searchTerm && filterStatus === 'all' && filterUrgency === 'all') && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="modern-button"
            >
              <Plus size={20} />
              Programmer une intervention
            </button>
          )}
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="text-center p-12">
          <div className="animate-spin mx-auto mb-4 w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-600">🔥 Connexion à Firebase...</p>
        </Card>
      )}

      {/* Click outside pour fermer les menus */}
      {selectedIntervention && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setSelectedIntervention(null)}
        />
      )}
    </div>
  );
};

export default Interventions;