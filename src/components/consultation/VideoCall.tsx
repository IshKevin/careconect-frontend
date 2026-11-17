'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { isAxiosError } from 'axios';
import { io, Socket } from 'socket.io-client';
import { AlertCircle, Loader2, Mic, MicOff, PhoneOff, UserRound, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
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
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
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
    setMicOn(true);
    setCameraOn(true);
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
    setMicOn(true);
    setCameraOn(true);
    setOpen(false);
    setPhase('idle');
    setMessage(null);
    join.reset();
  };

  // Mute / camera-off only flip track.enabled; no renegotiation, the call keeps running.
  const toggleTrack = (kind: 'audio' | 'video') => {
    const tracks = kind === 'audio' ? session.current.stream?.getAudioTracks() : session.current.stream?.getVideoTracks();
    if (!tracks?.length) return;
    const enabled = !tracks[0].enabled;
    tracks.forEach((track) => (track.enabled = enabled));
    if (kind === 'audio') setMicOn(enabled);
    else setCameraOn(enabled);
  };

  const status = STATUS[phase];
  const inCall = phase === 'waiting' || phase === 'connecting' || phase === 'connected';
  const statusText = phase === 'waiting' || phase === 'ended' || phase === 'error' ? (message ?? status.text) : status.text;

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:items-end">
      {!open && (
        <Button onClick={handleJoin} className="w-full sm:w-auto">
          <Video /> Join video call
        </Button>
      )}

      {open && (
        <div className="w-full overflow-hidden rounded-2xl bg-slate-950 shadow-[var(--shadow-raised)] ring-1 ring-slate-900/10">
          {/* Stage */}
          <div className="relative aspect-[3/4] w-full sm:aspect-video">
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              aria-label="Other participant"
              className={cn('absolute inset-0 h-full w-full object-cover', phase !== 'connected' && 'opacity-0')}
            />

            {/* Status overlay while there is no remote video */}
            {phase !== 'connected' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <span
                  className={cn(
                    'grid size-14 place-items-center rounded-full',
                    phase === 'error' ? 'bg-rose-500/15 text-rose-300' : phase === 'ended' ? 'bg-white/10 text-slate-300' : 'bg-brand-500/15 text-brand-300',
                  )}
                >
                  {phase === 'error' ? (
                    <AlertCircle className="size-7" />
                  ) : phase === 'ended' ? (
                    <PhoneOff className="size-7" />
                  ) : phase === 'waiting' ? (
                    <UserRound className="size-7" />
                  ) : (
                    <Loader2 className="size-7 animate-spin" />
                  )}
                </span>
                <p className="max-w-sm text-sm font-medium text-white">{status.title}</p>
                {statusText && statusText !== status.title ? <p className="max-w-sm text-sm text-slate-400">{statusText}</p> : null}
              </div>
            )}

            {/* Top bar */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-gradient-to-b from-black/60 to-transparent px-4 py-3">
              <span className="truncate text-sm font-medium text-white">Video consultation</span>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
                role="status"
              >
                <span className={cn('size-1.5 rounded-full', status.dot, phase === 'connected' && 'animate-pulse')} aria-hidden />
                {status.label}
              </span>
            </div>

            {/* Local preview (picture in picture) */}
            <video
              ref={localVideo}
              autoPlay
              playsInline
              muted
              aria-label="Your camera"
              className={cn(
                'absolute bottom-20 right-3 aspect-[3/4] w-24 rounded-xl bg-slate-800 object-cover shadow-lg ring-2 ring-white/20 sm:aspect-video sm:w-44',
                !cameraOn && 'opacity-30',
                !inCall && 'hidden',
              )}
            />

            {/* Controls */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-8">
              <ControlButton
                label={micOn ? 'Mute microphone' : 'Unmute microphone'}
                active={micOn}
                disabled={!inCall}
                onClick={() => toggleTrack('audio')}
              >
                {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
              </ControlButton>
              <ControlButton
                label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
                active={cameraOn}
                disabled={!inCall}
                onClick={() => toggleTrack('video')}
              >
                {cameraOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}
              </ControlButton>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Leave video call"
                title="Leave video call"
                className="grid size-12 place-items-center rounded-full bg-rose-600 text-white shadow-lg transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
              >
                <PhoneOff className="size-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS: Record<Phase, { label: string; title: string; text: string; dot: string }> = {
  idle: { label: 'Not started', title: 'Not started', text: '', dot: 'bg-slate-400' },
  joining: { label: 'Joining', title: 'Joining the call…', text: 'Connecting to the call…', dot: 'bg-amber-400' },
  waiting: { label: 'Waiting', title: 'Waiting for the other participant', text: 'Waiting for the other participant to join…', dot: 'bg-amber-400' },
  connecting: { label: 'Connecting', title: 'Connecting…', text: 'Setting up the video…', dot: 'bg-sky-400' },
  connected: { label: 'Connected', title: 'Connected', text: 'Connected', dot: 'bg-emerald-400' },
  ended: { label: 'Ended', title: 'Call ended', text: 'The call has ended.', dot: 'bg-slate-400' },
  error: { label: 'Error', title: 'Could not connect', text: 'Something went wrong.', dot: 'bg-rose-400' },
};

function ControlButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={!active}
      title={label}
      className={cn(
        'grid size-12 place-items-center rounded-full shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-40',
        active ? 'bg-white/15 text-white backdrop-blur-sm hover:bg-white/25' : 'bg-white text-slate-900 hover:bg-slate-100',
      )}
    >
      {children}
    </button>
  );
}
