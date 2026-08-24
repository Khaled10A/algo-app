import { Component } from "react";
import { getPalette, FONT_SANS } from "../theme/tokens";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Algo App crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            background: "#020817",
            color: "#e2e8f0",
            fontFamily: "'Courier New', monospace",
          }}
        >
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontSize: 14, letterSpacing: 2 }}>SOMETHING WENT WRONG</div>
          <div style={{ fontSize: 11, color: "#64748b", maxWidth: 480, textAlign: "center", wordBreak: "break-word" }}>
            {String(this.state.error?.message || this.state.error)}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              border: "1px solid #1e293b",
              background: "#0f172a",
              color: "#94a3b8",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            RELOAD APP STATE
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
