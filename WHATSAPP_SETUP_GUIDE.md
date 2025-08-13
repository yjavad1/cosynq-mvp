# WhatsApp Business API Setup Guide

## Overview
This guide covers the complete setup of WhatsApp Business API integration with Cosynq MVP backend.

## 🏗️ Backend Infrastructure Complete ✅

### Files Created:
1. **`/backend/src/models/WhatsAppMessage.ts`** - Message model with full schema
2. **`/backend/src/services/whatsappService.ts`** - Core WhatsApp service class
3. **`/backend/src/controllers/whatsappController.ts`** - API endpoints controller
4. **`/backend/src/routes/whatsapp.ts`** - Route definitions
5. **`/backend/src/routes/index.ts`** - Updated to include WhatsApp routes

### Features Implemented:
- ✅ Webhook verification and message handling
- ✅ Inbound/outbound message processing  
- ✅ Phone number to contact mapping
- ✅ Message status tracking (sent/delivered/read/failed)
- ✅ Conversation history management
- ✅ Template and text message sending
- ✅ Security with webhook signature verification
- ✅ Database integration with Contact model
- ✅ Error handling and logging

## 🔧 Required Environment Variables

Add these to your backend environment (`.env` file):

```bash
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token_here
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret_here
WHATSAPP_API_VERSION=v18.0
```

## 📱 WhatsApp Business API Account Setup

### Step 1: Meta Business Account
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or use existing business app
3. Add "WhatsApp" product to your app

### Step 2: Phone Number Setup
1. In WhatsApp > Getting Started
2. Add your phone number (must be business phone)
3. Verify phone number with code
4. Note down the **Phone Number ID**

### Step 3: Access Token
1. In WhatsApp > API Setup
2. Generate a **Permanent Access Token** (not temporary)
3. Copy the **Business Account ID**
4. Save both values securely

### Step 4: Webhook Configuration
1. In WhatsApp > Configuration
2. Set Webhook URL: `https://your-domain.com/api/whatsapp/webhook`
3. Set Verify Token: Use a strong random string
4. Subscribe to webhook fields: `messages`

## 🔐 Security Setup

### Webhook Signature Verification
The system automatically verifies webhook signatures if `WHATSAPP_WEBHOOK_SECRET` is set.

### Token Management
- Use **permanent access tokens** for production
- Store tokens securely in environment variables
- Rotate tokens regularly for security

## 🧪 Testing the Integration

### 1. Test Webhook Verification
```bash
curl "https://your-domain.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=1234567890"
```
Should return: `1234567890`

### 2. Test Service Status
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-domain.com/api/whatsapp/status
```

### 3. Send Test Message
```bash
curl -X POST https://your-domain.com/api/whatsapp/send-message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "message": "Hello from Cosynq!"
  }'
```

## 📊 Available API Endpoints

### Public (No Auth):
- `GET /api/whatsapp/webhook` - Webhook verification
- `POST /api/whatsapp/webhook` - Receive messages

### Protected (Requires Auth):
- `POST /api/whatsapp/send-message` - Send text message
- `POST /api/whatsapp/send-template` - Send template message
- `GET /api/whatsapp/conversations` - List all conversations  
- `GET /api/whatsapp/conversation/:phoneNumber` - Get specific conversation
- `GET /api/whatsapp/status` - Service status

## 🔄 Message Flow

### Inbound Messages:
1. WhatsApp sends webhook to `/api/whatsapp/webhook`
2. System verifies signature and processes message
3. Creates/finds contact based on phone number
4. Saves message to database with contact link
5. Ready for AI processing (future enhancement)

### Outbound Messages:
1. API call to `/api/whatsapp/send-message`
2. Formats phone number and validates contact
3. Sends via WhatsApp Business API
4. Saves message to database for tracking
5. Status updates received via webhooks

## 🗄️ Database Schema

### WhatsAppMessage Model:
```typescript
{
  messageId: string,          // WhatsApp message ID
  contactId: ObjectId,        // Link to Contact
  phoneNumber: string,        // E.164 format
  direction: 'inbound'|'outbound',
  messageType: 'text'|'image'|'template'|etc,
  content: {
    text?: string,
    mediaUrl?: string,
    templateName?: string
  },
  status: 'sent'|'delivered'|'read'|'failed',
  timestamp: Date,
  metadata: {
    deliveredAt?: Date,
    readAt?: Date,
    failureReason?: string
  }
}
```

## 📞 Phone Number Integration

### Automatic Contact Linking:
- Inbound messages automatically create/link contacts
- Phone numbers normalized to E.164 format
- New contacts created with WhatsApp profile info
- Existing contacts matched by phone number

### Contact Enhancement:
- WhatsApp profile name stored in contact metadata
- Tags added to identify WhatsApp contacts
- Source tracking for analytics

## 🚀 Production Checklist

- [ ] Set up Meta Business account
- [ ] Configure phone number and verify
- [ ] Generate permanent access token
- [ ] Set webhook URL and verify token
- [ ] Add all environment variables
- [ ] Test webhook verification
- [ ] Test message sending/receiving
- [ ] Configure webhook signature verification
- [ ] Set up monitoring and logging
- [ ] Test phone number formatting
- [ ] Verify contact creation/linking

## 🔮 Future Enhancements Ready For:

1. **AI Message Processing**: Hook into `processIncomingMessage()` 
2. **Rich Message Types**: Image, document, location support
3. **Message Templates**: Dynamic template management
4. **Broadcast Messages**: Bulk messaging capabilities
5. **Analytics**: Message metrics and conversation insights
6. **Customer Service**: Queue management and agent assignment

## 📋 Next Steps

1. **Set up Meta Business account** following Step 1-4 above
2. **Add environment variables** to backend deployment
3. **Deploy backend** with WhatsApp routes
4. **Test webhook** verification endpoint
5. **Send first test message** via API
6. **Integrate with contact management** system
7. **Add frontend interface** for WhatsApp conversations

The WhatsApp Business API foundation is now complete and ready for testing and production deployment!