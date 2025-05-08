import { dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";

// Define supported locales
const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

// Create the calendar localizer
export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});