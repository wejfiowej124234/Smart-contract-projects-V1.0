import type { ReactNode } from "react";
import { Component } from "react";
import { errorBoundaryTitle, errorBoundaryBody, reloadLabel } from "../config/ui";

type Props = {
  children: ReactNode;
};

type State = {
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // Enterprise note: keep a structured log for debugging. In real products, this is sent to telemetry.
    console.error("[ErrorBoundary] uncaught render error", { error, info });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="errorBoundaryWrap">
          <div className="banner bannerErr">
            <div className="bannerTitle">{errorBoundaryTitle}</div>
            <div className="muted errorBoundaryBody">{errorBoundaryBody}</div>
            <pre className="mono errorBoundaryPre">{this.state.error.message}</pre>
            <button className="btn btnPrimary errorBoundaryBtn" onClick={() => window.location.reload()}>
              {reloadLabel}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
