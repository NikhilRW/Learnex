import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';

// Firebase response types
export interface AuthResponse {
  success: boolean;
  error?: any;
}

export interface TaskResponse {
  success: boolean;
  error?: string;
  data?: any;
}

// User related types
export interface FirebaseUser {
  uid: string;
  email: string;
  username: string;
  fullName: string;
  isLoggedIn: boolean;
  savedPosts: string[];
  createdAt: any; // firestore.FieldValue.serverTimestamp()
  image: string;
}

// Task related types
export interface Task {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  category: string;
  userId: string;
  createdAt: any; // firestore.FieldValue.serverTimestamp()
  updatedAt: any; // firestore.FieldValue.serverTimestamp()
}

// Post related types
export interface Post {
  id?: string;
  userId: string;
  content: string;
  likes: string[];
  createdAt: any; // firestore.FieldValue.serverTimestamp()
  updatedAt: any; // firestore.FieldValue.serverTimestamp()
}

// Firestore document interfaces
export interface NotificationPreferences {
  userId: string;
  mutedRecipients: string[];
  createdAt?:
    | FirebaseFirestoreTypes.FieldValue
    | FirebaseFirestoreTypes.Timestamp;
  updatedAt?:
    | FirebaseFirestoreTypes.FieldValue
    | FirebaseFirestoreTypes.Timestamp;
}
