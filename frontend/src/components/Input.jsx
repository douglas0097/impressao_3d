function Input({ className = '', type = 'text', size = 'md', ...props }) {
  return <input {...props} type={type} className={`field-control field-input field-${size} ${className}`.trim()} />;
}

export default Input;
