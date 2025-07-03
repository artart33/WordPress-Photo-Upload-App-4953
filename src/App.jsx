import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './components/Header';
import PhotoUploader from './components/PhotoUploader';
import Settings from './components/Settings';
import { WordPressProvider } from './context/WordPressContext';
import './App.css';

function App() {
  return (
    <WordPressProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <motion.main 
            className="container mx-auto px-4 py-6 max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Routes>
              <Route path="/" element={<PhotoUploader />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </motion.main>
        </div>
      </Router>
    </WordPressProvider>
  );
}

export default App;