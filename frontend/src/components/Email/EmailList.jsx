import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { decryptEmailMessage } from "../../services/emailService";
import { emailAPI } from "../../services/apiService";
import { groupEmailsIntoThreads, getThreadSummary, shouldEnableThreading } from "../../utils/emailThreading";

export default function EmailList({
  emails,
  onEmailClick,
  onRefresh,
  selectedEmailId,
  viewType,
  onEmptyTrash,
}) {
  const { privateKey, isLocked } = useAuth();
  const [decryptedSubjects, setDecryptedSubjects] = useState({});
  const [emptyingTrash, setEmptyingTrash] = useState(false);
  const [restoringEmails, setRestoringEmails] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    let cancelled = false;
    
    const decryptSubjects = async () => {
      if (!privateKey || !emails.length) {
        if (!cancelled) {
          setDecryptedSubjects({});
        }
        return;
      }

      console.log("🔓 Starting to decrypt email subjects:", {
        emailCount: emails.length,
        hasPrivateKey: !!privateKey,
        privateKeyType: privateKey?.type,
        privateKeyAlgorithm: privateKey?.algorithm?.name
      });

      const newDecrypted = {};
      let successCount = 0;
      let failureCount = 0;

      for (const email of emails) {
        if (cancelled) break;
        
        try {
          console.log(`🔄 Decrypting subject for email ${email.id}...`, {
            fromUsername: email.fromUsername,
            hasEncryptedSubject: !!email.encryptedSubject,
            hasSubjectIv: !!email.subjectIv
          });

          const decrypted = await decryptEmailMessage(email, privateKey, viewType);
          if (!cancelled) {
            newDecrypted[email.id] = decrypted.subject;
            successCount++;
            console.log(`✅ Email ${email.id} subject decrypted:`, decrypted.subject?.substring(0, 50));
          }
        } catch (error) {
          failureCount++;
          console.error(`❌ Failed to decrypt subject for email ${email.id}:`, {
            errorMessage: error.message,
            errorName: error.name,
            fromUsername: email.fromUsername
          });
          if (!cancelled) {
            newDecrypted[email.id] = "(Unable to decrypt)";
          }
        }
      }

      if (!cancelled) {
        console.log("✅ Subject decryption complete:", {
          totalEmails: emails.length,
          successCount,
          failureCount
        });
        setDecryptedSubjects(newDecrypted);
      }
    };

    decryptSubjects();

    return () => {
      cancelled = true;
    };
  }, [emails, privateKey, viewType]);

  const handleEmptyTrash = async () => {
    try {
      setEmptyingTrash(true);
      const response = await emailAPI.emptyTrash();
      const deletedCount = response.data?.deletedCount || 0;
      alert(`Successfully deleted ${deletedCount} email${deletedCount !== 1 ? 's' : ''} from trash.`);
      if (onEmptyTrash) onEmptyTrash();
    } catch (error) {
      console.error("Failed to empty trash:", error);
      alert("Failed to empty trash");
    } finally {
      setEmptyingTrash(false);
    }
  };

  const handleStarToggle = async (emailId, event) => {
    event.stopPropagation();
    try {
      const email = emails.find(e => e.id === emailId);
      if (!email) return;

      const newStarredState = !email.isStarred;
      await emailAPI.toggleStar(emailId, newStarredState);
    } catch (error) {
      console.error("Failed to toggle star:", error);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: 'short' });
    } else {
      return date.toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatAddress = (username) => {
    if (!username) return "Unknown";
    return `${username}@smail.in`;
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = searchTerm === '' || 
      (decryptedSubjects[email.id] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.fromUsername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toUsername?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (filterType) {
      case 'unread':
        return !email.isRead;
      case 'starred':
        return email.isStarred;
      case 'important':
        return email.isImportant;
      default:
        return true;
    }
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Search and Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
              <svg 
                className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('unread')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterType === 'unread'
                    ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setFilterType('starred')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filterType === 'starred'
                    ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100'
                }`}
              >
                Starred
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {/* Delete All Trash button - only show in trash view with emails */}
        {viewType === "trash" && filteredEmails.length > 0 && (
          <motion.div 
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-red-700 dark:text-red-300">
                <span className="font-medium">{filteredEmails.length}</span> items in trash
              </div>
              <button
                onClick={handleEmptyTrash}
                disabled={emptyingTrash}
                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {emptyingTrash ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Empty Trash
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {filteredEmails.length === 0 ? (
          <motion.div 
            className="flex flex-col items-center justify-center h-96 text-center text-slate-500 dark:text-slate-400 p-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div 
              className="text-6xl mb-4"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatDelay: 3 
              }}
            >
              {searchTerm ? '🔍' : '📭'}
            </motion.div>
            <motion.p 
              className="text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {searchTerm 
                ? `No emails found matching "${searchTerm}"` 
                : `No ${filterType} emails in ${viewType}`
              }
            </motion.p>
            {viewType === "trash" && !searchTerm && (
              <motion.p 
                className="text-sm text-slate-400 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Your trash folder is empty.
              </motion.p>
            )}
          </motion.div>
        ) : (
          /* Email List */
          <AnimatePresence mode="popLayout">
            <motion.div
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {filteredEmails.map((email, index) => {
                const isSelected = email.id === selectedEmailId;
                const otherParty =
                  viewType === "inbox"
                    ? formatAddress(email.fromUsername)
                    : formatAddress(email.toUsername);

                return (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.05,
                      type: "spring",
                      damping: 20,
                      stiffness: 300
                    }}
                    className={`group p-4 mb-2 rounded-xl cursor-pointer border transition-all ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 shadow-md ring-1 ring-indigo-500/20"
                        : "bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md"
                    } ${!email.isRead && viewType === "inbox" ? "font-semibold border-l-4 border-l-indigo-500 bg-slate-50 dark:bg-slate-800/50" : ""}`}
                    onClick={() => onEmailClick(email)}
                    whileHover={{ 
                      scale: 1.02, 
                      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    layout
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1 min-w-0">
                        <motion.span 
                          className={`text-sm ${
                            !email.isRead && viewType === "inbox"
                              ? "text-slate-900 dark:text-white font-bold"
                              : "text-slate-700 dark:text-slate-300 font-medium"
                          }`}
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          {otherParty}
                        </motion.span>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {viewType !== "trash" && (
                          <>
                            <motion.button
                              onClick={(e) => handleStarToggle(email.id, e)}
                              className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                                email.isStarred 
                                  ? 'text-yellow-500 hover:text-yellow-600' 
                                  : 'text-slate-400 hover:text-yellow-500'
                              }`}
                              title={email.isStarred ? "Remove star" : "Star email"}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <svg className="w-4 h-4" fill={email.isStarred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538 1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            </motion.button>
                          </>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap ml-1">
                          {formatDate(email.timestamp)}
                        </span>
                      </div>
                    </div>
                    <motion.div 
                      className={`text-sm truncate leading-relaxed ${
                        !email.isRead && viewType === "inbox"
                          ? "text-slate-800 dark:text-slate-200"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 + index * 0.02 }}
                    >
                      {isLocked || !privateKey
                        ? "🔐 Unlock mailbox to read"
                        : decryptedSubjects[email.id] || "Decrypting..."}
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}