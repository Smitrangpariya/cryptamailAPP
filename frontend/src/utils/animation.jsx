import { motion, AnimatePresence, useReducedMotion, LazyMotion, domAnimation, domMax } from 'framer-motion';

// Animation variants following the requirements
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -10,
    scale: 1.02
  }
};

export const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.25
};

// Sidebar animation variants
export const sidebarVariants = {
  expanded: {
    width: 256,
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  collapsed: {
    width: 80,
    transition: { duration: 0.3, ease: 'easeInOut' }
  }
};

// Email list stagger animation
export const emailListVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  },
  item: {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  }
};

// Modal animation variants
export const modalVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 200,
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    y: 40,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

// Dropdown/Menu animation variants
export const dropdownVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
      duration: 0.2
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.15 }
  }
};

// Tooltip animation variants
export const tooltipVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 400,
      duration: 0.15
    }
  }
};

// Auth form animation variants
export const authVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  },
  logo: {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      rotate: -10
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
        duration: 0.6
      }
    }
  },
  form: {
    hidden: { 
      opacity: 0, 
      y: 30 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 400,
        duration: 0.5
      }
    }
  },
  field: {
    hidden: { 
      opacity: 0, 
      x: -20 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
        duration: 0.4
      }
    }
  }
};

// Decrypting animation variants
export const decryptingVariants = {
  lock: {
    initial: { scale: 1, rotate: 0 },
    animate: {
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },
  shimmer: {
    initial: { x: '-100%' },
    animate: {
      x: '100%',
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  },
  content: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.3
      }
    }
  }
};

// Attachment animation variants
export const attachmentVariants = {
  upload: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 }
  },
  progress: {
    initial: { width: '0%' },
    animate: { width: '100%' }
  },
  error: {
    animate: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 }
    }
  }
};

// Theme switching animation
export const themeVariants = {
  light: {
    backgroundColor: '#f8fafc',
    transition: { duration: 0.3 }
  },
  dark: {
    backgroundColor: '#020617',
    transition: { duration: 0.3 }
  }
};

// Custom hook for reduced motion
export const useAnimationConfig = () => {
  const shouldReduceMotion = useReducedMotion();
  
  return {
    shouldReduceMotion,
    transition: shouldReduceMotion 
      ? { duration: 0 } 
      : pageTransition,
    variants: shouldReduceMotion
      ? { initial: {}, in: {}, out: {} }
      : pageVariants
  };
};

// Animated wrapper component for Radix UI asChild pattern
export const AnimatedWrapper = ({ 
  children, 
  variants = pageVariants, 
  transition = pageTransition,
  className = '',
  useOptimized = true,
  ...props 
}) => {
  const shouldReduceMotion = useReducedMotion();
  
  const finalTransition = shouldReduceMotion 
    ? { duration: 0 } 
    : transition;
  
  const finalVariants = shouldReduceMotion
    ? { initial: {}, animate: {}, exit: {} }
    : variants;

  const MotionComponent = useOptimized ? motion.div : motion.div;

  if (useOptimized) {
    return (
      <LazyMotion features={domAnimation}>
        <MotionComponent
          variants={finalVariants}
          transition={finalTransition}
          className={className}
          {...props}
        >
          {children}
        </MotionComponent>
      </LazyMotion>
    );
  }

  return (
    <motion.div
      variants={finalVariants}
      transition={finalTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Performance-optimized animation wrapper for heavy animations
export const OptimizedAnimatedWrapper = ({ 
  children, 
  variants = pageVariants, 
  transition = pageTransition,
  className = '',
  ...props 
}) => {
  const shouldReduceMotion = useReducedMotion();
  
  const finalTransition = shouldReduceMotion 
    ? { duration: 0 } 
    : transition;
  
  const finalVariants = shouldReduceMotion
    ? { initial: {}, animate: {}, exit: {} }
    : variants;

  return (
    <LazyMotion features={domMax}>
      <motion.div
        variants={finalVariants}
        transition={finalTransition}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    </LazyMotion>
  );
};

// Page transition component with accessibility
export const PageTransition = ({ children, location }) => {
  const shouldReduceMotion = useReducedMotion();
  
  const finalVariants = shouldReduceMotion
    ? { initial: {}, in: {}, out: {} }
    : pageVariants;
    
  const finalTransition = shouldReduceMotion
    ? { duration: 0 }
    : pageTransition;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial="initial"
        animate="in"
        exit="out"
        variants={finalVariants}
        transition={finalTransition}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};