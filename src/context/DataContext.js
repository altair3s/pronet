// context/DataContext.js
// Contexte pour gérer les données Firebase (remplace l'ancien système Google Sheets)

import React, { createContext, useContext, useState, useEffect } from 'react';
import FirebaseService from '../services/firebaseService';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData doit être utilisé dans un DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    vehicles: [],
    services: [],
    washing: [],
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

  // Fonction pour charger toutes les données (remplace loadAllData)
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Chargement des données depuis Firebase...');
      
      const firebaseData = await FirebaseService.getMockData();
      setData(firebaseData);
      
      console.log('✅ Données chargées avec succès:', firebaseData);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      setError('Impossible de charger les données depuis Firebase');
      
      // Garder les données précédentes en cas d'erreur
      setData(prevData => ({
        ...prevData,
        // On peut ajouter un flag d'erreur ici si nécessaire
      }));
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au démarrage
  useEffect(() => {
    loadAllData();
  }, []);

  // Écouter les changements en temps réel
  useEffect(() => {
    let unsubscribe = null;
    
    try {
      console.log('🔄 Configuration de l\'écoute en temps réel...');
      unsubscribe = FirebaseService.subscribeToAllData((newData) => {
        console.log('🔄 Données mises à jour en temps réel:', newData);
        setData(newData);
        setError(null); // Clear error si les données arrivent
      });
    } catch (error) {
      console.error('❌ Erreur lors de la configuration de l\'écoute temps réel:', error);
    }

    // Nettoyer l'écoute au démontage
    return () => {
      if (unsubscribe) {
        console.log('🧹 Nettoyage de l\'écoute Firebase');
        unsubscribe();
      }
    };
  }, []);

  // Fonction pour rafraîchir manuellement
  const refreshData = async () => {
    await loadAllData();
  };

  // Fonction pour ajouter un véhicule
  const addVehicle = async (vehicleData) => {
    try {
      const newVehicle = await FirebaseService.addVehicle(vehicleData);
      console.log('✅ Véhicule ajouté:', newVehicle);
      // Les données seront mises à jour automatiquement via l'écoute temps réel
      return newVehicle;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du véhicule:', error);
      throw error;
    }
  };

  // Fonction pour ajouter un service
  const addService = async (serviceData) => {
    try {
      const newService = await FirebaseService.addService(serviceData);
      console.log('✅ Service ajouté:', newService);
      return newService;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du service:', error);
      throw error;
    }
  };

  // Fonction pour ajouter un lavage
  const addWashing = async (washingData) => {
    try {
      const newWashing = await FirebaseService.addWashing(washingData);
      console.log('✅ Lavage ajouté:', newWashing);
      return newWashing;
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du lavage:', error);
      throw error;
    }
  };

  // Fonction pour mettre à jour un document
  const updateDocument = async (collection, docId, updates) => {
    try {
      await FirebaseService.updateDocument(collection, docId, updates);
      console.log(`✅ Document ${docId} mis à jour dans ${collection}`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de la mise à jour du document ${docId}:`, error);
      throw error;
    }
  };

  // Fonction pour supprimer un document
  const deleteDocument = async (collection, docId) => {
    try {
      await FirebaseService.deleteDocument(collection, docId);
      console.log(`✅ Document ${docId} supprimé de ${collection}`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression du document ${docId}:`, error);
      throw error;
    }
  };

  const contextValue = {
    // Données
    data,
    loading,
    error,
    
    // Actions
    loadAllData,
    refreshData,
    addVehicle,
    addService,
    addWashing,
    updateDocument,
    deleteDocument,
    
    // Utilitaires
    isConnected: !loading && !error,
    isEmpty: !loading && data.vehicles.length === 0 && data.services.length === 0,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;