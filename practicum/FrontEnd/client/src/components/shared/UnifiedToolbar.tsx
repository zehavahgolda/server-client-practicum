import type { ReactNode } from "react";
import "./UnifiedToolbar.css";

interface UnifiedToolbarProps {
  filters: ReactNode;
  summary: ReactNode;
  grouping: ReactNode;
  actionButton: ReactNode;
}

export default function UnifiedToolbar({
  filters,
  summary,
  grouping,
  actionButton
}: UnifiedToolbarProps) {
  return (
    <section className="unified-toolbar-card">
      <div className="unified-filter-row">{filters}</div>

      <div className="unified-toolbar-divider" />

      <div className="unified-toolbar-footer">
        <div className="unified-summary-row">{summary}</div>

        <div className="unified-toolbar-right">
          <div className="unified-view-row">{grouping}</div>

          <div className="unified-actions-row">{actionButton}</div>
        </div>
      </div>
    </section>
  );
}
