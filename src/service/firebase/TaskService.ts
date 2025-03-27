import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {Task} from '../../types/taskTypes';

export class TaskService {
  private tasksCollection = firestore().collection('tasks');
  /**
   * Get all tasks for the current user
   */
  async getTasks(): Promise<Task[]> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const tasksSnapshot = await this.tasksCollection
        .where('userId', '==', userId)
        .orderBy('dueDate', 'asc')
        .get();

      return tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
    } catch (error) {
      console.log('TaskService :: getTasks() ::', error);
      throw error;
    }
  }

  /**
   * Add a new task
   */
  async addTask(task: Omit<Task, 'id'>): Promise<string> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const taskWithUser = {
        ...task,
        userId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.tasksCollection.add(taskWithUser);
      return docRef.id;
    } catch (error) {
      console.log('TaskService :: addTask() ::', error);
      throw error;
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, taskData: Partial<Task>): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Verify task belongs to current user
      const taskDoc = await this.tasksCollection.doc(taskId).get();
      if (!taskDoc.exists || taskDoc.data()?.userId !== userId) {
        throw new Error('Task not found or unauthorized');
      }

      await this.tasksCollection.doc(taskId).update({
        ...taskData,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.log('TaskService :: updateTask() ::', error);
      throw error;
    }
  }

  /**
   * Toggle task completion status
   */
  async toggleTaskCompletion(taskId: string): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get current task data
      const taskDoc = await this.tasksCollection.doc(taskId).get();
      if (!taskDoc.exists || taskDoc.data()?.userId !== userId) {
        throw new Error('Task not found or unauthorized');
      }

      const currentStatus = taskDoc.data()?.completed || false;

      // Toggle completion status
      await this.tasksCollection.doc(taskId).update({
        completed: !currentStatus,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.log('TaskService :: toggleTaskCompletion() ::', error);
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Verify task belongs to current user
      const taskDoc = await this.tasksCollection.doc(taskId).get();
      if (!taskDoc.exists || taskDoc.data()?.userId !== userId) {
        throw new Error('Task not found or unauthorized');
      }

      await this.tasksCollection.doc(taskId).delete();
    } catch (error) {
      console.log('TaskService :: deleteTask() ::', error);
      throw error;
    }
  }
}
