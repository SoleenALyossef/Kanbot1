import { useI18n, type MsgKey } from '../../i18n';
import { Dialog } from '../../components/ui/Dialog';

const ROWS: Array<{ keys: string[]; label: MsgKey }> = [
  { keys: ['Ctrl', 'K'], label: 'sc.palette' },
  { keys: ['/'], label: 'sc.search' },
  { keys: ['C'], label: 'sc.create' },
  { keys: ['?'], label: 'sc.help' },
  { keys: ['G', 'P'], label: 'sc.goProjects' },
  { keys: ['G', 'L'], label: 'sc.goBacklog' },
  { keys: ['G', 'B'], label: 'sc.goBoard' },
  { keys: ['G', 'S'], label: 'sc.goSprints' },
];

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Dialog title={t('sc.title')} size="sm" onClose={onClose}>
      <ul className="shortcut-list">
        {ROWS.map((r) => (
          <li key={r.label}>
            <span>{t(r.label)}</span>
            <span className="shortcut-keys" dir="ltr">
              {r.keys.map((k, i) => (
                <span key={k + i}>
                  {i > 0 && r.keys[0] === 'G' ? <em>{t('sc.then')}</em> : null}
                  <kbd>{k}</kbd>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
