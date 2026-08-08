"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { RTC_ICE_SERVERS } from "@/lib/firebase/meet";

export interface VoiceParticipantInfo {
  userId: string;
  userName: string;
  isMuted?: boolean;
}

export interface UseWebRTCVoiceChatResult {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  connectionStates: Map<string, string>;
  voiceParticipants: VoiceParticipantInfo[];
  isMuted: boolean;
  isAudioBlocked: boolean;
  toggleMute: () => void;
  resumeAudio: () => Promise<void>;
  attachAudioElement: (
    remoteUserId: string,
    element: HTMLAudioElement | null
  ) => void;
}

/**
 * Full Mesh WebRTC Voice Chat Hook for Study Meet.
 *
 * Uses Firestore collections `/rooms/{roomId}/voiceParticipants` and `/rooms/{roomId}/voiceSignals`.
 * Resolves ICE candidate race conditions, browser autoplay blocks, and DOM audio track bindings.
 */
export function useWebRTCVoiceChat(
  roomId: string | undefined,
  userId: string | undefined,
  userName: string | undefined
): UseWebRTCVoiceChatResult {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );
  const [connectionStates, setConnectionStates] = useState<
    Map<string, string>
  >(new Map());
  const [voiceParticipants, setVoiceParticipants] = useState<
    VoiceParticipantInfo[]
  >([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAudioBlocked, setIsAudioBlocked] = useState<boolean>(false);

  // References to keep persistent state across React re-renders
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const iceQueuesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const isMutedRef = useRef<boolean>(false);

  // Keep isMutedRef in sync
  isMutedRef.current = isMuted;

  /* ------------------------------------------------------------------
     1. Local Audio Stream Acquisition
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!roomId || !userId) return;

    let mounted = true;

    async function initLocalAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);

        // Apply initial mute state if set
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isMutedRef.current;
        });

        // Add local tracks to existing peer connections if any
        pcsRef.current.forEach((pc) => {
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });
        });
      } catch (err) {
        console.error("Failed to acquire local microphone stream:", err);
      }
    }

    initLocalAudio();

    return () => {
      mounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }
    };
  }, [roomId, userId]);

  /* ------------------------------------------------------------------
     2. Presence Registration & Voice Signals Signalling Loop
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!roomId || !userId) return;

    const currentUserId = userId;
    const currentUserName = userName || "Scholar";

    const participantDocRef = doc(
      db,
      "rooms",
      roomId,
      "voiceParticipants",
      currentUserId
    );
    const participantsColRef = collection(
      db,
      "rooms",
      roomId,
      "voiceParticipants"
    );
    const signalsColRef = collection(db, "rooms", roomId, "voiceSignals");

    // Register presence in Firestore
    setDoc(participantDocRef, {
      userId: currentUserId,
      userName: currentUserName,
      isMuted: isMutedRef.current,
      joinedAt: serverTimestamp(),
    }).catch((err) =>
      console.error("Failed to register voice participant:", err)
    );

    /* Helper: Create or retrieve RTCPeerConnection for remote user */
    function getOrCreatePeerConnection(remoteUserId: string): RTCPeerConnection {
      let pc = pcsRef.current.get(remoteUserId);
      if (pc) return pc;

      pc = new RTCPeerConnection(RTC_ICE_SERVERS);
      pcsRef.current.set(remoteUserId, pc);

      // Add local audio tracks BEFORE creating offer/answer
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc!.addTrack(track, localStreamRef.current!);
        });
      }

      // Track incoming remote audio stream
      pc.ontrack = (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);
        remoteStreamsRef.current.set(remoteUserId, stream);
        setRemoteStreams(new Map(remoteStreamsRef.current));

        // Attach stream to DOM element if registered
        const audioEl = audioElementsRef.current.get(remoteUserId);
        if (audioEl) {
          audioEl.srcObject = stream;
          audioEl.play().catch((playErr) => {
            console.warn(
              `Autoplay blocked for remote user ${remoteUserId}:`,
              playErr
            );
            setIsAudioBlocked(true);
          });
        }
      };

      // Send local ICE candidates to signaling collection
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(signalsColRef, {
            type: "candidate",
            senderId: currentUserId,
            receiverId: remoteUserId,
            candidate: event.candidate.toJSON(),
            createdAt: serverTimestamp(),
          }).catch((err) =>
            console.error("Error sending ICE candidate signal:", err)
          );
        }
      };

      // Track connection state updates
      pc.onconnectionstatechange = () => {
        setConnectionStates((prev) =>
          new Map(prev).set(remoteUserId, pc!.connectionState)
        );
      };

      return pc;
    }

    /* Process queued ICE candidates after remote description is set */
    async function drainIceQueue(remoteUserId: string, pc: RTCPeerConnection) {
      const queue = iceQueuesRef.current.get(remoteUserId) || [];
      while (queue.length > 0) {
        const cand = queue.shift();
        if (cand) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.error("Error adding queued ICE candidate:", e);
          }
        }
      }
      iceQueuesRef.current.delete(remoteUserId);
    }

    /* A. Listen to Voice Participants in Room */
    const unsubParticipants: Unsubscribe = onSnapshot(
      participantsColRef,
      async (snapshot) => {
        const activeParticipants: VoiceParticipantInfo[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const remoteUserId = data.userId as string;

          if (!remoteUserId) continue;

          activeParticipants.push({
            userId: remoteUserId,
            userName: data.userName || "Scholar",
            isMuted: Boolean(data.isMuted),
          });

          if (remoteUserId === currentUserId) continue;

          // Deterministic Initiator Rule: userId < remoteUserId
          const isInitiator = currentUserId < remoteUserId;
          let pc = pcsRef.current.get(remoteUserId);

          if (!pc) {
            pc = getOrCreatePeerConnection(remoteUserId);

            if (isInitiator) {
              try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                await addDoc(signalsColRef, {
                  type: "offer",
                  senderId: currentUserId,
                  receiverId: remoteUserId,
                  sdp: offer.sdp,
                  createdAt: serverTimestamp(),
                });
              } catch (err) {
                console.error("Error creating WebRTC offer:", err);
              }
            }
          }
        }

        setVoiceParticipants(activeParticipants);

        // Clean up connections for participants who left
        const currentActiveUserIds = new Set(
          activeParticipants.map((p) => p.userId)
        );
        pcsRef.current.forEach((pc, pUserId) => {
          if (!currentActiveUserIds.has(pUserId)) {
            pc.close();
            pcsRef.current.delete(pUserId);
            remoteStreamsRef.current.delete(pUserId);
            iceQueuesRef.current.delete(pUserId);
            audioElementsRef.current.delete(pUserId);

            setRemoteStreams(new Map(remoteStreamsRef.current));
            setConnectionStates((prev) => {
              const next = new Map(prev);
              next.delete(pUserId);
              return next;
            });
          }
        });
      }
    );

    /* B. Listen to Signals Targetting Current User */
    const qSignals = query(
      signalsColRef,
      where("receiverId", "==", currentUserId)
    );

    const unsubSignals: Unsubscribe = onSnapshot(
      qSignals,
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type !== "added") continue;

          const signalDoc = change.doc;
          const data = signalDoc.data();
          const senderId = data.senderId as string;
          const signalType = data.type as "offer" | "answer" | "candidate";

          // Remove signal doc after reading
          deleteDoc(signalDoc.ref).catch(() => {});

          if (!senderId || senderId === currentUserId) continue;

          const pc = getOrCreatePeerConnection(senderId);

          if (signalType === "offer") {
            try {
              await pc.setRemoteDescription(
                new RTCSessionDescription({ type: "offer", sdp: data.sdp })
              );
              await drainIceQueue(senderId, pc);

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              await addDoc(signalsColRef, {
                type: "answer",
                senderId: currentUserId,
                receiverId: senderId,
                sdp: answer.sdp,
                createdAt: serverTimestamp(),
              });
            } catch (err) {
              console.error("Error handling SDP offer signal:", err);
            }
          } else if (signalType === "answer") {
            try {
              if (pc.signalingState !== "stable") {
                await pc.setRemoteDescription(
                  new RTCSessionDescription({ type: "answer", sdp: data.sdp })
                );
                await drainIceQueue(senderId, pc);
              }
            } catch (err) {
              console.error("Error handling SDP answer signal:", err);
            }
          } else if (signalType === "candidate" && data.candidate) {
            try {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              } else {
                // Buffer in queue until setRemoteDescription resolves
                const queue = iceQueuesRef.current.get(senderId) || [];
                queue.push(data.candidate);
                iceQueuesRef.current.set(senderId, queue);
              }
            } catch (err) {
              console.error("Error adding ICE candidate:", err);
            }
          }
        }
      }
    );

    // Teardown presence & listeners on unmount
    return () => {
      unsubParticipants();
      unsubSignals();

      deleteDoc(participantDocRef).catch(() => {});

      pcsRef.current.forEach((pc) => pc.close());
      pcsRef.current.clear();
      remoteStreamsRef.current.clear();
      iceQueuesRef.current.clear();
      audioElementsRef.current.clear();

      setRemoteStreams(new Map());
      setConnectionStates(new Map());
      setVoiceParticipants([]);
    };
  }, [roomId, userId, userName]);

  /* ------------------------------------------------------------------
     3. Helper Methods (Mute, Attach Audio, Resume Autoplay)
  ------------------------------------------------------------------ */

  const toggleMute = useCallback(() => {
    setIsMuted((prevMuted) => {
      const nextMuted = !prevMuted;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !nextMuted;
        });
      }

      if (roomId && userId) {
        setDoc(
          doc(db, "rooms", roomId, "voiceParticipants", userId),
          { isMuted: nextMuted },
          { merge: true }
        ).catch(() => {});
      }

      return nextMuted;
    });
  }, [roomId, userId]);

  const attachAudioElement = useCallback(
    (remoteUserId: string, element: HTMLAudioElement | null) => {
      if (element) {
        audioElementsRef.current.set(remoteUserId, element);
        const stream = remoteStreamsRef.current.get(remoteUserId);
        if (stream) {
          element.srcObject = stream;
          element.play().catch((err) => {
            console.warn(`Autoplay blocked for user ${remoteUserId}:`, err);
            setIsAudioBlocked(true);
          });
        }
      } else {
        audioElementsRef.current.delete(remoteUserId);
      }
    },
    []
  );

  const resumeAudio = useCallback(async () => {
    setIsAudioBlocked(false);
    const audioElements = Array.from(audioElementsRef.current.values());

    await Promise.all(
      audioElements.map(async (el) => {
        try {
          await el.play();
        } catch (err) {
          console.warn("Failed to resume audio element playback:", err);
          setIsAudioBlocked(true);
        }
      })
    );
  }, []);

  return {
    localStream,
    remoteStreams,
    connectionStates,
    voiceParticipants,
    isMuted,
    isAudioBlocked,
    toggleMute,
    resumeAudio,
    attachAudioElement,
  };
}
