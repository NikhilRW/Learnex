import {getAuth} from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  arrayRemove,
  writeBatch,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {Task, SubTask} from 'shared/types/taskTypes';
import notificationService from './NotificationService';
import axios from 'axios';
import Config from 'react-native-superconfig';
import {logger} from 'shared/utils/logger';

export class TaskService {
  private tasksCollection = collection(
    getFirestore(),
    'tasks',
  ) as FirebaseFirestoreTypes.CollectionReference<Task>;
  /**
   * Get all tasks for the current user (excluding team tasks)
   *
   */
  async getTasks(): Promise<Task[]> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const tasksSnapshot = await getDocs(
        query(
          this.tasksCollection,
          where('userId', '==', userId),
          where('isDuoTask', '!=', true), // Exclude team tasks
          orderBy('isDuoTask'), // Required for using the != filter
          orderBy('dueDate', 'asc'),
        ),
      );

      return tasksSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
    } catch (error) {
      logger.error('TaskService :: getTasks() ::', error, 'TaskService');
      throw error;
    }
  }

  async getTaskSuggestion() {
    try {
      const tasks = await this.getTasks();
      const tasksTitles = tasks.map(task => task.title);
      logger.debug('tasksTitles', tasksTitles, 'TaskService');
      const payload = {
        messages: [
          {
            role: 'user',
            content: `You are an AI assistant that suggests new tasks for a user to help improve their life. Here are the user's previous tasks:\n${tasksTitles.map((ele, index) => `${index + 1}. ${ele}`).join('\n')}
    Suggest a new, relevant task that is not a duplicate of the above. If you can't infer a new task, suggest a random but valuable task for a normal human being's growth.
    Respond ONLY with the task title and a brief description, separated by "|". The title should be concise (3 to 7 words). Do not include any extra text or explanation.`,
          },
        ],
        model: 'openai/gpt-oss-20b',
        temperature: 1,
        max_completion_tokens: 8192,
        top_p: 1,
        stream: false,
        reasoning_effort: 'medium',
        stop: null,
      };
      logger.debug('payload', payload, 'TaskService');
      const response = await axios.post(
        `https://api.groq.com/openai/v1/chat/completions`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Config.GROQ_API_KEY}`,
          },
        },
      );
      const aiSuggestedTask = response.data.choices[0].message.content;
      return aiSuggestedTask;
    } catch (error) {
      logger.error(
        'TaskService :: getTaskSugesstions() ::',
        error,
        'TaskService',
      );
      throw error;
    }
  }

  /**
   * Add a new task
   */
  async addTask(task: Omit<Task, 'id'>): Promise<string> {
    try {
      logger.debug(
        `TaskService :: addTask() :: Attempting to add task: "${task.title}"`,
        undefined,
        'TaskService',
      );
      logger.debug(
        'TaskService :: addTask() :: Task data',
        task,
        'TaskService',
      );

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        logger.error(
          'TaskService :: addTask() :: User not authenticated',
          undefined,
          'TaskService',
        );
        throw new Error('User not authenticated');
      }

      // Check if a task with the same name already exists
      logger.debug(
        `TaskService :: addTask() :: Checking for existing task with name: "${task.title}"`,
        undefined,
        'TaskService',
      );
      const existingTask = await this.findTaskByName(task.title);
      if (existingTask) {
        logger.warn(
          `TaskService :: addTask() :: Task with name "${task.title}" already exists (ID: ${existingTask.id})`,
          {taskId: existingTask.id},
          'TaskService',
        );
        throw new Error(
          `A task with the name "${task.title}" already exists. Please use a different name.`,
        );
      }
      logger.debug(
        `TaskService :: addTask() :: No existing task found with name: "${task.title}", proceeding with creation`,
        undefined,
        'TaskService',
      );

      // Validate date/time format
      if (task.notify) {
        if (!task.dueDate || !task.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          logger.warn(
            'TaskService :: addTask() :: Invalid dueDate format',
            task.dueDate,
            'TaskService',
          );
        }
        if (!task.dueTime || !task.dueTime.match(/^\d{2}:\d{2}$/)) {
          logger.warn(
            'TaskService :: addTask() :: Invalid dueTime format',
            task.dueTime,
            'TaskService',
          );
        }

        logger.debug(
          `TaskService :: addTask() :: Task due date/time: ${task.dueDate} ${task.dueTime}`,
          undefined,
          'TaskService',
        );
      }

      // Ensure task contains all required fields
      if (task.notify && (!task.dueDate || !task.dueTime)) {
        logger.warn(
          'TaskService :: addTask() :: Task has notify enabled but missing date/time',
          task,
          'TaskService',
        );
      }

      const taskWithUser = {
        ...task,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDuoTask: task.isDuoTask !== undefined ? task.isDuoTask : false,
      };

      logger.debug(
        `TaskService :: addTask() :: Adding task to Firestore, notify: ${
          task.notify ? 'Yes' : 'No'
        }, isDuoTask: ${taskWithUser.isDuoTask ? 'Yes' : 'No'}`,
        undefined,
        'TaskService',
      );
      const docRef = await addDoc(this.tasksCollection, taskWithUser);
      logger.debug(
        `TaskService :: addTask() :: Task added with ID: ${docRef.id}`,
        undefined,
        'TaskService',
      );

      // Schedule notification if needed
      if (task.notify) {
        logger.debug(
          `TaskService :: addTask() :: Scheduling notification for task: ${docRef.id}`,
          undefined,
          'TaskService',
        );
        const taskWithId = {...taskWithUser, id: docRef.id} as Task;

        try {
          const notificationId =
            await notificationService.scheduleTaskNotification(taskWithId);

          if (notificationId) {
            logger.debug(
              `TaskService :: addTask() :: Notification scheduled successfully, ID: ${notificationId}`,
              undefined,
              'TaskService',
            );
            // Update the task with the notification ID
            await updateDoc(doc(this.tasksCollection, docRef.id), {
              notificationId: notificationId,
            });
            logger.debug(
              'TaskService :: addTask() :: Updated task with notification ID',
              undefined,
              'TaskService',
            );
          } else {
            logger.warn(
              `TaskService :: addTask() :: Failed to schedule notification for task: ${docRef.id}`,
              undefined,
              'TaskService',
            );
          }
        } catch (notificationError) {
          logger.error(
            'TaskService :: addTask() :: Error scheduling notification',
            notificationError,
            'TaskService',
          );
        }
      }

      logger.debug(
        `TaskService :: addTask() :: Successfully completed task creation: "${task.title}" (ID: ${docRef.id})`,
        undefined,
        'TaskService',
      );
      return docRef.id;
    } catch (error) {
      logger.error('TaskService :: addTask() ::', error, 'TaskService');
      throw error;
    }
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, taskData: Partial<Task>): Promise<void> {
    try {
      logger.debug(
        `TaskService :: updateTask() :: Attempting to update task with ID: ${taskId}`,
        undefined,
        'TaskService',
      );
      logger.debug(
        'TaskService :: updateTask() :: Update data',
        taskData,
        'TaskService',
      );

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        logger.error(
          'TaskService :: updateTask() :: User not authenticated',
          undefined,
          'TaskService',
        );
        throw new Error('User not authenticated');
      }

      // Verify task belongs to current user
      logger.debug(
        `TaskService :: updateTask() :: Verifying task ownership for user: ${userId}`,
        undefined,
        'TaskService',
      );
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));

      if (!taskDoc.exists()) {
        logger.warn(
          `TaskService :: updateTask() :: Task does not exist: ${taskId}`,
          undefined,
          'TaskService',
        );
        throw new Error('Task not found or unauthorized');
      }

      if (taskDoc.data()?.userId !== userId) {
        logger.warn(
          `TaskService :: updateTask() :: Unauthorized task access. Owner: ${
            taskDoc.data()?.userId
          }, Requester: ${userId}`,
          undefined,
          'TaskService',
        );
        throw new Error('Task not found or unauthorized');
      }

      const existingTask = {id: taskId, ...taskDoc.data()} as Task;
      logger.debug(
        `TaskService :: updateTask() :: Found task: "${existingTask.title}"`,
        undefined,
        'TaskService',
      );

      // Log if notification settings are changing
      if (taskData.notify !== undefined) {
        logger.debug(
          `Notification setting changing from ${existingTask.notify} to ${taskData.notify}`,
          undefined,
          'TaskService',
        );
      }

      // If date or time is changing, log it
      if (
        taskData.dueDate !== undefined &&
        taskData.dueDate !== existingTask.dueDate
      ) {
        logger.debug(
          `Due date changing from ${existingTask.dueDate} to ${taskData.dueDate}`,
          undefined,
          'TaskService',
        );
      }

      if (
        taskData.dueTime !== undefined &&
        taskData.dueTime !== existingTask.dueTime
      ) {
        logger.debug(
          `Due time changing from ${existingTask.dueTime} to ${taskData.dueTime}`,
          undefined,
          'TaskService',
        );
      }

      // Cancel existing notification if it exists
      if (existingTask.notificationId) {
        logger.debug(
          'Cancelling existing notification',
          existingTask.notificationId,
          'TaskService',
        );
        await notificationService.cancelTaskNotification(
          existingTask.notificationId,
        );
      }

      // Update the task
      await updateDoc(doc(this.tasksCollection, taskId), {
        ...taskData,
        notificationId: null, // Clear the notification ID as we'll create a new one
        updatedAt: serverTimestamp(),
      });

      logger.debug('Task updated in database', undefined, 'TaskService');

      // If task is not completed and notifications are enabled, schedule a new notification
      const updatedTask = {
        ...existingTask,
        ...taskData,
        id: taskId,
      } as Task;

      if (updatedTask.notify && !updatedTask.completed) {
        logger.debug(
          'Scheduling new notification for updated task',
          undefined,
          'TaskService',
        );
        try {
          const notificationId =
            await notificationService.scheduleTaskNotification(updatedTask);

          if (notificationId) {
            logger.debug(
              'New notification scheduled with ID',
              notificationId,
              'TaskService',
            );
            await updateDoc(doc(this.tasksCollection, taskId), {
              notificationId: notificationId,
            });
          } else {
            logger.warn(
              'Failed to schedule notification for updated task',
              undefined,
              'TaskService',
            );
          }
        } catch (notificationError) {
          logger.error(
            'Error scheduling notification for updated task',
            notificationError,
            'TaskService',
          );
        }
      } else {
        logger.debug(
          'Task not eligible for notification',
          {notify: updatedTask.notify, completed: updatedTask.completed},
          'TaskService',
        );
      }
    } catch (error) {
      logger.error('TaskService :: updateTask() ::', error, 'TaskService');
      throw error;
    }
  }

  /**
   * Toggle task completion status
   */
  async toggleTaskCompletion(taskId: string): Promise<void> {
    try {
      logger.debug(
        `TaskService :: toggleTaskCompletion() :: Attempting to toggle completion for task with ID: ${taskId}`,
        undefined,
        'TaskService',
      );

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        logger.error(
          'TaskService :: toggleTaskCompletion() :: User not authenticated',
          undefined,
          'TaskService',
        );
        throw new Error('User not authenticated');
      }

      // Get current task data
      logger.debug(
        `TaskService :: toggleTaskCompletion() :: Verifying task ownership for user: ${userId}`,
        undefined,
        'TaskService',
      );
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));

      if (!taskDoc.exists()) {
        logger.warn(
          `TaskService :: toggleTaskCompletion() :: Task does not exist: ${taskId}`,
          undefined,
          'TaskService',
        );
        throw new Error('Task not found or unauthorized');
      }

      if (taskDoc.data()?.userId !== userId) {
        logger.warn(
          `TaskService :: toggleTaskCompletion() :: Unauthorized task access. Owner: ${
            taskDoc.data()?.userId
          }, Requester: ${userId}`,
          undefined,
          'TaskService',
        );
        throw new Error('Task not found or unauthorized');
      }

      const existingTask = {id: taskId, ...taskDoc.data()} as Task;
      const currentStatus = existingTask.completed || false;
      logger.debug(
        `TaskService :: toggleTaskCompletion() :: Found task: "${existingTask.title}", current status: ${currentStatus}`,
        undefined,
        'TaskService',
      );

      // If task has notification and is being marked as completed, cancel it
      if (!currentStatus && existingTask.notificationId) {
        await notificationService.cancelTaskNotification(
          existingTask.notificationId,
        );
      }

      // Toggle completion status
      await updateDoc(doc(this.tasksCollection, taskId), {
        completed: !currentStatus,
        notificationId: !currentStatus ? null : existingTask.notificationId, // Clear notification ID if marking as completed
        updatedAt: serverTimestamp(),
      });

      // If task is being marked as not completed and notifications are enabled, reschedule
      if (currentStatus && existingTask.notify) {
        const updatedTask = {...existingTask, completed: false} as Task;
        const notificationId =
          await notificationService.scheduleTaskNotification(updatedTask);
        if (notificationId) {
          await updateDoc(doc(this.tasksCollection, taskId), {
            notificationId: notificationId,
          });
        }
      }
    } catch (error) {
      logger.error(
        'TaskService :: toggleTaskCompletion() ::',
        error,
        'TaskService',
      );
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      logger.debug(
        `TaskService :: deleteTask() :: Attempting to delete task with ID: ${taskId}`,
        undefined,
        'TaskService',
      );

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        logger.error(
          'TaskService :: deleteTask() :: User not authenticated',
          undefined,
          'TaskService',
        );
        throw new Error('User not authenticated');
      }

      // Verify task belongs to current user
      logger.debug(
        `TaskService :: deleteTask() :: Verifying task ownership for user: ${userId}`,
        undefined,
        'TaskService',
      );
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));

      if (!taskDoc.exists()) {
        logger.warn(
          `TaskService :: deleteTask() :: Task does not exist: ${taskId}`,
          undefined,
          'TaskService',
        );
        throw new Error('Task not found or unauthorized');
      }

      if (taskDoc.data()?.userId !== userId) {
        logger.warn(
          `TaskService :: deleteTask() :: Unauthorized task access. Owner: ${
            taskDoc.data()?.userId
          }, Requester: ${userId}`,
          undefined,
          'TaskService',
        );
        throw new Error('Task not found or unauthorized');
      }

      const existingTask = taskDoc.data() as Task;
      logger.debug(
        `TaskService :: deleteTask() :: Task found: "${existingTask.title}"`,
        undefined,
        'TaskService',
      );

      // Cancel the notification if it exists
      if (existingTask.notificationId) {
        logger.debug(
          `TaskService :: deleteTask() :: Cancelling notification: ${existingTask.notificationId}`,
          undefined,
          'TaskService',
        );
        await notificationService.cancelTaskNotification(
          existingTask.notificationId,
        );
      }

      await deleteDoc(doc(this.tasksCollection, taskId));
      logger.debug(
        `TaskService :: deleteTask() :: Successfully deleted task with ID: ${taskId}`,
        undefined,
        'TaskService',
      );
    } catch (error) {
      logger.error('TaskService :: deleteTask() ::', error, 'TaskService');
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
      logger.debug(
        `TaskService :: findTaskByName() :: Looking for task with name: "${taskName}"`,
        undefined,
        'TaskService',
      );

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        logger.error(
          'TaskService :: findTaskByName() :: User not authenticated',
          undefined,
          'TaskService',
        );
        throw new Error('User not authenticated');
      }

      // Find tasks with the given name
      logger.debug(
        `TaskService :: findTaskByName() :: Querying Firestore with userId=${userId}, title="${taskName}"`,
        undefined,
        'TaskService',
      );

      const tasksSnapshot = await getDocs(
        query(
          this.tasksCollection,
          where('userId', '==', userId),
          where('title', '==', taskName),
          limit(1), // Limit to one result
        ),
      );

      if (tasksSnapshot.empty) {
        logger.debug(
          `TaskService :: findTaskByName() :: No task found with name: "${taskName}"`,
          undefined,
          'TaskService',
        );
        return null;
      }

      // Return the first matching task
      const doc = tasksSnapshot.docs[0];
      logger.debug(
        `TaskService :: findTaskByName() :: Found task with ID: ${doc.id}`,
        undefined,
        'TaskService',
      );

      return {
        id: doc.id,
        ...doc.data(),
      } as Task;
    } catch (error) {
      logger.error('TaskService :: findTaskByName() ::', error, 'TaskService');
      throw error;
    }
  }

  /**
   * Delete a task by its name
   */
  async deleteTaskByName(taskName: string): Promise<void> {
    try {
      logger.debug(
        `TaskService :: deleteTaskByName() :: Attempting to delete task: "${taskName}"`,
        undefined,
        'TaskService',
      );

      const task = await this.findTaskByName(taskName);
      if (!task) {
        logger.warn(
          `TaskService :: deleteTaskByName() :: Task not found: "${taskName}"`,
          undefined,
          'TaskService',
        );
        throw new Error(`Task with name "${taskName}" not found`);
      }

      logger.debug(
        `TaskService :: deleteTaskByName() :: Found task with ID: ${task.id}, proceeding with deletion`,
        undefined,
        'TaskService',
      );

      // Use the existing deleteTask method with the found ID
      await this.deleteTask(task.id);

      logger.debug(
        `TaskService :: deleteTaskByName() :: Successfully deleted task: "${taskName}" (ID: ${task.id})`,
        undefined,
        'TaskService',
      );
    } catch (error) {
      logger.error(
        'TaskService :: deleteTaskByName() ::',
        error,
        'TaskService',
      );
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
      logger.debug(
        `TaskService :: updateTaskByName() :: Attempting to update task: "${taskName}"`,
        undefined,
        'TaskService',
      );
      logger.debug(
        'TaskService :: updateTaskByName() :: Update data',
        taskData,
        'TaskService',
      );

      const task = await this.findTaskByName(taskName);
      if (!task) {
        logger.warn(
          `TaskService :: updateTaskByName() :: Task not found: "${taskName}"`,
          undefined,
          'TaskService',
        );
        throw new Error(`Task with name "${taskName}" not found`);
      }

      logger.debug(
        `TaskService :: updateTaskByName() :: Found task with ID: ${task.id}, proceeding with update`,
        undefined,
        'TaskService',
      );

      // Use the existing updateTask method with the found ID
      await this.updateTask(task.id, taskData);

      logger.debug(
        `TaskService :: updateTaskByName() :: Successfully updated task: "${taskName}" (ID: ${task.id})`,
        undefined,
        'TaskService',
      );
    } catch (error) {
      logger.error(
        'TaskService :: updateTaskByName() ::',
        error,
        'TaskService',
      );
      throw error;
    }
  }

  /**
   * Toggle task completion status by task name
   */
  async toggleTaskCompletionByName(taskName: string): Promise<void> {
    try {
      logger.debug(
        `TaskService :: toggleTaskCompletionByName() :: Attempting to toggle completion for task: "${taskName}"`,
        undefined,
        'TaskService',
      );

      const task = await this.findTaskByName(taskName);
      if (!task) {
        logger.warn(
          `TaskService :: toggleTaskCompletionByName() :: Task not found: "${taskName}"`,
          undefined,
          'TaskService',
        );
        throw new Error(`Task with name "${taskName}" not found`);
      }

      logger.debug(
        `TaskService :: toggleTaskCompletionByName() :: Found task with ID: ${task.id}, current completion status: ${task.completed}`,
        undefined,
        'TaskService',
      );

      // Use the existing toggleTaskCompletion method with the found ID
      await this.toggleTaskCompletion(task.id);

      logger.debug(
        `TaskService :: toggleTaskCompletionByName() :: Successfully toggled completion for task: "${taskName}" (ID: ${task.id})`,
        undefined,
        'TaskService',
      );
    } catch (error) {
      logger.error(
        'TaskService :: toggleTaskCompletionByName() ::',
        error,
        'TaskService',
      );
      throw error;
    }
  }

  /**
   * Create a team task with multiple collaborators
   * @param task The task data
   * @returns The task ID
   */
  async createDuoTask(task: Omit<Task, 'id'>): Promise<string> {
    try {
      logger.debug(
        `TaskService :: createDuoTask() :: Creating team task: "${task.title}"`,
        undefined,
        'TaskService',
      );

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        logger.error(
          'TaskService :: createDuoTask() :: User not authenticated',
          undefined,
          'TaskService',
        );
        throw new Error('User not authenticated');
      }

      // Check if collaborators is provided and valid
      if (!task.collaborators || task.collaborators.length < 2) {
        logger.warn(
          'TaskService :: createDuoTask() :: Missing or invalid collaborators',
          undefined,
          'TaskService',
        );
        throw new Error('Team task requires at least two collaborators');
      }

      // Verify current user is one of the collaborators
      if (!task.collaborators.includes(userId)) {
        logger.warn(
          'TaskService :: createDuoTask() :: Current user not in collaborators list',
          undefined,
          'TaskService',
        );
        throw new Error('Current user must be a collaborator');
      }

      // Create task with team task fields
      const teamTask = {
        ...task,
        userId, // Main owner is current user
        isDuoTask: true,
        collaborationStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastUpdatedBy: userId,
        progress:
          task.subtasks && task.subtasks.length > 0
            ? Math.round(
                (task.subtasks.filter(s => s.completed).length /
                  task.subtasks.length) *
                  100,
              )
            : 0,
      };

      logger.debug(
        `TaskService :: createDuoTask() :: Adding team task to Firestore`,
        undefined,
        'TaskService',
      );
      const docRef = await addDoc(this.tasksCollection, teamTask);
      logger.debug(
        `TaskService :: createDuoTask() :: Team task added with ID: ${docRef.id}`,
        undefined,
        'TaskService',
      );

      // Create notifications for collaborators (except current user)
      const otherCollaborators = task.collaborators.filter(id => id !== userId);

      for (const collaboratorId of otherCollaborators) {
        await addDoc(collection(getFirestore(), 'notifications'), {
          userId: collaboratorId,
          type: 'duo_task_invitation',
          title: 'Team Task Invitation',
          message: `${
            getAuth().currentUser?.displayName || 'Someone'
          } invited you to collaborate on "${task.title}"`,
          taskId: docRef.id,
          read: false,
          createdAt: serverTimestamp(),
        });
        logger.debug(
          `TaskService :: createDuoTask() :: Notification sent to collaborator: ${collaboratorId}`,
          undefined,
          'TaskService',
        );
      }

      // Schedule notification if enabled
      if (task.notify) {
        const taskWithId = {...teamTask, id: docRef.id} as Task;
        try {
          logger.debug(
            `TaskService :: createDuoTask() :: Scheduling notification for task: ${docRef.id}`,
            undefined,
            'TaskService',
          );
          const notificationId =
            await notificationService.scheduleTaskNotification(taskWithId);

          if (notificationId) {
            logger.debug(
              `TaskService :: createDuoTask() :: Notification scheduled successfully, ID: ${notificationId}`,
              undefined,
              'TaskService',
            );
            // Update the task with the notification ID
            await updateDoc(doc(this.tasksCollection, docRef.id), {
              notificationId: notificationId,
            });
          } else {
            logger.warn(
              `TaskService :: createDuoTask() :: Failed to schedule notification for task: ${docRef.id}`,
              undefined,
              'TaskService',
            );
          }
        } catch (notificationError) {
          logger.error(
            'TaskService :: createDuoTask() :: Error scheduling notification',
            notificationError,
            'TaskService',
          );
        }
      }

      return docRef.id;
    } catch (error) {
      logger.error('TaskService :: createDuoTask() ::', error, 'TaskService');
      throw error;
    }
  }

  /**
   * Update a team task
   */
  async updateDuoTask(taskId: string, task: Partial<Task>): Promise<Task> {
    try {
      logger.debug(
        `TaskService :: updateDuoTask() :: Updating team task: "${task.title}" (ID: ${taskId})`,
        undefined,
        'TaskService',
      );

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        logger.error(
          'TaskService :: updateDuoTask() :: User not authenticated',
          undefined,
          'TaskService',
        );
        throw new Error('User not authenticated');
      }

      // Verify user is a collaborator
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));

      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      const existingTask = taskDoc.data() as Task;

      if (!existingTask.collaborators?.includes(userId)) {
        throw new Error('User is not a collaborator on this task');
      }

      // Update the task
      const updateData = {
        ...task,
        updatedAt: serverTimestamp(),
        lastUpdatedBy: userId,
      };

      await updateDoc(doc(this.tasksCollection, taskId), updateData);
      logger.debug(
        `TaskService :: updateDuoTask() :: Team task updated successfully`,
        undefined,
        'TaskService',
      );

      // Handle notification updates
      if (task.notify !== undefined && task.dueDate && task.dueTime) {
        // Cancel existing notification
        if (existingTask.notificationId) {
          await notificationService.cancelTaskNotification(
            existingTask.notificationId,
          );
        }

        // Schedule new notification if enabled
        if (task.notify) {
          const updatedTask = {
            ...existingTask,
            ...task,
            id: taskId,
          } as Task;

          const notificationId =
            await notificationService.scheduleTaskNotification(updatedTask);

          if (notificationId) {
            await updateDoc(doc(this.tasksCollection, taskId), {
              notificationId: notificationId,
            });
            logger.debug(
              `TaskService :: updateDuoTask() :: Updated notification`,
              undefined,
              'TaskService',
            );
          }
        }
      }

      // Notify collaborators about the update (except current user)
      const collaborators = existingTask.collaborators?.filter(
        id => id !== userId,
      );

      if (collaborators && collaborators.length > 0) {
        for (const collaboratorId of collaborators) {
          await addDoc(collection(getFirestore(), 'notifications'), {
            userId: collaboratorId,
            type: 'duo_task_update',
            title: 'Team Task Updated',
            message: `${
              getAuth().currentUser?.displayName || 'Your team member'
            } updated task "${existingTask.title}"`,
            taskId: taskId,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
        logger.debug(
          `TaskService :: updateDuoTask() :: Notifications sent to collaborators`,
          undefined,
          'TaskService',
        );
      }

      // Return the updated task
      const updatedTaskDoc = await getDoc(doc(this.tasksCollection, taskId));
      return {
        id: taskId,
        ...updatedTaskDoc.data(),
      } as Task;
    } catch (error) {
      logger.error('TaskService :: updateDuoTask() ::', error, 'TaskService');
      throw error;
    }
  }

  /**
   * Get team tasks where the current user is a collaborator
   */
  async getDuoTasks(): Promise<Task[]> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.debug(
        `TaskService :: getDuoTasks() :: Fetching team tasks for user: ${userId}`,
        undefined,
        'TaskService',
      );
      const teamTasksSnapshot = await getDocs(
        query(
          this.tasksCollection,
          where('collaborators', 'array-contains', userId),
          where('isDuoTask', '==', true),
          orderBy('dueDate', 'asc'),
        ),
      );

      logger.debug(
        `TaskService :: getDuoTasks() :: Found ${teamTasksSnapshot.size} team tasks`,
        undefined,
        'TaskService',
      );
      return teamTasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
    } catch (error) {
      logger.error('TaskService :: getDuoTasks() ::', error, 'TaskService');
      throw error;
    }
  }

  /**
   * Get team task invitations pending for the current user
   */
  async getPendingDuoTaskInvitations(): Promise<Task[]> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get notifications for this user that are team task invitations and unread
      const notificationsSnapshot = await getDocs(
        query(
          collection(getFirestore(), 'notifications'),
          where('userId', '==', userId),
          where('type', '==', 'duo_task_invitation'),
          where('read', '==', false),
        ),
      );

      if (notificationsSnapshot.empty) {
        return [];
      }

      // Extract task IDs from notifications
      const taskIds = notificationsSnapshot.docs.map(
        doc => doc.data().taskId as string,
      );

      // If no task IDs, return empty array
      if (taskIds.length === 0) {
        return [];
      }

      // Get the tasks
      const tasks: Task[] = [];
      for (const chunkIds of this.chunkArray(taskIds, 10)) {
        // Firestore "in" queries are limited to 10 values
        const tasksSnapshot = await getDocs(
          query(this.tasksCollection, where('__name__', 'in', chunkIds)),
        );

        tasks.push(
          ...tasksSnapshot.docs.map(
            doc => ({id: doc.id, ...doc.data()}) as Task,
          ),
        );
      }

      return tasks;
    } catch (error) {
      logger.error(
        'TaskService :: getPendingDuoTaskInvitations() ::',
        error,
        'TaskService',
      );
      throw error;
    }
  }

  /**
   * Accept a team task invitation
   */
  async acceptDuoTaskInvitation(taskId: string): Promise<void> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.debug(
        `TaskService :: acceptDuoTaskInvitation() :: User ${userId} accepting task ${taskId}`,
        undefined,
        'TaskService',
      );

      // Get the task to verify user is a collaborator
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));

      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      const task = taskDoc.data() as Task;

      if (!task.collaborators?.includes(userId)) {
        throw new Error('User is not a collaborator on this task');
      }

      // Update task status
      await updateDoc(doc(this.tasksCollection, taskId), {
        collaborationStatus: 'active',
        updatedAt: serverTimestamp(),
      });

      logger.debug(
        `TaskService :: acceptDuoTaskInvitation() :: Updated task status to active`,
        undefined,
        'TaskService',
      );

      // Update notification as read
      const notificationsSnapshot = await getDocs(
        query(
          collection(getFirestore(), 'notifications'),
          where('userId', '==', userId),
          where('taskId', '==', taskId),
          where('type', '==', 'duo_task_invitation'),
        ),
      );

      if (!notificationsSnapshot.empty) {
        const batch = writeBatch(getFirestore());
        notificationsSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {read: true});
        });
        await batch.commit();
        logger.debug(
          `TaskService :: acceptDuoTaskInvitation() :: Updated notifications as read`,
          undefined,
          'TaskService',
        );
      }

      // Notify the task creator
      const notifyUserId = task.userId;
      if (notifyUserId !== userId) {
        await addDoc(collection(getFirestore(), 'notifications'), {
          userId: notifyUserId,
          type: 'duo_task_accepted',
          title: 'Team Task Accepted',
          message: `${
            getAuth().currentUser?.displayName || 'A team member'
          } accepted your invitation to task "${task.title}"`,
          taskId: taskId,
          read: false,
          createdAt: serverTimestamp(),
        });
        logger.debug(
          `TaskService :: acceptDuoTaskInvitation() :: Notification sent to task creator: ${notifyUserId}`,
          undefined,
          'TaskService',
        );
      }
    } catch (error) {
      logger.error(
        'TaskService :: acceptDuoTaskInvitation() ::',
        error,
        'TaskService',
      );
      throw error;
    }
  }

  /**
   * Decline a team task invitation
   */
  async rejectDuoTaskInvitation(taskId: string): Promise<void> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.debug(
        `TaskService :: rejectDuoTaskInvitation() :: User ${userId} declining task ${taskId}`,
        undefined,
        'TaskService',
      );

      // Get the task
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));

      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      const task = taskDoc.data() as Task;

      // Remove the user from collaborators
      const updatedCollaborators =
        task.collaborators?.filter(id => id !== userId) || [];

      // If only one collaborator left, convert back to regular task
      if (updatedCollaborators.length <= 1) {
        await updateDoc(doc(this.tasksCollection, taskId), {
          isDuoTask: false,
          collaborators: arrayRemove(),
          collaborationStatus: arrayRemove(),
          updatedAt: serverTimestamp(),
          lastUpdatedBy: userId,
        });
        logger.debug(
          `TaskService :: rejectDuoTaskInvitation() :: Converted task to regular task`,
          undefined,
          'TaskService',
        );
      } else {
        // Update collaborators list
        await updateDoc(doc(this.tasksCollection, taskId), {
          collaborators: updatedCollaborators,
          updatedAt: serverTimestamp(),
          lastUpdatedBy: userId,
        });
        logger.debug(
          `TaskService :: rejectDuoTaskInvitation() :: Removed user from collaborators`,
          undefined,
          'TaskService',
        );
      }
      // Update notification as read
      const notificationsSnapshot = await getDocs(
        query(
          collection(getFirestore(), 'notifications'),
          where('userId', '==', userId),
          where('taskId', '==', taskId),
          where('type', '==', 'duo_task_invitation'),
        ),
      );

      if (!notificationsSnapshot.empty) {
        const batch = writeBatch(getFirestore());
        notificationsSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {read: true});
        });
        await batch.commit();
        logger.debug(
          `TaskService :: rejectDuoTaskInvitation() :: Updated notifications as read`,
          undefined,
          'TaskService',
        );
      }

      // Notify the task creator
      const notifyUserId = task.userId;
      if (notifyUserId !== userId) {
        await addDoc(collection(getFirestore(), 'notifications'), {
          userId: notifyUserId,
          type: 'duo_task_declined',
          title: 'Team Task Declined',
          message: `${
            getAuth().currentUser?.displayName || 'A team member'
          } declined your invitation to task "${task.title}"`,
          taskId: taskId,
          read: false,
          createdAt: serverTimestamp(),
        });
        logger.debug(
          `TaskService :: rejectDuoTaskInvitation() :: Notification sent to task creator: ${notifyUserId}`,
          undefined,
          'TaskService',
        );
      }
    } catch (error) {
      logger.error(
        'TaskService :: rejectDuoTaskInvitation() ::',
        error,
        'TaskService',
      );
      throw error;
    }
  }

  /**
   * Helper method to chunk an array into smaller arrays
   * @private
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    let index = 0;
    while (index < array.length) {
      chunked.push(array.slice(index, size + index));
      index += size;
    }
    return chunked;
  }

  /**
   * Update a subtask in a duo/team task
   * @param taskId The ID of the task
   * @param subtaskId The ID of the subtask to update
   * @param updates The updates to apply to the subtask
   * @returns Promise that resolves when the subtask is updated
   */
  async updateDuoTaskSubtask(
    taskId: string,
    subtaskId: string,
    updates: Partial<SubTask>,
  ): Promise<void> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Verify the task exists and user is a collaborator
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      const task = taskDoc.data() as Task;
      if (!task.collaborators?.includes(userId)) {
        throw new Error('User is not a collaborator on this task');
      }

      // Find the subtask to update
      if (!task.subtasks || task.subtasks.length === 0) {
        throw new Error('Task has no subtasks');
      }

      const subtaskIndex = task.subtasks.findIndex(s => s.id === subtaskId);
      if (subtaskIndex === -1) {
        throw new Error('Subtask not found');
      }

      // Create a new Date object for timestamps instead of using serverTimestamp()
      // since serverTimestamp() is not supported in arrays
      const now = new Date();

      // Update the subtask
      const updatedSubtasks = [...task.subtasks];
      updatedSubtasks[subtaskIndex] = {
        ...updatedSubtasks[subtaskIndex],
        ...updates,
        completedBy: updates.completed ? userId : undefined,
        completedAt: updates.completed ? now : undefined,
        updatedAt: now,
      };

      // Calculate the new progress
      const completedCount = updatedSubtasks.filter(s => s.completed).length;
      const progress = Math.round(
        (completedCount / updatedSubtasks.length) * 100,
      );

      // Update the task
      await updateDoc(doc(this.tasksCollection, taskId), {
        subtasks: updatedSubtasks,
        progress,
        updatedAt: serverTimestamp(),
        lastUpdatedBy: userId,
      });

      // Create a notification for other collaborators
      const otherCollaborators = task.collaborators.filter(id => id !== userId);
      if (otherCollaborators.length > 0) {
        const batch = writeBatch(getFirestore());
        const currentUserName =
          getAuth().currentUser?.displayName || 'A team member';
        const subtaskTitle = updatedSubtasks[subtaskIndex].title;

        for (const collaboratorId of otherCollaborators) {
          const notificationRef = doc(
            collection(getFirestore(), 'notifications'),
          );
          batch.set(notificationRef, {
            userId: collaboratorId,
            type: 'subtask_update',
            title: 'Subtask Update',
            message: `${currentUserName} ${
              updates.completed ? 'completed' : 'updated'
            } the subtask "${subtaskTitle}"`,
            taskId: taskId,
            subtaskId: subtaskId,
            read: false,
            createdAt: serverTimestamp(),
          });
        }

        await batch.commit();
      }

      logger.debug(
        `TaskService :: updateDuoTaskSubtask() :: Subtask ${subtaskId} updated successfully`,
        undefined,
        'TaskService',
      );
    } catch (error) {
      logger.error(
        'TaskService :: updateDuoTaskSubtask() ::',
        error,
        'TaskService',
      );
      throw error;
    }
  }

  /**
   * Add a subtask to a duo/team task
   * @param taskId The ID of the task
   * @param subtask The subtask to add
   * @returns Promise that resolves when the subtask is added
   */
  async addDuoTaskSubtask(
    taskId: string,
    subtask: Omit<SubTask, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Verify the task exists and user is a collaborator
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      const task = taskDoc.data() as Task;
      if (!task.collaborators?.includes(userId)) {
        throw new Error('User is not a collaborator on this task');
      }

      // Create a new Date object for timestamps
      const now = new Date();

      // Create a new subtask with ID and timestamps
      const newSubtask: SubTask = {
        id: this.generateUUID(),
        ...subtask,
        createdAt: now,
        updatedAt: now,
      };

      // Add the subtask to the task
      const updatedSubtasks = task.subtasks
        ? [...task.subtasks, newSubtask]
        : [newSubtask];

      // Calculate the new progress
      const completedCount = updatedSubtasks.filter(s => s.completed).length;
      const progress = Math.round(
        (completedCount / updatedSubtasks.length) * 100,
      );

      // Update the task
      await updateDoc(doc(this.tasksCollection, taskId), {
        subtasks: updatedSubtasks,
        progress,
        updatedAt: serverTimestamp(),
        lastUpdatedBy: userId,
      });

      // Create a notification for other collaborators
      const otherCollaborators = task.collaborators.filter(id => id !== userId);
      if (otherCollaborators.length > 0) {
        const batch = writeBatch(getFirestore());
        const currentUserName =
          getAuth().currentUser?.displayName || 'A team member';

        for (const collaboratorId of otherCollaborators) {
          const notificationRef = doc(
            collection(getFirestore(), 'notifications'),
          );
          batch.set(notificationRef, {
            userId: collaboratorId,
            type: 'subtask_added',
            title: 'New Subtask',
            message: `${currentUserName} added a new subtask "${newSubtask.title}"`,
            taskId: taskId,
            subtaskId: newSubtask.id,
            read: false,
            createdAt: serverTimestamp(),
          });
        }

        await batch.commit();
      }

      logger.debug(
        `TaskService :: addDuoTaskSubtask() :: Subtask added successfully to task ${taskId}`,
        undefined,
        'TaskService',
      );
    } catch (error) {
      logger.error(
        'TaskService :: addDuoTaskSubtask() ::',
        error,
        'TaskService',
      );
      throw error;
    }
  }

  /**
   * Get messages for a duo/team task
   * @param taskId The ID of the task
   * @returns Promise that resolves with the messages
   */
  async getDuoTaskMessages(taskId: string): Promise<any[]> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Verify the task exists and user is a collaborator
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      const task = taskDoc.data() as Task;
      if (!task.collaborators?.includes(userId)) {
        throw new Error('User is not a collaborator on this task');
      }

      // Get the messages for this task
      const messagesSnapshot = await getDocs(
        query(
          collection(getFirestore(), 'taskMessages'),
          where('taskId', '==', taskId),
          orderBy('createdAt', 'asc'),
        ),
      );

      // Process the messages with user info
      const messages = [];
      for (const doc of messagesSnapshot.docs) {
        const messageData = doc.data();
        let userData = {displayName: 'Unknown User'};

        try {
          const userDoc = await getDoc(
            doc(collection(getFirestore(), 'users'), messageData.userId),
          );
          if (userDoc.exists()) {
            userData = userDoc.data() || userData;
          }
        } catch (e) {
          logger.error(
            'Error fetching user data for message',
            e,
            'TaskService',
          );
        }

        messages.push({
          id: doc.id,
          ...messageData,
          user: {
            id: messageData.userId,
            displayName:
              userData.displayName || userData.email || 'Unknown User',
            photoURL: userData.photoURL || null,
          },
          isCurrentUser: messageData.userId === userId,
        });
      }

      return messages;
    } catch (error) {
      logger.error(
        'TaskService :: getDuoTaskMessages() ::',
        error,
        'TaskService',
      );
      throw error;
    }
  }

  /**
   * Send a message for a duo/team task
   * @param taskId The ID of the task
   * @param message The message to send
   * @returns Promise that resolves when the message is sent
   */
  async sendDuoTaskMessage(taskId: string, message: string): Promise<void> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Verify the task exists and user is a collaborator
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }

      const task = taskDoc.data() as Task;
      if (!task.collaborators?.includes(userId)) {
        throw new Error('User is not a collaborator on this task');
      }

      // Add the message
      await addDoc(collection(getFirestore(), 'taskMessages'), {
        taskId,
        userId,
        message,
        createdAt: serverTimestamp(),
      });

      // Create notifications for other collaborators
      const otherCollaborators = task.collaborators.filter(id => id !== userId);
      if (otherCollaborators.length > 0) {
        const batch = writeBatch(getFirestore());
        const currentUserName =
          getAuth().currentUser?.displayName || 'A team member';

        for (const collaboratorId of otherCollaborators) {
          const notificationRef = doc(
            collection(getFirestore(), 'notifications'),
          );
          batch.set(notificationRef, {
            userId: collaboratorId,
            type: 'task_message',
            title: 'New Message',
            message: `${currentUserName} sent a message in task "${task.title}"`,
            taskId: taskId,
            read: false,
            createdAt: serverTimestamp(),
          });
        }

        await batch.commit();
      }

      logger.debug(
        `TaskService :: sendDuoTaskMessage() :: Message sent successfully for task ${taskId}`,
        undefined,
        'TaskService',
      );
    } catch (error) {
      logger.error(
        'TaskService :: sendDuoTaskMessage() ::',
        error,
        'TaskService',
      );
      throw error;
    }
  }

  /**
   * Helper method to generate a UUID
   * @private
   */
  private generateUUID(): string {
    // Use a timestamp-based prefix to ensure uniqueness
    const timestamp = Date.now().toString(36);

    // Generate random segments
    const randomSegment1 = Math.random().toString(36).substring(2, 15);
    const randomSegment2 = Math.random().toString(36).substring(2, 15);

    // Combine timestamp and random segments to form a UUID-like string
    return `${timestamp}-${randomSegment1}-${randomSegment2}`;
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.debug(
        `TaskService :: getTaskById() :: Fetching task with ID: ${taskId}`,
        undefined,
        'TaskService',
      );

      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));

      if (!taskDoc.exists()) {
        logger.warn(
          `TaskService :: getTaskById() :: Task not found: ${taskId}`,
          undefined,
          'TaskService',
        );
        return null;
      }

      const task = {
        id: taskId,
        ...taskDoc.data(),
      } as Task;

      // Verify user has access to this task
      if (!task.isDuoTask || !task.collaborators?.includes(userId)) {
        if (task.userId !== userId) {
          logger.warn(
            `TaskService :: getTaskById() :: User does not have access to task: ${taskId}`,
            undefined,
            'TaskService',
          );
          return null;
        }
      }

      logger.debug(
        `TaskService :: getTaskById() :: Successfully retrieved task: ${taskId}`,
        undefined,
        'TaskService',
      );
      return task;
    } catch (error) {
      logger.error('TaskService :: getTaskById() ::', error, 'TaskService');
      throw error;
    }
  }
}
