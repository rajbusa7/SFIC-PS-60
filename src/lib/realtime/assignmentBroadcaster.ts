import { EventEmitter } from "events";

export interface AssignmentChangeEvent {
  type: "ASSIGNMENT_SAVED" | "ASSIGNMENT_REMOVED" | "ASSIGNMENT_BULK_SYNC";
  teacherId: string;
  teacherEmail?: string;
  teacherName?: string;
  subjectCode?: string;
  classroomIds?: string[];
  grades?: number[];
  timestamp: string;
}

// Global process-wide singleton event emitter to survive module re-evaluations in dev
const globalEmitterKey = Symbol.for("studysaathi.assignment.emitter");
const globalObj = globalThis as unknown as { [key: symbol]: EventEmitter };

if (!globalObj[globalEmitterKey]) {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(100);
  globalObj[globalEmitterKey] = emitter;
}

const assignmentEmitter: EventEmitter = globalObj[globalEmitterKey];

/**
 * Broadcasts an assignment update event across all active real-time subscribers.
 */
export function broadcastAssignmentChange(event: Omit<AssignmentChangeEvent, "timestamp"> & { timestamp?: string }) {
  const payload: AssignmentChangeEvent = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  try {
    assignmentEmitter.emit("change", payload);
  } catch (err) {
    console.warn("[AssignmentBroadcaster] Error emitting change:", err);
  }

  return payload;
}

/**
 * Subscribes a listener to assignment changes.
 */
export function onAssignmentChange(listener: (event: AssignmentChangeEvent) => void) {
  assignmentEmitter.on("change", listener);
  return () => {
    assignmentEmitter.off("change", listener);
  };
}

