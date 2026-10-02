/** Shared button styles; native attributes and refs are forwarded to the button. */
function Button({ children, variant = 'primary', size = 'md', fullWidth = false, loading = false, disabled = false, type = 'button', className = '', ...props }) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || props['aria-busy'] || undefined}
      className={`btn btn-${variant} btn-${size}${fullWidth ? ' btn-full' : ''} ${className}`.trim()}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

export default Button;
