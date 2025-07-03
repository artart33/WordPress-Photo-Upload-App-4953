import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiCamera, FiSettings, FiUpload } = FiIcons;

const Header = () => {
  const location = useLocation();

  return (
    <motion.header 
      className="bg-white shadow-lg border-b border-gray-200"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-4 max-w-lg">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full instagram-gradient flex items-center justify-center">
              <SafeIcon icon={FiCamera} className="text-white text-lg" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 font-instagram">
              WP Uploader
            </h1>
          </Link>

          <nav className="flex items-center space-x-4">
            <Link
              to="/"
              className={`p-2 rounded-full transition-colors ${
                location.pathname === '/' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <SafeIcon icon={FiUpload} className="text-xl" />
            </Link>
            <Link
              to="/settings"
              className={`p-2 rounded-full transition-colors ${
                location.pathname === '/settings' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <SafeIcon icon={FiSettings} className="text-xl" />
            </Link>
          </nav>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;