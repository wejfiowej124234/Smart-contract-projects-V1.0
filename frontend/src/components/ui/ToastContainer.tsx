import { useEffect } from "react";
import { useToast } from "../../state/toast";
import { closeLabel } from "../../config/ui";

const TOAST_AUTO_DISMISS_MS = 5000;

/** F6: Renders toasts from ToastProvider; auto-dismiss after TOAST_AUTO_DISMISS_MS. */
export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toastContainer" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          id={t.id}
          message={t.message}
          variant={t.variant}
          link={t.link}
          onDismiss={() => removeToast(t.id)}
          autoDismissMs={TOAST_AUTO_DISMISS_MS}
        />
      ))}
    </div>
  );
}

type ToastLink = { url: string; label: string };

function ToastItem({
  id,
  message,
  variant,
  link,
  onDismiss,
  autoDismissMs,
}: {
  id: string;
  message: string;
  variant: "success" | "error" | "info";
  link?: ToastLink;
  onDismiss: () => void;
  autoDismissMs: number;
}) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(t);
  }, [id, onDismiss, autoDismissMs]);

  return (
    <div className={`toast toast-${variant}`} role="status">
      <div className="toastBody">
        <span className="toastMessage">{message}</span>
        {link && (
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="toastLink"
          >
            {link.label}
          </a>
        )}
      </div>
      <button
        type="button"
        className="toastDismiss"
        onClick={onDismiss}
        aria-label={closeLabel}
      >
        ×
      </button>
    </div>
  );
}
