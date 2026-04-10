import { useState } from 'react'
import logo from '../assets/images/logo_no_bg.png'
import '../assets/styles/login.css'

const footerLinks = [
  { label: 'Terms of Service', href: '#terms' },
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Help Center', href: '#help' },
]

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  )
}

export default function LoginCard() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <section className="login-shell">
      <main className="login-main">
        <div className="login-panel">
          <article className="login-card">
            <div className="login-card-body">
              <header className="login-header">
                <div className="login-brand-mark">
                  <img src={logo} alt="InternHub Logo" className="login-brand-image" />
                </div>
                <h1>Welcome back</h1>
                <p>Enter your credentials to access your dashboard</p>
              </header>

              <form className="login-form">
                <div className="login-field-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="login-input-wrap">
                    <Icon name="mail" className="login-input-icon" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@university.edu"
                    />
                  </div>
                </div>

                <div className="login-field-group">
                  <div className="login-field-topline">
                    <label htmlFor="password">Password</label>
                    <a href="#forgot-password">Forgot password?</a>
                  </div>

                  <div className="login-input-wrap">
                    <Icon name="lock" className="login-input-icon" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="login-visibility-button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                    >
                      <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
                    </button>
                  </div>
                </div>

                <label className="login-checkbox-row" htmlFor="remember">
                  <input id="remember" type="checkbox" />
                  <span>Keep me logged in</span>
                </label>

                <button type="submit" className="login-submit-button">
                  Sign In
                </button>
              </form>
            </div>

            <footer className="login-card-footer">
              <p>
                {"Don't have an account?"}
                <a href="#join">Join InternHub</a>
              </p>
            </footer>
          </article>

          <nav className="login-footer-links" aria-label="Support links">
            {footerLinks.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </main>

      <div className="login-bottom-bar" aria-hidden="true" />
    </section>
  )
}
