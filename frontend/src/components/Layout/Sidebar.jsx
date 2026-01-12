import { motion } from 'framer-motion';
import { sidebarVariants } from '../../utils/animation';

export default function Sidebar({ activeView, onViewChange, onCompose, collapsed, onToggleCollapse }) {
    return (
        <div className="bg-slate-100 dark:bg-slate-950 flex flex-col h-full transition-colors duration-200">
            {!collapsed && (
                <div className="p-4">
                    <motion.button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 mb-8 shadow-lg shadow-indigo-500/30"
                        onClick={onCompose}
                        whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(99, 102, 241, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <motion.span 
                            className="text-xl"
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                            ✉️
                        </motion.span> 
                        Compose
                    </motion.button>
                </div>
            )}

            <nav className="flex flex-col gap-2 px-4">
                
                <motion.button
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full font-medium ${activeView === 'inbox'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                    onClick={() => onViewChange('inbox')}
                    whileHover={{ x: activeView !== 'inbox' ? 8 : 0 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    title={collapsed ? "Inbox" : ""}
                >
                    <motion.span 
                        className="text-lg"
                        animate={activeView === 'inbox' ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                    >
                        📥
                    </motion.span>
                    {!collapsed && <span>Inbox</span>}
                </motion.button>

                <motion.button
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full font-medium ${activeView === 'drafts'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                    onClick={() => onViewChange("drafts")}
                    whileHover={{ x: activeView !== 'drafts' ? 8 : 0 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    title={collapsed ? "Drafts" : ""}
                >
                    <motion.span 
                        className="text-lg"
                        animate={activeView === 'drafts' ? { rotate: [0, 360] } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        📝
                    </motion.span>
                    {!collapsed && <span>Drafts</span>}
                </motion.button>

                <motion.button
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full font-medium ${activeView === 'sent'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                    onClick={() => onViewChange('sent')}
                    whileHover={{ x: activeView !== 'sent' ? 8 : 0 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    title={collapsed ? "Sent" : ""}
                >
                    <motion.span 
                        className="text-lg"
                        animate={activeView === 'sent' ? { y: [-3, 3, -3] } : {}}
                        transition={{ duration: 0.5, repeat: 2 }}
                    >
                        📤
                    </motion.span>
                    {!collapsed && <span>Sent</span>}
                </motion.button>

                <motion.button
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full font-medium ${activeView === 'spam'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                    onClick={() => onViewChange('spam')}
                    whileHover={{ x: activeView !== 'spam' ? 8 : 0 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    title={collapsed ? "Spam" : ""}
                >
                    <motion.span 
                        className="text-lg"
                        animate={activeView === 'spam' ? { rotate: [-10, 10, -10] } : {}}
                        transition={{ duration: 0.3, repeat: 3 }}
                    >
                        🛡️
                    </motion.span>
                    {!collapsed && <span>Spam</span>}
                </motion.button>

                <motion.button
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full font-medium ${activeView === 'trash'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                    onClick={() => onViewChange('trash')}
                    whileHover={{ x: activeView !== 'trash' ? 8 : 0 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    title={collapsed ? "Trash" : ""}
                >
                    <motion.span 
                        className="text-lg"
                        animate={activeView === 'trash' ? { rotate: [0, -15, 15, -15, 0] } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        🗑️
                    </motion.span>
                    {!collapsed && <span>Trash</span>}
                </motion.button>

                <motion.button
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left w-full font-medium ${activeView === 'settings'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                    onClick={() => onViewChange('settings')}
                    whileHover={{ x: activeView !== 'settings' ? 8 : 0 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    title={collapsed ? "Settings" : ""}
                >
                    <motion.span 
                        className="text-lg"
                        animate={activeView === 'settings' ? { rotate: [0, 360] } : {}}
                        transition={{ duration: 1 }}
                    >
                        ⚙️
                    </motion.span>
                    {!collapsed && <span>Settings</span>}
                </motion.button>
                
            </nav>
            
            {/* Collapse/Expand toggle button */}
            <div className="mt-auto p-4">
                <motion.button
                    onClick={onToggleCollapse}
                    className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <motion.span
                        animate={{ rotate: collapsed ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-lg"
                    >
                        {collapsed ? '→' : '←'}
                    </motion.span>
                </motion.button>
            </div>
        </div>
    );
}