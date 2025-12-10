import { motion } from 'framer-motion';
import { useState } from 'react';

const AnimatedCard = ({ children, className = '', delay = 0, ...props }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ 
        scale: 1.05, 
        y: -10,
        rotateY: 5,
        rotateX: 5,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative ${className}`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      {...props}
    >
      <motion.div
        animate={{
          rotateY: isHovered ? 5 : 0,
          rotateX: isHovered ? -5 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="relative h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-xl blur-xl -z-10"
          />
        )}
      </motion.div>
    </motion.div>
  );
};

export default AnimatedCard;

