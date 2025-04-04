interface FirebaseError {
  code?: string;
  message?: string;
  name?: string;
  stack?: string;
}

export class FirebaseErrorHandler {
  /**
   * Handles Firebase errors consistently across the application
   *
   * @param error The error thrown by Firebase operations
   * @param defaultMessage Default message to display if error is not recognized
   * @returns A standardized error object
   */
  handleError(
    error: unknown,
    defaultMessage: string = 'An error occurred',
  ): Error {
    // Log the original error for debugging
    console.error('Firebase error:', error);

    // If it's a Firebase error with a code, handle it specifically
    if (typeof error === 'object' && error !== null) {
      const firebaseError = error as FirebaseError;

      // If we have a Firebase error code, provide a more specific message
      if (firebaseError.code) {
        switch (firebaseError.code) {
          case 'permission-denied':
            return new Error(
              'You do not have permission to perform this action',
            );

          case 'unauthenticated':
          case 'auth/user-not-found':
          case 'auth/invalid-credential':
            return new Error('Authentication error. Please sign in again');

          case 'not-found':
            return new Error('The requested resource was not found');

          case 'already-exists':
            return new Error('This resource already exists');

          case 'resource-exhausted':
            return new Error(
              'You have exceeded your quota. Please try again later',
            );

          case 'failed-precondition':
            return new Error(
              'The operation failed. Please ensure all conditions are met',
            );

          case 'deadline-exceeded':
            return new Error('Request timeout. Please try again');

          case 'cancelled':
            return new Error('Operation was cancelled');

          case 'unavailable':
            return new Error(
              'Service is currently unavailable. Please check your connection',
            );

          default:
            // If we have a message, use it, otherwise use the code
            if (firebaseError.message) {
              return new Error(firebaseError.message);
            } else {
              return new Error(`Firebase error: ${firebaseError.code}`);
            }
        }
      }

      // If there's a message but no code
      if (firebaseError.message) {
        return new Error(firebaseError.message);
      }
    }

    // For any other type of error or if we couldn't extract useful information
    if (error instanceof Error) {
      return error;
    }

    // As a last resort, return the default error message
    return new Error(defaultMessage);
  }
}
