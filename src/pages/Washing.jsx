import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Plus, 
  Calendar, 
  Clock, 
  DollarSign,
  User,
  Car,
  Camera,
  Star,
  Upload,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Edit,
  X,
  Save,
  MoreHorizontal,
  MapPin,
  Heart,
  ThumbsUp
} from 'lucide-react';
import Card, { CardWithHeader } from '../components/common/Card';

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


const WashingService = ({ data, onRefresh }) => {
  const [washings, setWashings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filteredWashings, setFilteredWashings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedWashing, setSelectedWashing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [error, setError] = useState(null);

  // États pour les modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [currentWashing, setCurrentWashing] = useState(null);
  const [editWashing, setEditWashing] = useState({});

  // Formulaire nouveau lavage
  const [newWashing, setNewWashing] = useState({
    vehicleId: '',
    type: '',
    description: '',
    cost: '',
    date: new Date().toISOString().slice(0, 16), // Format datetime-local
    employeeId: '',
    duration: '',
    location: 'onsite',
    notes: '',
    customerSatisfaction: 5,
    photosBefore: [],
    photosAfter: []
  });

  // Types de lavage disponibles
  const washingTypes = [
    { 
      id: 'complete', 
      label: 'Lavage Complet', 
      description: 'Extérieur + Intérieur + Aspirateur',
      price: 45, 
      duration: 120, 
      color: 'from-blue-500 to-cyan-500',
      icon: '🚗'
    },
    { 
      id: 'interior', 
      label: 'Intérieur Seulement', 
      description: 'Nettoyage intérieur + Aspirateur',
      price: 25, 
      duration: 60, 
      color: 'from-green-500 to-emerald-500',
      icon: '🪑'
    },
    { 
      id: 'exterior', 
      label: 'Extérieur Seulement', 
      description: 'Lavage extérieur + Séchage',
      price: 20, 
      duration: 45, 
      color: 'from-orange-500 to-red-500',
      icon: '🧽'
    },
    { 
      id: 'premium', 
      label: 'Premium + Cire', 
      description: 'Complet + Cire + Protection',
      price: 65, 
      duration: 180, 
      color: 'from-purple-500 to-pink-500',
      icon: '✨'
    },
    { 
      id: 'express', 
      label: 'Express', 
      description: 'Lavage rapide extérieur',
      price: 15, 
      duration: 30, 
      color: 'from-yellow-500 to-orange-500',
      icon: '⚡'
    },
    { 
      id: 'deep', 
      label: 'Nettoyage Approfondi', 
      description: 'Détailing complet + Désinfection',
      price: 85, 
      duration: 240, 
      color: 'from-indigo-500 to-purple-500',
      icon: '🔬'
    }
  ];

  // Employés disponibles
  const employees = [
    { id: 1, name: 'Sophie Rousseau', speciality: 'Lavage premium', avatar: '👩‍💼' },
    { id: 2, name: 'Kevin Dubois', speciality: 'Nettoyage intérieur', avatar: '👨‍🔧' },
    { id: 3, name: 'Marie Leblanc', speciality: 'Détailing', avatar: '👩‍🎨' },
    { id: 4, name: 'Thomas Moreau', speciality: 'Lavage express', avatar: '👨‍💼' },
    { id: 5, name: 'Julie Martin', speciality: 'Carrosserie', avatar: '👩‍🔬' }
  ];

  // CHARGEMENT DES DONNÉES DEPUIS FIREBASE
  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);
        console.log('🔥 Chargement des lavages depuis Firebase...');
        
        // Charger les lavages
        const washingsRef = collection(db, 'washing');
        const washingsQuery = query(washingsRef, orderBy('createdAt', 'desc'));
        
        const unsubscribeWashings = onSnapshot(washingsQuery, 
          (snapshot) => {
            const washingsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('✅ Lavages chargés:', washingsList);
            setWashings(washingsList);
            setError(null);
          }, 
          (error) => {
            console.error('❌ Erreur lors du chargement des lavages:', error);
            setError('Impossible de charger les lavages: ' + error.message);
          }
        );

        // Charger les véhicules
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
          unsubscribeWashings();
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
    let filtered = [...washings];

    // Recherche par texte
    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(washing => {
        const searchLower = searchTerm.toLowerCase();
        return (washing.vehiclePlate || '').toLowerCase().includes(searchLower) ||
               (washing.type || '').toLowerCase().includes(searchLower) ||
               (washing.description || '').toLowerCase().includes(searchLower) ||
               (washing.notes || '').toLowerCase().includes(searchLower);
      });
    }

    // Filtrage par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(washing => washing.status === filterStatus);
    }

    // Filtrage par type
    if (filterType !== 'all') {
      filtered = filtered.filter(washing => washing.type === filterType);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          const dateA = a.scheduledDate ? new Date(a.scheduledDate) : new Date();
          const dateB = b.scheduledDate ? new Date(b.scheduledDate) : new Date();
          return dateB.getTime() - dateA.getTime();
          
        case 'cost':
          return (b.cost || 0) - (a.cost || 0);
          
        case 'vehicle':
          return (a.vehiclePlate || '').localeCompare(b.vehiclePlate || '');
          
        case 'satisfaction':
          return (b.customerSatisfaction || 0) - (a.customerSatisfaction || 0);
          
        default:
          return 0;
      }
    });

    setFilteredWashings(filtered);
  }, [washings, searchTerm, filterStatus, filterType, sortBy]);

  // FONCTION POUR AJOUTER UN LAVAGE
  const handleAddWashing = async () => {
    setError(null);
    setLoading(true);
    
    try {
      console.log('🔥 Ajout lavage à Firebase:', newWashing);
      
      // Validation
      if (!newWashing.vehicleId) {
        throw new Error('Veuillez sélectionner un véhicule');
      }
      if (!newWashing.type) {
        throw new Error('Veuillez sélectionner un type de lavage');
      }
      
      // Trouver les infos du véhicule
      const selectedVehicle = vehicles.find(v => v.id === newWashing.vehicleId);
      if (!selectedVehicle) {
        throw new Error('Véhicule introuvable');
      }
      
      // Trouver les infos de l'employé
      const selectedEmployee = employees.find(e => e.id === parseInt(newWashing.employeeId));
      
      const washingData = {
        vehicleId: newWashing.vehicleId,
        vehiclePlate: selectedVehicle.plate,
        vehicleBrand: selectedVehicle.brand,
        vehicleModel: selectedVehicle.model,
        type: newWashing.type,
        description: newWashing.description || getTypeInfo(newWashing.type).description,
        cost: parseFloat(newWashing.cost) || 0,
        scheduledDate: newWashing.date,
        estimatedDuration: parseInt(newWashing.duration) || 0,
        employeeId: newWashing.employeeId ? parseInt(newWashing.employeeId) : null,
        employeeName: selectedEmployee ? selectedEmployee.name : null,
        location: newWashing.location,
        notes: newWashing.notes.trim(),
        customerSatisfaction: parseInt(newWashing.customerSatisfaction),
        status: 'scheduled',
        photosBefore: newWashing.photosBefore || [],
        photosAfter: newWashing.photosAfter || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Ajouter à Firebase
      const washingsRef = collection(db, 'washing');
      const docRef = await addDoc(washingsRef, washingData);
      
      console.log('✅ Lavage ajouté avec succès! ID:', docRef.id);
      
      // Reset du formulaire
      setNewWashing({
        vehicleId: '',
        type: '',
        description: '',
        cost: '',
        date: new Date().toISOString().slice(0, 16),
        employeeId: '',
        duration: '',
        location: 'onsite',
        notes: '',
        customerSatisfaction: 5,
        photosBefore: [],
        photosAfter: []
      });
      
      setShowForm(false);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du lavage:', error);
      setError(error.message || 'Erreur lors de l\'ajout du lavage');
    } finally {
      setLoading(false);
    }
  };

  // FONCTION POUR VOIR LES DÉTAILS
  const handleViewDetails = (washing) => {
    setCurrentWashing(washing);
    setShowDetailsModal(true);
    setSelectedWashing(null);
  };

  // FONCTION POUR MODIFIER
  const handleEditWashing = (washing) => {
    setCurrentWashing(washing);
    setEditWashing({ ...washing });
    setShowEditModal(true);
    setSelectedWashing(null);
  };

  // FONCTION POUR SAUVEGARDER MODIFICATION
  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      const washingRef = doc(db, 'washing', currentWashing.id);
      await updateDoc(washingRef, {
        ...editWashing,
        updatedAt: new Date()
      });
      console.log('✅ Lavage modifié avec succès');
      setShowEditModal(false);
      setCurrentWashing(null);
    } catch (error) {
      console.error('❌ Erreur lors de la modification:', error);
      setError('Impossible de modifier le lavage: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // FONCTION POUR VOIR LES PHOTOS
  const handleViewPhotos = (washing) => {
    setCurrentWashing(washing);
    setShowPhotosModal(true);
    setSelectedWashing(null);
  };

  // FONCTION POUR CHANGER LE STATUT
  const handleChangeStatus = async (washingId, newStatus) => {
    try {
      const washingRef = doc(db, 'washing', washingId);
      const updateData = {
        status: newStatus,
        updatedAt: new Date()
      };

      // Si on marque comme terminé, ajouter la date de fin
      if (newStatus === 'completed') {
        updateData.completedAt = new Date();
      }

      await updateDoc(washingRef, updateData);
      console.log('✅ Statut mis à jour:', newStatus);
      setSelectedWashing(null);
    } catch (error) {
      console.error('❌ Erreur lors du changement de statut:', error);
      setError('Impossible de changer le statut: ' + error.message);
    }
  };

  // FONCTION POUR SUPPRIMER
  const handleDeleteWashing = async (washingId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce lavage ?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'washing', washingId));
      console.log('✅ Lavage supprimé avec succès');
      setSelectedWashing(null);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      setError('Impossible de supprimer le lavage: ' + error.message);
    }
  };

  // FONCTION POUR METTRE À JOUR LA SATISFACTION
  const handleUpdateSatisfaction = async (washingId, rating) => {
    try {
      const washingRef = doc(db, 'washing', washingId);
      await updateDoc(washingRef, {
        customerSatisfaction: rating,
        updatedAt: new Date()
      });
      console.log('✅ Satisfaction mise à jour:', rating);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la satisfaction:', error);
      setError('Impossible de mettre à jour la satisfaction: ' + error.message);
    }
  };

  // Fonctions utilitaires
  const handleTypeSelect = (typeId) => {
    const selectedType = washingTypes.find(t => t.id === typeId);
    setNewWashing({
      ...newWashing,
      type: typeId,
      cost: selectedType?.price || '',
      duration: selectedType?.duration || '',
      description: selectedType?.description || ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 border-green-200';
      case 'in-progress': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'scheduled': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'cancelled': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in-progress': return Clock;
      case 'scheduled': return Calendar;
      case 'cancelled': return XCircle;
      default: return AlertCircle;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in-progress': return 'En cours';
      case 'scheduled': return 'Planifié';
      case 'cancelled': return 'Annulé';
      default: return 'Inconnu';
    }
  };

  const getTypeInfo = (typeId) => {
    return washingTypes.find(t => t.id === typeId) || washingTypes[0];
  };

  const handlePhotoUpload = (e, type) => {
    const files = Array.from(e.target.files);
    // Pour la démonstration, on simule l'ajout d'URLs
    const newPhotos = files.map(file => URL.createObjectURL(file));
    
    if (type === 'before') {
      setNewWashing({
        ...newWashing,
        photosBefore: [...(newWashing.photosBefore || []), ...newPhotos]
      });
    } else {
      setNewWashing({
        ...newWashing,
        photosAfter: [...(newWashing.photosAfter || []), ...newPhotos]
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Services de Lavage</h2>
          <p className="text-gray-600 font-medium">
            {filteredWashings.length} service{filteredWashings.length > 1 ? 's' : ''} de lavage
            {(filterStatus !== 'all' || filterType !== 'all') && ' (filtrés)'}
            {loading && ' - Chargement...'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un lavage..."
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
            <option value="scheduled">Planifiés</option>
            <option value="in-progress">En cours</option>
            <option value="completed">Terminés</option>
            <option value="cancelled">Annulés</option>
          </select>
          
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-modern"
          >
            <option value="all">Tous les types</option>
            {washingTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-modern"
          >
            <option value="date">Trier par date</option>
            <option value="cost">Trier par prix</option>
            <option value="vehicle">Trier par véhicule</option>
            <option value="satisfaction">Trier par satisfaction</option>
          </select>
          
          <button 
            onClick={() => setShowForm(true)}
            className="modern-button whitespace-nowrap"
            disabled={loading}
          >
            <Plus size={20} />
            Nouveau lavage
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && !showForm && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
          <div className="font-bold mb-2">🔥 Erreur Firebase</div>
          <div>{error}</div>
        </div>
      )}

      {/* Types de lavage - Tarifs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {washingTypes.map((type) => (
          <Card 
            key={type.id} 
            interactive 
            className="text-center p-6 cursor-pointer group"
            onClick={() => handleTypeSelect(type.id)}
          >
            <div className={`p-4 rounded-3xl bg-gradient-to-r ${type.color} inline-block mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
              <span className="text-2xl">{type.icon}</span>
            </div>
            <h3 className="font-bold text-sm gradient-text mb-2">{type.label}</h3>
            <p className="text-2xl font-bold text-gray-800 mb-1">{type.price}€</p>
            <p className="text-gray-600 text-xs font-medium">{type.duration}min</p>
            <p className="text-gray-500 text-xs mt-2 leading-tight">{type.description}</p>
          </Card>
        ))}
      </div>

      {/* Formulaire nouveau lavage */}
      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold gradient-text">Nouveau Service de Lavage</h3>
            <button 
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Sélection véhicule */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Véhicule *
              </label>
              <select
                value={newWashing.vehicleId}
                onChange={(e) => setNewWashing({...newWashing, vehicleId: e.target.value})}
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
            
            {/* Type de service */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type de service *
              </label>
              <select
                value={newWashing.type}
                onChange={(e) => handleTypeSelect(e.target.value)}
                className="input-modern"
                required
              >
                <option value="">Choisir le service</option>
                {washingTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.label} - {type.price}€
                  </option>
                ))}
              </select>
            </div>
            
            {/* Date et heure */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date et heure *
              </label>
              <input
                type="datetime-local"
                value={newWashing.date}
                onChange={(e) => setNewWashing({...newWashing, date: e.target.value})}
                className="input-modern"
                required
              />
            </div>
            
            {/* Employé */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Employé assigné
              </label>
              <select
                value={newWashing.employeeId}
                onChange={(e) => setNewWashing({...newWashing, employeeId: e.target.value})}
                className="input-modern"
              >
                <option value="">Sélectionner un employé</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.avatar} {emp.name} - {emp.speciality}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Prix */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prix (€)
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
            
            {/* Durée */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Durée estimée (minutes)
              </label>
              <input
                type="number"
                value={newWashing.duration}
                onChange={(e) => setNewWashing({...newWashing, duration: e.target.value})}
                className="input-modern"
                placeholder="60"
                min="0"
              />
            </div>

            {/* Lieu */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lieu du lavage
              </label>
              <select
                value={newWashing.location}
                onChange={(e) => setNewWashing({...newWashing, location: e.target.value})}
                className="input-modern"
              >
                <option value="onsite">Sur site</option>
                <option value="external">Prestataire externe</option>
                <option value="garage">Garage partenaire</option>
                <option value="mobile">Service mobile</option>
              </select>
            </div>

            {/* Satisfaction client */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Satisfaction attendue
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setNewWashing({...newWashing, customerSatisfaction: rating})}
                    className={`p-1 rounded-lg transition-all ${
                      rating <= newWashing.customerSatisfaction 
                        ? 'text-yellow-400' 
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  >
                    <Star size={24} className={rating <= newWashing.customerSatisfaction ? 'fill-current' : ''} />
                  </button>
                ))}
                <span className="text-sm text-gray-600 ml-2">
                  ({newWashing.customerSatisfaction}/5)
                </span>
              </div>
            </div>
            
            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description du service
              </label>
              <textarea
                value={newWashing.description}
                onChange={(e) => setNewWashing({...newWashing, description: e.target.value})}
                className="input-modern"
                rows="2"
                placeholder="Détails du service de lavage..."
              />
            </div>
            
            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes spéciales
              </label>
              <textarea
                value={newWashing.notes}
                onChange={(e) => setNewWashing({...newWashing, notes: e.target.value})}
                className="input-modern"
                rows="2"
                placeholder="Instructions particulières, produits spéciaux..."
              />
            </div>
          </div>
          
          {/* Upload de photos */}
          <div className="mb-8">
            <h4 className="text-lg font-bold mb-4 gradient-text">Photos Avant/Après (Optionnel)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photos AVANT */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Photos AVANT
                </label>
                <div className="glass-card p-6 text-center cursor-pointer hover:scale-105 transition-all border-2 border-dashed border-gray-300">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'before')}
                    className="hidden"
                    id="photos-before"
                  />
                  <label htmlFor="photos-before" className="cursor-pointer">
                    <Camera className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-700 font-semibold mb-2">Photos AVANT</p>
                    <p className="text-gray-500 text-sm">Cliquez pour ajouter des photos</p>
                  </label>
                  
                  {newWashing.photosBefore && newWashing.photosBefore.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {newWashing.photosBefore.map((photo, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={photo} 
                            alt={`Avant ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <button 
                            onClick={() => {
                              const newPhotos = newWashing.photosBefore.filter((_, i) => i !== index);
                              setNewWashing({...newWashing, photosBefore: newPhotos});
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Photos APRÈS */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Photos APRÈS
                </label>
                <div className="glass-card p-6 text-center cursor-pointer hover:scale-105 transition-all border-2 border-dashed border-gray-300">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, 'after')}
                    className="hidden"
                    id="photos-after"
                  />
                  <label htmlFor="photos-after" className="cursor-pointer">
                    <Camera className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-700 font-semibold mb-2">Photos APRÈS</p>
                    <p className="text-gray-500 text-sm">Cliquez pour ajouter des photos</p>
                  </label>
                  
                  {newWashing.photosAfter && newWashing.photosAfter.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {newWashing.photosAfter.map((photo, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={photo} 
                            alt={`Après ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <button 
                            onClick={() => {
                              const newPhotos = newWashing.photosAfter.filter((_, i) => i !== index);
                              setNewWashing({...newWashing, photosAfter: newPhotos});
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="p-4 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
              <div className="font-bold mb-2">🔥 Erreur</div>
              <div>{error}</div>
            </div>
          )}
          
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all font-semibold text-gray-700"
            >
              Annuler
            </button>
            <button 
              onClick={handleAddWashing}
              disabled={loading || !newWashing.vehicleId || !newWashing.type}
              className="modern-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Planification...' : '🧽 Planifier le lavage'}
            </button>
          </div>
        </Card>
      )}

      {/* Liste des lavages */}
      <div className="space-y-4">
        {filteredWashings.map((washing) => {
          const vehicle = vehicles.find(v => v.id === washing.vehicleId);
          const employee = employees.find(e => e.id === washing.employeeId);
          const typeInfo = getTypeInfo(washing.type);
          const StatusIcon = getStatusIcon(washing.status);
          
          return (
            <Card key={washing.id} className="hover:shadow-glass-lg transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                
                {/* Info principale */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl bg-gradient-to-r ${typeInfo.color} shadow-lg`}>
                        <span className="text-xl">{typeInfo.icon}</span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-xl font-bold gradient-text">{typeInfo.label}</h4>
                        <p className="text-gray-600 font-medium">
                          {washing.vehiclePlate || vehicle?.plate} - {washing.vehicleBrand || vehicle?.brand} {washing.vehicleModel || vehicle?.model}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`status-badge ${getStatusColor(washing.status)}`}>
                        <StatusIcon size={14} className="mr-1" />
                        {getStatusLabel(washing.status)}
                      </span>
                      
                      <div className="relative">
                        <button 
                          onClick={() => setSelectedWashing(selectedWashing === washing.id ? null : washing.id)}
                          className="p-2 rounded-xl bg-white/50 hover:bg-white/70 transition-all"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {selectedWashing === washing.id && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-glass border border-white/20 py-2 z-10">
                            <button 
                              onClick={() => handleViewDetails(washing)}
                              className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                            >
                              <Eye size={14} />
                              Voir détails
                            </button>
                            <button 
                              onClick={() => handleEditWashing(washing)}
                              className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                            >
                              <Edit size={14} />
                              Modifier
                            </button>
                            <button 
                              onClick={() => handleViewPhotos(washing)}
                              className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                            >
                              <Camera size={14} />
                              Photos
                            </button>
                            {washing.status === 'scheduled' && (
                              <button 
                                onClick={() => handleChangeStatus(washing.id, 'in-progress')}
                                className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                              >
                                <Clock size={14} />
                                Démarrer
                              </button>
                            )}
                            {washing.status === 'in-progress' && (
                              <button 
                                onClick={() => handleChangeStatus(washing.id, 'completed')}
                                className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                              >
                                <CheckCircle size={14} />
                                Terminer
                              </button>
                            )}
                            <hr className="my-2 border-gray-200/50" />
                            <button 
                              onClick={() => handleDeleteWashing(washing.id)}
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
                  
                  {washing.description && (
                    <p className="text-gray-700 mb-4">{washing.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} />
                      <span className="font-medium">
                        {washing.scheduledDate ? new Date(washing.scheduledDate).toLocaleDateString() : 'Date non définie'}
                      </span>
                    </div>
                    
                    {washing.cost && (
                      <div className="flex items-center gap-2 text-green-600">
                        <DollarSign size={16} />
                        <span className="font-bold">{washing.cost}€</span>
                      </div>
                    )}
                    
                    {washing.estimatedDuration && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Clock size={16} />
                        <span className="font-medium">{washing.estimatedDuration}min</span>
                      </div>
                    )}
                    
                    {(washing.employeeName || employee) && (
                      <div className="flex items-center gap-2 text-purple-600">
                        <User size={16} />
                        <span className="font-medium">{washing.employeeName || employee?.name}</span>
                      </div>
                    )}

                    {washing.location && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <MapPin size={16} />
                        <span className="font-medium">
                          {washing.location === 'onsite' ? 'Sur site' :
                           washing.location === 'external' ? 'Externe' :
                           washing.location === 'garage' ? 'Garage' : 'Mobile'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Satisfaction client */}
                  {washing.customerSatisfaction && washing.status === 'completed' && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-sm text-gray-600">Satisfaction:</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, index) => (
                          <button
                            key={index}
                            onClick={() => handleUpdateSatisfaction(washing.id, index + 1)}
                            className={`transition-all ${index < washing.customerSatisfaction ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                          >
                            <Star 
                              size={16}
                              className={index < washing.customerSatisfaction ? 'fill-current' : ''}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        ({washing.customerSatisfaction}/5)
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-32">
                  <button 
                    onClick={() => handleViewDetails(washing)}
                    className="px-4 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 transition-all font-semibold text-blue-700 text-sm flex items-center justify-center gap-1"
                  >
                    <Eye size={16} />
                    Détails
                  </button>
                  
                  <button 
                    onClick={() => handleViewPhotos(washing)}
                    className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 transition-all font-semibold text-purple-700 text-sm flex items-center justify-center gap-1"
                  >
                    <Camera size={16} />
                    Photos
                  </button>
                  
                  {washing.status === 'scheduled' && (
                    <button 
                      onClick={() => handleChangeStatus(washing.id, 'in-progress')}
                      className="px-4 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 transition-all font-semibold text-orange-700 text-sm flex items-center justify-center gap-1"
                    >
                      <Clock size={16} />
                      Démarrer
                    </button>
                  )}
                  
                  {washing.status === 'in-progress' && (
                    <button 
                      onClick={() => handleChangeStatus(washing.id, 'completed')}
                      className="px-4 py-2 rounded-xl bg-green-100 hover:bg-green-200 transition-all font-semibold text-green-700 text-sm flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={16} />
                      Terminer
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Message si aucun lavage */}
      {filteredWashings.length === 0 && !loading && (
        <Card className="text-center p-12">
          <Droplets className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
              ? 'Aucun lavage trouvé' 
              : 'Aucun lavage programmé'
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all'
              ? 'Essayez de modifier vos critères de recherche ou de filtrage.'
              : 'Commencez par planifier votre premier service de lavage.'
            }
          </p>
          {(!searchTerm && filterStatus === 'all' && filterType === 'all') && (
            <button 
              onClick={() => setShowForm(true)}
              className="modern-button"
            >
              <Plus size={20} />
              Planifier le premier lavage
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
      {selectedWashing && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setSelectedWashing(null)}
        />
      )}
    </div>
  );
};

export default WashingService;