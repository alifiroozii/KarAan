"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getRealtimeSocket } from "@/lib/realtime/client";
import { invalidateQueriesForRealtimeEvent } from "@/lib/realtime/query-invalidation";
import type { RealtimeEventName } from "@/lib/realtime/events";
import type { RoomType } from "@/lib/realtime/rooms";

const EVENTS: RealtimeEventName[] = [
  "assignment.updated",
  "worker.en_route",
  "worker.arrived",
  "worker.checked_in",
  "worker.checked_out",
  "worker.late_risk",
  "no_show.potential",
  "no_show.finalized",
  "no_show.overridden",
  "no_show.detected",
  "backfill.requested",
  "backfill.offers_dispatched",
  "backfill.filled",
  "backfill.exhausted",
  "backfill.cancelled",
  "timesheet.updated",
];

export function useRealtimeRoom(type: RoomType, id?: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;
    const socket = getRealtimeSocket();

    const joinRoom = () => {
      socket.emit("room.join", { type, id });
    };

    socket.on("connect", joinRoom);
    if (socket.connected) joinRoom();

    const handlers = EVENTS.map((event) => {
      const handler = (payload: Record<string, unknown>) => {
        invalidateQueriesForRealtimeEvent(queryClient, event, payload);
      };
      socket.on(event, handler);
      return { event, handler };
    });

    return () => {
      socket.off("connect", joinRoom);
      for (const { event, handler } of handlers) socket.off(event, handler);
    };
  }, [id, queryClient, type]);
}
