import type { ReactNode } from "react";
import { Component } from "react";

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
        <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
          <h2>Something went wrong</h2>
          <p style={{ opacity: 0.8, fontSize: 14 }}>
            A rendering error occurred. This is a demo app, so the safest recovery is to reload.
          </p>
          <pre style={{ whiteSpace: "pre-wrap", background: "#0b1220", color: "#e5e7eb", padding: 12, borderRadius: 8 }}>
            {this.state.error.message}
          </pre>
          <button style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
