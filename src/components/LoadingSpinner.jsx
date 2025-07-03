import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center space-y-4 max-w-sm mx-4">
        <div className="loading-spinner w-8 h-8"></div>
        <p className="text-gray-700 font-medium text-center">Uploaden naar WordPress...</p>
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>🗜️ Geoptimaliseerde foto wordt verzonden</p>
          <p>⏳ Dit kan even duren bij grote bestanden</p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingSpinner;