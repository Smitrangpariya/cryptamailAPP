import { motion } from 'framer-motion';

const EmailSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 mb-2 rounded-xl bg-white dark:bg-slate-800 border border-transparent"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <motion.div 
            className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        <motion.div 
          className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 ml-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
      </div>
      <motion.div 
        className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
      />
    </motion.div>
  );
};

const LoadingSkeleton = ({ count = 5 }) => {
  return (
    <div className="p-2">
      {[...Array(count)].map((_, i) => (
        <EmailSkeleton key={i} />
      ))}
    </div>
  );
};

export default LoadingSkeleton;