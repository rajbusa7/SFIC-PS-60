export interface PtmMessageContext {
  meetingTitle: string;
  teacherName: string;
  startTime: string;
  durationMin: number;
  studentName?: string;
  joinUrl?: string;
  newStartTime?: string;
  cancellationReason?: string;
  schoolName?: string;
}

const GUJARATI_MONTHS = [
  "જાન્યુઆરી",
  "ફેબ્રુઆરી",
  "માર્ચ",
  "એપ્રિલ",
  "મે",
  "જૂન",
  "જુલાઈ",
  "ઓગસ્ટ",
  "સપ્ટેમ્બર",
  "ઓક્ટોબર",
  "નવેમ્બર",
  "ડિસેમ્બર",
];

const GUJARATI_DIGITS: Record<string, string> = {
  "0": "૦",
  "1": "૧",
  "2": "૨",
  "3": "૩",
  "4": "૪",
  "5": "૫",
  "6": "૬",
  "7": "૭",
  "8": "૮",
  "9": "૯",
};

export function toGujaratiDigits(str: string | number): string {
  return String(str).replace(/[0-9]/g, (w) => GUJARATI_DIGITS[w] || w);
}

export function formatDateTimeLocalized(isoString: string, lang: "en" | "gu"): { date: string; time: string } {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: isoString, time: "" };

    const hours24 = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;

    if (lang === "gu") {
      const guPeriod = hours24 < 12 ? "સવારે" : hours24 < 17 ? "બપોરે" : "સાંજે";
      const guDate = `${toGujaratiDigits(d.getDate())} ${GUJARATI_MONTHS[d.getMonth()]} ${toGujaratiDigits(d.getFullYear())}`;
      const guTime = `${guPeriod} ${toGujaratiDigits(hours12)}:${toGujaratiDigits(minutes)}`;
      return { date: guDate, time: guTime };
    }

    const enDate = d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const enTime = `${hours12}:${minutes} ${period}`;
    return { date: enDate, time: enTime };
  } catch {
    return { date: isoString, time: "" };
  }
}

/**
 * Builds localized title and message body for all PTM events.
 */
export function buildBilingualPtmMessage(
  type:
    | "ptm_invite"
    | "ptm_update"
    | "ptm_reschedule"
    | "ptm_cancel"
    | "ptm_reminder_24h"
    | "ptm_reminder_1h"
    | "ptm_reminder_start",
  ctx: PtmMessageContext,
  lang: "en" | "gu" = "gu"
): { title: string; body: string } {
  const { date, time } = formatDateTimeLocalized(ctx.startTime, lang);
  const studentPrefix = ctx.studentName
    ? lang === "gu"
      ? `${ctx.studentName} માટે `
      : `for ${ctx.studentName}: `
    : "";

  switch (type) {
    case "ptm_invite":
      if (lang === "gu") {
        return {
          title: `નવું વાલી-શિક્ષક મિલન: ${ctx.meetingTitle}`,
          body: `શિક્ષક ${ctx.teacherName} દ્વારા ${studentPrefix}'${ctx.meetingTitle}' માટે આમંત્રણ. તારીખ: ${date}, સમય: ${time} (${toGujaratiDigits(ctx.durationMin)} મિનિટ).`,
        };
      }
      return {
        title: `New PTM Invitation: ${ctx.meetingTitle}`,
        body: `${ctx.teacherName} invited you ${studentPrefix}to '${ctx.meetingTitle}' on ${date} at ${time} (${ctx.durationMin} mins).`,
      };

    case "ptm_update":
      if (lang === "gu") {
        return {
          title: `મીટિંગ અપડેટ: ${ctx.meetingTitle}`,
          body: `શિક્ષક ${ctx.teacherName} એ '${ctx.meetingTitle}' ની વિગતો અપડેટ કરી છે. સમય: ${date}, ${time}.`,
        };
      }
      return {
        title: `Meeting Updated: ${ctx.meetingTitle}`,
        body: `${ctx.teacherName} updated the details for '${ctx.meetingTitle}'. Schedule: ${date} at ${time}.`,
      };

    case "ptm_reschedule": {
      const newDt = ctx.newStartTime ? formatDateTimeLocalized(ctx.newStartTime, lang) : { date, time };
      if (lang === "gu") {
        return {
          title: `સમય બદલાયો: ${ctx.meetingTitle}`,
          body: `'${ctx.meetingTitle}' નો નવો સમય: ${newDt.date}, ${newDt.time}. કૃપા કરીને નવો સમય નોંધી લો.`,
        };
      }
      return {
        title: `Rescheduled: ${ctx.meetingTitle}`,
        body: `'${ctx.meetingTitle}' has been rescheduled to ${newDt.date} at ${newDt.time}.`,
      };
    }

    case "ptm_cancel":
      if (lang === "gu") {
        return {
          title: `મીટિંગ રદ થઈ: ${ctx.meetingTitle}`,
          body: `શિક્ષક ${ctx.teacherName} દ્વારા '${ctx.meetingTitle}' PTM રદ કરવામાં આવી છે. ${ctx.cancellationReason ? `કારણ: ${ctx.cancellationReason}` : ""}`,
        };
      }
      return {
        title: `Meeting Cancelled: ${ctx.meetingTitle}`,
        body: `${ctx.teacherName} cancelled '${ctx.meetingTitle}'. ${ctx.cancellationReason ? `Reason: ${ctx.cancellationReason}` : ""}`,
      };

    case "ptm_reminder_24h":
      if (lang === "gu") {
        return {
          title: `રીમાઇન્ડર: આવતીકાલે PTM છે (${ctx.meetingTitle})`,
          body: `આવતીકાલે ${time} વાગ્યે '${ctx.meetingTitle}' PTM શરૂ થશે. કૃપા કરીને સમયસર હાજર રહેશો.`,
        };
      }
      return {
        title: `Reminder: PTM tomorrow (${ctx.meetingTitle})`,
        body: `Your PTM '${ctx.meetingTitle}' is scheduled for tomorrow at ${time}. Please be ready to join on time.`,
      };

    case "ptm_reminder_1h":
      if (lang === "gu") {
        return {
          title: `૧ કલાક બાકી: ${ctx.meetingTitle}`,
          body: `'${ctx.meetingTitle}' PTM ૧ કલાકમાં શરૂ થઈ રહી છે (${time}). કૃપા કરીને જોડાવા માટે તૈયાર રહો.`,
        };
      }
      return {
        title: `Starts in 1 Hour: ${ctx.meetingTitle}`,
        body: `'${ctx.meetingTitle}' starts in 1 hour (${time}). Please prepare to join.`,
      };

    case "ptm_reminder_start":
      if (lang === "gu") {
        return {
          title: `હમણાં જ શરૂ થઈ: ${ctx.meetingTitle}`,
          body: `'${ctx.meetingTitle}' PTM શરૂ થઈ ગઈ છે! શિક્ષક સાથે જોડાવા માટે અહીં ક્લિક કરો.`,
        };
      }
      return {
        title: `Starting Now: ${ctx.meetingTitle}`,
        body: `'${ctx.meetingTitle}' is starting now! Click to join your teacher now.`,
      };

    default:
      return {
        title: ctx.meetingTitle,
        body: `Meeting: ${ctx.meetingTitle} on ${date} at ${time}`,
      };
  }
}

/**
 * Builds pre-filled text for "Share on WhatsApp" wa.me link.
 */
export function buildPtmWhatsAppMessage(ctx: PtmMessageContext, lang: "en" | "gu" = "gu"): string {
  const { date, time } = formatDateTimeLocalized(ctx.startTime, lang);
  const join = ctx.joinUrl
    ? `\n\n👉 *${lang === "gu" ? "મીટિંગમાં સીધા જોડાવા માટે લિંક પર ક્લિક કરો:" : "Click here to join meeting directly:"}*\n${ctx.joinUrl}`
    : "";
  const school = ctx.schoolName ? `\n🏫 ${ctx.schoolName}` : "";

  if (lang === "gu") {
    return (
      `*વાલી-શિક્ષક મિલન (PTM) આમંત્રણ* 🤝` +
      school +
      `\n📌 *વિષય:* ${ctx.meetingTitle}` +
      (ctx.studentName ? `\n👶 *વિદ્યાર્થી:* ${ctx.studentName}` : "") +
      `\n👩‍🏫 *શિક્ષક:* ${ctx.teacherName}` +
      `\n📅 *તારીખ:* ${date}` +
      `\n⏰ *સમય:* ${time} (${toGujaratiDigits(ctx.durationMin)} મિનિટ)` +
      join +
      `\n\n_StudySaathi AI - ગુજરાત પ્રાથમિક શિક્ષણ મંચ_`
    );
  }

  return (
    `*Parent-Teacher Meeting (PTM) Invitation* 🤝` +
    school +
    `\n📌 *Title:* ${ctx.meetingTitle}` +
    (ctx.studentName ? `\n👶 *Student:* ${ctx.studentName}` : "") +
    `\n👩‍🏫 *Teacher:* ${ctx.teacherName}` +
    `\n📅 *Date:* ${date}` +
    `\n⏰ *Time:* ${time} (${ctx.durationMin} mins)` +
    join +
    `\n\n_StudySaathi AI - Gujarat Primary Education Platform_`
  );
}

/**
 * Builds a direct wa.me link.
 */
export function buildWhatsAppShareUrl(phone: string | undefined, message: string): string {
  const cleanPhone = phone ? phone.replace(/[^\d]/g, "") : "";
  const encodedText = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
