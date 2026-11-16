import React from 'react';
import { View } from 'react-native';
import { ErrorState } from '@/components/States';
import { logger } from '@/utils/logger';

type State = { error: Error | null };

/** Catches render errors so the app shows a recovery screen instead of crashing. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Phase 4: forward to a crash reporter (no PII).
    logger.error('Unhandled render error', error.message, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ErrorState message="Something unexpected happened. Please try again." onRetry={this.reset} />
        </View>
      );
    }
    return this.props.children;
  }
}
