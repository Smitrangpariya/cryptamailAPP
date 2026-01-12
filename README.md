# 🔐 CryptaMail (CipherMail)

**CryptaMail** is a secure, end-to-end encrypted email service inspired by ProtonMail. It ensures that your communications remain private, with all encryption happening purely on the client-side. The server never sees your unencrypted emails, attachments, or private keys.

## 🌟 Key Features

*   **End-to-End Encryption (E2EE):**
    *   **Hybrid Cryptography:** Uses **RSA-OAEP** (4096-bit) for key exchange and **AES-GCM** (256-bit) for content encryption.
    *   **Zero-Knowledge Architecture:** Private keys are stored encrypted on the server but decrypted *only* in your browser using your password. The server cannot decrypt your data.
*   **Secure Attachments:**
    *   Supports large file uploads via **Encrypted Chunking**.
    *   Attachments are AES-encrypted client-side before upload.
    *   Secure download and decryption stream directly in the browser.
*   **Mailbox Management:**
    *   Full support for **Inbox**, **Sent**, **Drafts**, **Trash**, and **Spam** folders.
    *   Reply, Forward, and Delete functionality.
*   **Modern UI:**
    *   Built with **React** and **Tailwind CSS** for a responsive, clean experience.
    *   Real-time feedback on encryption status.

## 🛠️ Technology Stack

### Frontend
*   **React:** UI Library.
*   **Vite:** Build tool.
*   **Web Crypto API:** Native browser cryptography (SubtleCrypto) for high performance.
*   **Axios:** HTTP client with interceptors for auth.

### Backend
*   **Java Spring Boot:** REST API server.
*   **Spring Security:** Authentication and Authorization (JWT).
*   **H2 / MySQL:** Database storage.
*   **Hibernate/JPA:** ORM.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Java JDK (17+)
*   Maven

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Smitrangpariya/cryptamailAPP.git.git
    cd cryptamail
    ```

2.  **Start the Backend:**
    ```bash
    cd backend
    ./mvnw spring-boot:run
    ```
    The server will start on `http://localhost:8080`.

3.  **Start the Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    The app will open on `http://localhost:5173`.

## 🔒 Security Architecture

1.  **Login:** User enters credentials. Server returns Salt + Encrypted Private Key.
2.  **Key Derivation:** Client derives a generic key from Password + Salt (PBKDF2).
3.  **Unlock:** Client attempts to decrypt the Private Key. If successful, the Private Key is stored in memory (never written to disk).
4.  **Sending:**
    *   Client generates a random 256-bit AES key.
    *   Encrypts Body/Attachments with AES key.
    *   Encrypts AES key with Recipient's Public Key (RSA).
    *   Sends ciphertext to server.
5.  **Receiving:**
    *   Client downloads ciphertext + Encrypted AES key.
    *   Decrypts AES key with User's Private Key.
    *   Decrypts Body/Attachments with AES Key.

## 📄 License

This project is licensed under the MIT License.
