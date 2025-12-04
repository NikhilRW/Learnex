# LinkedIn OAuth Implementation Tutorial

A comprehensive guide to implementing LinkedIn OAuth authentication in React Native using Firebase Authentication.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Code Breakdown](#code-breakdown)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

---

## Overview

This tutorial demonstrates how to implement LinkedIn OAuth authentication in a React Native application using:
- **Firebase Authentication** with OIDC (OpenID Connect) provider
- **React Native WebView** for OAuth flow
- **LinkedIn OAuth 2.0 API**
- **Redux** for state management

### What You'll Build

A complete LinkedIn authentication flow that:
1. Opens a WebView with LinkedIn's authorization page
2. Captures the authorization code from the redirect
3. Exchanges the code for an access token
4. Signs in to Firebase using the LinkedIn OIDC provider
5. Creates or updates user data in Firestore

---

## Prerequisites

### Required Tools & Libraries

```json
{
  "dependencies": {
    "@react-native-firebase/auth": "^latest",
    "@react-native-firebase/firestore": "^latest",
    "react-native-webview": "^latest",
    "react-native-config": "^latest",
    "axios": "^latest",
    "react-native-snackbar": "^latest",
    "@reduxjs/toolkit": "^latest"
  }
}
```

### LinkedIn Developer Setup

1. **Create a LinkedIn App:**
   - Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
   - Create a new app
   - Note your **Client ID** and **Client Secret**

2. **Configure OAuth Settings:**
   - Add redirect URI: `https://your-domain.com/auth/linkedin/sign-in`
   - Request scopes: `email`, `profile`

3. **Firebase Setup:**
   - Enable OIDC provider in Firebase Authentication
   - Provider ID: `azure-test` (or your custom ID)
   - Configure issuer URL and client credentials

### Environment Variables

Create a `.env` file:

```env
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
```

---

## Architecture

### Flow Diagram

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   User      │      │   WebView    │      │   LinkedIn   │
│  Clicks     │─────▶│   Opens      │─────▶│   Auth Page  │
│  LinkedIn   │      │              │      │              │
└─────────────┘      └──────────────┘      └──────────────┘
                            │                       │
                            │    User Authorizes    │
                            │◀──────────────────────│
                            │                       │
                            ▼                       │
                     ┌──────────────┐              │
                     │   Redirect   │◀─────────────┘
                     │  with Code   │
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Exchange   │
                     │   Code for   │
                     │   Token      │
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐      ┌──────────────┐
                     │   Firebase   │      │   Firestore  │
                     │   Sign In    │─────▶│   User Doc   │
                     │              │      │   Created    │
                     └──────────────┘      └──────────────┘
```

### Key Components

1. **LinkedInAuth Screen** - Handles WebView and OAuth flow
2. **AuthService** - Manages Firebase authentication
3. **Navigation** - Routes between auth screens
4. **Redux Store** - Manages authentication state

---

## Step-by-Step Implementation

### Step 1: Create the LinkedIn Auth Screen

Create `LinkedInAuth.tsx`:

```tsx
import axios from 'axios';
import React, { useRef } from 'react';
import { View } from 'react-native';
import Config from 'react-native-config';
import WebView from 'react-native-webview';
import { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import Snackbar from 'react-native-snackbar';
import { useTypedDispatch } from 'hooks/redux/useTypedDispatch';
import { changeIsLoggedIn, changeProfileColor } from 'shared/reducers/User';
import { getRandomColors } from 'shared/helpers/common/stringHelpers';

const LinkedInAuth = () => {
  const ref = useRef<WebView>(null);
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const dispatch = useTypedDispatch();

  // Handle URL changes in WebView
  const handleURIChange = (event: ShouldStartLoadRequest) => {
    if (event.url.includes('code=')) {
      handleDeepLink(event.url);
      return false; // Prevent navigation
    } else {
      return true; // Allow navigation
    }
  };

  // Exchange authorization code for access token
  const handleDeepLink = async (url: string) => {
    const authenticationCode = new URL(url).searchParams.get('code');
    
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
        grant_type: 'authorization_code',
        code: authenticationCode,
        client_id: Config.LINKEDIN_CLIENT_ID!,
        client_secret: Config.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: 'https://learnex-web.vercel.app/auth/linkedin/sign-in',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    if (response.data.access_token !== null) {
      const { success, error } = await firebase.auth.linkedinSignIn(
        response.data.access_token,
      );
      
      if (success) {
        dispatch(changeProfileColor(getRandomColors()));
        dispatch(changeIsLoggedIn(true));
      } else {
        Snackbar.show({
          text: 'Login Unsuccessful Due To : ' + error,
          duration: Snackbar.LENGTH_LONG,
          textColor: 'white',
          backgroundColor: '#007cb5',
        });
        console.log(error);
      }
    } else {
      Snackbar.show({ text: 'LinkedIn Authentication Failed' });
    }
  };

  return (
    <View className="flex-1">
      <WebView
        source={{
          uri: 'https://www.linkedin.com/oauth/v2/authorization?redirect_uri=https%3A%2F%2Flearnex-web.vercel.app%2Fauth%2Flinkedin%2Fsign-in&client_id=782j1d8cgc8xaw&response_type=code&scope=email%20profile',
        }}
        style={{
          flex: 1,
          height: '100%',
          position: 'absolute',
          zIndex: 1000,
          width: '100%',
          top: 0,
          left: 0,
        }}
        ref={ref}
        onShouldStartLoadWithRequest={handleURIChange}
      />
    </View>
  );
};

export default LinkedInAuth;
```

**Key Points:**

- **WebView** displays LinkedIn's OAuth page
- **onShouldStartLoadWithRequest** intercepts URL changes
- **handleDeepLink** extracts the code and exchanges it for a token
- **axios.post** calls LinkedIn's token endpoint with `application/x-www-form-urlencoded` format

---

### Step 2: Implement Auth Service Method

Add to `AuthService.ts`:

```typescript
async linkedinSignIn(accessToken: string): Promise<AuthResponse> {
  try {
    // Create OIDC credential with LinkedIn token
    const linkedinCredential = OIDCAuthProvider.credential(
      'azure-test', // Your OIDC provider ID from Firebase
      accessToken,
    );
    
    console.log('accessToken', accessToken);
    await getAuth().signInWithCredential(linkedinCredential);

    // Handle user document (create or update)
    const user = getAuth().currentUser;
    if (user) {
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        // First time user - create new document
        const usersRef = collection(
          db,
          'users',
        ) as FirebaseFirestoreTypes.CollectionReference<FirebaseUser>;
        
        const newUserDoc: FirebaseUser = {
          uid: user.uid,
          email: user.email || '',
          username:
            user.displayName || user.email?.split('@')[0] || 'LinkedIn User',
          fullName: user.displayName || 'LinkedIn User',
          isLoggedIn: true,
          savedPosts: [],
          createdAt: serverTimestamp() as any,
          image:
            user.photoURL ||
            `https://avatar.iran.liara.run/username?username=${encodeURIComponent(
              user.displayName || 'Anonymous',
            )}`,
        };
        
        await setDoc(doc(usersRef, user.uid), newUserDoc);
      } else {
        // Returning user - update isLoggedIn status
        await updateDoc(doc(db, 'users', user.uid), {
          isLoggedIn: true,
          lastLogin: serverTimestamp(),
        });
      }
    }
    
    return { success: true };
  } catch (error) {
    console.log('AuthService :: linkedinSignIn() ::', error);
    return { success: false, error };
  }
}
```

**Key Points:**

- **OIDCAuthProvider.credential** creates a Firebase credential from LinkedIn token
- **getAuth().signInWithCredential** signs the user into Firebase
- **Firestore logic** creates a new user document or updates existing one
- **Error handling** returns structured response

---

### Step 3: Add Navigation Route

Update `AuthStack.tsx`:

```tsx
export type AuthStackParamList = {
  GettingStarted: undefined;
  SignUp: undefined;
  SignIn: undefined;
  LinkedInAuth: undefined; // Add this
};

// Inside AuthStack component
<Stack.Screen
  component={LinkedInAuth}
  options={{ headerShown: false }}
  name="LinkedInAuth"
/>
```

---

### Step 4: Add LinkedIn Button to Sign-In Screen

In `SignIn.tsx`, add the handler and button:

```tsx
const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);

const handleLinkedInSignIn = async () => {
  try {
    setIsLinkedInLoading(true);
    navigation.navigate('LinkedInAuth', undefined);
  } catch (error) {
    console.error('LinkedIn sign in error:', error);
    Snackbar.show({
      text: 'Failed to sign in with LinkedIn',
      duration: Snackbar.LENGTH_LONG,
      textColor: 'white',
      backgroundColor: '#ff3b30',
    });
  } finally {
    setIsLinkedInLoading(false);
  }
};

// In your OAuth buttons section:
<TouchableOpacity
  disabled={isLinkedInLoading || isSubmitting}
  onPress={handleLinkedInSignIn}
  style={{
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0066C8',
    borderRadius: 30,
  }}>
  {isLinkedInLoading ? (
    <ButtonLoader />
  ) : (
    <Image
      source={require('shared/res/webp/linkedin.webp')}
      style={{
        width: 38,
        height: 38,
        borderRadius: 30,
        marginBottom: 1.5,
      }}
    />
  )}
</TouchableOpacity>
```

---

## Code Breakdown

### 1. LinkedIn OAuth URL Construction

```typescript
const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
  `redirect_uri=${encodeURIComponent('https://your-domain.com/auth/linkedin/sign-in')}` +
  `&client_id=${YOUR_CLIENT_ID}` +
  `&response_type=code` +
  `&scope=email%20profile`;
```

**Parameters:**
- `redirect_uri`: Where LinkedIn redirects after authorization
- `client_id`: Your LinkedIn app's client ID
- `response_type=code`: Request authorization code (not token)
- `scope`: Requested permissions (email and profile)

---

### 2. Intercepting the Redirect

```typescript
const handleURIChange = (event: ShouldStartLoadRequest) => {
  if (event.url.includes('code=')) {
    handleDeepLink(event.url);
    return false; // Stop WebView navigation
  }
  return true; // Continue WebView navigation
};
```

**Why return false?**
- Prevents WebView from navigating to redirect URL
- Keeps user in the app
- Allows extraction of authorization code

---

### 3. Token Exchange

```typescript
const response = await axios.post(
  'https://www.linkedin.com/oauth/v2/accessToken',
  {
    grant_type: 'authorization_code',
    code: authenticationCode,
    client_id: Config.LINKEDIN_CLIENT_ID!,
    client_secret: Config.LINKEDIN_CLIENT_SECRET!,
    redirect_uri: 'https://learnex-web.vercel.app/auth/linkedin/sign-in',
  },
  {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  },
);
```

**Critical Details:**
- **Content-Type**: Must be `application/x-www-form-urlencoded`
- **redirect_uri**: Must match exactly with the one used in authorization
- **grant_type**: Always `authorization_code` for this flow
- **Response**: Contains `access_token`, `expires_in`, and `token_type`

---

### 4. Firebase OIDC Integration

```typescript
const linkedinCredential = OIDCAuthProvider.credential(
  'azure-test', // Provider ID configured in Firebase
  accessToken,
);
await getAuth().signInWithCredential(linkedinCredential);
```

**Firebase Configuration Required:**
1. Go to Firebase Console → Authentication → Sign-in method
2. Add OIDC provider
3. Set Provider ID (e.g., `azure-test`)
4. Configure issuer URL: `https://www.linkedin.com/oauth`
5. Add client ID and client secret

---

### 5. User Document Management

```typescript
const userDoc = await getDoc(doc(db, 'users', user.uid));

if (!userDoc.exists()) {
  // Create new user
  await setDoc(doc(usersRef, user.uid), newUserDoc);
} else {
  // Update existing user
  await updateDoc(doc(db, 'users', user.uid), {
    isLoggedIn: true,
    lastLogin: serverTimestamp(),
  });
}
```

**Best Practice:**
- Check if user exists before creating
- Use `serverTimestamp()` for accurate timestamps
- Store minimal essential data
- Update login status for analytics

---

## Testing

### Test Checklist

- [ ] LinkedIn button appears on Sign-In screen
- [ ] Clicking button opens WebView with LinkedIn auth page
- [ ] User can log in with LinkedIn credentials
- [ ] WebView closes after successful authentication
- [ ] User is redirected to main app screen
- [ ] User document is created/updated in Firestore
- [ ] Error messages display for failed authentication
- [ ] App handles cancelled authentication gracefully

### Testing on Different Platforms

**iOS:**
```bash
npx react-native run-ios
```

**Android:**
```bash
npx react-native run-android
```

### Common Test Scenarios

1. **First-time User:**
   - Verify user document created in Firestore
   - Check all fields populated correctly

2. **Returning User:**
   - Verify `isLoggedIn` updated to `true`
   - Check `lastLogin` timestamp updated

3. **Error Handling:**
   - Cancel authentication → Check snackbar message
   - Invalid credentials → Check error display
   - Network error → Check error handling

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "Invalid Redirect URI" Error

**Problem:** LinkedIn returns error about redirect URI mismatch

**Solution:**
```typescript
// Ensure EXACT match in three places:
// 1. LinkedIn Developer Console
// 2. WebView URI parameter
// 3. Token exchange request

const REDIRECT_URI = 'https://your-domain.com/auth/linkedin/sign-in';
```

#### 2. "Invalid Client" Error

**Problem:** LinkedIn doesn't recognize your client credentials

**Solution:**
- Verify `.env` file has correct `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`
- Restart Metro bundler after changing `.env`
- Rebuild app if using native modules

```bash
# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

#### 3. WebView Doesn't Close After Auth

**Problem:** WebView stays open after successful authentication

**Solution:**
```typescript
// Add navigation back after successful auth
if (success) {
  dispatch(changeProfileColor(getRandomColors()));
  dispatch(changeIsLoggedIn(true));
  navigation.goBack(); // Add this line
}
```

#### 4. "OIDC Provider Not Found" Error

**Problem:** Firebase doesn't recognize OIDC provider

**Solution:**
1. Verify provider ID in Firebase Console matches code
2. Ensure OIDC provider is enabled
3. Check Firebase project configuration

```typescript
// Provider ID must match Firebase config
const linkedinCredential = OIDCAuthProvider.credential(
  'azure-test', // This must match Firebase
  accessToken,
);
```

#### 5. CORS Errors in Development

**Problem:** Browser/WebView blocks requests due to CORS

**Solution:**
- LinkedIn token endpoint should work from mobile
- If testing in browser, use a proxy or backend
- For production, always use HTTPS

#### 6. Token Exchange Fails

**Problem:** axios.post returns 400 or 401

**Debug Steps:**
```typescript
console.log('Auth Code:', authenticationCode);
console.log('Client ID:', Config.LINKEDIN_CLIENT_ID);
console.log('Redirect URI:', REDIRECT_URI);

const response = await axios.post(
  'https://www.linkedin.com/oauth/v2/accessToken',
  // ... params
).catch(error => {
  console.log('Full Error:', error.response.data);
});
```

---

## Security Best Practices

### 1. Never Expose Client Secret in Frontend

**❌ Bad:**
```typescript
// Hardcoded in code
const CLIENT_SECRET = 'abc123xyz';
```

**✅ Good:**
```typescript
// Stored in .env file
const CLIENT_SECRET = Config.LINKEDIN_CLIENT_SECRET;

// Add to .gitignore
.env
.env.local
```

### 2. Use Backend Proxy for Token Exchange

**Recommended Architecture:**

```
Mobile App → Your Backend → LinkedIn API → Your Backend → Mobile App
```

**Benefits:**
- Keep client secret secure on server
- Add rate limiting
- Log authentication attempts
- Implement additional validation

**Example Backend Endpoint:**

```typescript
// Node.js/Express example
app.post('/api/auth/linkedin/token', async (req, res) => {
  const { code } = req.body;
  
  try {
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    
    res.json({ access_token: response.data.access_token });
  } catch (error) {
    res.status(400).json({ error: 'Token exchange failed' });
  }
});
```

### 3. Validate Tokens

```typescript
// Verify token before using
if (!response.data.access_token || 
    typeof response.data.access_token !== 'string') {
  throw new Error('Invalid token response');
}
```

### 4. Handle Token Expiration

```typescript
// LinkedIn tokens typically expire in 60 days
// Store token expiry
const tokenExpiry = Date.now() + (response.data.expires_in * 1000);

// Check before using
if (Date.now() > tokenExpiry) {
  // Refresh token or re-authenticate
}
```

### 5. Implement State Parameter

**Prevent CSRF attacks:**

```typescript
// Generate random state
const state = generateRandomString(32);

// Store in AsyncStorage
await AsyncStorage.setItem('oauth_state', state);

// Add to authorization URL
const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
  `state=${state}&` +
  `redirect_uri=...`;

// Verify on callback
const returnedState = new URL(url).searchParams.get('state');
const storedState = await AsyncStorage.getItem('oauth_state');

if (returnedState !== storedState) {
  throw new Error('State mismatch - possible CSRF attack');
}
```

### 6. Use HTTPS Only

```typescript
// Always use HTTPS for redirect URIs
const REDIRECT_URI = 'https://your-domain.com/auth/callback';

// Never use HTTP in production
// ❌ const REDIRECT_URI = 'http://...';
```

### 7. Secure User Data

```typescript
// Firestore security rules
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can only read/write their own data
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## Advanced Features

### 1. Auto-Close WebView on Success

```typescript
const handleDeepLink = async (url: string) => {
  // ... authentication logic
  
  if (success) {
    dispatch(changeIsLoggedIn(true));
    
    // Navigate back automatically
    navigation.goBack();
  }
};
```

### 2. Loading States

```tsx
const [isAuthenticating, setIsAuthenticating] = useState(false);

const handleDeepLink = async (url: string) => {
  setIsAuthenticating(true);
  try {
    // ... auth logic
  } finally {
    setIsAuthenticating(false);
  }
};

// Show loading overlay
{isAuthenticating && (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator size="large" />
    <Text>Authenticating with LinkedIn...</Text>
  </View>
)}
```

### 3. Error Recovery

```typescript
const handleDeepLink = async (url: string) => {
  try {
    // ... authentication
  } catch (error) {
    if (error.code === 'auth/network-request-failed') {
      Alert.alert(
        'Network Error',
        'Please check your internet connection',
        [
          { text: 'Retry', onPress: () => handleDeepLink(url) },
          { text: 'Cancel', onPress: () => navigation.goBack() },
        ]
      );
    }
  }
};
```

### 4. Profile Data Fetching

```typescript
// After getting access token, fetch LinkedIn profile
const fetchLinkedInProfile = async (accessToken: string) => {
  const response = await axios.get(
    'https://api.linkedin.com/v2/me',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    },
  );
  
  return {
    firstName: response.data.localizedFirstName,
    lastName: response.data.localizedLastName,
    profilePicture: response.data.profilePicture,
  };
};
```

---

## Performance Optimization

### 1. Lazy Load WebView

```typescript
import { lazy, Suspense } from 'react';

const WebView = lazy(() => import('react-native-webview'));

// In component
<Suspense fallback={<ActivityIndicator />}>
  <WebView source={{ uri: authUrl }} />
</Suspense>
```

### 2. Memoize Callbacks

```typescript
const handleURIChange = useCallback((event: ShouldStartLoadRequest) => {
  if (event.url.includes('code=')) {
    handleDeepLink(event.url);
    return false;
  }
  return true;
}, []);
```

### 3. Optimize Redux Updates

```typescript
// Batch updates
batch(() => {
  dispatch(changeProfileColor(getRandomColors()));
  dispatch(changeIsLoggedIn(true));
});
```

---

## Conclusion

You've now implemented a complete LinkedIn OAuth flow in React Native! This implementation:

✅ Uses secure OAuth 2.0 authorization code flow  
✅ Integrates with Firebase Authentication  
✅ Handles user creation and updates in Firestore  
✅ Provides proper error handling and user feedback  
✅ Follows security best practices  

### Next Steps

1. **Implement token refresh** for long-lived sessions
2. **Add backend proxy** for enhanced security
3. **Implement profile sync** to update user data from LinkedIn
4. **Add analytics** to track authentication success rates
5. **Write tests** for authentication flow

### Resources

- [LinkedIn OAuth Documentation](https://docs.microsoft.com/linkedin/shared/authentication/authentication)
- [Firebase OIDC Provider](https://firebase.google.com/docs/auth/web/openid-connect)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)
- [OAuth 2.0 Specification](https://oauth.net/2/)

---

**Made with ❤️ for the Learnex Project**
