import { settingsPlaceholderF5Optional } from "../config/ui";

/** Placeholder for Settings (F5 optional). P2 audit: we explicitly mark this as F5 optional. */
export function SettingsPage() {
  return (
    <section className="sectionPlaceholder">
      <h2 className="sectionTitle">Settings</h2>
      <p className="muted">{settingsPlaceholderF5Optional}</p>
    </section>
  );
}
