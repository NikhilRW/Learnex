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
  }

  // Private properties
  private static navigationRef: any = null;
  private static pendingDeepLink: string | null = null;
}
