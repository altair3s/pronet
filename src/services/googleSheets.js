// Service d'intégration avec Google Sheets
// Remplacez ces constantes par vos vraies valeurs
const SHEET_ID = process.env.REACT_APP_GOOGLE_SHEET_ID || 'your-sheet-id';
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || 'your-api-key';
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// Configuration des feuilles
const SHEETS_CONFIG = {
  VEHICLES: 'Vehicles',
  INTERVENTIONS: 'Interventions',
  WASHINGS: 'Washings',
  BILLING: 'Billing',
  USERS: 'Users'
};

// Format attendu pour chaque type de données
const DATA_SCHEMAS = {
  VEHICLE: {
    id: 'number',
    plate: 'string',
    model: 'string',
    brand: 'string',
    year: 'number',
    km: 'number',
    nextMaintenance: 'date',
    status: 'string', // active, maintenance, inactive
    fuelType: 'string',
    insuranceExpiry: 'date',
    technicalControlExpiry: 'date',
    notes: 'string'
  },
  INTERVENTION: {
    id: 'number',
    vehicleId: 'number',
    type: 'string', // tires, oil, battery, lights, coolant, adblue, other
    description: 'string',
    date: 'date',
    cost: 'number',
    status: 'string', // pending, in-progress, completed, cancelled
    technicianId: 'number',
    parts: 'string', // JSON array of parts used
    duration: 'number', // in minutes
    nextMaintenanceKm: 'number',
    notes: 'string',
    photos: 'string' // JSON array of photo URLs
  },
  WASHING: {
    id: 'number',
    vehicleId: 'number',
    type: 'string', // complete, interior, exterior, premium
    description: 'string',
    date: 'date',
    cost: 'number',
    status: 'string', // scheduled, in-progress, completed, cancelled
    employeeId: 'number',
    photosBefore: 'string', // JSON array of photo URLs
    photosAfter: 'string', // JSON array of photo URLs
    duration: 'number', // in minutes
    notes: 'string',
    customerSatisfaction: 'number' // 1-5 rating
  },
  BILLING: {
    id: 'number',
    invoiceNumber: 'string',
    vehicleId: 'number',
    serviceType: 'string', // intervention, washing
    serviceId: 'number',
    clientName: 'string',
    clientEmail: 'string',
    amount: 'number',
    vat: 'number',
    totalAmount: 'number',
    date: 'date',
    dueDate: 'date',
    status: 'string', // draft, sent, paid, overdue, cancelled
    paymentMethod: 'string',
    paymentDate: 'date',
    notes: 'string'
  }
};

class GoogleSheetsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Fonction utilitaire pour construire l'URL de l'API
  buildApiUrl(sheetName, range = 'A:Z') {
    return `${BASE_URL}/${SHEET_ID}/values/${sheetName}!${range}?key=${API_KEY}`;
  }

  // Fonction utilitaire pour les headers de requête
  getHeaders(method = 'GET') {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (method !== 'GET') {
      headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
    }
    
    return headers;
  }

  // Récupération du token d'accès OAuth2
  async getAccessToken() {
    try {
      console.log('Checking for existing access token...');
      const token = localStorage.getItem('google_access_token');
      const expiry = localStorage.getItem('google_token_expiry');
      
      if (token && expiry && new Date(expiry) > new Date()) {
        console.log('Using existing valid access token');
        return token;
      }

      console.log('No valid token found, initiating OAuth flow');
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(process.env.REACT_APP_GOOGLE_CLIENT_ID)}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
        `response_type=token&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/spreadsheets')}&` +
        `include_granted_scopes=true&` +
        `state=pass-through-value`;

      console.log('Opening auth window with URL:', authUrl);
      const authWindow = window.open(authUrl, 'google_auth', 'width=500,height=600');
      
      if (!authWindow) {
        throw new Error('Popup window blocked. Please allow popups for this site.');
      }

      return new Promise((resolve, reject) => {
        console.log('Waiting for OAuth response...');
        const checkPopup = setInterval(() => {
          try {
            if (authWindow.closed) {
              clearInterval(checkPopup);
              console.error('User closed authentication window');
              reject(new Error('Authentication window closed by user'));
            }
            
            if (authWindow.location.href.includes(window.location.origin)) {
              console.log('Received OAuth response');
              const url = new URL(authWindow.location.href);
              
              const token = url.hash.split('&').find(p => p.startsWith('access_token='))?.split('=')[1];
              const expiresIn = url.hash.split('&').find(p => p.startsWith('expires_in='))?.split('=')[1];
              
              if (!token || !expiresIn) {
                throw new Error('Invalid OAuth response - missing token or expiry');
              }

              console.log('Storing new access token');
              localStorage.setItem('google_access_token', token);
              localStorage.setItem('google_token_expiry', 
                new Date(Date.now() + expiresIn * 1000).toISOString());
              
              authWindow.close();
              clearInterval(checkPopup);
              resolve(token);
            }
          } catch (e) {
            clearInterval(checkPopup);
            authWindow.close();
            console.error('Error during OAuth flow:', e);
            reject(new Error(`Authentication failed: ${e.message}`));
          }
        }, 100);
      });
    } catch (error) {
      console.error('Detailed error in getAccessToken:', {
        error: error.message,
        stack: error.stack,
        time: new Date().toISOString()
      });
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  // Cache management
  getCacheKey(method, params) {
    return `${method}_${JSON.stringify(params)}`;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clearCache() {
    this.cache.clear();
  }

  // Transformation des données brutes en objets structurés
  transformRowsToObjects(rows, schema) {
    if (!rows || rows.length < 2) return [];
    
    const headers = rows[0];
    const dataRows = rows.slice(1);
    
    return dataRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        const value = row[index] || '';
        const fieldType = schema[header] || 'string';
        
        obj[header] = this.parseValue(value, fieldType);
      });
      return obj;
    });
  }

  // Parse des valeurs selon leur type
  parseValue(value, type) {
    if (!value || value === '') return null;
    
    switch (type) {
      case 'number':
        return parseFloat(value) || 0;
      case 'date':
        return new Date(value).toISOString().split('T')[0];
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      default:
        return value.toString();
    }
  }

  // Formatage des valeurs pour l'écriture
  formatValue(value, type) {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString('fr-FR');
      case 'json':
        return JSON.stringify(value);
      case 'boolean':
        return value ? 'true' : 'false';
      default:
        return value.toString();
    }
  }

  // **LECTURE DES DONNÉES**

  // Récupérer tous les véhicules
  async fetchVehicles() {
    const cacheKey = this.getCacheKey('fetchVehicles');
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const url = this.buildApiUrl(SHEETS_CONFIG.VEHICLES);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.values || data.values.length < 2) {
        throw new Error('No vehicle data found in sheet');
      }
      
      const vehicles = this.transformRowsToObjects(data.values, DATA_SCHEMAS.VEHICLE);
      this.setCache(cacheKey, vehicles);
      return vehicles;
    } catch (error) {
      console.error('Erreur lors de la récupération des véhicules:', error);
      throw new Error('Impossible de charger les données des véhicules depuis Google Sheets');
    }
  }

  // Récupérer toutes les interventions
  async fetchInterventions() {
    const cacheKey = this.getCacheKey('fetchInterventions');
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const url = this.buildApiUrl(SHEETS_CONFIG.INTERVENTIONS);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.values || data.values.length < 2) {
        throw new Error('No intervention data found in sheet');
      }
      
      const interventions = this.transformRowsToObjects(data.values, DATA_SCHEMAS.INTERVENTION);
      this.setCache(cacheKey, interventions);
      return interventions;
    } catch (error) {
      console.error('Erreur lors de la récupération des interventions:', error);
      throw new Error('Impossible de charger les données des interventions depuis Google Sheets');
    }
  }

  // Récupérer tous les lavages
  async fetchWashings() {
    const cacheKey = this.getCacheKey('fetchWashings');
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const url = this.buildApiUrl(SHEETS_CONFIG.WASHINGS);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.values || data.values.length < 2) {
        throw new Error('No washing data found in sheet');
      }
      
      const washings = this.transformRowsToObjects(data.values, DATA_SCHEMAS.WASHING);
      this.setCache(cacheKey, washings);
      return washings;
    } catch (error) {
      console.error('Erreur lors of the récupération des lavages:', error);
      throw new Error('Impossible de charger les données des lavages depuis Google Sheets');
    }
  }

  // Récupérer toutes les factures
  async fetchBilling() {
    const cacheKey = this.getCacheKey('fetchBilling');
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const url = this.buildApiUrl(SHEETS_CONFIG.BILLING);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.values || data.values.length < 2) {
        throw new Error('No billing data found in sheet');
      }
      
      const billing = this.transformRowsToObjects(data.values, DATA_SCHEMAS.BILLING);
      this.setCache(cacheKey, billing);
      return billing;
    } catch (error) {
      console.error('Erreur lors de la récupération de la facturation:', error);
      throw new Error('Impossible de charger les données de facturation depuis Google Sheets');
    }
  }

  // Récupérer toutes les données
  async fetchAllData() {
    try {
      const [vehicles, interventions, washings, billing] = await Promise.all([
        this.fetchVehicles(),
        this.fetchInterventions(),
        this.fetchWashings(),
        this.fetchBilling()
      ]);

      return {
        vehicles,
        interventions,
        washings,
        billing,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      throw new Error('Impossible de charger les données depuis Google Sheets');
    }
  }

  // **ÉCRITURE DES DONNÉES**

  // Ajouter un nouveau véhicule
  async addVehicle(vehicleData) {
    try {
      // Vérifier les champs requis
      if (!vehicleData.plate || !vehicleData.brand || !vehicleData.model) {
        throw new Error('Les champs plaque, marque et modèle sont obligatoires');
      }

      console.log('Starting vehicle addition process...');
      
      // Check authentication first
      try {
        const token = await this.getAccessToken();
        console.log('Authentication successful, token:', token ? 'valid' : 'invalid');
      } catch (authError) {
        console.error('Authentication failed:', authError);
        throw new Error('Authentication required - please sign in with Google');
      }

      const vehicles = await this.fetchVehicles();
      console.log('Fetched vehicles count:', vehicles.length);
      
      const newId = Math.max(...vehicles.map(v => v.id || 0)) + 1;
      console.log('Generated new vehicle ID:', newId);
      
      const newVehicle = {
        id: newId,
        ...vehicleData,
        status: vehicleData.status || 'active',
        createdAt: new Date().toISOString()
      };

      console.log('Attempting to append row to Google Sheet...');
      const result = await this.appendRow(SHEETS_CONFIG.VEHICLES, this.objectToRow(newVehicle, DATA_SCHEMAS.VEHICLE));
      console.log('Row append result:', result);
      
      this.clearCache(); // Invalider le cache
      console.log('Cache cleared successfully');
      
      return newVehicle;
    } catch (error) {
      console.error('Detailed error during vehicle addition:', {
        error: error.message,
        stack: error.stack,
        vehicleData,
        time: new Date().toISOString()
      });
      throw new Error(`Échec de l'ajout du véhicule: ${error.message}`);
    }
  }

  // Ajouter une nouvelle intervention
  async addIntervention(interventionData) {
    try {
      const interventions = await this.fetchInterventions();
      const newId = Math.max(...interventions.map(i => i.id || 0)) + 1;
      
      const newIntervention = {
        id: newId,
        ...interventionData,
        date: interventionData.date || new Date().toISOString().split('T')[0],
        status: interventionData.status || 'pending'
      };

      await this.appendRow(SHEETS_CONFIG.INTERVENTIONS, this.objectToRow(newIntervention, DATA_SCHEMAS.INTERVENTION));
      this.clearCache();
      
      return newIntervention;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'intervention:', error);
      throw error;
    }
  }

  // Ajouter un nouveau lavage
  async addWashing(washingData) {
    try {
      const washings = await this.fetchWashings();
      const newId = Math.max(...washings.map(w => w.id || 0)) + 1;
      
      const newWashing = {
        id: newId,
        ...washingData,
        date: washingData.date || new Date().toISOString().split('T')[0],
        status: washingData.status || 'scheduled'
      };

      await this.appendRow(SHEETS_CONFIG.WASHINGS, this.objectToRow(newWashing, DATA_SCHEMAS.WASHING));
      this.clearCache();
      
      return newWashing;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du lavage:', error);
      throw error;
    }
  }

  // Ajouter une nouvelle facture
  async addBilling(billingData) {
    try {
      const billing = await this.fetchBilling();
      const newId = Math.max(...billing.map(b => b.id || 0)) + 1;
      const invoiceNumber = `F${new Date().getFullYear()}${String(newId).padStart(4, '0')}`;
      
      const newBilling = {
        id: newId,
        invoiceNumber,
        ...billingData,
        date: billingData.date || new Date().toISOString().split('T')[0],
        status: billingData.status || 'draft'
      };

      await this.appendRow(SHEETS_CONFIG.BILLING, this.objectToRow(newBilling, DATA_SCHEMAS.BILLING));
      this.clearCache();
      
      return newBilling;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la facture:', error);
      throw error;
    }
  }

  // **MÉTHODES UTILITAIRES**

  // Transformer un objet en ligne pour Google Sheets
  objectToRow(obj, schema) {
    const headers = Object.keys(schema);
    return headers.map(header => {
      const value = obj[header];
      const type = schema[header];
      return this.formatValue(value, type);
    });
  }

  // Ajouter une ligne à une feuille
  async appendRow(sheetName, rowData) {
    try {
      console.log('Starting appendRow with sheet:', sheetName);
      const token = await this.getAccessToken();
      console.log('Using access token:', token ? 'valid' : 'invalid');
      
      const url = `${BASE_URL}/${SHEET_ID}/values/${sheetName}!A:A:append?valueInputOption=USER_ENTERED`;
      console.log('API URL:', url);
      
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          values: [rowData]
        })
      };
      console.log('Request options:', requestOptions);

      const response = await fetch(url, requestOptions);
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        const errorMsg = data.error?.message || `HTTP error ${response.status}`;
        console.error('API Error:', errorMsg);
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      console.error('Detailed appendRow error:', {
        error: error.message,
        stack: error.stack,
        sheetName,
        rowData: JSON.stringify(rowData),
        time: new Date().toISOString()
      });
      throw new Error(`Failed to append row: ${error.message}`);
    }
  }

  // Mettre à jour une ligne existante
  async updateRow(sheetName, rowIndex, rowData) {
    const range = `${sheetName}!A${rowIndex}:Z${rowIndex}`;
    const url = `${BASE_URL}/${SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED&key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders('PUT'),
      body: JSON.stringify({
        values: [rowData]
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la mise à jour: ${response.status}`);
    }

    this.clearCache();
    return response.json();
  }

  // **DONNÉES DE TEST (FALLBACK)**

  // No mock data - using real Google Sheets data only

  // No mock data methods - using real Google Sheets data only

  // **STATISTIQUES ET ANALYTICS**

  async getStats() {
    const data = await this.fetchAllData();
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Filtrer les données du mois en cours
    const thisMonthInterventions = data.interventions.filter(i => {
      const date = new Date(i.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const thisMonthWashings = data.washings.filter(w => {
      const date = new Date(w.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const thisMonthRevenue = [
      ...thisMonthInterventions.map(i => i.cost || 0),
      ...thisMonthWashings.map(w => w.cost || 0)
    ].reduce((sum, cost) => sum + cost, 0);

    return {
      totalVehicles: data.vehicles.length,
      activeVehicles: data.vehicles.filter(v => v.status === 'active').length,
      maintenanceVehicles: data.vehicles.filter(v => v.status === 'maintenance').length,
      
      totalInterventions: data.interventions.length,
      completedInterventions: data.interventions.filter(i => i.status === 'completed').length,
      pendingInterventions: data.interventions.filter(i => i.status === 'pending').length,
      
      totalWashings: data.washings.length,
      completedWashings: data.washings.filter(w => w.status === 'completed').length,
      scheduledWashings: data.washings.filter(w => w.status === 'scheduled').length,
      
      thisMonthRevenue,
      thisMonthInterventions: thisMonthInterventions.length,
      thisMonthWashings: thisMonthWashings.length,
      
      averageInterventionCost: data.interventions.reduce((sum, i) => sum + (i.cost || 0), 0) / data.interventions.length || 0,
      averageWashingCost: data.washings.reduce((sum, w) => sum + (w.cost || 0), 0) / data.washings.length || 0
    };
  }
}

// Export d'une instance singleton
export default new GoogleSheetsService();
