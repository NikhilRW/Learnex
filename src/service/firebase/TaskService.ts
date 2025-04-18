import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {Task} from '../../types/taskTypes';
import notificationService from '../../service/NotificationService';

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
      console.log(
        `TaskService :: addTask() :: Attempting to add task: "${task.title}"`,
      );
      console.log(
        `TaskService :: addTask() :: Task data:`,
        JSON.stringify(task),
      );

      const userId = auth().currentUser?.uid;
      if (!userId) {
        console.log('TaskService :: addTask() :: User not authenticated');
        throw new Error('User not authenticated');
      }

      // Check if a task with the same name already exists
      console.log(
        `TaskService :: addTask() :: Checking for existing task with name: "${task.title}"`,
      );
      const existingTask = await this.findTaskByName(task.title);
      if (existingTask) {
        console.warn(
          `TaskService :: addTask() :: Task with name "${task.title}" already exists (ID: ${existingTask.id})`,
        );
        throw new Error(
          `A task with the name "${task.title}" already exists. Please use a different name.`,
        );
      }
      console.log(
        `TaskService :: addTask() :: No existing task found with name: "${task.title}", proceeding with creation`,
      );

      // Validate date/time format
      if (task.notify) {
        if (!task.dueDate || !task.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.warn(
            `TaskService :: addTask() :: Invalid dueDate format:`,
            task.dueDate,
          );
        }
        if (!task.dueTime || !task.dueTime.match(/^\d{2}:\d{2}$/)) {
          console.warn(
            `TaskService :: addTask() :: Invalid dueTime format:`,
            task.dueTime,
          );
        }

        console.log(
          `TaskService :: addTask() :: Task due date/time: ${task.dueDate} ${task.dueTime}`,
        );
      }

      // Ensure task contains all required fields
      if (task.notify && (!task.dueDate || !task.dueTime)) {
        console.warn(
          `TaskService :: addTask() :: Task has notify enabled but missing date/time:`,
          JSON.stringify(task),
        );
      }

      const taskWithUser = {
        ...task,
        userId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      console.log(
        `TaskService :: addTask() :: Adding task to Firestore, notify: ${
          task.notify ? 'Yes' : 'No'
        }`,
      );
      const docRef = await this.tasksCollection.add(taskWithUser);
      console.log(
        `TaskService :: addTask() :: Task added with ID: ${docRef.id}`,
      );

      // Schedule notification if needed
      if (task.notify) {
        console.log(
          `TaskService :: addTask() :: Scheduling notification for task: ${docRef.id}`,
        );
        const taskWithId = {...taskWithUser, id: docRef.id} as Task;

        try {
          const notificationId =
            await notificationService.scheduleTaskNotification(taskWithId);

          if (notificationId) {
            console.log(
              `TaskService :: addTask() :: Notification scheduled successfully, ID: ${notificationId}`,
            );
            // Update the task with the notification ID
            await this.tasksCollection.doc(docRef.id).update({
              notificationId: notificationId,
            });
            console.log(
              `TaskService :: addTask() :: Updated task with notification ID`,
            );
          } else {
            console.warn(
              `TaskService :: addTask() :: Failed to schedule notification for task: ${docRef.id}`,
            );
          }
        } catch (notificationError) {
          console.error(
            `TaskService :: addTask() :: Error scheduling notification:`,
            notificationError,
          );
        }
      }

      console.log(
        `TaskService :: addTask() :: Successfully completed task creation: "${task.title}" (ID: ${docRef.id})`,
      );
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
      console.log(
        `TaskService :: updateTask() :: Attempting to update task with ID: ${taskId}`,
      );
      console.log(
        `TaskService :: updateTask() :: Update data:`,
        JSON.stringify(taskData),
      );

      const userId = auth().currentUser?.uid;
      if (!userId) {
        console.log('TaskService :: updateTask() :: User not authenticated');
        throw new Error('User not authenticated');
      }

      // Verify task belongs to current user
      console.log(
        `TaskService :: updateTask() :: Verifying task ownership for user: ${userId}`,
      );
      const taskDoc = await this.tasksCollection.doc(taskId).get();

      if (!taskDoc.exists) {
        console.log(
          `TaskService :: updateTask() :: Task does not exist: ${taskId}`,
        );
        throw new Error('Task not found or unauthorized');
      }

      if (taskDoc.data()?.userId !== userId) {
        console.log(
          `TaskService :: updateTask() :: Unauthorized task access. Owner: ${
            taskDoc.data()?.userId
          }, Requester: ${userId}`,
        );
        throw new Error('Task not found or unauthorized');
      }

      const existingTask = {id: taskId, ...taskDoc.data()} as Task;
      console.log(
        `TaskService :: updateTask() :: Found task: "${existingTask.title}"`,
      );

      // Log if notification settings are changing
      if (taskData.notify !== undefined) {
        console.log(
          `Notification setting changing from ${existingTask.notify} to ${taskData.notify}`,
        );
      }

      // If date or time is changing, log it
      if (
        taskData.dueDate !== undefined &&
        taskData.dueDate !== existingTask.dueDate
      ) {
        console.log(
          `Due date changing from ${existingTask.dueDate} to ${taskData.dueDate}`,
        );
      }

      if (
        taskData.dueTime !== undefined &&
        taskData.dueTime !== existingTask.dueTime
      ) {
        console.log(
          `Due time changing from ${existingTask.dueTime} to ${taskData.dueTime}`,
        );
      }

      // Cancel existing notification if it exists
      if (existingTask.notificationId) {
        console.log(
          'Cancelling existing notification:',
          existingTask.notificationId,
        );
        await notificationService.cancelTaskNotification(
          existingTask.notificationId,
        );
      }

      // Update the task
      await this.tasksCollection.doc(taskId).update({
        ...taskData,
        notificationId: null, // Clear the notification ID as we'll create a new one
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      console.log('Task updated in database');

      // If task is not completed and notifications are enabled, schedule a new notification
      const updatedTask = {
        ...existingTask,
        ...taskData,
        id: taskId,
      } as Task;

      if (updatedTask.notify && !updatedTask.completed) {
        console.log('Scheduling new notification for updated task');
        try {
          const notificationId =
            await notificationService.scheduleTaskNotification(updatedTask);

          if (notificationId) {
            console.log('New notification scheduled with ID:', notificationId);
            await this.tasksCollection.doc(taskId).update({
              notificationId: notificationId,
            });
          } else {
            console.warn('Failed to schedule notification for updated task');
          }
        } catch (notificationError) {
          console.error(
            'Error scheduling notification for updated task:',
            notificationError,
          );
        }
      } else {
        console.log(
          'Task not eligible for notification: notify=',
          updatedTask.notify,
          'completed=',
          updatedTask.completed,
        );
      }
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
      console.log(
        `TaskService :: toggleTaskCompletion() :: Attempting to toggle completion for task with ID: ${taskId}`,
      );

      const userId = auth().currentUser?.uid;
      if (!userId) {
        console.log(
          'TaskService :: toggleTaskCompletion() :: User not authenticated',
        );
        throw new Error('User not authenticated');
      }

      // Get current task data
      console.log(
        `TaskService :: toggleTaskCompletion() :: Verifying task ownership for user: ${userId}`,
      );
      const taskDoc = await this.tasksCollection.doc(taskId).get();

      if (!taskDoc.exists) {
        console.log(
          `TaskService :: toggleTaskCompletion() :: Task does not exist: ${taskId}`,
        );
        throw new Error('Task not found or unauthorized');
      }

      if (taskDoc.data()?.userId !== userId) {
        console.log(
          `TaskService :: toggleTaskCompletion() :: Unauthorized task access. Owner: ${
            taskDoc.data()?.userId
          }, Requester: ${userId}`,
        );
        throw new Error('Task not found or unauthorized');
      }

      const existingTask = {id: taskId, ...taskDoc.data()} as Task;
      const currentStatus = existingTask.completed || false;
      console.log(
        `TaskService :: toggleTaskCompletion() :: Found task: "${existingTask.title}", current status: ${currentStatus}`,
      );

      // If task has notification and is being marked as completed, cancel it
      if (!currentStatus && existingTask.notificationId) {
        await notificationService.cancelTaskNotification(
          existingTask.notificationId,
        );
      }

      // Toggle completion status
      await this.tasksCollection.doc(taskId).update({
        completed: !currentStatus,
        notificationId: !currentStatus ? null : existingTask.notificationId, // Clear notification ID if marking as completed
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // If task is being marked as not completed and notifications are enabled, reschedule
      if (currentStatus && existingTask.notify) {
        const updatedTask = {...existingTask, completed: false} as Task;
        const notificationId =
          await notificationService.scheduleTaskNotification(updatedTask);
        if (notificationId) {
          await this.tasksCollection.doc(taskId).update({
            notificationId: notificationId,
          });
        }
      }
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
      console.log(
        `TaskService :: deleteTask() :: Attempting to delete task with ID: ${taskId}`,
      );

      const userId = auth().currentUser?.uid;
      if (!userId) {
        console.log('TaskService :: deleteTask() :: User not authenticated');
        throw new Error('User not authenticated');
      }

      // Verify task belongs to current user
      console.log(
        `TaskService :: deleteTask() :: Verifying task ownership for user: ${userId}`,
      );
      const taskDoc = await this.tasksCollection.doc(taskId).get();

      if (!taskDoc.exists) {
        console.log(
          `TaskService :: deleteTask() :: Task does not exist: ${taskId}`,
        );
        throw new Error('Task not found or unauthorized');
      }

      if (taskDoc.data()?.userId !== userId) {
        console.log(
          `TaskService :: deleteTask() :: Unauthorized task access. Owner: ${
            taskDoc.data()?.userId
          }, Requester: ${userId}`,
        );
        throw new Error('Task not found or unauthorized');
      }

      const existingTask = taskDoc.data() as Task;
      console.log(
        `TaskService :: deleteTask() :: Task found: "${existingTask.title}"`,
      );

      // Cancel the notification if it exists
      if (existingTask.notificationId) {
        console.log(
          `TaskService :: deleteTask() :: Cancelling notification: ${existingTask.notificationId}`,
        );
        await notificationService.cancelTaskNotification(
          existingTask.notificationId,
        );
      }

      await this.tasksCollection.doc(taskId).delete();
      console.log(
        `TaskService :: deleteTask() :: Successfully deleted task with ID: ${taskId}`,
      );
    } catch (error) {
      console.log('TaskService :: deleteTask() ::', error);
      throw error;
    }
  }

  /**
   * Find a task by its name
   * @param taskName The name/title of the task to find
   * @returns The task if found, null otherwise
   */
  async findTaskByName(taskName: string): Promise<Task | null> {
    try {
      console.log(
        `TaskService :: findTaskByName() :: Looking for task with name: "${taskName}"`,
      );

      const userId = auth().currentUser?.uid;
      if (!userId) {
        console.log(
          'TaskService :: findTaskByName() :: User not authenticated',
        );
        throw new Error('User not authenticated');
      }

      // Find tasks with the given name
      console.log(
        `TaskService :: findTaskByName() :: Querying Firestore with userId=${userId}, title="${taskName}"`,
      );

      const tasksSnapshot = await this.tasksCollection
        .where('userId', '==', userId)
        .where('title', '==', taskName)
        .limit(1) // Limit to one result
        .get();

      if (tasksSnapshot.empty) {
        console.log(
          `TaskService :: findTaskByName() :: No task found with name: "${taskName}"`,
        );
        return null;
      }

      // Return the first matching task
      const doc = tasksSnapshot.docs[0];
      console.log(
        `TaskService :: findTaskByName() :: Found task with ID: ${doc.id}`,
      );

      return {
        id: doc.id,
        ...doc.data(),
      } as Task;
    } catch (error) {
      console.log('TaskService :: findTaskByName() ::', error);
      throw error;
    }
  }

  /**
   * Delete a task by its name
   */
  async deleteTaskByName(taskName: string): Promise<void> {
    try {
      console.log(
        `TaskService :: deleteTaskByName() :: Attempting to delete task: "${taskName}"`,
      );

      const task = await this.findTaskByName(taskName);
      if (!task) {
        console.log(
          `TaskService :: deleteTaskByName() :: Task not found: "${taskName}"`,
        );
        throw new Error(`Task with name "${taskName}" not found`);
      }

      console.log(
        `TaskService :: deleteTaskByName() :: Found task with ID: ${task.id}, proceeding with deletion`,
      );

      // Use the existing deleteTask method with the found ID
      await this.deleteTask(task.id);

      console.log(
        `TaskService :: deleteTaskByName() :: Successfully deleted task: "${taskName}" (ID: ${task.id})`,
      );
    } catch (error) {
      console.log('TaskService :: deleteTaskByName() ::', error);
      throw error;
    }
  }

  /**
   * Update a task by its name
   */
  async updateTaskByName(
    taskName: string,
    taskData: Partial<Task>,
  ): Promise<void> {
    try {
      console.log(
        `TaskService :: updateTaskByName() :: Attempting to update task: "${taskName}"`,
      );
      console.log(
        `TaskService :: updateTaskByName() :: Update data:`,
        JSON.stringify(taskData),
      );

      const task = await this.findTaskByName(taskName);
      if (!task) {
        console.log(
          `TaskService :: updateTaskByName() :: Task not found: "${taskName}"`,
        );
        throw new Error(`Task with name "${taskName}" not found`);
      }

      console.log(
        `TaskService :: updateTaskByName() :: Found task with ID: ${task.id}, proceeding with update`,
      );

      // Use the existing updateTask method with the found ID
      await this.updateTask(task.id, taskData);

      console.log(
        `TaskService :: updateTaskByName() :: Successfully updated task: "${taskName}" (ID: ${task.id})`,
      );
    } catch (error) {
      console.log('TaskService :: updateTaskByName() ::', error);
      throw error;
    }
  }

  /**
   * Toggle task completion status by task name
   */
  async toggleTaskCompletionByName(taskName: string): Promise<void> {
    try {
      console.log(
        `TaskService :: toggleTaskCompletionByName() :: Attempting to toggle completion for task: "${taskName}"`,
      );

      const task = await this.findTaskByName(taskName);
      if (!task) {
        console.log(
          `TaskService :: toggleTaskCompletionByName() :: Task not found: "${taskName}"`,
        );
        throw new Error(`Task with name "${taskName}" not found`);
      }

      console.log(
        `TaskService :: toggleTaskCompletionByName() :: Found task with ID: ${task.id}, current completion status: ${task.completed}`,
      );

      // Use the existing toggleTaskCompletion method with the found ID
      await this.toggleTaskCompletion(task.id);

      console.log(
        `TaskService :: toggleTaskCompletionByName() :: Successfully toggled completion for task: "${taskName}" (ID: ${task.id})`,
      );
    } catch (error) {
      console.log('TaskService :: toggleTaskCompletionByName() ::', error);
      throw error;
    }
  }
}
