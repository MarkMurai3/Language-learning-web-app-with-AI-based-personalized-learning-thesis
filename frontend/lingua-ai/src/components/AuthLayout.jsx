// src/components/AuthLayout.jsx
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-bg">
      <div className="auth-wrap">
        <div className="auth-hero">
          <div className="auth-heroTitle">{title}</div>
          {subtitle ? <div className="auth-heroSubtitle">{subtitle}</div> : null}
        </div>

        <div className="auth-card">
          {children}
        </div>
      </div>
    </div>
  );
}