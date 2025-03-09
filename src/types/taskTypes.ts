import {FirebaseFirestoreTypes} from '@react-native-firebase/firestore';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  category: string;
  userId: string;
  createdAt?: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
}

export interface TaskResponse {
  success: boolean;
  error?: any;
  taskId?: string;
}