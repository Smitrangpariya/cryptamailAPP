import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPanel({ isSignUp, onToggle }) {
  return (
    <div className="relative w-full max-w-4xl mx-auto my-4">
      <motion.div 
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden min-h-[500px] md:min-h-[600px]"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row min-h-[500px] md:min-h-[600px] max-h-[80vh] md:max-h-none">
          {/* Left Panel - Forms */}
          <div className="flex-1 relative order-2 md:order-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {isSignUp ? (
                <motion.div
                  key="register"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="relative p-6 md:p-12 h-full overflow-y-auto"
                >
                  <RegisterForm onToggle={onToggle} />
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="relative p-6 md:p-12 h-full overflow-y-auto"
                >
                  <LoginForm onToggle={onToggle} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Panel - CTA */}
          <motion.div 
            className="flex-1 bg-gradient-to-br from-indigo-600 to-purple-700 p-6 md:p-12 flex items-center justify-center relative overflow-hidden order-1 md:order-2 min-h-[200px] md:min-h-[600px]"
            animate={{
              background: isSignUp 
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
              }}></div>
            </div>

            <AnimatePresence mode="wait">
              {isSignUp ? (
                <motion.div
                  key="login-cta"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-center text-white relative z-10"
                >
                  <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
                  <p className="text-white/90 mb-8 leading-relaxed">
                    To keep connected with us and access your encrypted emails, 
                    please sign in with your personal info.
                  </p>
                  <motion.button
                    onClick={onToggle}
                    className="px-8 py-3 bg-white text-indigo-600 rounded-full font-semibold 
                             hover:bg-gray-100 transition-all duration-300 hover:scale-105 
                             shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign In
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="register-cta"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-center text-white relative z-10"
                >
                  <h2 className="text-3xl font-bold mb-4">Hello, Friend!</h2>
                  <p className="text-white/90 mb-8 leading-relaxed">
                    Enter your personal details and start your journey with 
                    end-to-end encrypted email communication.
                  </p>
                  <motion.button
                    onClick={onToggle}
                    className="px-8 py-3 bg-white text-indigo-600 rounded-full font-semibold 
                             hover:bg-gray-100 transition-all duration-300 hover:scale-105 
                             shadow-lg hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign Up
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}