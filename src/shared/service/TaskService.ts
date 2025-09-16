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
import Config from 'react-native-config';

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
      console.log('TaskService :: getTasks() ::', error);
      throw error;
    }
  }

  async getTaskSuggestion() {
    try {
      const tasks = await this.getTasks();
      const tasksTitles = tasks.map(task => task.title);
      const payload = {
        messages: [
          {
            role: 'user',
            content: `You Are AI Task Suggestor You Will Get Multiple Tasks Title And Use Them To Predict New One So Here Are The Task Titles ${tasksTitles.join(' ')}
        Now Give Text Of The Next Task Only Nothing Else And If Task Is Not Given Try To Give Any Random But Great Sugesstion Because The person is using app to improve His Carrier Mostly Software Engineer One Give Task Title And Description Separated By | And Make Sure Title Is Small In Length 3 to 7 Words
        `,
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
      console.log('payload', payload);
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
      console.log('TaskService :: getTaskSugesstions() ::', error);
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

      const userId = getAuth().currentUser?.uid;
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDuoTask: task.isDuoTask !== undefined ? task.isDuoTask : false,
      };

      console.log(
        `TaskService :: addTask() :: Adding task to Firestore, notify: ${
          task.notify ? 'Yes' : 'No'
        }, isDuoTask: ${taskWithUser.isDuoTask ? 'Yes' : 'No'}`,
      );
      const docRef = await addDoc(this.tasksCollection, taskWithUser);
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
            await updateDoc(doc(this.tasksCollection, docRef.id), {
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

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        console.log('TaskService :: updateTask() :: User not authenticated');
        throw new Error('User not authenticated');
      }

      // Verify task belongs to current user
      console.log(
        `TaskService :: updateTask() :: Verifying task ownership for user: ${userId}`,
      );
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));

      if (!taskDoc.exists()) {
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
      await updateDoc(doc(this.tasksCollection, taskId), {
        ...taskData,
        notificationId: null, // Clear the notification ID as we'll create a new one
        updatedAt: serverTimestamp(),
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
            await updateDoc(doc(this.tasksCollection, taskId), {
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

      const userId = getAuth().currentUser?.uid;
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
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));

      if (!taskDoc.exists()) {
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

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        console.log('TaskService :: deleteTask() :: User not authenticated');
        throw new Error('User not authenticated');
      }

      // Verify task belongs to current user
      console.log(
        `TaskService :: deleteTask() :: Verifying task ownership for user: ${userId}`,
      );
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));

      if (!taskDoc.exists()) {
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

      await deleteDoc(doc(this.tasksCollection, taskId));
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

      const userId = getAuth().currentUser?.uid;
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

      const tasksSnapshot = await getDocs(
        query(
          this.tasksCollection,
          where('userId', '==', userId),
          where('title', '==', taskName),
          limit(1), // Limit to one result
        ),
      );

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

  /**
   * Create a team task with multiple collaborators
   * @param task The task data
   * @returns The task ID
   */
  async createDuoTask(task: Omit<Task, 'id'>): Promise<string> {
    try {
      console.log(
        `TaskService :: createDuoTask() :: Creating team task: "${task.title}"`,
      );

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        console.log('TaskService :: createDuoTask() :: User not authenticated');
        throw new Error('User not authenticated');
      }

      // Check if collaborators is provided and valid
      if (!task.collaborators || task.collaborators.length < 2) {
        console.warn(
          'TaskService :: createDuoTask() :: Missing or invalid collaborators',
        );
        throw new Error('Team task requires at least two collaborators');
      }

      // Verify current user is one of the collaborators
      if (!task.collaborators.includes(userId)) {
        console.warn(
          'TaskService :: createDuoTask() :: Current user not in collaborators list',
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

      console.log(
        `TaskService :: createDuoTask() :: Adding team task to Firestore`,
      );
      const docRef = await addDoc(this.tasksCollection, teamTask);
      console.log(
        `TaskService :: createDuoTask() :: Team task added with ID: ${docRef.id}`,
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
        console.log(
          `TaskService :: createDuoTask() :: Notification sent to collaborator: ${collaboratorId}`,
        );
      }

      // Schedule notification if enabled
      if (task.notify) {
        const taskWithId = {...teamTask, id: docRef.id} as Task;
        try {
          console.log(
            `TaskService :: createDuoTask() :: Scheduling notification for task: ${docRef.id}`,
          );
          const notificationId =
            await notificationService.scheduleTaskNotification(taskWithId);

          if (notificationId) {
            console.log(
              `TaskService :: createDuoTask() :: Notification scheduled successfully, ID: ${notificationId}`,
            );
            // Update the task with the notification ID
            await updateDoc(doc(this.tasksCollection, docRef.id), {
              notificationId: notificationId,
            });
          } else {
            console.warn(
              `TaskService :: createDuoTask() :: Failed to schedule notification for task: ${docRef.id}`,
            );
          }
        } catch (notificationError) {
          console.error(
            `TaskService :: createDuoTask() :: Error scheduling notification:`,
            notificationError,
          );
        }
      }

      return docRef.id;
    } catch (error) {
      console.error('TaskService :: createDuoTask() ::', error);
      throw error;
    }
  }

  /**
   * Update a team task
   */
  async updateDuoTask(taskId: string, task: Partial<Task>): Promise<Task> {
    try {
      console.log(
        `TaskService :: updateDuoTask() :: Updating team task: "${task.title}" (ID: ${taskId})`,
      );

      const userId = getAuth().currentUser?.uid;
      if (!userId) {
        console.log('TaskService :: updateDuoTask() :: User not authenticated');
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
      console.log(
        `TaskService :: updateDuoTask() :: Team task updated successfully`,
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
            console.log(
              `TaskService :: updateDuoTask() :: Updated notification`,
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
        console.log(
          `TaskService :: updateDuoTask() :: Notifications sent to collaborators`,
        );
      }

      // Return the updated task
      const updatedTaskDoc = await getDoc(doc(this.tasksCollection, taskId));
      return {
        id: taskId,
        ...updatedTaskDoc.data(),
      } as Task;
    } catch (error) {
      console.error('TaskService :: updateDuoTask() ::', error);
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

      console.log(
        `TaskService :: getDuoTasks() :: Fetching team tasks for user: ${userId}`,
      );
      const teamTasksSnapshot = await getDocs(
        query(
          this.tasksCollection,
          where('collaborators', 'array-contains', userId),
          where('isDuoTask', '==', true),
          orderBy('dueDate', 'asc'),
        ),
      );

      console.log(
        `TaskService :: getDuoTasks() :: Found ${teamTasksSnapshot.size} team tasks`,
      );
      return teamTasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
    } catch (error) {
      console.log('TaskService :: getDuoTasks() ::', error);
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
      console.error('TaskService :: getPendingDuoTaskInvitations() ::', error);
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

      console.log(
        `TaskService :: acceptDuoTaskInvitation() :: User ${userId} accepting task ${taskId}`,
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

      console.log(
        `TaskService :: acceptDuoTaskInvitation() :: Updated task status to active`,
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
        console.log(
          `TaskService :: acceptDuoTaskInvitation() :: Updated notifications as read`,
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
        console.log(
          `TaskService :: acceptDuoTaskInvitation() :: Notification sent to task creator: ${notifyUserId}`,
        );
      }
    } catch (error) {
      console.error('TaskService :: acceptDuoTaskInvitation() ::', error);
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

      console.log(
        `TaskService :: rejectDuoTaskInvitation() :: User ${userId} declining task ${taskId}`,
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
        console.log(
          `TaskService :: rejectDuoTaskInvitation() :: Converted task to regular task`,
        );
      } else {
        // Update collaborators list
        await updateDoc(doc(this.tasksCollection, taskId), {
          collaborators: updatedCollaborators,
          updatedAt: serverTimestamp(),
          lastUpdatedBy: userId,
        });
        console.log(
          `TaskService :: rejectDuoTaskInvitation() :: Removed user from collaborators`,
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
        console.log(
          `TaskService :: rejectDuoTaskInvitation() :: Updated notifications as read`,
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
        console.log(
          `TaskService :: rejectDuoTaskInvitation() :: Notification sent to task creator: ${notifyUserId}`,
        );
      }
    } catch (error) {
      console.error('TaskService :: rejectDuoTaskInvitation() ::', error);
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

      console.log(
        `TaskService :: updateDuoTaskSubtask() :: Subtask ${subtaskId} updated successfully`,
      );
    } catch (error) {
      console.error('TaskService :: updateDuoTaskSubtask() ::', error);
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

      console.log(
        `TaskService :: addDuoTaskSubtask() :: Subtask added successfully to task ${taskId}`,
      );
    } catch (error) {
      console.error('TaskService :: addDuoTaskSubtask() ::', error);
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
          console.error('Error fetching user data for message:', e);
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
      console.error('TaskService :: getDuoTaskMessages() ::', error);
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

      console.log(
        `TaskService :: sendDuoTaskMessage() :: Message sent successfully for task ${taskId}`,
      );
    } catch (error) {
      console.error('TaskService :: sendDuoTaskMessage() ::', error);
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

      console.log(
        `TaskService :: getTaskById() :: Fetching task with ID: ${taskId}`,
      );

      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));

      if (!taskDoc.exists()) {
        console.log(
          `TaskService :: getTaskById() :: Task not found: ${taskId}`,
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
          console.log(
            `TaskService :: getTaskById() :: User does not have access to task: ${taskId}`,
          );
          return null;
        }
      }

      console.log(
        `TaskService :: getTaskById() :: Successfully retrieved task: ${taskId}`,
      );
      return task;
    } catch (error) {
      console.error('TaskService :: getTaskById() ::', error);
      throw error;
    }
  }
}
