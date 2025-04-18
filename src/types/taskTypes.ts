import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  category: string;
  userId: string;
  notify: boolean;
  notificationId?: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
}

export interface TaskResponse {
  success: boolean;
  error?: any;
  taskId?: string;
}
