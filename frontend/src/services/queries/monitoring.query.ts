import { useQuery } from "@tanstack/react-query";
import { monitoringService } from "../api/monitoring.service";

export const useOpenedDocuments = () =>
  useQuery({
    queryKey: ["lool", "monitoring", "documents"],
    queryFn: monitoringService.getDocuments,
  });

export const useUserCount = () =>
  useQuery({
    queryKey: ["lool", "monitoring", "users"],
    queryFn: monitoringService.getUserCount,
  });

export const useEventCount = (event: "ACCESS" | "NEW_VERSION") =>
  useQuery({
    queryKey: ["lool", "monitoring", "event", event],
    queryFn: () => monitoringService.getEventCount(event),
  });

export const useExtensions = () =>
  useQuery({
    queryKey: ["lool", "monitoring", "extensions"],
    queryFn: monitoringService.getExtensions,
  });
