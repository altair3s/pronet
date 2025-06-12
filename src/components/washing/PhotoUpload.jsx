import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Camera, 
  Upload, 
  X, 
  Eye, 
  Download,
  RotateCw,
  Crop,
  ZoomIn,
  ImageIcon,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Card from '../common/Card';

const PhotoUpload = ({ 
  onPhotosChange, 
  maxPhotos = 5, 
  type = 'before', // 'before' ou 'after'
  existingPhotos = [],
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 5 * 1024 * 1024, // 5MB
  quality = 0.8
}) => {
  const [photos, setPhotos] = useState(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Gestion de l'upload de fichiers
  const handleFileSelect = async (files) => {
    setError('');
    setUploading(true);

    const validFiles = Array.from(files).filter(file => {
      // Vérification du type de fichier
      if (!allowedTypes.includes(file.type)) {
        setError(`Type de fichier non supporté: ${file.type}`);
        return false;
      }

      // Vérification de la taille
      if (file.size > maxFileSize) {
        setError(`Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: ${maxFileSize / 1024 / 1024}MB)`);
        return false;
      }

      return true;
    });

    // Vérification du nombre total de photos
    if (photos.length + validFiles.length > maxPhotos) {
      setError(`Nombre maximum de photos atteint (${maxPhotos})`);
      setUploading(false);
      return;
    }

    try {
      const processedPhotos = await Promise.all(
        validFiles.map(file => processPhoto(file))
      );

      const newPhotos = [...photos, ...processedPhotos];
      setPhotos(newPhotos);
      onPhotosChange(newPhotos, type);
    } catch (err) {
      setError('Erreur lors du traitement des photos');
      console.error('Photo processing error:', err);
    } finally {
      setUploading(false);
    }
  };

  // Traitement et optimisation des photos
  const processPhoto = (file) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcul des dimensions optimisées
        const maxWidth = 1200;
        const maxHeight = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dessin de l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);

        // Conversion en blob avec compression
        canvas.toBlob(
          (blob) => {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            resolve({
              id: Date.now() + Math.random(),
              file: optimizedFile,
              url: URL.createObjectURL(blob),
              name: file.name,
              size: blob.size,
              originalSize: file.size,
              timestamp: new Date().toISOString(),
              type: type
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Gestion du drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Suppression d'une photo
  const removePhoto = (photoId) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos, type);

    // Libération de la mémoire
    const photoToRemove = photos.find(photo => photo.id === photoId);
    if (photoToRemove?.url) {
      URL.revokeObjectURL(photoToRemove.url);
    }
  };

  // Rotation d'une photo
  const rotatePhoto = async (photoId) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    try {
      const rotatedPhoto = await rotateImage(photo);
      const updatedPhotos = photos.map(p => 
        p.id === photoId ? { ...p, ...rotatedPhoto } : p
      );
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos, type);
    } catch (err) {
      setError('Erreur lors de la rotation de l\'image');
    }
  };

  // Fonction de rotation d'image
  const rotateImage = (photo) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.height;
        canvas.height = img.width;
        
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(photo.url);
            const newUrl = URL.createObjectURL(blob);
            resolve({
              url: newUrl,
              size: blob.size
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = reject;
      img.src = photo.url;
    });
  };

  // Téléchargement d'une photo
  const downloadPhoto = (photo) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `${type}_${photo.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prévisualisation d'une photo
  const previewPhoto = (photo) => {
    setSelectedPhoto(photo);
  };

  return (
    <div className="space-y-4">
      {/* Zone d'upload */}
      <Card className="relative">
        <div
          className={`
            p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer
            ${dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={uploading}
          />

          <div className="text-center">
            {uploading ? (
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                <p className="text-blue-600 font-semibold">Traitement des photos...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600">
                    <Camera className="text-white" size={32} />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold gradient-text mb-2">
                    Photos {type === 'before' ? 'AVANT' : 'APRÈS'}
                  </h4>
                  <p className="text-gray-700 font-medium mb-1">
                    Glissez vos photos ici ou cliquez pour sélectionner
                  </p>
                  <p className="text-gray-500 text-sm">
                    Max {maxPhotos} photos • {allowedTypes.map(t => t.split('/')[1]).join(', ')} • 
                    Max {Math.round(maxFileSize / 1024 / 1024)}MB par photo
                  </p>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 transition-all text-blue-700 font-medium"
                  >
                    <Upload size={16} />
                    Sélectionner
                  </button>
                  
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 transition-all text-purple-700 font-medium"
                  >
                    <Camera size={16} />
                    Appareil photo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compteur de photos */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
          <span className="text-sm font-semibold text-gray-700">
            {photos.length}/{maxPhotos}
          </span>
        </div>
      </Card>

      {/* Message d'erreur */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">{error}</span>
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Galerie des photos */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h5 className="font-bold text-gray-800 flex items-center gap-2">
            <CheckCircle className="text-green-600" size={18} />
            Photos ajoutées ({photos.length})
          </h5>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img 
                    src={photo.url} 
                    alt={photo.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  
                  {/* Overlay avec actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => previewPhoto(photo)}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-white"
                      title="Prévisualiser"
                    >
                      <Eye size={16} />
                    </button>
                    
                    <button
                      onClick={() => rotatePhoto(photo.id)}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-white"
                      title="Rotation"
                    >
                      <RotateCw size={16} />
                    </button>
                    
                    <button
                      onClick={() => downloadPhoto(photo)}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-white"
                      title="Télécharger"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                  
                  {/* Bouton de suppression */}
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Supprimer"
                  >
                    <X size={14} />
                  </button>
                </div>
                
                {/* Informations de la photo */}
                <div className="mt-2 px-1">
                  <p className="text-xs font-medium text-gray-700 truncate" title={photo.name}>
                    {photo.name}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{(photo.size / 1024).toFixed(0)}KB</span>
                    {photo.originalSize !== photo.size && (
                      <span className="text-green-600">
                        -{Math.round((1 - photo.size / photo.originalSize) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de prévisualisation */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h4 className="font-bold text-gray-800">{selectedPhoto.name}</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {new Date(selectedPhoto.timestamp).toLocaleString()}
                </span>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.name}
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
              />
            </div>
            
            <div className="flex justify-center gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => rotatePhoto(selectedPhoto.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 transition-all text-blue-700 font-medium"
              >
                <RotateCw size={16} />
                Rotation
              </button>
              
              <button
                onClick={() => downloadPhoto(selectedPhoto)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-100 hover:bg-green-200 transition-all text-green-700 font-medium"
              >
                <Download size={16} />
                Télécharger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

PhotoUpload.propTypes = {
  onPhotosChange: PropTypes.func.isRequired,
  maxPhotos: PropTypes.number,
  type: PropTypes.oneOf(['before', 'after']),
  existingPhotos: PropTypes.array,
  allowedTypes: PropTypes.array,
  maxFileSize: PropTypes.number,
  quality: PropTypes.number
};

export default PhotoUpload;