// components/ErrorBoundary.js
// Composant pour gérer les erreurs Firebase

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Met à jour le state pour afficher l'UI d'erreur
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log de l'erreur
    console.error('❌ Erreur capturée par ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    // Recharger la page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Oups ! Une erreur s'est produite
            </h1>
            
            <p className="text-gray-600 mb-6">
              Une erreur inattendue s'est produite avec Firebase. 
              Veuillez vérifier votre connexion et réessayer.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold"
              >
                <RefreshCw size={20} />
                Recharger l'application
              </button>
              
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Détails techniques
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-gray-600 overflow-auto max-h-32">
                  <pre>{this.state.error && this.state.error.toString()}</pre>
                </div>
              </details>
            </div>
            
            <div className="mt-6 text-xs text-gray-500">
              💡 Vérifications suggérées:
              <ul className="list-disc text-left pl-4 mt-2 space-y-1">
                <li>Configuration Firebase dans firebase/config.js</li>
                <li>Règles Firestore (utilisez le mode "test")</li>
                <li>Connexion internet</li>
                <li>Console navigateur pour plus de détails</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;