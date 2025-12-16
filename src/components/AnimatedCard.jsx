import { motion } from 'framer-motion';

const AnimatedCard = ({ children, className = '', delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={`relative ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;

