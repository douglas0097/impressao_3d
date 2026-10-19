function Select({ className = '', size = 'md', children, ...props }) {
  return (
    <select {...props} className={`field-control field-select field-${size} ${className}`.trim()}>
      {children}
    </select>
  );
}

export default Select;
