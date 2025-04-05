import auth from '@react-native-firebase/auth';
import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import {generateRoomCode} from '../../helpers/roomCodeGenerator';

export interface Meeting {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  host: string;
  participants: string[];
  roomCode: string;
  isPrivate: boolean;
  maxParticipants: number;
  settings: {
    muteOnEntry: boolean;
    allowChat: boolean;
    allowScreenShare: boolean;
    recordingEnabled: boolean;
  };
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface MeetingError extends Error {
  code?: string;
  details?: any;
}

export class MeetingService {
  private meetingsCollection = firestore().collection('meetings');
  private unsubscribeMeeting: (() => void) | null = null;
  private endTimeCheckInterval: NodeJS.Timeout | null = null;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  private async retryOperation<T>(
    operation: () => Promise<T>,
    customError?: string,
  ): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.retryAttempts) {
          await new Promise(resolve =>
            setTimeout(resolve, this.retryDelay * attempt),
          );
        }
      }
    }
    throw this.createError(
      customError || 'Operation failed after multiple attempts',
      lastError,
    );
  }

  private createError(message: string, originalError?: any): MeetingError {
    const error: MeetingError = new Error(message);
    if (originalError) {
      error.code = originalError.code;
      error.details = originalError;
    }
    return error;
  }

  private validateMeetingData(meetingData: Partial<Meeting>): void {
    if (!meetingData.title?.trim()) {
      throw this.createError('Meeting title is required');
    }
    if (!meetingData.duration && meetingData.duration !== 0) {
      throw this.createError('Meeting duration is required');
    }
    if (meetingData.duration < 1) {
      throw this.createError('Meeting duration must be at least 1 minute');
    }
    if (meetingData.duration > 100) {
      throw this.createError('Meeting duration cannot exceed 100 minutes');
    }
    if (meetingData.maxParticipants && meetingData.maxParticipants < 2) {
      throw this.createError('Maximum participants must be at least 2');
    }
  }
  /**
   * Create a new meeting
   */
  async createMeeting(
    meetingData: Omit<
      Meeting,
      'id' | 'status' | 'participants' | 'createdAt' | 'updatedAt' | 'roomCode'
    >,
  ): Promise<string> {
    return this.retryOperation(async () => {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw this.createError('User not authenticated');
      }

      this.validateMeetingData(meetingData);

      const meeting = {
        ...meetingData,
        host: userId,
        status: 'scheduled',
        participants: [userId],
        roomCode: generateRoomCode(),
        settings: {
          ...meetingData.settings,
          muteOnEntry: meetingData.settings?.muteOnEntry ?? true,
          allowChat: meetingData.settings?.allowChat ?? true,
          allowScreenShare: meetingData.settings?.allowScreenShare ?? true,
          recordingEnabled: meetingData.settings?.recordingEnabled ?? false,
        },
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.meetingsCollection.add(meeting);
      return docRef.id;
    }, 'Failed to create meeting');
  }

  /**
   * Join an existing meeting
   */
  async joinMeeting(meetingId: string): Promise<void> {
    return this.retryOperation(async () => {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw this.createError('User not authenticated');
      }

      const meetingRef = this.meetingsCollection.doc(meetingId);
      const meetingDoc = await meetingRef.get();

      if (!meetingDoc.exists) {
        throw this.createError('Meeting not found');
      }

      const meetingData = meetingDoc.data() as Meeting;

      if (
        meetingData.status === 'completed' ||
        meetingData.status === 'cancelled'
      ) {
        throw this.createError('Meeting has ended');
      }

      if (meetingData.isPrivate && meetingData.host !== userId) {
        throw this.createError('This is a private meeting');
      }

      if (
        meetingData.maxParticipants &&
        meetingData.participants.length >= meetingData.maxParticipants
      ) {
        console.warn(
          `Meeting ${meetingId} has reached maximum participants limit of ${meetingData.maxParticipants}`,
        );
        throw this.createError(
          `Meeting has reached maximum participants limit of ${meetingData.maxParticipants}`,
        );
      }

      await meetingRef.update({
        participants: firestore.FieldValue.arrayUnion(userId),
        status: 'active',
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }, 'Failed to join meeting');
  }

  /**
   * Leave a meeting
   */
  async leaveMeeting(meetingId: string): Promise<void> {
    return this.retryOperation(async () => {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw this.createError('User not authenticated');
      }

      const meetingRef = this.meetingsCollection.doc(meetingId);
      const meetingDoc = await meetingRef.get();

      if (!meetingDoc.exists) {
        throw this.createError('Meeting not found');
      }

      const meetingData = meetingDoc.data() as Meeting;

      // If host leaves, end the meeting for everyone
      if (meetingData.host === userId) {
        await this.endMeeting(meetingId);
        return;
      }

      // Clean up participant state data from Firestore
      try {
        await this.meetingsCollection
          .doc(meetingId)
          .collection('participantStates')
          .doc(userId)
          .delete();
        console.log(
          `Deleted participant state for ${userId} in meeting ${meetingId}`,
        );
      } catch (error) {
        console.error('Error deleting participant state:', error);
        // Continue with removal from participants list even if state deletion fails
      }

      await meetingRef.update({
        participants: firestore.FieldValue.arrayRemove(userId),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }, 'Failed to leave meeting');
  }

  /**
   * End a meeting (host only)
   */
  async endMeeting(meetingId: string): Promise<void> {
    return this.retryOperation(async () => {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw this.createError('User not authenticated');
      }

      const meetingRef = this.meetingsCollection.doc(meetingId);
      const meetingDoc = await meetingRef.get();

      if (!meetingDoc.exists) {
        throw this.createError('Meeting not found');
      }

      const meetingData = meetingDoc.data() as Meeting;
      if (meetingData.host !== userId) {
        throw this.createError('Only the host can end the meeting');
      }

      // Delete all participant states for this meeting
      try {
        // Get all participant state documents
        const participantStatesSnapshot = await this.meetingsCollection
          .doc(meetingId)
          .collection('participantStates')
          .get();

        // Delete each document
        const deletionPromises = participantStatesSnapshot.docs.map(doc =>
          doc.ref.delete(),
        );
        await Promise.all(deletionPromises);

        console.log(
          `Deleted ${participantStatesSnapshot.size} participant states for meeting ${meetingId}`,
        );
      } catch (error) {
        console.error('Error deleting participant states:', error);
        // Continue with meeting end even if state deletion fails
      }

      await meetingRef.update({
        status: 'completed',
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }, 'Failed to end meeting');
  }

  /**
   * Update meeting settings
   */
  async updateMeetingSettings(
    meetingId: string,
    settings: Partial<Meeting['settings']>,
  ): Promise<void> {
    return this.retryOperation(async () => {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw this.createError('User not authenticated');
      }

      const meetingRef = this.meetingsCollection.doc(meetingId);
      const meetingDoc = await meetingRef.get();

      if (!meetingDoc.exists) {
        throw this.createError('Meeting not found');
      }

      const meetingData = meetingDoc.data() as Meeting;
      if (meetingData.host !== userId) {
        throw this.createError('Only the host can update meeting settings');
      }

      await meetingRef.update({
        settings: {...meetingData.settings, ...settings},
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }, 'Failed to update meeting settings');
  }

  /**
   * Check if meeting should end based on end time
   */
  private async checkMeetingEndTime(meetingId: string): Promise<boolean> {
    try {
      const meetingDoc = await this.meetingsCollection.doc(meetingId).get();
      if (!meetingDoc.exists) return false;

      const meetingData = meetingDoc.data() as Meeting;
      const now = new Date();
      const endTime = new Date(
        meetingData.duration * 60000 + meetingData.createdAt.toMillis(),
      );

      return endTime <= now;
    } catch (error) {
      console.error('Error checking meeting end time:', error);
      return false;
    }
  }

  /**
   * Start monitoring meeting end time
   */
  startEndTimeMonitoring(meetingId: string, onMeetingEnd: () => void): void {
    // Clear any existing interval
    if (this.endTimeCheckInterval) {
      clearInterval(this.endTimeCheckInterval);
    }

    // Check every minute if meeting should end
    this.endTimeCheckInterval = setInterval(async () => {
      try {
        const shouldEnd = await this.checkMeetingEndTime(meetingId);
        if (shouldEnd) {
          await this.endMeeting(meetingId);
          onMeetingEnd();
          this.stopEndTimeMonitoring();
        }
      } catch (error) {
        console.error('Error in end time monitoring:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop monitoring meeting end time
   */
  stopEndTimeMonitoring(): void {
    if (this.endTimeCheckInterval) {
      clearInterval(this.endTimeCheckInterval);
      this.endTimeCheckInterval = null;
    }
  }

  /**
   * Subscribe to meeting updates with end time monitoring
   */
  subscribeMeeting(
    meetingId: string,
    onUpdate: (meeting: Meeting) => void,
    onError: (error: MeetingError) => void,
  ): void {
    try {
      if (this.unsubscribeMeeting) {
        this.unsubscribeMeeting();
      }

      this.unsubscribeMeeting = this.meetingsCollection
        .doc(meetingId)
        .onSnapshot(
          snapshot => {
            if (!snapshot) {
              const error = this.createError('Failed to get meeting data');
              console.warn(
                'MeetingService: Received null snapshot in meeting listener',
              );
              onError(error);
              return;
            }

            try {
              if (snapshot.exists) {
                const meeting = {
                  id: snapshot.id,
                  ...snapshot.data(),
                } as Meeting;

                // Check if meeting has ended
                const now = new Date();
                const endTime = new Date(
                  meeting.duration * 60000 + meeting.createdAt.toMillis(),
                );
                if (this.endTimeCheckInterval) {
                  clearInterval(this.endTimeCheckInterval);
                  this.endTimeCheckInterval = null;
                }
                this.startEndTimeMonitoring(meetingId, () => {
                  meeting.status = 'completed';
                  onUpdate(meeting);
                });

                if (endTime <= now && meeting.status !== 'completed') {
                  this.endMeeting(meetingId)
                    .then(() => {
                      meeting.status = 'completed';
                      onUpdate(meeting);
                    })
                    .catch(error => {
                      console.error('Error ending expired meeting:', error);
                    });
                } else {
                  onUpdate(meeting);
                }
              } else {
                onError(this.createError('Meeting not found'));
              }
            } catch (error) {
              console.error(
                'MeetingService: Error processing meeting snapshot:',
                error,
              );
              onError(this.createError('Error processing meeting data', error));
            }
          },
          error => {
            console.error('MeetingService: Error in meeting listener:', error);
            onError(this.createError('Meeting subscription error', error));
          },
        );
    } catch (error) {
      console.error('MeetingService :: subscribeMeeting() ::', error);
      onError(
        this.createError('Failed to subscribe to meeting updates', error),
      );
    }
  }

  /**
   * Get meeting by ID
   */
  async getMeeting(meetingId: string): Promise<Meeting> {
    return this.retryOperation(async () => {
      const meetingDoc = await this.meetingsCollection.doc(meetingId).get();
      if (!meetingDoc.exists) {
        throw this.createError('Meeting not found');
      }

      return {
        id: meetingDoc.id,
        ...meetingDoc.data(),
      } as Meeting;
    }, 'Failed to get meeting');
  }

  /**
   * Get meeting by room code
   */
  async getMeetingByRoomCode(roomCode: string): Promise<Meeting> {
    return this.retryOperation(async () => {
      const querySnapshot = await this.meetingsCollection
        .where('roomCode', '==', roomCode)
        .where('status', 'in', ['scheduled', 'active'])
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        throw this.createError('Meeting not found');
      }

      const meetingDoc = querySnapshot.docs[0];
      return {
        id: meetingDoc.id,
        ...meetingDoc.data(),
      } as Meeting;
    }, 'Failed to get meeting by room code');
  }

  /**
   * Get active meetings
   */
  async getActiveMeetings(): Promise<Meeting[]> {
    return this.retryOperation(async () => {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw this.createError('User not authenticated');
      }

      const querySnapshot = await this.meetingsCollection
        .where('participants', 'array-contains', userId)
        .where('status', '==', 'active')
        .orderBy('startTime', 'desc')
        .get();

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Meeting[];
    }, 'Failed to get active meetings');
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopEndTimeMonitoring();
    if (this.unsubscribeMeeting) {
      this.unsubscribeMeeting();
      this.unsubscribeMeeting = null;
    }
  }
}
