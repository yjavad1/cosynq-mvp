import mongoose from 'mongoose';
import { Space } from '../models/Space';

/**
 * Migration script to update existing spaces with safe capacity defaults
 * - For all existing spaces: capacity = 1 (preserves behavior)
 * - For "Virtual Address" spaces: capacity = null (unlimited)
 * - All spaces: hasPooledUnits = false (default)
 */

async function migrateSpaceCapacity() {
  try {
    console.log('🚀 Starting space capacity migration...');

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cosynq');
      console.log('📊 Connected to MongoDB');
    }

    // Count existing spaces
    const totalSpaces = await Space.countDocuments({});
    console.log(`📋 Found ${totalSpaces} spaces to migrate`);

    if (totalSpaces === 0) {
      console.log('✅ No spaces found. Migration not needed.');
      return;
    }

    // Update all spaces with default capacity settings
    const defaultUpdate = await Space.updateMany(
      {
        $or: [
          { capacity: { $exists: false } },
          { hasPooledUnits: { $exists: false } }
        ]
      },
      {
        $set: {
          capacity: 1, // Default to 1 to preserve existing behavior
          hasPooledUnits: false // Default to false
        }
      }
    );

    console.log(`✅ Updated ${defaultUpdate.modifiedCount} spaces with default capacity settings`);

    // Special case: Update Virtual Address spaces to unlimited capacity
    const virtualAddressUpdate = await Space.updateMany(
      { type: { $in: ['Virtual Address', 'Virtual Office'] } },
      {
        $set: {
          capacity: null // Unlimited capacity for virtual addresses
        }
      }
    );

    console.log(`✅ Updated ${virtualAddressUpdate.modifiedCount} Virtual Address spaces to unlimited capacity`);

    // Verify migration results
    const verification = await Space.aggregate([
      {
        $group: {
          _id: '$capacity',
          count: { $sum: 1 },
          types: { $addToSet: '$type' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    console.log('📊 Migration verification:');
    verification.forEach(group => {
      const capacityLabel = group._id === null ? 'unlimited' : group._id;
      console.log(`  - Capacity ${capacityLabel}: ${group.count} spaces (${group.types.join(', ')})`);
    });

    // Check hasPooledUnits distribution
    const pooledUnitsCheck = await Space.aggregate([
      {
        $group: {
          _id: '$hasPooledUnits',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('📊 Pooled units distribution:');
    pooledUnitsCheck.forEach(group => {
      console.log(`  - hasPooledUnits ${group._id}: ${group.count} spaces`);
    });

    console.log('🎉 Space capacity migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Script execution
if (require.main === module) {
  migrateSpaceCapacity()
    .then(() => {
      console.log('👋 Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateSpaceCapacity };