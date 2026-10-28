'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { io, Socket } from 'socket.io-client';
import { Video, X } from 'lucide-react';
import { useJoinVideoCall, JoinDetails } from '@/hooks/useVideo';

// Internal WebRTC call. Media flows browser-to-browser (encrypted); the API server only relays
// offers, answers and ICE candidates over Socket.IO in the /video namespace.

const OUTSIDE_WINDOW_MESSAGE = 'The video call opens 15 minutes before the appointment and closes 30 minutes after it ends.';

const API_ORIGIN = new URL(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1').origin;

type Phase = 'idle' | 'joining' | 'waiting' | 'connecting' | 'connected' | 'ended' | 'error';

type Session = {
  socket?: Socket;
  pc?: RTCPeerConnection;
  stream?: MediaStream;
  pendingCandidates: RTCIceCandidateInit[];
};

type SignalPayload = {
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

type Props = {
  appointmentId: string;
};

export default function VideoCall({ appointmentId }: Props) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const session = useRef<Session>({ pendingCandidates: [] });
  const join = useJoinVideoCall();

  const teardown = useCallback(() => {
    session.current.socket?.disconnect();
    session.current.pc?.close();
    session.current.stream?.getTracks().forEach((track) => track.stop());
    session.current = { pendingCandidates: [] };
  }, []);

  // Stop camera, microphone, and socket when the component unmounts.
  useEffect(() => teardown, [teardown]);

  const addCandidate = async (candidate: RTCIceCandidateInit) => {
    const pc = session.current.pc;
    if (!pc) return;
    if (!pc.remoteDescription) {
      session.current.pendingCandidates.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(candidate);
    } catch {
      // A stale candidate from a previous attempt is harmless; ignore it.
    }
  };

  const startCall = async (details: JoinDetails) => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    session.current.stream = stream;
    if (localVideo.current) localVideo.current.srcObject = stream;

    const pc = new RTCPeerConnection({ iceServers: details.iceServers });
    session.current.pc = pc;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const socket = io(`${API_ORIGIN}/video`, {
      path: '/socket.io',
      auth: { token: details.joinToken },
      transports: ['websocket'],
    });
    session.current.socket = socket;

    pc.onicecandidate = (event) => {
      if (event.candidate) socket.emit('signal', { candidate: event.candidate.toJSON() } satisfies SignalPayload);
    };

    pc.ontrack = (event) => {
      if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
      setPhase('connected');
      setMessage(null);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        setPhase('error');
        setMessage('The connection failed. Check your network, then leave and join again.');
      }
    };

    socket.on('joined', ({ occupants }: { occupants: number }) => {
      setPhase(occupants >= 2 ? 'connecting' : 'waiting');
    });

    // The participant already in the room creates the offer when the other one arrives.
    socket.on('peer-joined', async () => {
      setPhase('connecting');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('signal', { description: pc.localDescription?.toJSON() } satisfies SignalPayload);
    });

    socket.on('signal', async (payload: SignalPayload) => {
      if (payload.description) {
        await pc.setRemoteDescription(payload.description);
        for (const candidate of session.current.pendingCandidates.splice(0)) {
          await addCandidate(candidate);
        }
        if (payload.description.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', { description: pc.localDescription?.toJSON() } satisfies SignalPayload);
        }
      } else if (payload.candidate) {
        await addCandidate(payload.candidate);
      }
    });

    socket.on('peer-left', () => {
      if (remoteVideo.current) remoteVideo.current.srcObject = null;
      setPhase('waiting');
      setMessage('The other participant left the call.');
    });

    socket.on('room-full', () => {
      setPhase('error');
      setMessage('This consultation already has two participants.');
      teardown();
    });

    socket.on('connect_error', () => {
      setPhase('error');
      setMessage('Could not reach the call server. Check your connection and try again.');
    });

    // The server disconnects the socket when the join window closes.
    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        setPhase('ended');
        setMessage('The video call window has closed.');
      }
    });
  };

  const handleJoin = async () => {
    setOpen(true);
    setPhase('joining');
    setMessage(null);

    let details: JoinDetails;
    try {
      details = await join.mutateAsync(appointmentId);
    } catch (error) {
      setPhase('error');
      if (isAxiosError(error) && error.response?.status === 403) {
        setMessage(error.response.data?.message || OUTSIDE_WINDOW_MESSAGE);
      } else {
        setMessage('Could not start the video call. Please try again.');
      }
      return;
    }

    try {
      await startCall(details);
    } catch {
      setPhase('error');
      setMessage('Camera or microphone access is needed for the video call.');
      teardown();
    }
  };

  const handleClose = () => {
    teardown();
    setOpen(false);
    setPhase('idle');
    setMessage(null);
    join.reset();
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {!open && (
        <button
          onClick={handleJoin}
          className="inline-flex items-center gap-2 rounded-lg bg-[#C4E1E1] px-3 py-2 text-sm font-medium text-gray-900 ring-1 ring-black/10 hover:bg-[#b3d8d8]"
        >
          <Video className="h-4 w-4" /> Join video call
        </button>
      )}

      {open && (
        <div className="w-full overflow-hidden rounded-xl border border-black/10 bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-2">
            <span className="text-sm font-medium text-gray-800">Video consultation</span>
            <button
              onClick={handleClose}
              aria-label="Leave video call"
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative bg-gray-900">
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              aria-label="Other participant"
              className="h-[420px] w-full object-cover"
            />
            <video
              ref={localVideo}
              autoPlay
              playsInline
              muted
              aria-label="Your camera"
              className="absolute bottom-3 right-3 h-24 w-32 rounded-md border border-white/30 bg-black object-cover"
            />
          </div>

          <p className="px-4 py-3 text-center text-sm text-gray-700" role="status">
            {phase === 'joining' && 'Connecting to the call…'}
            {phase === 'waiting' && (message ?? 'Waiting for the other participant to join…')}
            {phase === 'connecting' && 'Setting up the video…'}
            {phase === 'connected' && 'Connected'}
            {phase === 'ended' && message}
            {phase === 'error' && <span className="text-rose-700">{message}</span>}
          </p>
        </div>
      )}
    </div>
  );
}
