import React from "react";
import { Github, ShieldCheck } from "lucide-react";

const Login = () => {
  const handleLogin = () => {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    window.location.href = `${baseUrl}/auth/github`;
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div className="bg-gradient" />

      <div
        className="glass-card"
        style={{
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          padding: "48px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg, var(--primary), var(--secondary))",
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={32} color="white" />
          </div>

          <h1 style={{ fontSize: "2rem", color: "white" }}>
            GitGuard AI
          </h1>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1rem",
            }}
          >
            Production-grade PR security & performance analysis.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={handleLogin}
          style={{
            width: "100%",
            justifyContent: "center",
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Github size={20} />
          Login with GitHub
        </button>

        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-muted)",
          }}
        >
          By logging in, you agree to our terms of service and security policy.
        </p>
      </div>
    </div>
  );
};

export default Login;