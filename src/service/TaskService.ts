// /**
//  * Test notifications by creating a test notification
//  * This can be used to verify notification delivery
//  */
// async testNotification(): Promise<boolean> {
//   try {
//     const PushNotificationHandler = require('../utils/PushNotificationHandler').PushNotificationHandler;
//     const notificationId = await PushNotificationHandler.testTriggerNotification();
//     return !!notificationId;
//   } catch (error) {
//     console.error('Error testing notification:', error);
//     return false;
//   }
// } 