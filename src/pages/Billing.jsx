import React, { useState, useEffect } from 'react';
import { 
  Euro,
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Receipt,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  X,
  Save,
  Download,
  Send,
  Car,
  Wrench,
  Droplets
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

const Billing = ({ data, onRefresh }) => {
  const [invoices, setInvoices] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [washings, setWashings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  // États pour les modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [editInvoice, setEditInvoice] = useState({});

  // Formulaire pour nouvelle facture
  const [newInvoice, setNewInvoice] = useState({
    type: 'intervention', // intervention, washing, other
    referenceId: '',
    vehicleId: '',
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    description: '',
    amount: '',
    taxRate: 20,
    notes: ''
  });

  // Statistiques
  const [stats, setStats] = useState({
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    invoiceCount: 0
  });

  // CHARGEMENT DES DONNÉES DEPUIS FIREBASE
  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);
        console.log('🔥 Chargement des factures depuis Firebase...');
        
        // Charger les factures
        const invoicesRef = collection(db, 'billing');
        const invoicesQuery = query(invoicesRef, orderBy('createdAt', 'desc'));
        
        const unsubscribeInvoices = onSnapshot(invoicesQuery, 
          (snapshot) => {
            const invoicesList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('✅ Factures chargées:', invoicesList);
            setInvoices(invoicesList);
            calculateStats(invoicesList);
            setError(null);
          }, 
          (error) => {
            console.error('❌ Erreur lors du chargement des factures:', error);
            setError('Impossible de charger les factures: ' + error.message);
          }
        );

        // Charger les données liées
        const vehiclesRef = collection(db, 'vehicles');
        const unsubscribeVehicles = onSnapshot(vehiclesRef, 
          (snapshot) => {
            const vehiclesList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setVehicles(vehiclesList);
          }
        );

        const interventionsRef = collection(db, 'interventions');
        const unsubscribeInterventions = onSnapshot(interventionsRef, 
          (snapshot) => {
            const interventionsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setInterventions(interventionsList);
          }
        );

        const washingsRef = collection(db, 'washing');
        const unsubscribeWashings = onSnapshot(washingsRef, 
          (snapshot) => {
            const washingsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setWashings(washingsList);
            setLoading(false);
          }
        );

        return () => {
          console.log('🧹 Nettoyage des listeners Firebase');
          unsubscribeInvoices();
          unsubscribeVehicles();
          unsubscribeInterventions();
          unsubscribeWashings();
        };
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation Firebase:', error);
        setError('Erreur de connexion à Firebase: ' + error.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calcul des statistiques
  const calculateStats = (invoicesList) => {
    const totalAmount = invoicesList.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    const paidAmount = invoicesList
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    const pendingAmount = invoicesList
      .filter(invoice => invoice.status === 'pending')
      .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
    
    // Factures en retard (plus de 30 jours)
    const overdueAmount = invoicesList
      .filter(invoice => {
        if (invoice.status !== 'pending') return false;
        const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : new Date(invoice.createdAt?.toDate());
        const today = new Date();
        const diffDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        return diffDays > 30;
      })
      .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

    setStats({
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      invoiceCount: invoicesList.length
    });
  };

  // Filtrage et recherche
  useEffect(() => {
    let filtered = [...invoices];

    // Recherche par texte
    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(invoice => {
        const searchLower = searchTerm.toLowerCase();
        return (invoice.invoiceNumber || '').toLowerCase().includes(searchLower) ||
               (invoice.clientName || '').toLowerCase().includes(searchLower) ||
               (invoice.description || '').toLowerCase().includes(searchLower) ||
               (invoice.vehiclePlate || '').toLowerCase().includes(searchLower);
      });
    }

    // Filtrage par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === filterStatus);
    }

    // Filtrage par type
    if (filterType !== 'all') {
      filtered = filtered.filter(invoice => invoice.type === filterType);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          const dateA = a.createdAt ? new Date(a.createdAt.toDate()) : new Date();
          const dateB = b.createdAt ? new Date(b.createdAt.toDate()) : new Date();
          return dateB.getTime() - dateA.getTime();
          
        case 'amount':
          return (b.totalAmount || 0) - (a.totalAmount || 0);
          
        case 'client':
          return (a.clientName || '').localeCompare(b.clientName || '');
          
        case 'dueDate':
          const dueDateA = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          const dueDateB = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          return dueDateA.getTime() - dueDateB.getTime();
          
        default:
          return 0;
      }
    });

    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, filterStatus, filterType, sortBy]);

  // FONCTION POUR AJOUTER UNE FACTURE
  const handleAddInvoice = async () => {
    setError(null);
    setLoading(true);
    
    try {
      console.log('🔥 Ajout facture à Firebase:', newInvoice);
      
      // Validation
      if (!newInvoice.clientName.trim()) {
        throw new Error('Le nom du client est obligatoire');
      }
      if (!newInvoice.description.trim()) {
        throw new Error('La description est obligatoire');
      }
      if (!newInvoice.amount || parseFloat(newInvoice.amount) <= 0) {
        throw new Error('Le montant doit être supérieur à 0');
      }
      
      // Générer un numéro de facture
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;
      
      // Calculer les montants
      const baseAmount = parseFloat(newInvoice.amount);
      const taxAmount = (baseAmount * parseFloat(newInvoice.taxRate)) / 100;
      const totalAmount = baseAmount + taxAmount;
      
      // Date d'échéance (30 jours par défaut)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      // Récupérer les infos complémentaires selon le type
      let additionalData = {};
      if (newInvoice.type === 'intervention' && newInvoice.referenceId) {
        const intervention = interventions.find(i => i.id === newInvoice.referenceId);
        if (intervention) {
          additionalData = {
            vehicleId: intervention.vehicleId,
            vehiclePlate: intervention.vehiclePlate,
            vehicleBrand: intervention.vehicleBrand,
            vehicleModel: intervention.vehicleModel,
            interventionType: intervention.type
          };
        }
      } else if (newInvoice.type === 'washing' && newInvoice.referenceId) {
        const washing = washings.find(w => w.id === newInvoice.referenceId);
        if (washing) {
          additionalData = {
            vehicleId: washing.vehicleId,
            vehiclePlate: washing.vehiclePlate,
            vehicleBrand: washing.vehicleBrand,
            vehicleModel: washing.vehicleModel,
            washingType: washing.type
          };
        }
      } else if (newInvoice.vehicleId) {
        const vehicle = vehicles.find(v => v.id === newInvoice.vehicleId);
        if (vehicle) {
          additionalData = {
            vehicleId: vehicle.id,
            vehiclePlate: vehicle.plate,
            vehicleBrand: vehicle.brand,
            vehicleModel: vehicle.model
          };
        }
      }
      
      const invoiceData = {
        invoiceNumber,
        type: newInvoice.type,
        referenceId: newInvoice.referenceId || null,
        clientName: newInvoice.clientName.trim(),
        clientEmail: newInvoice.clientEmail.trim(),
        clientAddress: newInvoice.clientAddress.trim(),
        description: newInvoice.description.trim(),
        baseAmount,
        taxRate: parseFloat(newInvoice.taxRate),
        taxAmount,
        totalAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pending',
        notes: newInvoice.notes.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...additionalData
      };

      // Ajouter à Firebase
      const invoicesRef = collection(db, 'billing');
      const docRef = await addDoc(invoicesRef, invoiceData);
      
      console.log('✅ Facture ajoutée avec succès! ID:', docRef.id);
      
      // Reset du formulaire
      setNewInvoice({
        type: 'intervention',
        referenceId: '',
        vehicleId: '',
        clientName: '',
        clientEmail: '',
        clientAddress: '',
        description: '',
        amount: '',
        taxRate: 20,
        notes: ''
      });
      
      setShowAddForm(false);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la facture:', error);
      setError(error.message || 'Erreur lors de l\'ajout de la facture');
    } finally {
      setLoading(false);
    }
  };

  // FONCTION POUR VOIR LES DÉTAILS
  const handleViewDetails = (invoice) => {
    setCurrentInvoice(invoice);
    setShowDetailsModal(true);
    setSelectedInvoice(null);
  };

  // FONCTION POUR MODIFIER
  const handleEditInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    setEditInvoice({ ...invoice });
    setShowEditModal(true);
    setSelectedInvoice(null);
  };

  // FONCTION POUR MARQUER COMME PAYÉE
  const handleMarkAsPaid = async (invoiceId) => {
    try {
      const invoiceRef = doc(db, 'billing', invoiceId);
      await updateDoc(invoiceRef, {
        status: 'paid',
        paidAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Facture marquée comme payée');
      setSelectedInvoice(null);
    } catch (error) {
      console.error('❌ Erreur lors du marquage:', error);
      setError('Impossible de marquer la facture comme payée: ' + error.message);
    }
  };

  // FONCTION POUR SUPPRIMER
  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'billing', invoiceId));
      console.log('✅ Facture supprimée avec succès');
      setSelectedInvoice(null);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      setError('Impossible de supprimer la facture: ' + error.message);
    }
  };

  // Fonctions utilitaires
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'intervention': return 'bg-orange-100 text-orange-800';
      case 'washing': return 'bg-blue-100 text-blue-800';
      case 'other': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'intervention': return <Wrench size={14} />;
      case 'washing': return <Droplets size={14} />;
      case 'other': return <FileText size={14} />;
      default: return <Receipt size={14} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'paid': return 'Payée';
      case 'overdue': return 'En retard';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'intervention': return 'Intervention';
      case 'washing': return 'Lavage';
      case 'other': return 'Autre';
      default: return type;
    }
  };

  const isOverdue = (invoice) => {
    if (invoice.status !== 'pending') return false;
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : new Date(invoice.createdAt?.toDate());
    const today = new Date();
    return today > dueDate;
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600">
              <Euro className="text-white" size={24} />
            </div>
            <div>
              <p className="text-gray-600 font-medium">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalAmount.toFixed(2)}€</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-600">
              <CheckCircle className="text-white" size={24} />
            </div>
            <div>
              <p className="text-gray-600 font-medium">Montant payé</p>
              <p className="text-2xl font-bold text-gray-800">{stats.paidAmount.toFixed(2)}€</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-600">
              <Clock className="text-white" size={24} />
            </div>
            <div>
              <p className="text-gray-600 font-medium">En attente</p>
              <p className="text-2xl font-bold text-gray-800">{stats.pendingAmount.toFixed(2)}€</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600">
              <AlertCircle className="text-white" size={24} />
            </div>
            <div>
              <p className="text-gray-600 font-medium">En retard</p>
              <p className="text-2xl font-bold text-gray-800">{stats.overdueAmount.toFixed(2)}€</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Header avec contrôles */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Facturation</h2>
          <p className="text-gray-600 font-medium">
            {filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''} 
            {(filterStatus !== 'all' || filterType !== 'all') && ' (filtrées)'}
            {loading && ' - Chargement...'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une facture..."
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
            <option value="paid">Payées</option>
            <option value="overdue">En retard</option>
            <option value="cancelled">Annulées</option>
          </select>
          
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-modern"
          >
            <option value="all">Tous les types</option>
            <option value="intervention">Interventions</option>
            <option value="washing">Lavages</option>
            <option value="other">Autres</option>
          </select>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-modern"
          >
            <option value="createdAt">Trier par date</option>
            <option value="amount">Trier par montant</option>
            <option value="client">Trier par client</option>
            <option value="dueDate">Trier par échéance</option>
          </select>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="modern-button whitespace-nowrap"
            disabled={loading}
          >
            <Plus size={20} />
            Nouvelle facture
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
            <h3 className="text-xl font-bold gradient-text">Nouvelle Facture</h3>
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
                Type de facture *
              </label>
              <select
                value={newInvoice.type}
                onChange={(e) => setNewInvoice({...newInvoice, type: e.target.value, referenceId: ''})}
                className="input-modern"
                required
              >
                <option value="intervention">Intervention technique</option>
                <option value="washing">Service de lavage</option>
                <option value="other">Autre service</option>
              </select>
            </div>
            
            {newInvoice.type === 'intervention' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Intervention liée
                </label>
                <select
                  value={newInvoice.referenceId}
                  onChange={(e) => setNewInvoice({...newInvoice, referenceId: e.target.value})}
                  className="input-modern"
                >
                  <option value="">Sélectionner une intervention</option>
                  {interventions
                    .filter(i => i.status === 'completed')
                    .map(intervention => (
                      <option key={intervention.id} value={intervention.id}>
                        {intervention.vehiclePlate} - {intervention.type} ({intervention.estimatedCost}€)
                      </option>
                    ))}
                </select>
              </div>
            )}
            
            {newInvoice.type === 'washing' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lavage lié
                </label>
                <select
                  value={newInvoice.referenceId}
                  onChange={(e) => setNewInvoice({...newInvoice, referenceId: e.target.value})}
                  className="input-modern"
                >
                  <option value="">Sélectionner un lavage</option>
                  {washings
                    .filter(w => w.status === 'completed')
                    .map(washing => (
                      <option key={washing.id} value={washing.id}>
                        {washing.vehiclePlate} - {washing.type} ({washing.cost}€)
                      </option>
                    ))}
                </select>
              </div>
            )}
            
            {newInvoice.type === 'other' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Véhicule concerné
                </label>
                <select
                  value={newInvoice.vehicleId}
                  onChange={(e) => setNewInvoice({...newInvoice, vehicleId: e.target.value})}
                  className="input-modern"
                >
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.brand} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du client *
              </label>
              <input
                type="text"
                value={newInvoice.clientName}
                onChange={(e) => setNewInvoice({...newInvoice, clientName: e.target.value})}
                className="input-modern"
                placeholder="Nom de l'entreprise ou particulier"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email du client
              </label>
              <input
                type="email"
                value={newInvoice.clientEmail}
                onChange={(e) => setNewInvoice({...newInvoice, clientEmail: e.target.value})}
                className="input-modern"
                placeholder="email@client.com"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse du client
              </label>
              <textarea
                value={newInvoice.clientAddress}
                onChange={(e) => setNewInvoice({...newInvoice, clientAddress: e.target.value})}
                className="input-modern"
                rows="2"
                placeholder="Adresse complète du client"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description du service *
              </label>
              <textarea
                value={newInvoice.description}
                onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                className="input-modern"
                rows="3"
                placeholder="Description détaillée du service facturé..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Montant HT (€) *
              </label>
              <input
                type="number"
                value={newInvoice.amount}
                onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                className="input-modern"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Taux de TVA (%)
              </label>
              <input
                type="number"
                value={newInvoice.taxRate}
                onChange={(e) => setNewInvoice({...newInvoice, taxRate: e.target.value})}
                className="input-modern"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes internes
              </label>
              <textarea
                value={newInvoice.notes}
                onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
                className="input-modern"
                rows="2"
                placeholder="Notes internes (non visibles sur la facture)"
              />
            </div>
          </div>
          
          {/* Aperçu des montants */}
          {newInvoice.amount && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-gray-800 mb-3">Aperçu des montants</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Montant HT:</span>
                  <span>{parseFloat(newInvoice.amount || 0).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA ({newInvoice.taxRate}%):</span>
                  <span>{((parseFloat(newInvoice.amount || 0) * parseFloat(newInvoice.taxRate)) / 100).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total TTC:</span>
                  <span>{(parseFloat(newInvoice.amount || 0) * (1 + parseFloat(newInvoice.taxRate) / 100)).toFixed(2)}€</span>
                </div>
              </div>
            </div>
          )}
          
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
              onClick={handleAddInvoice}
              disabled={loading || !newInvoice.clientName || !newInvoice.description || !newInvoice.amount}
              className="modern-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 Création...' : '📄 Créer la facture'}
            </button>
          </div>
        </Card>
      )}

      {/* Liste des factures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id} className="invoice-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                  <Receipt className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold gradient-text">{invoice.invoiceNumber}</h3>
                  <p className="text-gray-600 font-medium">{invoice.clientName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTypeColor(invoice.type)}`}>
                  {getTypeIcon(invoice.type)}
                  {getTypeText(invoice.type)}
                </span>
                
                <div className="relative">
                  <button 
                    onClick={() => setSelectedInvoice(selectedInvoice === invoice.id ? null : invoice.id)}
                    className="p-2 rounded-xl bg-white/50 hover:bg-white/70 transition-all"
                  >
                    <Receipt size={16} />
                  </button>
                  
                  {selectedInvoice === invoice.id && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-md rounded-xl shadow-glass border border-white/20 py-2 z-10">
                      <button 
                        onClick={() => handleViewDetails(invoice)}
                        className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                      >
                        <Eye size={14} />
                        Voir détails
                      </button>
                      <button 
                        onClick={() => handleEditInvoice(invoice)}
                        className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                      >
                        <Edit size={14} />
                        Modifier
                      </button>
                      {invoice.status === 'pending' && (
                        <button 
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          className="w-full px-4 py-2 text-left hover:bg-white/50 transition-all flex items-center gap-3 text-sm"
                        >
                          <CheckCircle size={14} />
                          Marquer payée
                        </button>
                      )}
                      <hr className="my-2 border-gray-200/50" />
                      <button 
                        onClick={() => handleDeleteInvoice(invoice.id)}
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
            
            {/* Statut et montant */}
            <div className="flex items-center justify-between mb-4">
              <span className={`status-badge ${getStatusColor(isOverdue(invoice) ? 'overdue' : invoice.status)}`}>
                {getStatusText(isOverdue(invoice) ? 'overdue' : invoice.status)}
              </span>
              <span className="text-2xl font-bold text-gray-800">
                {invoice.totalAmount?.toFixed(2)}€
              </span>
            </div>
            
            {/* Informations */}
            <div className="space-y-3 mb-4">
              {invoice.vehiclePlate && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                  <span className="text-gray-700 flex items-center gap-2 font-medium">
                    <Car size={16} />
                    Véhicule
                  </span>
                  <span className="font-bold text-gray-800">
                    {invoice.vehiclePlate}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/50">
                <span className="text-gray-700 flex items-center gap-2 font-medium">
                  <Calendar size={16} />
                  Échéance
                </span>
                <span className="font-bold text-gray-800">
                  {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Non définie'}
                </span>
              </div>
            </div>
            
            {/* Description */}
            <div className="p-3 rounded-xl bg-gray-50 mb-4">
              <p className="text-gray-700 text-sm line-clamp-2">
                {invoice.description}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button 
                onClick={() => handleViewDetails(invoice)}
                className="flex-1 p-3 rounded-xl bg-white/70 hover:bg-white transition-all font-semibold text-gray-700 text-sm"
              >
                Détails
              </button>
              {invoice.status === 'pending' && (
                <button 
                  onClick={() => handleMarkAsPaid(invoice.id)}
                  className="flex-1 p-3 rounded-xl bg-green-100 hover:bg-green-200 transition-all font-semibold text-green-700 text-sm"
                >
                  Payée
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Message si aucune facture */}
      {filteredInvoices.length === 0 && !loading && (
        <Card className="text-center p-12">
          <Receipt className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
              ? 'Aucune facture trouvée' 
              : 'Aucune facture créée'
            }
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all'
              ? 'Essayez de modifier vos critères de recherche ou de filtrage.'
              : 'Commencez par créer votre première facture.'
            }
          </p>
          {(!searchTerm && filterStatus === 'all' && filterType === 'all') && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="modern-button"
            >
              <Plus size={20} />
              Créer une facture
            </button>
          )}
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card className="text-center p-12">
          <div className="animate-spin mx-auto mb-4 w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-600">🔥 Connexion à Firebase...</p>
        </Card>
      )}

      {/* Click outside pour fermer les menus */}
      {selectedInvoice && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

export default Billing;