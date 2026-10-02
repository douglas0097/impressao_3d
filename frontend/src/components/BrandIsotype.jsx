const BrandIsotype = ({ size = 24, className = '' }) => (
  <svg
    aria-hidden="true"
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2.75 20 7.3 12 11.85 4 7.3 12 2.75Z"
      fill="currentColor"
      opacity=".2"
    />
    <path
      d="m4 7.3 8 4.55 8-4.55M12 11.85v9.4M4 7.3v9.4l8 4.55 8-4.55V7.3l-8-4.55L4 7.3Z"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m4.5 12.05 7.5 4.2 7.5-4.2M4.5 15.65l7.5 4.2 7.5-4.2"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity=".72"
    />
  </svg>
);

export default BrandIsotype;
