import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface ShellProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (a: { describedBy: string | undefined }) => ReactNode;
}

function FieldShell({ id, label, hint, error, required, className, children }: ShellProps) {
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [error ? errId : null, hint && !error ? hintId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('field', error && 'field-invalid', className)}>
      {label ? (
        <label htmlFor={id} className="field-label">
          {label}
          {required ? (
            <span className="req" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children({ describedBy })}
      {hint && !error ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface CommonFieldProps {
  label?: string;
  hint?: string;
  error?: string;
}

interface TextFieldExtras {
  /** Leading icon inside the input. */
  icon?: LucideIcon;
  /** Trailing control inside the input (e.g. a show/hide button). */
  adornment?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, CommonFieldProps & TextFieldExtras & InputHTMLAttributes<HTMLInputElement>>(
  function TextField({ label, hint, error, required, className, icon: Icon, adornment, ...props }, ref) {
    const id = useId();
    return (
      <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
        {({ describedBy }) => (
          <div className={cn('input-wrap', Icon && 'has-icon', Boolean(adornment) && 'has-adornment')}>
            {Icon ? <Icon className="input-icon" size={17} aria-hidden="true" /> : null}
            <input
              ref={ref}
              id={id}
              className="input"
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              aria-required={required || undefined}
              {...props}
            />
            {adornment ? <span className="input-adorn">{adornment}</span> : null}
          </div>
        )}
      </FieldShell>
    );
  },
);

export const TextAreaField = forwardRef<HTMLTextAreaElement, CommonFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextAreaField({ label, hint, error, required, className, rows = 4, ...props }, ref) {
    const id = useId();
    return (
      <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
        {({ describedBy }) => (
          <textarea
            ref={ref}
            id={id}
            rows={rows}
            className="input textarea"
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            {...props}
          />
        )}
      </FieldShell>
    );
  },
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export const SelectField = forwardRef<
  HTMLSelectElement,
  CommonFieldProps & { options: SelectOption[] } & SelectHTMLAttributes<HTMLSelectElement>
>(function SelectField({ label, hint, error, options, className, ...props }, ref) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      {({ describedBy }) => (
        <select
          ref={ref}
          id={id}
          className="input select"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
});

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div className="form-error" role="alert">
      {children}
    </div>
  );
}
