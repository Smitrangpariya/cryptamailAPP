import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { emailAPI } from "./services/apiService";
import TopBar from "./components/Layout/TopBar";
import Sidebar from "./components/Layout/Sidebar";
import EmailList from "./components/Email/EmailList";
import EmailDetail from "./components/Email/EmailDetail";
import ComposeModal from "./components/Email/ComposeModal";
import Settings from "./components/Settings";
import AnimatedSectionBackground from "./components/ui/AnimatedSectionBackground";
import LoadingSkeleton from "./components/ui/LoadingSkeleton";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

export default function MailApp() {
  const { user, privateKey, logout } = useAuth();
  const { toggleTheme } = useTheme();
  const searchInputRef = useRef(null);
  
  const [activeView, setActiveView] = useState("inbox");
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    loadEmails(activeView);

    let interval;
    if (activeView === "inbox") {
      interval = setInterval(() => {
        loadEmails("inbox", true);
      }, 10000); // Poll every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeView]);

const loadEmails = async (view, silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setSelectedEmail(null);
    try {
      let res;
      if (view === "inbox") {
        res = await emailAPI.getInbox();
      } else if (view === "sent") {
        res = await emailAPI.getSent();
      } else if (view === "drafts") {
        res = await emailAPI.getDrafts();
      } else if (view === "trash") {
        res = await emailAPI.getTrash();
      } else if (view === "spam") {
        res = await emailAPI.getSpam();
      }
      
      // Validate response before setting emails
      if (!res || !res.data) {
        throw new Error('Invalid response from server');
      }
      
      setEmails(res.data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to load emails", error);
      }
      if (!silent) {
        setEmails([]); // Clear emails on error to prevent stale data
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const response = await emailAPI.emptyTrash();
      const deletedCount = response.data?.deletedCount || 0;
      
      // Show success message
      alert(`Successfully deleted ${deletedCount} email${deletedCount !== 1 ? 's' : ''} from trash.`);
      
      // Reload trash emails
      await loadEmails('trash');
      
      // Clear selected email if it was in trash
      if (activeView === 'trash') {
        setSelectedEmail(null);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to empty trash:", error);
      }
      // Error is already handled in EmailList component
      throw error;
    }
  };

  const handleEmailRefresh = () => {
    loadEmails(activeView);
  };

  return (
    <div id="main-content" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <TopBar onLogout={logout} userAddress={user?.address || ""} />

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
        <motion.div
          initial={false}
          animate={{ width: sidebarCollapsed ? 80 : 256 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-slate-100 dark:bg-slate-950 flex flex-col border-r border-slate-200 dark:border-slate-800 relative"
        >
          <Sidebar
            activeView={activeView}
            onViewChange={setActiveView}
            onCompose={() => setShowCompose(true)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </motion.div>

        <div className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-slate-900 shadow-xl rounded-tl-2xl border-l border-slate-200 dark:border-slate-800">
            {activeView === 'settings' ? (
              <div className="h-full overflow-y-auto">
                <Settings />
              </div>
            ) : loading ? (
              <LoadingSkeleton count={8} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full overflow-hidden"
                >
                    <EmailList
                      emails={emails}
                      onEmailClick={(email) => {
                        if (email === null) {
                          // Handle refresh request from EmailList
                          handleEmailRefresh();
                        } else {
                          setSelectedEmail(email);
                        }
                      }}
                      onRefresh={handleEmailRefresh}
                      selectedEmailId={selectedEmail?.id}
                      viewType={activeView}
                      onEmptyTrash={activeView === "trash" ? handleEmptyTrash : undefined}
                    />
                </motion.div>
              </AnimatePresence>
            )}

            <AnimatePresence>
              {selectedEmail && privateKey && (
                <motion.div
                  initial={{ opacity: 0, x: "100%" }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute inset-0 bg-white dark:bg-slate-900 z-10 shadow-2xl"
                >
                  <div className="h-full overflow-y-auto">
                    <EmailDetail
                      email={selectedEmail}
                      userPrivateKey={privateKey}
                      onClose={() => setSelectedEmail(null)}
                      viewType={activeView}
                      onEdit={(data) => {
                        setComposeData(data);
                        setSelectedEmail(null);
                        setShowCompose(true);
                      }}
                      onDelete={async (id) => {
                        const confirmMessage = activeView === "trash" 
                          ? "Are you sure you want to permanently delete this email? This action cannot be undone."
                          : "Are you sure you want to delete this email?";
                        
                        if (confirm(confirmMessage)) {
                          try {
                            if (activeView === "drafts") {
                              await emailAPI.deleteDraft(id);
                            } else if (activeView === "trash") {
                              await emailAPI.permanentlyDeleteEmail(id);
                            } else {
                              await emailAPI.deleteEmail(id);
                            }
                            setSelectedEmail(null);
                            loadEmails(activeView);
                          } catch (error) {
                            alert("Failed to delete email");
                            if (import.meta.env.DEV) console.error(error);
                          }
                        }
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
                  </div>
      </div>

      {showCompose && (
        <ComposeModal
          onClose={() => {
            setShowCompose(false);
            setComposeData(null);
          }}
          onEmailSent={() => {
            setShowCompose(false);
            setComposeData(null);
            if (activeView === 'drafts' || activeView === 'sent') loadEmails(activeView);
            else setActiveView("sent");
          }}
          initialData={composeData}
        />
      )}

      {/* Keyboard Shortcuts */}
      {useKeyboardShortcuts({
        onCompose: () => setShowCompose(true),
        onRefresh: () => loadEmails(activeView),
        onSearch: () => {
          const searchInput = document.querySelector('input[placeholder*="Search"]');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        },
        onToggleTheme: toggleTheme,
        onSelectEmail: (email) => {
          if (typeof email === 'object' && email.id) {
            setSelectedEmail(email);
          }
        },
        onDeleteEmail: async (emailId) => {
          const email = emails.find(e => e.id === emailId);
          if (!email) return;
          
          const confirmMessage = activeView === "trash" 
            ? "Are you sure you want to permanently delete this email? This action cannot be undone."
            : "Are you sure you want to delete this email?";
          
          if (confirm(confirmMessage)) {
            try {
              if (activeView === "drafts") {
                await emailAPI.deleteDraft(emailId);
              } else if (activeView === "trash") {
                await emailAPI.permanentlyDeleteEmail(emailId);
              } else {
                await emailAPI.deleteEmail(emailId);
              }
              setSelectedEmail(null);
              loadEmails(activeView);
            } catch (error) {
              alert("Failed to delete email");
              if (import.meta.env.DEV) console.error(error);
            }
          }
        },
        onReply: (emailId) => {
          const email = emails.find(e => e.id === emailId);
          if (email) {
            setComposeData({
              to: email.fromUsername ? `${email.fromUsername}@smail.in` : '',
              subject: email.subject ? `Re: ${email.subject}` : '',
              body: `\n\n---\nOn ${new Date(email.timestamp).toLocaleDateString()}, ${email.fromUsername} wrote:\n`,
              replyToEmailId: emailId
            });
            setSelectedEmail(null);
            setShowCompose(true);
          }
        },
        onForward: (emailId) => {
          const email = emails.find(e => e.id === emailId);
          if (email) {
            setComposeData({
              to: '',
              subject: email.subject ? `Fwd: ${email.subject}` : '',
              body: `\n\n--- Forwarded message ---\nFrom: ${email.fromUsername}\nDate: ${new Date(email.timestamp).toLocaleDateString()}\nSubject: ${email.subject}\n\n`,
              forwardEmailId: emailId
            });
            setSelectedEmail(null);
            setShowCompose(true);
          }
        },
        onStarEmail: async (emailId) => {
          const email = emails.find(e => e.id === emailId);
          if (email) {
            try {
              const newStarredState = !email.isStarred;
              await emailAPI.toggleStar(emailId, newStarredState);
              setEmails(prevEmails => 
                prevEmails.map(e => 
                  e.id === emailId ? { ...e, isStarred: newStarredState } : e
                )
              );
            } catch (error) {
              if (import.meta.env.DEV) console.error("Failed to toggle star:", error);
            }
          }
        },
        onMarkImportant: async (emailId) => {
          const email = emails.find(e => e.id === emailId);
          if (email) {
            try {
              const newImportantState = !email.isImportant;
              await emailAPI.toggleImportant(emailId, newImportantState);
              setEmails(prevEmails => 
                prevEmails.map(e => 
                  e.id === emailId ? { ...e, isImportant: newImportantState } : e
                )
              );
            } catch (error) {
              if (import.meta.env.DEV) console.error("Failed to toggle important:", error);
            }
          }
        },
        onToggleRead: async (emailId) => {
          const email = emails.find(e => e.id === emailId);
          if (email) {
            try {
              await emailAPI.markAsRead(emailId);
              setEmails(prevEmails => 
                prevEmails.map(e => 
                  e.id === emailId ? { ...e, isRead: !e.isRead } : e
                )
              );
            } catch (error) {
              if (import.meta.env.DEV) console.error("Failed to toggle read status:", error);
            }
          }
        },
        onMoveToFolder: (emailId, folder) => {
          if (!emailId) {
            // Just navigate to folder
            setActiveView(folder);
          } else {
            // Move email to folder (this would require additional API endpoints)
            if (import.meta.env.DEV) console.debug(`Moving email ${emailId} to ${folder}`);
          }
        },
        viewMode: activeView,
        emails,
        selectedEmailId: selectedEmail?.id,
        activeView
      })}
    </div>
  );
}