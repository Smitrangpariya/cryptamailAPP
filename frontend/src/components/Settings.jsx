import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAPI } from "../services/apiService";
import { exportPrivateKey, encryptPrivateKey } from "../utils/cryptoUtils";
import CryptaMailLoader from "./ui/CryptaMailLoader";

export default function Settings() {
    const { user, privateKey, updateSession, clearSession } = useAuth();
    const navigate = useNavigate();

    // Load storage usage on component mount
    useEffect(() => {
        const loadStorageUsage = async () => {
            try {
                const response = await userAPI.getStorageUsage();
                setStorageUsage(response.data);
            } catch (err) {
                console.error("Failed to load storage usage:", err);
            }
        };
        loadStorageUsage();
    }, []);

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setMessage({ type: "error", text: "Password is required to delete account" });
            return;
        }

        setDeleteLoading(true);
        try {
            await userAPI.deleteAccount(deletePassword);
            setMessage({ type: "success", text: "Account deleted successfully" });
            
            // Clear session and redirect to login immediately
            clearSession();
            navigate('/login');
        } catch (err) {
            console.error(err);
            setMessage({
                type: "error",
                text: err.response?.data?.message || err.message || "Failed to delete account"
            });
        } finally {
            setDeleteLoading(false);
            setDeleteAccountModal(false);
            setDeletePassword("");
        }
    };

    const [newUsername, setNewUsername] = useState(user?.username || "");
    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [storageUsage, setStorageUsage] = useState(null);
    const [deleteAccountModal, setDeleteAccountModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // Email signature and additional profile settings
    const [signature, setSignature] = useState(user?.signature || "");
    const [autoSaveDrafts, setAutoSaveDrafts] = useState(() => {
        return JSON.parse(localStorage.getItem("autoSaveDrafts") || "true");
    });
    const [emailNotifications, setEmailNotifications] = useState(() => {
        return JSON.parse(localStorage.getItem("emailNotifications") || "true");
    });

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            if (passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword) {
                throw new Error("New passwords do not match");
            }

            if (passwordData.newPassword && passwordData.newPassword.length < 8) {
                throw new Error("New password must be at least 8 characters");
            }

            if (!passwordData.oldPassword) {
                throw new Error("Current password is required to save changes");
            }

            const payload = {
                oldPassword: passwordData.oldPassword,
            };

             if (newUsername !== user.username) {
                 payload.newUsername = newUsername;
             }

             // Add signature to payload
             if (signature !== (user?.signature || "")) {
                 payload.signature = signature;
             }

             if (passwordData.newPassword) {
                payload.newPassword = passwordData.newPassword;

                // Re-encrypt private key with new password
                if (!privateKey) {
                    throw new Error("Private key is not unlocked. Please relogin.");
                }

                const exportedKey = await exportPrivateKey(privateKey);
                const newEncryptedKey = await encryptPrivateKey(exportedKey, passwordData.newPassword);
                payload.newEncryptedPrivateKey = newEncryptedKey;
            }

            const res = await userAPI.updateProfile(payload);

            // Update session with new data
             const { token, ...userData } = res.data;
             updateSession({
                 token: token,
                 user: {
                     username: userData.username,
                     address: userData.address,
                     signature: userData.signature || signature
                 },
                 encryptedPrivateKey: userData.encryptedPrivateKey
             });

            setMessage({ type: "success", text: "Profile updated successfully!" });

            // Clear sensitive fields
            setPasswordData({
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

        } catch (err) {
            console.error(err);
            setMessage({
                type: "error",
                text: err.response?.data?.message || err.message || "Failed to update profile"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8 dark:text-white">Settings</h1>

            <form onSubmit={handleUpdate} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 space-y-6">

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold dark:text-gray-200 border-b pb-2 dark:border-gray-700">Profile Info</h2>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Username
                        </label>
                        <div className="flex">
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="flex-1 p-2 border border-r-0 rounded-l-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            />
                            <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300">
                                @smail.in
                            </span>
                        </div>
                     </div>
                 </div>

                 <div className="space-y-4 pt-4">
                     <h2 className="text-xl font-semibold dark:text-gray-200 border-b pb-2 dark:border-gray-700">Email Signature</h2>
                     
                     <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                             Email Signature
                         </label>
                         <textarea
                             value={signature}
                             onChange={(e) => setSignature(e.target.value)}
                             className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white resize-none"
                             rows={4}
                             placeholder="Enter your email signature..."
                             maxLength={500}
                         />
                         <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                             {signature.length}/500 characters
                         </div>
                     </div>
                 </div>

                 <div className="space-y-4 pt-4">
                     <h2 className="text-xl font-semibold dark:text-gray-200 border-b pb-2 dark:border-gray-700">Email Preferences</h2>
                     
                     <div className="space-y-3">
                         <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                             <div>
                                 <div className="font-medium text-slate-700 dark:text-slate-300">
                                     Auto-save drafts
                                 </div>
                                 <div className="text-xs text-slate-500 dark:text-slate-400">
                                     Automatically save composed emails as drafts
                                 </div>
                             </div>
                             <input
                                 type="checkbox"
                                 checked={autoSaveDrafts}
                                 onChange={(e) => {
                                     setAutoSaveDrafts(e.target.checked);
                                     localStorage.setItem("autoSaveDrafts", JSON.stringify(e.target.checked));
                                 }}
                                 className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                             />
                         </label>

                         <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                             <div>
                                 <div className="font-medium text-slate-700 dark:text-slate-300">
                                     Email notifications
                                 </div>
                                 <div className="text-xs text-slate-500 dark:text-slate-400">
                                     Show desktop notifications for new emails
                                 </div>
                             </div>
                             <input
                                 type="checkbox"
                                 checked={emailNotifications}
                                 onChange={(e) => {
                                     setEmailNotifications(e.target.checked);
                                     localStorage.setItem("emailNotifications", JSON.stringify(e.target.checked));
                                 }}
                                 className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                             />
                         </label>
                     </div>
                 </div>

                 <div className="space-y-4 pt-4">
                     <h2 className="text-xl font-semibold dark:text-gray-200 border-b pb-2 dark:border-gray-700">Storage Usage</h2>
                    
                    {storageUsage && (
                        <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                            <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Storage Used
                                    </span>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        {storageUsage.storageUsedFormatted} / {storageUsage.storageQuotaFormatted}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                    <div 
                                        className={`h-2 rounded-full ${
                                            storageUsage.usagePercentage > 90 
                                                ? 'bg-red-500' 
                                                : storageUsage.usagePercentage > 75 
                                                    ? 'bg-yellow-500' 
                                                    : 'bg-green-500'
                                        }`}
                                        style={{ width: `${Math.min(storageUsage.usagePercentage, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                                {storageUsage.usagePercentage.toFixed(1)}% of quota used
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4 pt-4">
                    <h2 className="text-xl font-semibold dark:text-gray-200 border-b pb-2 dark:border-gray-700">Change Password</h2>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Current Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            required
                            value={passwordData.oldPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                            className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            placeholder="Required to make changes"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                placeholder="Leave blank to keep current"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <h2 className="text-xl font-semibold dark:text-red-600 dark:text-red-400 border-b pb-2 dark:border-gray-700">Delete Account</h2>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                        <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                            <strong>Warning:</strong> This action cannot be undone. Deleting your account will permanently remove:
                        </p>
                        <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside mb-3">
                            <li>All your emails (sent and received)</li>
                            <li>All attachments you've uploaded</li>
                            <li>Your encryption keys and settings</li>
                            <li>Your username and profile data</li>
                        </ul>
                        <button
                            type="button"
                            onClick={() => setDeleteAccountModal(true)}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                        >
                            Delete My Account
                        </button>
                    </div>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-lg ${message.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                        {message.text}
                    </div>
                )}

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>

            {/* Delete Account Confirmation Modal */}
            {deleteAccountModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
                            Confirm Account Deletion
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
                        </p>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Enter your password to confirm
                            </label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                placeholder="Enter your password"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeleteAccountModal(false);
                                    setDeletePassword("");
                                }}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {deleteLoading ? (
                                    <>
                                        <CryptaMailLoader size={16} />
                                        <span>Deleting...</span>
                                    </>
                                ) : "Delete Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
