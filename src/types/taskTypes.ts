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
  // Duo Task related fields
  isDuoTask?: boolean;
  collaborators?: string[];
  collaborationStatus?: 'pending' | 'active' | 'completed';
  lastUpdatedBy?: string;
  subtasks?: SubTask[];
  progress?: number; // 0-100 percentage complete
}

// New interface for subtasks
export interface SubTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  assignedTo?: string; // User ID of the person responsible
  completedBy?: string; // User ID of the person who completed it
  completedAt?: FirebaseFirestoreTypes.Timestamp;
  createdAt?: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
}

export interface TaskResponse {
  success: boolean;
  error?: any;
  taskId?: string;
}

// Type for Duo Task collaborator
export interface TaskCollaborator {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  status: 'pending' | 'accepted' | 'declined';
  joinedAt?: FirebaseFirestoreTypes.Timestamp;
}
