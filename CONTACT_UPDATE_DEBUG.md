# Contact Update Debugging Guide

The contact update endpoint now has comprehensive error logging. When you encounter a 500 error, check your backend server console for these debug sections:

## 🔍 **Frontend Logging**

When you try to update a contact, you'll see:

```
=== FRONTEND UPDATE CONTACT DEBUG ===
Contact ID: [contact-id]
Update data: {
  // The exact data being sent
}

=== API SERVICE UPDATE CONTACT ===
Contact ID: [contact-id]
Sending update data to API: {
  // Cleaned data being sent to server
}
```

If it fails on the frontend:
```
=== FRONTEND UPDATE CONTACT ERROR ===
Contact ID: [contact-id]
Update data that failed: { ... }
Error details: [axios error]
Error response from server: { ... }
HTTP status code: [status]
=== FRONTEND UPDATE CONTACT ERROR END ===
```

## 🔧 **Backend Logging**

On the server side, you'll see detailed logs:

```
=== UPDATE CONTACT DEBUG START ===
Contact ID: [id]
User ID: [user-id]
Request body: {
  // Raw request data
}
Validated data: {
  // Data after Joi validation
}
Processing contact ID: [id]
Building update data...
Final update data: {
  // Data that will be sent to MongoDB
}
Executing findOneAndUpdate...
Query filter: { _id: [id], organizationId: [org-id] }
findOneAndUpdate completed, contact found: true/false
Populating contact references...
Population completed successfully
=== UPDATE CONTACT DEBUG END ===
```

## ⚠️ **Error Types**

### Validation Errors (400)
```
Validation error details: [joi errors]
// or
Mongoose validation errors: [mongoose errors]
```

### Database Errors
```
=== UPDATE CONTACT ERROR ===
Error type: [ValidationError|CastError|MongoError]
Error message: [specific message]
Error stack: [full stack trace]
```

### Specific Error Patterns
- **CastError**: Invalid data types (e.g., invalid ObjectId)
- **ValidationError**: Schema validation failed
- **Code 11000**: Duplicate key constraint violation
- **Contact not found**: Invalid ID or wrong organization
- **MongoDB Path Conflict**: ✅ FIXED - "Updating the path 'aiContext' would create a conflict"

## 🔧 **MongoDB Conflict Fix**

The update logic now properly handles nested objects to avoid MongoDB path conflicts:

**Before (caused conflict):**
```javascript
updateData = {
  ...value,  // Contains aiContext object
  'aiContext.preferences': [...],  // Dot notation for same field
  // ❌ MongoDB conflict: can't update both aiContext and aiContext.preferences
}
```

**After (conflict resolved):**
```javascript
const { aiContext, ...otherFields } = value;
updateData = {
  ...otherFields,  // aiContext excluded
  'aiContext.preferences': [...],  // Only dot notation updates
  'aiContext.interests': [...],
  'aiContext.lastContextUpdate': new Date()
  // ✅ No conflict: only using dot notation for aiContext
}
```

## 🔧 **Common Issues & Solutions**

1. **Invalid ObjectId**: Check the contact ID format
2. **Validation Error**: Check required fields and data types
3. **Email Conflict**: Another contact has the same email
4. **AssignedTo Error**: Invalid user ID in assignedTo field
5. **Population Error**: Reference fields have invalid data

## 📋 **What to Look For**

When debugging:
1. Check if validation passes
2. Verify the contact ID is valid
3. Confirm the user has access to the contact (organizationId match)
4. Look for any MongoDB-specific errors
5. Check if population of references fails

The logs will now show exactly where the error occurs in the update process!