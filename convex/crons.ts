import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval("whatsappDispatcher", { seconds: 5 }, api.queue.processQueue, {});
crons.cron("serviceReminderSweep", "0 8 * * *", api.reminders.fireDueReminders, {});

export default crons;