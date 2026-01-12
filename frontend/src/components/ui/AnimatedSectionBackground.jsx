import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const AnimatedSectionBackground = ({ activeView, children }) => {
  const [backgroundStyle, setBackgroundStyle] = useState({});

  const viewConfigs = {
    inbox: {
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      particles: 'rgba(102, 126, 234, 0.1)',
      animation: 'float'
    },
    sent: {
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      particles: 'rgba(240, 147, 251, 0.1)',
      animation: 'pulse'
    },
    drafts: {
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      particles: 'rgba(79, 172, 254, 0.1)',
      animation: 'wave'
    },
    trash: {
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      particles: 'rgba(250, 112, 154, 0.1)',
      animation: 'shimmer'
    },
    spam: {
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      particles: 'rgba(48, 207, 208, 0.1)',
      animation: 'glitch'
    },
    settings: {
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      particles: 'rgba(168, 237, 234, 0.1)',
      animation: 'breathe'
    },
    default: {
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      particles: 'rgba(99, 102, 241, 0.1)',
      animation: 'float'
    }
  };

  const currentConfig = viewConfigs[activeView] || viewConfigs.default;

  useEffect(() => {
    setBackgroundStyle({
      background: currentConfig.gradient,
      transition: 'all 0.8s ease-in-out'
    });
  }, [activeView, currentConfig]);

  const animationVariants = {
    float: {
      initial: { scale: 1, rotate: 0 },
      animate: { 
        scale: [1, 1.05, 1], 
        rotate: [0, 1, -1, 0],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
      }
    },
    pulse: {
      initial: { scale: 1, opacity: 0.3 },
      animate: { 
        scale: [1, 1.1, 1], 
        opacity: [0.3, 0.6, 0.3],
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }
    },
    wave: {
      initial: { y: 0 },
      animate: { 
        y: [-10, 10, -10],
        transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
      }
    },
    shimmer: {
      initial: { backgroundPosition: '0% 50%' },
      animate: { 
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        transition: { duration: 8, repeat: Infinity, ease: "linear" }
      }
    },
    glitch: {
      initial: { x: 0 },
      animate: { 
        x: [0, -2, 2, -1, 1, 0],
        transition: { duration: 0.5, repeat: Infinity, repeatDelay: 3 }
      }
    },
    breathe: {
      initial: { scale: 1, opacity: 0.2 },
      animate: { 
        scale: [1, 1.02, 1],
        opacity: [0.2, 0.4, 0.2],
        transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
      }
    }
  };

  return (
    <div className="relative h-full overflow-hidden">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={backgroundStyle}
        variants={animationVariants[currentConfig.animation]}
        initial="initial"
        animate="animate"
      />
      
      {/* Floating shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              background: currentConfig.particles,
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              scale: [1, Math.random() * 0.5 + 0.8, 1],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};

export default AnimatedSectionBackground;