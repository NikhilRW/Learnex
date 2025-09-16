// Custom UUID generator that doesn't rely on crypto.getRandomValues()
export const generateUUID = (): string => {
  // Use a timestamp-based prefix to ensure uniqueness
  const timestamp = Date.now().toString(36);

  // Generate random segments
  const randomSegment1 = Math.random().toString(36).substring(2, 15);
  const randomSegment2 = Math.random().toString(36).substring(2, 15);

  // Combine timestamp and random segments to form a UUID-like string
  return `${timestamp}-${randomSegment1}-${randomSegment2}`;
};

export const logDebug = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[LexAI ${timestamp}] ${message}`;
    console.log(logMessage);
    if (data) {
        console.log('Data:', JSON.stringify(data, null, 2));
    }
};