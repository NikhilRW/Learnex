import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {LexAIConversation} from '../../types/lexAITypes';

/**
 * Service class to handle LexAI data storage in Firestore.
 * Replaces the AsyncStorage implementation with Firestore.
 */
export class LexAIFirestoreService {
  private conversationsCollection = firestore().collection(
    'lexai_conversations',
  );

  /**
   * Save a conversation to Firestore
   */
  async saveConversation(conversation: LexAIConversation): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Add userId to the conversation document for security rules
      const conversationWithUser = {
        ...conversation,
        userId,
        // Convert timestamp numbers to Firestore timestamps
        firestoreCreatedAt: firestore.Timestamp.fromMillis(
          conversation.createdAt,
        ),
        firestoreUpdatedAt: firestore.Timestamp.fromMillis(
          conversation.updatedAt,
        ),
      };

      // Use the conversation ID as the document ID
      await this.conversationsCollection
        .doc(conversation.id)
        .set(conversationWithUser);
    } catch (error) {
      console.error('Error saving LexAI conversation to Firestore:', error);
      throw error;
    }
  }

  /**
   * Load all conversations for the current user from Firestore
   */
  async loadConversations(): Promise<LexAIConversation[]> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const conversationsSnapshot = await this.conversationsCollection
        .where('userId', '==', userId)
        .orderBy('firestoreUpdatedAt', 'desc')
        .get();

      return conversationsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Return the conversation with original createdAt/updatedAt properties
        return {
          id: doc.id,
          title: data.title,
          messages: data.messages,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          mode: data.mode,
        } as LexAIConversation;
      });
    } catch (error) {
      console.error('Error loading LexAI conversations from Firestore:', error);
      return [];
    }
  }

  /**
   * Delete a conversation from Firestore
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Verify the conversation belongs to the current user
      const conversationDoc = await this.conversationsCollection
        .doc(conversationId)
        .get();
      if (
        !conversationDoc.exists ||
        conversationDoc.data()?.userId !== userId
      ) {
        throw new Error('Conversation not found or unauthorized');
      }

      await this.conversationsCollection.doc(conversationId).delete();
    } catch (error) {
      console.error('Error deleting LexAI conversation from Firestore:', error);
      throw error;
    }
  }

  /**
   * Get the active conversation ID from Firestore
   */
  async getActiveConversationId(): Promise<string | null> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        return null;
      }

      // Store active conversation ID in the user's document
      const userDoc = await firestore().collection('users').doc(userId).get();
      if (userDoc.exists()) {
        return userDoc.data()?.lexai_active_conversation || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting active LexAI conversation ID:', error);
      return null;
    }
  }

  /**
   * Set the active conversation ID in Firestore
   */
  async setActiveConversationId(conversationId: string): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Store active conversation ID in the user's document
      await firestore().collection('users').doc(userId).update({
        lexai_active_conversation: conversationId,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error setting active LexAI conversation ID:', error);
      throw error;
    }
  }
}

export default new LexAIFirestoreService();
