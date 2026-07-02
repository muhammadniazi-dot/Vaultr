import axios from 'axios';

/**
 * Turns any thrown error (axios response, network failure, or generic Error)
 * into a short, customer-friendly message suitable for display in the UI.
 *
 * Prefers the backend's own `{ error: "..." }` payload, then falls back to
 * status-code-specific guidance, then a generic message.
 */
export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(err)) {
    // Backend sent a structured error message — trust it, it's already user-facing.
    const backendMessage = err.response?.data?.error;
    if (typeof backendMessage === 'string' && backendMessage.length > 0) {
      return backendMessage;
    }

    // No response at all usually means the server is unreachable.
    if (!err.response) {
      return 'Cannot reach the server. Check your connection and make sure the backend is running.';
    }

    switch (err.response.status) {
      case 400:
        return 'Please check the details you entered and try again.';
      case 401:
        return 'Incorrect email or password.';
      case 403:
        return 'You do not have permission to do that.';
      case 404:
        return 'We could not find what you were looking for.';
      case 409:
        return 'That already exists. Try logging in instead.';
      case 429:
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        if (err.response.status >= 500) {
          return 'The server ran into a problem. Please try again shortly.';
        }
        return fallback;
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return fallback;
}
