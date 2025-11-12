import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getAccessToken, usePrivy } from "@privy-io/react-auth";
import Head from "next/head";
import Portal from "@components/graphics/portal";
import { validateUsernameFormat } from "@utils/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameError("");
    setError("");

    // Validate on change for immediate feedback
    if (value.trim().length > 0) {
      const validation = validateUsernameFormat(value);
      if (!validation.valid) {
        setUsernameError(validation.error || "");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUsernameError("");

    // Validate username
    const validation = validateUsernameFormat(username);
    if (!validation.valid) {
      setUsernameError(validation.error || "Invalid username");
      return;
    }

    setIsSubmitting(true);

    try {
      const accessToken = await getAccessToken();

      const response = await fetch("/api/users/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username: username.trim(),
          bio: bio.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to complete onboarding");
        setIsSubmitting(false);
        return;
      }

      // Success! Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!ready || !authenticated) return null;

  return (
    <>
      <Head>
        <title>Welcome to Fort Worth TX DAO</title>
      </Head>

      <main className="relative flex min-h-screen min-w-full overflow-hidden bg-gradient-to-br from-violet-50 via-white to-blue-50">
        {/* Cybernetic Animation Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
          <style jsx>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(180deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 0.5; }
            }
            .cyber-grid {
              position: absolute;
              width: 100%;
              height: 100%;
              background-image:
                linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px);
              background-size: 50px 50px;
              animation: float 20s ease-in-out infinite;
            }
            .cyber-particle {
              position: absolute;
              width: 4px;
              height: 4px;
              background: radial-gradient(circle, rgba(139, 92, 246, 0.6), transparent);
              border-radius: 50%;
              animation: pulse 3s ease-in-out infinite;
            }
          `}</style>
          <div className="cyber-grid" />
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="cyber-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-1 p-6 justify-center items-center">
          <div className="max-w-2xl w-full">
            <div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl p-8 md:p-12 border border-violet-100">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32">
                    <Portal style={{ width: "100%", height: "100%" }} />
                  </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                  Welcome to Fort Worth TX DAO
                </h1>
                <p className="text-lg text-gray-600">
                  Growing Web3 Civic Excellence
                </p>
                <p className="text-sm text-gray-500 mt-4 max-w-xl mx-auto">
                  Complete your profile to join our community of innovators working to advance Fort Worth through emerging technology and civic engagement.
                </p>
              </div>

              {/* Onboarding Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Choose Your Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="e.g., civicbuilder"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition ${
                      usernameError ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                    disabled={isSubmitting}
                    maxLength={30}
                  />
                  {usernameError && (
                    <p className="mt-2 text-sm text-red-600">{usernameError}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    3-30 characters. Letters, numbers, underscores, and hyphens only.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Tell us about yourself <span className="text-gray-400">(Optional)</span>
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share your interests, expertise, or what brings you to Fort Worth TX DAO..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition resize-none"
                    disabled={isSubmitting}
                    maxLength={500}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {bio.length}/500 characters
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !username.trim() || !!usernameError}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Completing Profile...
                    </span>
                  ) : (
                    "Complete Profile & Join DAO"
                  )}
                </button>
              </form>

              {/* Additional Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    By joining, you'll receive basic membership with voting power and the ability to contribute to projects, forums, and DAO governance.
                  </p>
                  <a
                    href="https://constitution.fwtx.city"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-3 text-sm text-violet-600 hover:text-violet-700 font-medium"
                  >
                    Read our Constitution →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
