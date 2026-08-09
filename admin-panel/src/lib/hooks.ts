import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

export function useApiQuery<T>(key: string[], fetcher: () => Promise<T>, options?: { enabled?: boolean }) {
  return useQuery<T>({
    queryKey: key,
    queryFn: fetcher,
    retry: 1,
    ...options,
  });
}

// Data hooks
export function useUsers() {
  return useApiQuery(["users"], () => api.getUsers({ start: 0, end: 10000 }));
}

export function useCities() {
  return useApiQuery(["cities"], () => api.getCities());
}

export function useRides() {
  return useApiQuery(["rides"], () => api.getRides());
}

export function useBookings() {
  return useApiQuery(["bookings"], () => api.getBookings({ start: 0, end: 10000 }));
}

export function useVehicles() {
  return useApiQuery(["vehicles"], () => api.getVehicles());
}

export function useLanguages() {
  return useApiQuery(["languages"], () => api.getLanguages());
}

export function useAppTranslations() {
  return useApiQuery(["app-translations"], () => api.getAppTranslations());
}

export function useReports() {
  return useApiQuery(["reports"], () => api.getReports());
}

export function useSettings() {
  return useApiQuery(["settings"], () => api.getSettings());
}

export function useProfile() {
  return useApiQuery(["profile"], () => api.getProfile());
}

// Mutation hooks
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateReport(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.cancelBooking(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useCreateCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createCity(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cities"] }),
  });
}

export function useDeleteCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCity(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cities"] }),
  });
}

export function useDeleteRide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteRide(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rides"] }),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteReport(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteVehicle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createUser(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useMeetingPoints() {
  return useApiQuery(["meeting-points"], () => api.getMeetingPoints());
}

export function useCreateMeetingPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.createMeetingPoint(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meeting-points"] }),
  });
}

export function useUpdateMeetingPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateMeetingPoint(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meeting-points"] }),
  });
}

export function useDeleteMeetingPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMeetingPoint(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meeting-points"] }),
  });
}

export function useUpdateCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateCity(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cities"] }),
  });
}

export function useLogs(lines: number = 500, enabled: boolean = true) {
  return useApiQuery(["logs", String(lines)], () => api.getLogs(lines), { enabled });
}
