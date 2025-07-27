import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChatSession, Message } from '../types/chat';

export const chatService = {
  async createChatSession(userId: string, initialTitle: string = 'New Chat'): Promise<string> {
    try {
      const chatSession: Omit<ChatSession, 'id'> = {
        title: initialTitle, // Set initial title to 'New Chat'
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId
      };

      console.log('Creating chat session in Firestore with initial title...');
      const docRef = await addDoc(collection(db, 'chatSessions'), chatSession);
      console.log('Chat session created successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw new Error('Failed to create chat session. Please check your Firestore configuration.');
    }
  },

  async addMessage(sessionId: string, message: Message) {
    try {
      console.log('Adding message to Firestore session:', sessionId);
      const sessionRef = doc(db, 'chatSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (sessionDoc.exists()) {
        // Ensure the message object has all required fields
        const messageToSave = {
          ...message,
          // Make sure isVoice is explicitly set (even if undefined/false)
          isVoice: message.isVoice || false
        };
        
        const currentMessages = sessionDoc.data().messages || [];
        const updatedMessages = [...currentMessages, messageToSave];
        
        await updateDoc(sessionRef, {
          messages: updatedMessages,
          updatedAt: Date.now()
        });
        console.log('Message added to Firestore successfully');
      } else {
        console.error('Session document does not exist:', sessionId);
        throw new Error('Chat session not found');
      }
    } catch (error) {
      console.error('Error adding message to Firestore:', error);
      throw error;
    }
  },

  async deleteChat(sessionId: string) {
    try {
      console.log('Deleting chat session:', sessionId);
      await deleteDoc(doc(db, 'chatSessions', sessionId));
      console.log('Chat session deleted successfully');
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  },

  async updateChatTitle(sessionId: string, title: string) {
    try {
      console.log('Updating chat title:', sessionId, title);
      const sessionRef = doc(db, 'chatSessions', sessionId);
      await updateDoc(sessionRef, {
        title: title,
        updatedAt: Date.now()
      });
      console.log('Chat title updated successfully');
    } catch (error) {
      console.error('Error updating chat title:', error);
      throw error;
    }
  },

  subscribeToChatSessions(userId: string, callback: (sessions: ChatSession[]) => void, onError?: (error: any) => void) {
    // Use a simpler query without orderBy to avoid index requirements
    const q = query(
      collection(db, 'chatSessions'),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q, 
      (snapshot) => {
        const sessions: ChatSession[] = [];
        snapshot.forEach((doc) => {
          sessions.push({ id: doc.id, ...doc.data() } as ChatSession);
        });
        // Sort on the client side instead of requiring a Firestore index
        sessions.sort((a, b) => b.updatedAt - a.updatedAt);
        callback(sessions);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  },

  subscribeToMessages(sessionId: string, callback: (messages: Message[]) => void) {
    const sessionRef = doc(db, 'chatSessions', sessionId);
    
    return onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback(data.messages || []);
      }
    });
  }
};