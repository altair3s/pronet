// services/firebaseService.js
// Version ROBUSTE qui évite les erreurs undefined

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  where,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

class FirebaseService {
  
  // Fonction utilitaire pour nettoyer et valider les données véhicules
  static sanitizeVehicleData(vehicleData) {
    return {
      id: vehicleData.id || '',
      plate: (vehicleData.plate || '').toString().trim().toUpperCase(),
      brand: (vehicleData.brand || '').toString().trim(),
      model: (vehicleData.model || '').toString().trim(),
      year: parseInt(vehicleData.year) || new Date().getFullYear(),
      km: parseInt(vehicleData.km) || 0,
      fuelType: vehicleData.fuelType || 'Diesel',
      status: vehicleData.status || 'active',
      nextMaintenance: vehicleData.nextMaintenance || null,
      insuranceExpiry: vehicleData.insuranceExpiry || null,
      technicalControlExpiry: vehicleData.technicalControlExpiry || null,
      notes: (vehicleData.notes || '').toString().trim(),
      createdAt: vehicleData.createdAt || new Date(),
      updatedAt: vehicleData.updatedAt || new Date()
    };
  }

  // Fonction utilitaire pour nettoyer les données de service
  static sanitizeServiceData(serviceData) {
    return {
      id: serviceData.id || '',
      vehicleId: serviceData.vehicleId || '',
      type: (serviceData.type || '').toString().trim(),
      description: (serviceData.description || '').toString().trim(),
      status: serviceData.status || 'pending',
      cost: parseFloat(serviceData.cost) || 0,
      date: serviceData.date || new Date().toISOString().split('T')[0],
      createdAt: serviceData.createdAt || new Date(),
      updatedAt: serviceData.updatedAt || new Date()
    };
  }

  // Fonction utilitaire pour nettoyer les données de lavage
  static sanitizeWashingData(washingData) {
    return {
      id: washingData.id || '',
      vehicleId: washingData.vehicleId || '',
      type: (washingData.type || '').toString().trim(),
      status: washingData.status || 'completed',
      cost: parseFloat(washingData.cost) || 0,
      date: washingData.date || new Date().toISOString().split('T')[0],
      createdAt: washingData.createdAt || new Date(),
      updatedAt: washingData.updatedAt || new Date()
    };
  }

  // ========================================
  // VEHICLES (Véhicules)
  // ========================================
  
  static async getAllVehicles() {
    try {
      const vehiclesRef = collection(db, 'vehicles');
      const q = query(vehiclesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const vehicles = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return this.sanitizeVehicleData({
          id: doc.id,
          ...data
        });
      });

      console.log('✅ Véhicules chargés et nettoyés:', vehicles);
      return vehicles;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des véhicules:', error);
      return []; // Retourner un tableau vide au lieu de null
    }
  }

  static async addVehicle(vehicleData) {
    try {
      const vehiclesRef = collection(db, 'vehicles');
      
      // Nettoyer et valider les données avant sauvegarde
      const cleanData = this.sanitizeVehicleData({
        ...vehicleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Supprimer l'ID temporaire
      delete cleanData.id;

      const docRef = await addDoc(vehiclesRef, cleanData);
      
      console.log('✅ Véhicule ajouté avec ID:', docRef.id);
      
      return this.sanitizeVehicleData({
        id: docRef.id,
        ...cleanData
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du véhicule:', error);
      throw error;
    }
  }

  // ========================================
  // SERVICES/INTERVENTIONS
  // ========================================
  
  static async getAllServices() {
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const services = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return this.sanitizeServiceData({
          id: doc.id,
          ...data
        });
      });

      console.log('✅ Services chargés et nettoyés:', services);
      return services;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des services:', error);
      return [];
    }
  }

  static async addService(serviceData) {
    try {
      const servicesRef = collection(db, 'services');
      
      const cleanData = this.sanitizeServiceData({
        ...serviceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      delete cleanData.id;
      const docRef = await addDoc(servicesRef, cleanData);
      
      console.log('✅ Service ajouté avec ID:', docRef.id);
      
      return this.sanitizeServiceData({
        id: docRef.id,
        ...cleanData
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du service:', error);
      throw error;
    }
  }

  // ========================================
  // WASHING (Lavages)
  // ========================================
  
  static async getAllWashing() {
    try {
      const washingRef = collection(db, 'washing');
      const q = query(washingRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const washing = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return this.sanitizeWashingData({
          id: doc.id,
          ...data
        });
      });

      console.log('✅ Lavages chargés et nettoyés:', washing);
      return washing;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des lavages:', error);
      return [];
    }
  }

  static async addWashing(washingData) {
    try {
      const washingRef = collection(db, 'washing');
      
      const cleanData = this.sanitizeWashingData({
        ...washingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      delete cleanData.id;
      const docRef = await addDoc(washingRef, cleanData);
      
      console.log('✅ Lavage ajouté avec ID:', docRef.id);
      
      return this.sanitizeWashingData({
        id: docRef.id,
        ...cleanData
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du lavage:', error);
      throw error;
    }
  }

  // ========================================
  // DONNÉES MOCKÉES ROBUSTES
  // ========================================
  
  static async getMockData() {
    try {
      console.log('🔥 Chargement des données Firebase avec validation...');
      
      // Charger toutes les données en parallèle
      const [vehicles, services, washing] = await Promise.all([
        this.getAllVehicles(),
        this.getAllServices(),
        this.getAllWashing()
      ]);

      // S'assurer que tous les tableaux existent
      const safeVehicles = Array.isArray(vehicles) ? vehicles : [];
      const safeServices = Array.isArray(services) ? services : [];
      const safeWashing = Array.isArray(washing) ? washing : [];

      // Calculer les statistiques de manière sécurisée
      const stats = {
        totalVehicles: safeVehicles.length,
        activeVehicles: safeVehicles.filter(v => v.status === 'active').length,
        maintenanceVehicles: safeVehicles.filter(v => v.status === 'maintenance').length,
        totalServices: safeServices.length,
        pendingServices: safeServices.filter(s => s.status === 'pending').length,
        completedServices: safeServices.filter(s => s.status === 'completed').length,
        totalWashing: safeWashing.length
      };

      const mockData = {
        vehicles: safeVehicles,
        services: safeServices,
        interventions: safeServices, // Alias pour compatibilité
        washing: safeWashing,
        washings: safeWashing, // Alias pour compatibilité
        billing: [], // À implémenter plus tard
        stats
      };

      console.log('✅ Données Firebase validées et chargées:', mockData);
      return mockData;
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données Firebase:', error);
      
      // Retourner des données sécurisées même en cas d'erreur
      return {
        vehicles: [],
        services: [],
        interventions: [],
        washing: [],
        washings: [],
        billing: [],
        stats: {
          totalVehicles: 0,
          activeVehicles: 0,
          maintenanceVehicles: 0,
          totalServices: 0,
          pendingServices: 0,
          completedServices: 0,
          totalWashing: 0
        }
      };
    }
  }

  // ========================================
  // DONNÉES EN TEMPS RÉEL SÉCURISÉES
  // ========================================
  
  static subscribeToAllData(callback) {
    try {
      const vehiclesRef = collection(db, 'vehicles');
      const servicesRef = collection(db, 'services');
      const washingRef = collection(db, 'washing');

      // Fonction helper pour gérer les mises à jour
      const handleUpdate = async () => {
        try {
          const newData = await this.getMockData();
          callback(newData);
        } catch (error) {
          console.error('❌ Erreur lors de la mise à jour temps réel:', error);
          // Ne pas appeler callback en cas d'erreur pour éviter les crashes
        }
      };

      // Écouter les changements sur toutes les collections
      const unsubscribeVehicles = onSnapshot(vehiclesRef, handleUpdate, (error) => {
        console.error('❌ Erreur véhicules temps réel:', error);
      });

      const unsubscribeServices = onSnapshot(servicesRef, handleUpdate, (error) => {
        console.error('❌ Erreur services temps réel:', error);
      });

      const unsubscribeWashing = onSnapshot(washingRef, handleUpdate, (error) => {
        console.error('❌ Erreur lavages temps réel:', error);
      });

      // Retourner une fonction pour nettoyer tous les listeners
      return () => {
        try {
          unsubscribeVehicles();
          unsubscribeServices();
          unsubscribeWashing();
          console.log('🧹 Nettoyage des listeners Firebase terminé');
        } catch (error) {
          console.error('❌ Erreur lors du nettoyage des listeners:', error);
        }
      };
    } catch (error) {
      console.error('❌ Erreur lors de la configuration de l\'écoute temps réel:', error);
      return () => {}; // Fonction vide en cas d'erreur
    }
  }

  // ========================================
  // MÉTHODES UTILITAIRES SÉCURISÉES
  // ========================================
  
  static async updateDocument(collection_name, docId, updates) {
    try {
      if (!docId || !collection_name) {
        throw new Error('ID du document et nom de collection requis');
      }

      const docRef = doc(db, collection_name, docId);
      const safeUpdates = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, safeUpdates);
      console.log(`✅ Document ${docId} mis à jour dans ${collection_name}`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de la mise à jour du document ${docId}:`, error);
      throw error;
    }
  }

  static async deleteDocument(collection_name, docId) {
    try {
      if (!docId || !collection_name) {
        throw new Error('ID du document et nom de collection requis');
      }

      const docRef = doc(db, collection_name, docId);
      await deleteDoc(docRef);
      console.log(`✅ Document ${docId} supprimé de ${collection_name}`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression du document ${docId}:`, error);
      throw error;
    }
  }

  // ========================================
  // COMPATIBILITÉ AVEC L'ANCIEN SYSTÈME
  // ========================================
  
  static async getVehicles() {
    return this.getAllVehicles();
  }

  static async getServices() {
    return this.getAllServices();
  }

  static async getWashing() {
    return this.getAllWashing();
  }

  // Méthode pour créer des données de test sécurisées
  static async createSampleData() {
    try {
      console.log('🔧 Création de données de test...');
      
      const sampleVehicle = {
        plate: 'TEST-123',
        brand: 'Renault',
        model: 'Kangoo',
        year: 2022,
        km: 15000,
        fuelType: 'Diesel',
        status: 'active',
        nextMaintenance: '2024-08-15',
        notes: 'Véhicule de test Firebase'
      };

      const result = await this.addVehicle(sampleVehicle);
      console.log('✅ Données de test créées avec succès:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Erreur lors de la création des données de test:', error);
      throw error;
    }
  }
}

export default FirebaseService;