import { format } from "date-fns";

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
}

// Format date for Google Calendar (YYYYMMDDTHHmmssZ)
const formatGoogleDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

// Format date for iCal (YYYYMMDDTHHmmssZ)
const formatICalDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

export const generateGoogleCalendarUrl = (event: CalendarEvent): string => {
  const endDate = event.endDate || new Date(event.startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
  
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(endDate)}`,
    details: event.description || "",
    location: event.location || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const generateICalContent = (event: CalendarEvent): string => {
  const endDate = event.endDate || new Date(event.startDate.getTime() + 60 * 60 * 1000);
  const uid = `${Date.now()}-${Math.random().toString(36).substring(2)}@skoolify`;
  
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Skoolify//NONSGML Event//ES",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(event.startDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}` : "",
    event.location ? `LOCATION:${event.location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
};

export const downloadICalFile = (event: CalendarEvent): void => {
  const content = generateICalContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
