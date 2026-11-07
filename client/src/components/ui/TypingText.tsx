import { useTypingLoop } from '../../hooks/useTyping';
import { cn } from '../../lib/cn';

interface Props {
  phrases: string[];
  loop?: boolean;
  className?: string;
  typeMs?: number;
  startDelay?: number;
}

/** Letter-by-letter typing with a blinking caret. Screen readers get the full first phrase. */
export function TypingText({ phrases, loop = true, className, typeMs, startDelay }: Props) {
  const text = useTypingLoop(phrases, { loop, typeMs, startDelay });
  return (
    <span className={cn('typing', className)}>
      <span aria-hidden="true">{text}</span>
      <span className="caret" aria-hidden="true" />
      <span className="sr-only">{phrases[0]}</span>
    </span>
  );
}
