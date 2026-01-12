import { motion } from 'framer-motion';
import CryptaMailIcon from '../ui/CryptaMailIcon';

export default function AuthLogo({ className = "" }) {
  return (
    <motion.div 
      className={`flex flex-col items-center justify-center mb-8 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-3"
      >
        <CryptaMailIcon size={48} animated={false} />
      </motion.div>
      
      <motion.h1 
        className="text-2xl font-bold text-gray-900 dark:text-white"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        CryptaMail
      </motion.h1>
      
      <motion.p 
        className="text-sm text-gray-600 dark:text-gray-400 mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        End-to-End Encrypted Email
      </motion.p>
    </motion.div>
  );
}