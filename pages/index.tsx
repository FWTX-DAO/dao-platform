import Portal from "../components/graphics/portal";
import { useLogin } from "@privy-io/react-auth";
import { PrivyClient } from "@privy-io/server-auth";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookieAuthToken = req.cookies["privy-token"];

  // If no cookie is found, skip any further checks
  if (!cookieAuthToken) return { props: {} };

  const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
  const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

  try {
    const claims = await client.verifyAuthToken(cookieAuthToken);
    // Use this result to pass props to a page for server rendering or to drive redirects!
    // ref https://nextjs.org/docs/pages/api-reference/functions/get-server-side-props
    console.log({ claims });

    return {
      props: {},
      redirect: { destination: "/dashboard", permanent: false },
    };
  } catch (error) {
    return { props: {} };
  }
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => router.push("/dashboard"),
  });

  return (
    <>
      <Head>
        <title>Fort Worth TX DAO - Growing Web3 Civic Excellence</title>
      </Head>

      <main className="relative flex min-h-screen min-w-full overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/fw-background.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
          }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Cybernetic Animation Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <style jsx>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(180deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.8; }
            }
            .cyber-grid {
              position: absolute;
              width: 100%;
              height: 100%;
              background-image: 
                linear-gradient(rgba(100, 200, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(100, 200, 255, 0.1) 1px, transparent 1px);
              background-size: 50px 50px;
              animation: float 20s ease-in-out infinite;
            }
            .cyber-particle {
              position: absolute;
              width: 4px;
              height: 4px;
              background: radial-gradient(circle, rgba(100, 200, 255, 0.8), transparent);
              border-radius: 50%;
              animation: pulse 3s ease-in-out infinite;
            }
          `}</style>
          <div className="cyber-grid" />
          {/* Generate random cyber particles */}
          {[...Array(20)].map((_, i) => (
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
        <div className="relative z-20 flex flex-1 p-6 justify-center items-center">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">
                Welcome to Fort Worth TX DAO
              </h1>
              <p className="text-xl md:text-2xl text-gray-100 mb-4 drop-shadow-md">
                Growing Web3 Civic Excellence
              </p>
            </div>
            <div className="flex justify-center mb-8">
              <div className="w-64 h-64">
                <Portal style={{ width: "100%", height: "100%" }} />
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <button
                className="bg-violet-600 hover:bg-violet-700 py-3 px-6 text-white rounded-lg text-lg font-medium shadow-lg transform transition hover:scale-105"
                onClick={login}
              >
                Log in
              </button>
              <a
                href="https://constitution.fwtx.city"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 py-2 px-4 text-white rounded-lg text-base font-medium shadow-lg transform transition hover:scale-105"
              >
                📜 Read our Whitepaper and Constitution
              </a>
              <p className="text-sm text-gray-300 max-w-2xl mx-auto text-center mt-2 drop-shadow-md">
                Educating on Emerging Tech, and paying forward thought leadership on Cryptographic Governance and Digital Property Rights, social impacts of AI, and how Fort Worth can protect our Constituency's Sovreignty in the information age
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
