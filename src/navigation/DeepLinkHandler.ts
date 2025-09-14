/**
 * DeepLinkHandler - Utility for handling deep links in the app
 */
export class DeepLinkHandler {
  /**
   * Configure deep links with the navigation ref
   * @param navigationRef React Navigation reference
   */
  public static configureDeepLinks(navigationRef: any): void {
    // Store the navigation ref for later use
    this.navigationRef = navigationRef;
  }

  /**
   * Navigate directly to a screen using the navigation ref
   * This is useful for programmatic navigation from notifications
   *
   * @param screenName The name of the screen to navigate to
   * @param params Parameters to pass to the screen
   * @returns boolean indicating if navigation was attempted
   */
  public static navigate(screenName: string, params?: any): boolean {
    if (!this.navigationRef || !this.navigationRef.isReady()) {
      console.log('Navigation not ready, storing navigation request for later');
      this.pendingNavigation = {screenName, params};
      return false;
    }

    try {
      console.log(`Navigating to ${screenName}`, params);
      this.navigationRef.navigate(screenName, params);
      return true;
    } catch (error) {
      console.error('Error during navigation:', error);
      return false;
    }
  }

  /**
   * Handle a deep link URL
   * @param url The deep link URL to handle
   */
  public static handleDeepLink(url: string): void {
    if (!url) return;

    try {
      console.log('Handling deep link:', url);

      // Parse the URL
      const parsedUrl = new URL(url);
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

      // Check if we have a valid navigation ref
      if (!this.navigationRef || !this.navigationRef.isReady()) {
        console.log('Navigation not ready, storing deep link for later');
        this.pendingDeepLink = url;
        return;
      }

      // Handle different deep link paths
      if (pathSegments.length > 0) {
        switch (pathSegments[0]) {
          case 'event':
          case 'hackathon':
            if (pathSegments.length >= 3) {
              // Format: /event/[source]/[id]
              const source = pathSegments[1];
              const id = pathSegments[2];

              // Navigate to the event details screen
              this.navigationRef.navigate('EventDetails', {
                id,
                source,
              });
            }
            break;

          case 'chat':
          case 'message':
            if (pathSegments.length >= 2) {
              // Format: /chat/[conversationId]?senderId=xxx&senderName=xxx
              const conversationId = pathSegments[1];

              // Get query parameters
              const senderId = parsedUrl.searchParams.get('senderId') || '';
              const senderName =
                parsedUrl.searchParams.get('senderName') || 'User';
              const senderPhoto =
                parsedUrl.searchParams.get('senderPhoto') || '';

                // UserStack
              // Navigate to the chat screen
              this.navigationRef.navigate('UserStack', {
                conversationId,
                recipientId: senderId,
                recipientName: senderName,
                recipientPhoto: senderPhoto,
              });
            }
            break;

          // Add more cases for other deep link types

          default:
            console.log('Unknown deep link path:', pathSegments[0]);
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }

  /**
   * Process any pending deep link (called when navigation becomes ready)
   */
  public static processPendingDeepLink(): void {
    if (this.pendingDeepLink && this.navigationRef?.isReady()) {
      this.handleDeepLink(this.pendingDeepLink);
      this.pendingDeepLink = null;
    }

    // Also check for any pending direct navigation
    if (this.pendingNavigation && this.navigationRef?.isReady()) {
      const {screenName, params} = this.pendingNavigation;
      this.navigate(screenName, params);
      this.pendingNavigation = null;
    }
  }

  /**
   * Check for any pending navigation or deep links at app startup
   * This should be called when the navigation container is ready
   */
  public static checkPendingNavigation(): void {
    // Check for any pending deep link
    if (this.pendingDeepLink && this.navigationRef?.isReady()) {
      console.log('Processing pending deep link from app startup');
      this.handleDeepLink(this.pendingDeepLink);
      this.pendingDeepLink = null;
    }

    // Check for any pending direct navigation
    if (this.pendingNavigation && this.navigationRef?.isReady()) {
      console.log('Processing pending navigation from app startup');
      const {screenName, params} = this.pendingNavigation;
      this.navigate(screenName, params);
      this.pendingNavigation = null;
    }
  }

  // Private properties
  private static navigationRef: any = null;
  private static pendingDeepLink: string | null = null;
  private static pendingNavigation: {screenName: string; params: any} | null =
    null;
}
