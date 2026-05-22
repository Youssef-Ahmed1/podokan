import { format } from "date-fns";

export const safeFormatDate = (dateString, formatStr = "PP") => {
  if (!dateString) return "-";

  const dateObj = new Date(dateString);
  // Check if it's an Invalid Date object
  if (isNaN(dateObj.getTime())) return "Invalid Date";

  return format(dateObj, formatStr);
};
