/**
 * Essential MongoDB indexes for production stability
 * Run this during application startup to ensure indexes exist
 */
import mongoose from 'mongoose';

export async function ensureEssentialIndexes(): Promise<void> {
  try {
    console.log('🔍 Ensuring essential database indexes...');
    
    const db = mongoose.connection.db;
    if (!db) {
      console.warn('⚠️ Database connection not ready, skipping index creation');
      return;
    }

    // WhatsApp Messages Collection - Critical for conversation queries
    await db.collection('whatsappmessages').createIndex(
      {
        organizationId: 1,
        conversationId: 1,
        sentAt: -1
      },
      { 
        background: true,
        name: 'whatsapp_conversation_idx'
      }
    );

    await db.collection('whatsappmessages').createIndex(
      {
        organizationId: 1,
        fromNumber: 1,
        direction: 1,
        sentAt: -1
      },
      { 
        background: true,
        name: 'whatsapp_messaging_window_idx'
      }
    );

    // Ensure messageId uniqueness for duplicate prevention
    await db.collection('whatsappmessages').createIndex(
      { messageId: 1 },
      { 
        unique: true,
        background: true,
        name: 'whatsapp_message_id_unique'
      }
    );

    console.log('✅ Essential database indexes created successfully');
  } catch (error) {
    console.error('❌ Failed to create database indexes:', error);
    // Don't throw - app should still start even if indexes fail
  }
}