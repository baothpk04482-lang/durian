// Single mock data export aligned 100% with the finalized MongoDB schema for notifications (alerts)
export const alertsMockData = {
  statistics: {
    totalAlerts: 48,
    unreadAlerts: 12,
    readAlerts: 36,
    targetFarms: 3,
  },
  filters: {
    farms: [
      { farm_id: "f1", farm_name: "Chanthaburi Gold" },
      { farm_id: "f2", farm_name: "Rayong Sweet" },
      { farm_id: "f3", farm_name: "Chumphon Valley" },
    ],
    statuses: ["All", "Unread", "Read"],
  },
  table: {
    rows: [
      {
        _id: "a1",
        farm_id: "f1",
        title: "Leaf Spot Infection",
        content: "AI detected Leaf Spot infection with 88.0% confidence in Zone A1.",
        status: "unread",
        created_at: "2026-07-02",
      },
      {
        _id: "a2",
        farm_id: "f2",
        title: "Phytophthora Warning",
        content: "High risk of Phytophthora patch canker in Tree TR-004.",
        status: "unread",
        created_at: "2026-07-03",
      },
      {
        _id: "a3",
        farm_id: "f1",
        title: "Weekly Inspection Due",
        content: "Scheduled inspection sequence due for Chanthaburi Gold.",
        status: "read",
        created_at: "2026-06-28",
      },
      {
        _id: "a4",
        farm_id: "f3",
        title: "Critical Insect Infestation",
        content: "Fruit Borer larval activity reported inside Zone C1.",
        status: "read",
        created_at: "2026-06-25",
      },
    ],
  },
  pagination: {
    page: 1,
    totalPages: 1,
    totalRecords: 4,
  },
};
