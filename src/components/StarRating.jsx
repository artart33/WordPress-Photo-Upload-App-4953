import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiStar } = FiIcons;

const StarRating = ({ rating = 0, onRatingChange, size = "text-2xl", interactive = true }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (newRating) => {
    if (interactive && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleMouseEnter = (star) => {
    if (interactive) {
      setHoverRating(star);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const getRatingText = (rating) => {
    const texts = {
      1: 'Slecht',
      2: 'Matig',
      3: 'Goed',
      4: 'Zeer goed',
      5: 'Uitstekend'
    };
    return texts[rating] || 'Geen beoordeling';
  };

  const getRatingColor = (star) => {
    const currentRating = hoverRating || rating;
    if (star <= currentRating) {
      if (currentRating <= 2) return 'text-red-500';
      if (currentRating === 3) return 'text-yellow-500';
      return 'text-green-500';
    }
    return 'text-gray-300';
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            className={`${size} transition-all duration-200 ${
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            } ${getRatingColor(star)}`}
            whileHover={interactive ? { scale: 1.1 } : undefined}
            whileTap={interactive ? { scale: 0.95 } : undefined}
            disabled={!interactive}
          >
            <SafeIcon 
              icon={FiStar} 
              className={`${star <= (hoverRating || rating) ? 'fill-current' : ''} stroke-current`}
            />
          </motion.button>
        ))}
      </div>
      
      {(rating > 0 || hoverRating > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <span className={`text-sm font-medium ${
            (hoverRating || rating) <= 2 ? 'text-red-600' :
            (hoverRating || rating) === 3 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {getRatingText(hoverRating || rating)}
          </span>
          {rating > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              {rating}/5 sterren
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default StarRating;