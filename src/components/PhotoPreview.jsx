import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiImage } = FiIcons;

const PhotoPreview = ({ src, onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <SafeIcon icon={FiArrowLeft} className="text-lg" />
          <span>Terug</span>
        </button>
        <div className="flex items-center space-x-2">
          <SafeIcon icon={FiImage} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-600">Geselecteerde foto</span>
        </div>
      </div>
      
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        <img
          src={src}
          alt="Selected"
          className="max-w-full max-h-full object-contain photo-preview"
        />
      </div>
    </motion.div>
  );
};

export default PhotoPreview;