import { useMutation } from '@tanstack/react-query';
import api from '../lib/api/api';

export type IceServer = {
  urls: string[];
  username?: string;
  credential?: string;
};

export type JoinDetails = {
  appointmentId: string;
  joinToken: string; // short-lived; valid only for this appointment's window
  iceServers: IceServer[]; // STUN plus time-limited TURN credentials
  expiresAt: string; // ISO
  isOwner: boolean;
};

/**
 * Requests a join token and ICE servers for an appointment. The backend checks that the
 * caller is the patient or doctor on the appointment and that the time is inside the join
 * window. Outside the window it responds 403.
 */
export function useJoinVideoCall() {
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const res = await api.get(`/consultation/appointments/${appointmentId}/join`);
      return res.data.data as JoinDetails;
    },
  });
}
