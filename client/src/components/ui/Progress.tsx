export function ProgressBar({ value, label, tone = 'primary' }: { value: number; label: string; tone?: 'primary' | 'done' | 'danger' }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`progress progress-${tone}`} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress-fill" style={{ width: `${v}%` }} />
    </div>
  );
}
