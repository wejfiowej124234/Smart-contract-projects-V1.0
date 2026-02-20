import { useState, useRef, useEffect } from "react";

/**
 * Two-line (or multi-line) hover tooltip for Aave-style readability.
 * Renders a positioned popover on hover/focus; does not rely on native title.
 */
export function Tooltip(props: {
  /** First line (e.g. "Borrowed / Max borrow") */
  line1: string;
  /** Second line (e.g. threshold bands) */
  line2: string;
  children: React.ReactNode;
  /** Optional class on wrapper */
  className?: string;
}) {
  const { line1, line2, children, className } = props;
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const onScroll = () => setVisible(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [visible]);

  return (
    <div
      ref={wrapperRef}
      className={`tooltipWrap ${className ?? ""}`.trim()}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="tooltipBubble" role="tooltip">
          <span className="tooltipLine1">{line1}</span>
          <span className="tooltipLine2">{line2}</span>
        </div>
      )}
    </div>
  );
}
