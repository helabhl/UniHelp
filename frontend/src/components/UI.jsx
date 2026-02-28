import { forwardRef } from 'react'

// ── Button ────────────────────────────────────────────────────────────────────
const variantStyles = {
  primary: {
    background: 'linear-gradient(135deg, var(--navy), var(--navy-2))',
    color: '#fff',
    border: '1px solid transparent',
    boxShadow: '0 2px 8px rgba(13,31,60,0.3)',
  },
  gold: {
    background: 'linear-gradient(135deg, var(--gold), var(--gold-2))',
    color: '#fff',
    border: '1px solid transparent',
    boxShadow: '0 2px 8px rgba(184,134,11,0.35)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-2)',
    border: '1px solid var(--border)',
  },
  danger: {
    background: 'var(--red-bg)',
    color: 'var(--red)',
    border: '1px solid var(--red-border)',
  },
  success: {
    background: 'var(--green-bg)',
    color: 'var(--green)',
    border: '1px solid var(--green-border)',
  },
}

export function Button({
  children, variant = 'primary', size = 'md',
  loading = false, icon, fullWidth = false,
  className = '', style = {}, ...props
}) {
  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px', gap: '5px', borderRadius: '6px' },
    md: { padding: '9px 18px', fontSize: '13.5px', gap: '7px', borderRadius: '8px' },
    lg: { padding: '12px 26px', fontSize: '15px', gap: '8px', borderRadius: '10px' },
  }

  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer',
        transition: 'var(--transition)', userSelect: 'none',
        width: fullWidth ? '100%' : undefined,
        opacity: (props.disabled || loading) ? 0.55 : 1,
        ...variantStyles[variant], ...sizes[size], ...style,
      }}
      onMouseEnter={e => { if (!props.disabled && !loading) e.currentTarget.style.filter = 'brightness(1.08)' }}
      onMouseLeave={e => { e.currentTarget.style.filter = '' }}
      className={className}
    >
      {loading ? <Spinner size={14} color="currentColor" /> : icon}
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = forwardRef(function Input({ label, error, icon, ...props }, ref) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <Label>{label}</Label>}
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--muted)', pointerEvents: 'none', display: 'flex',
          }}>{icon}</div>
        )}
        <input
          ref={ref}
          {...props}
          style={{
            width: '100%', padding: icon ? '10px 12px 10px 36px' : '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: `1.5px solid ${error ? 'var(--red)' : 'var(--border)'}`,
            background: 'var(--surface)', fontSize: 13.5,
            fontFamily: 'var(--font-body)', color: 'var(--text)', outline: 'none',
            transition: 'var(--transition)',
            ...props.style,
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--navy)'; e.target.style.boxShadow = '0 0 0 3px rgba(13,31,60,0.08)'; }}
          onBlur={e => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'; e.target.style.boxShadow = ''; }}
        />
      </div>
      {error && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>}
    </div>
  )
})

// ── Textarea ──────────────────────────────────────────────────────────────────
export const Textarea = forwardRef(function Textarea({ label, error, ...props }, ref) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <Label>{label}</Label>}
      <textarea
        ref={ref}
        {...props}
        style={{
          width: '100%', padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          border: `1.5px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          background: 'var(--surface)', fontSize: 13.5,
          fontFamily: 'var(--font-body)', color: 'var(--text)', outline: 'none',
          resize: 'vertical', lineHeight: 1.65,
          transition: 'var(--transition)',
          ...props.style,
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--navy)'; e.target.style.boxShadow = '0 0 0 3px rgba(13,31,60,0.08)'; }}
        onBlur={e => { e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'; e.target.style.boxShadow = ''; }}
      />
      {error && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>}
    </div>
  )
})

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ label, options = [], ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <Label>{label}</Label>}
      <select
        {...props}
        style={{
          width: '100%', padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1.5px solid var(--border)',
          background: 'var(--surface)', fontSize: 13.5,
          fontFamily: 'var(--font-body)', color: 'var(--text)', outline: 'none',
          cursor: 'pointer', transition: 'var(--transition)',
          ...props.style,
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--navy)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Label ─────────────────────────────────────────────────────────────────────
export function Label({ children, required }) {
  return (
    <label style={{
      fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
    }}>
      {children}{required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
    </label>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, hover = false, onClick, className = '' }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
        transition: 'var(--transition)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={hover || onClick ? (e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-2)'; }) : undefined}
      onMouseLeave={hover || onClick ? (e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border)'; }) : undefined}
    >
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const badgeStyles = {
  pdf:     { bg: '#dbeafe', color: '#1e40af' },
  rule:    { bg: '#d1fae5', color: '#166534' },
  faq:     { bg: '#fef9c3', color: '#854d0e' },
  note:    { bg: '#fce7f3', color: '#9d174d' },
  default: { bg: 'var(--bg-2)', color: 'var(--text-3)' },
}

export function Badge({ type, children }) {
  const s = badgeStyles[type] || badgeStyles.default
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 5, padding: '2px 8px',
      fontSize: 11, fontWeight: 700,
      letterSpacing: '0.04em',
    }}>
      {children}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 18, color = 'var(--navy)' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid transparent`,
      borderTopColor: color, borderRightColor: color,
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )
}

// ── Typing dots ───────────────────────────────────────────────────────────────
export function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--navy)',
          animation: 'pulse-dot 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      textAlign: 'center', padding: '64px 32px',
      background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
      border: '1.5px dashed var(--border)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-2)', marginBottom: 8 }}>{title}</div>
      {description && <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 20, maxWidth: 320, margin: '0 auto 20px' }}>{description}</div>}
      {action}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, color = 'var(--navy)', sub }) {
  return (
    <Card style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: 30, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{sub}</div>}
    </Card>
  )
}

// ── Page header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--navy)', margin: '0 0 4px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: 0 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
