import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Booking } from "../models/Booking";
import { Contact } from "../models/Contact";
import { Space } from "../models/Space";
import { WhatsAppMessage } from "../models/WhatsAppMessage";
import mongoose from "mongoose";

/**
 * Get comprehensive analytics dashboard data
 */
export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    // Allow both authenticated and fallback access (like WhatsApp)
    let organizationId: mongoose.Types.ObjectId;

    if (req.user?._id) {
      organizationId = req.user._id;
      console.log("🔐 Using authenticated organization:", organizationId);
    } else {
      const defaultOrgId =
        process.env.DEFAULT_ORGANIZATION_ID || "507f1f77bcf86cd799439011";
      organizationId = new mongoose.Types.ObjectId(defaultOrgId);
      console.log(
        "🔓 Using default organization for analytics:",
        organizationId
      );
    }

    const timeRange = (req.query.timeRange as string) || "30d";
    console.log("📊 Analytics request:", { organizationId, timeRange });

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    console.log("📅 Date range:", { startDate, endDate });

    // Run all analytics queries in parallel for performance
    const [
      overviewMetrics,
      bookingTrends,
      spaceUtilization,
      popularTimeSlots,
      contactMetrics,
      revenueMetrics,
      whatsappMetrics,
    ] = await Promise.all([
      getOverviewMetrics(organizationId, startDate, endDate),
      getBookingTrends(organizationId, startDate, endDate),
      getSpaceUtilization(organizationId, startDate, endDate),
      getPopularTimeSlots(organizationId, startDate, endDate),
      getContactMetrics(organizationId, startDate, endDate),
      getRevenueMetrics(organizationId, startDate, endDate),
      getWhatsAppMetrics(organizationId, startDate, endDate),
    ]);

    const analytics = {
      overview: overviewMetrics,
      trends: {
        bookingsByMonth: bookingTrends,
        spaceUtilization: spaceUtilization,
        popularTimeSlots: popularTimeSlots,
        revenueByMonth: revenueMetrics,
      },
      contacts: contactMetrics,
      whatsapp: whatsappMetrics,
      timeRange,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };

    console.log("✅ Analytics compiled successfully");

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error("❌ Analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate analytics",
      error: error.message,
    });
  }
};

/**
 * Get overview metrics (KPIs)
 */
async function getOverviewMetrics(
  organizationId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  console.log("📊 Calculating overview metrics...");

  const [bookingStats, contactStats, revenueStats, spaceStats] =
    await Promise.all([
      // Total bookings in period
      Booking.countDocuments({
        organizationId,
        createdAt: { $gte: startDate, $lte: endDate },
      }),

      // Active contacts (contacts with recent activity)
      Contact.countDocuments({
        organizationId,
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { updatedAt: { $gte: startDate, $lte: endDate } },
        ],
      }),

      // Revenue calculation
      Booking.aggregate([
        {
          $match: {
            organizationId,
            startTime: { $gte: startDate, $lte: endDate },
            status: { $in: ["confirmed", "completed"] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
            averageBookingValue: { $avg: "$totalPrice" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Total spaces
      Space.countDocuments({ organizationId }),
    ]);

  // Calculate space utilization
  const bookedHours = await Booking.aggregate([
    {
      $match: {
        organizationId,
        startTime: { $gte: startDate, $lte: endDate },
        status: { $in: ["confirmed", "completed"] },
      },
    },
    {
      $group: {
        _id: null,
        totalHours: {
          $sum: {
            $divide: [
              { $subtract: ["$endTime", "$startTime"] },
              1000 * 60 * 60, // Convert ms to hours
            ],
          },
        },
      },
    },
  ]);

  const daysDifference = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalPossibleHours = spaceStats * 10 * daysDifference; // Assuming 10 operating hours per day
  const bookedHoursCount = bookedHours[0]?.totalHours || 0;
  const averageUtilization =
    totalPossibleHours > 0
      ? Math.round((bookedHoursCount / totalPossibleHours) * 100)
      : 0;

  const revenue = revenueStats[0] || {
    totalRevenue: 0,
    averageBookingValue: 0,
  };

  return {
    totalBookings: bookingStats,
    totalRevenue: revenue.totalRevenue || 0,
    averageBookingValue: Math.round(revenue.averageBookingValue || 0),
    averageUtilization: Math.min(averageUtilization, 100), // Cap at 100%
    activeContacts: contactStats,
    totalSpaces: spaceStats,
  };
}

/**
 * Get booking trends by month
 */
async function getBookingTrends(
  organizationId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  console.log("📈 Calculating booking trends...");

  const trends = await Booking.aggregate([
    {
      $match: {
        organizationId,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        bookings: { $sum: 1 },
        revenue: { $sum: "$totalPrice" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
    },
    {
      $project: {
        date: {
          $dateFromParts: {
            year: "$_id.year",
            month: "$_id.month",
            day: "$_id.day",
          },
        },
        bookings: 1,
        revenue: { $ifNull: ["$revenue", 0] },
      },
    },
  ]);

  return trends;
}

/**
 * Get space utilization by space
 */
async function getSpaceUtilization(
  organizationId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  console.log("🏢 Calculating space utilization...");

  const utilization = await Booking.aggregate([
    {
      $match: {
        organizationId,
        startTime: { $gte: startDate, $lte: endDate },
        status: { $in: ["confirmed", "completed"] },
      },
    },
    {
      $lookup: {
        from: "spaces",
        localField: "spaceId",
        foreignField: "_id",
        as: "space",
      },
    },
    {
      $unwind: "$space",
    },
    {
      $group: {
        _id: {
          spaceId: "$space._id",
          spaceName: "$space.name",
          spaceType: "$space.type",
        },
        bookings: { $sum: 1 },
        totalHours: {
          $sum: {
            $divide: [
              { $subtract: ["$endTime", "$startTime"] },
              1000 * 60 * 60,
            ],
          },
        },
        totalRevenue: { $sum: "$totalPrice" },
      },
    },
    {
      $project: {
        spaceId: "$_id.spaceId",
        spaceName: "$_id.spaceName",
        spaceType: "$_id.spaceType",
        bookings: 1,
        totalHours: { $round: ["$totalHours", 1] },
        totalRevenue: 1,
        // Simplified utilization calculation (bookings per day)
        utilizationScore: {
          $round: {
            $multiply: [
              {
                $divide: [
                  "$bookings",
                  Math.ceil(
                    (endDate.getTime() - startDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  ),
                ],
              },
              100,
            ],
          },
        },
      },
    },
    {
      $sort: { utilizationScore: -1 },
    },
  ]);

  return utilization;
}

/**
 * Get popular time slots
 */
async function getPopularTimeSlots(
  organizationId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  console.log("⏰ Calculating popular time slots...");

  const timeSlots = await Booking.aggregate([
    {
      $match: {
        organizationId,
        startTime: { $gte: startDate, $lte: endDate },
        status: { $in: ["confirmed", "completed"] },
      },
    },
    {
      $group: {
        _id: { $hour: "$startTime" },
        bookings: { $sum: 1 },
        averageRevenue: { $avg: "$totalPrice" },
      },
    },
    {
      $project: {
        hour: "$_id",
        bookings: 1,
        averageRevenue: { $round: ["$averageRevenue", 0] },
      },
    },
    {
      $sort: { bookings: -1 },
    },
  ]);

  return timeSlots;
}

/**
 * Get contact metrics
 */
async function getContactMetrics(
  organizationId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  console.log("👥 Calculating contact metrics...");

  const [newContacts, contactsByType, conversions] = await Promise.all([
    // New contacts in period
    Contact.countDocuments({
      organizationId,
      createdAt: { $gte: startDate, $lte: endDate },
    }),

    // Contacts by type
    Contact.aggregate([
      {
        $match: {
          organizationId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]),

    // Conversion rate calculation
    Contact.aggregate([
      {
        $match: {
          organizationId,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "contactId",
          as: "bookings",
        },
      },
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          contactsWithBookings: {
            $sum: {
              $cond: [{ $gt: [{ $size: "$bookings" }, 0] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const conversionData = conversions[0] || {
    totalContacts: 0,
    contactsWithBookings: 0,
  };
  const conversionRate =
    conversionData.totalContacts > 0
      ? Math.round(
          (conversionData.contactsWithBookings / conversionData.totalContacts) *
            100
        )
      : 0;

  return {
    newContacts,
    contactsByType,
    conversionRate,
    totalContactsWithBookings: conversionData.contactsWithBookings,
  };
}

/**
 * Get revenue metrics
 */
async function getRevenueMetrics(
  organizationId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  console.log("💰 Calculating revenue metrics...");

  const revenueByMonth = await Booking.aggregate([
    {
      $match: {
        organizationId,
        startTime: { $gte: startDate, $lte: endDate },
        status: { $in: ["confirmed", "completed"] },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        revenue: { $sum: "$totalPrice" },
        bookings: { $sum: 1 },
        averageValue: { $avg: "$totalPrice" },
      },
    },
    {
      $project: {
        month: {
          $concat: [
            { $toString: "$_id.year" },
            "-",
            { $toString: "$_id.month" },
          ],
        },
        revenue: { $round: ["$revenue", 0] },
        bookings: 1,
        averageValue: { $round: ["$averageValue", 0] },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  return revenueByMonth;
}

/**
 * Get WhatsApp metrics
 */
async function getWhatsAppMetrics(
  organizationId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  console.log("💬 Calculating WhatsApp metrics...");

  try {
    const [totalMessages, conversations, messagesByDirection] =
      await Promise.all([
        // Total messages in period
        WhatsAppMessage.countDocuments({
          organizationId,
          sentAt: { $gte: startDate, $lte: endDate },
        }),

        // Unique conversations
        WhatsAppMessage.aggregate([
          {
            $match: {
              organizationId,
              sentAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: { _id: "$conversationId" },
          },
          {
            $count: "totalConversations",
          },
        ]),

        // Messages by direction
        WhatsAppMessage.aggregate([
          {
            $match: {
              organizationId,
              sentAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: "$direction",
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    return {
      totalMessages,
      totalConversations: conversations[0]?.totalConversations || 0,
      messagesByDirection,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("⚠️ WhatsApp metrics not available:", errorMessage);
    return {
      totalMessages: 0,
      totalConversations: 0,
      messagesByDirection: [],
    };
  }
}
