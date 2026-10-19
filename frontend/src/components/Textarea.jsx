function Textarea({ className = '', rows = 3, ...props }) {
  return <textarea {...props} rows={rows} className={`field-control field-textarea ${className}`.trim()} />;
}

export default Textarea;
