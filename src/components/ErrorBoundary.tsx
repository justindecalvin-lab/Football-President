import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
    this.handleRecover = this.handleRecover.bind(this);
    this.handleResetGame = this.handleResetGame.bind(this);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleRecover() {
    this.setState({ hasError: false, error: null });
  }

  public handleResetGame() {
    if (window.confirm('Are you sure you want to reset all game data and start a new agency?')) {
      try {
        localStorage.removeItem('soccer_agent_agency');
        localStorage.removeItem('soccer_agent_players');
        localStorage.removeItem('soccer_agent_clubs');
        localStorage.removeItem('SOCCER_AGENT_SAVED_GAME_SLOT');
      } catch (e) {}
      window.location.reload();
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Temporary View Glitch</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              A temporary display error occurred. You can safely retry and recover your active career.
            </p>
            {this.state.error?.message && (
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-left text-[11px] font-mono text-red-300 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleRecover}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recover & Continue Game</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetGame}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-300 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Data (New Game)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

