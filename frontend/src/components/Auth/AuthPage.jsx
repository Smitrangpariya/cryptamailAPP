import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPasswordStrength } from "../../utils/passwordStrength";
import CryptaMailLoader from "../ui/CryptaMailLoader";
import CryptaMailLogo from "../ui/CryptaMailLogo";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const strength = getPasswordStrength(password);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "register" && strength < 3) {
      setError("Password is too weak");
      return;
    }

    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br
                    from-secure-primary to-secure-secondary
                    dark:from-secure-dark dark:to-black">

<div className="bg-white dark:bg-gray-900 dark:text-white
                      p-8 rounded-2xl shadow-xl w-full max-w-md">

        <div className="flex justify-center mb-6">
          <CryptaMailLogo className="text-secure-primary" />
        </div>

        <h1 className="text-2xl font-bold text-center">
          {mode === "login" ? "Sign In" : "Create Account"}
        </h1>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-lg border"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg border"
            required
          />

          {/* Password strength meter */}
          {mode === "register" && (
            <div className="text-sm">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded
                      ${strength > i
                        ? strength >= 4
                          ? "bg-green-500"
                          : strength >= 3
                          ? "bg-yellow-500"
                          : "bg-red-500"
                        : "bg-gray-300 dark:bg-gray-700"}`}
                  />
                ))}
              </div>
              <p className="mt-1">
                {strength < 2 && "Weak"}
                {strength === 2 && "Medium"}
                {strength >= 3 && "Strong"}
              </p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

<button
            disabled={loading}
            className="w-full bg-secure-primary text-white py-3 rounded-lg flex items-center justify-center gap-2">
            {loading ? (
              <>
                <CryptaMailLoader size={20} />
                <span>Please wait…</span>
              </>
            ) : mode === "login" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          {mode === "login" ? "No account?" : "Already registered?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-secure-primary font-semibold">
            {mode === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
