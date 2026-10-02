import Button from './Button';
function PageHeader({ title, subtitle, buttonLabel, onButtonClick, buttonIcon, buttonDisabled = false }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="mb-0 text-2xl tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {buttonLabel && (
        <Button
          type="button"
          className="shrink-0 self-start sm:self-auto"
          onClick={onButtonClick}
          disabled={buttonDisabled}
        >
          {buttonIcon}
          {buttonLabel}
        </Button>
      )}
    </header>
  );
}

export default PageHeader;
