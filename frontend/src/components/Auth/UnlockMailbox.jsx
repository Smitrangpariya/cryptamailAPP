import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function UnlockMailbox() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { unlockMailbox, loading, user } = useAuth();
  const navigate = useNavigate();

  const unlock = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await unlockMailbox(password);
      navigate("/", { replace: true });
    } catch {
      setError("Invalid password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div 
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-sm"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.h1 
          className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Unlock Mailbox
        </motion.h1>
        <motion.p 
          className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Welcome back, <strong>{user?.address}</strong>
        </motion.p>

        <motion.form 
          onSubmit={unlock} 
          className="mt-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <input
              type="password"
              placeholder="Enter password to decrypt"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-indigo-500 focus:border-transparent 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
            />
          </motion.div>

          {error && (
            <motion.div 
              className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 
                     text-white font-semibold rounded-lg shadow-lg hover:shadow-xl disabled:shadow-none 
                     transition-all duration-300 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <>
                <motion.div 
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                Decrypting…
              </>
            ) : (
              "Unlock Mailbox"
            )}
          </motion.button>
        </motion.form>

        <motion.p 
          className="text-xs text-gray-500 text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          🔐 Private keys are decrypted locally only
        </motion.p>
      </motion.div>
    </div>
  );
}