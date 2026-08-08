/**
 * Firestore Study Meet Realtime Module — StudySync AI
 *
 * Realtime synchronization for Collaborative Study Meet rooms, shared documents,
 * WebRTC voice chat signaling, in-room text chat, friend invitations,
 * user active room persistence, and host-exclusive AI explanations by "abang ganteng".
 */

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./clientApp";
import type { User } from "firebase/auth";

/* ----------------------------------------------------------------
   Types
---------------------------------------------------------------- */
export interface RoomParticipant {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: "host" | "participant";
  isMuted?: boolean;
  isSpeaking?: boolean;
  joinedAt: string;
}

export interface StudyMeetRoom {
  roomId: string;
  hostId: string;
  hostName: string;
  hostPhotoURL?: string;
  title: string;
  topic?: string;
  sharedDocument: string;
  participants: RoomParticipant[];
  invitedFriendIds: string[];
  lastAiExplanation?: {
    topic: string;
    explanation: string;
    createdAt: string;
  } | null;
  isAiGenerating?: boolean;
  status: "active" | "ended";
  createdAt: string;
  updatedAt: string;
}

export interface MeetInvite {
  id: string;
  roomId: string;
  roomTitle: string;
  hostId: string;
  hostName: string;
  invitedUserId: string;
  invitedUserName: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface MeetChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  text: string;
  createdAt: string;
}

/* ----------------------------------------------------------------
   STUN & WebRTC Configuration
---------------------------------------------------------------- */
export const RTC_ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
};

/* ----------------------------------------------------------------
   Room Creation, Join, Delete & Persistence Operations
---------------------------------------------------------------- */

/**
 * Create a new Study Meet Room in Firestore.
 */
export async function createStudyMeetRoom(
  hostUser: User,
  title: string,
  initialNotes: string = ""
): Promise<string> {
  const roomRef = doc(collection(db, "study_meets"));
  const roomId = roomRef.id;

  const hostName =
    hostUser.displayName || hostUser.email?.split("@")[0] || "Scholar Host";
  const now = new Date().toISOString();

  const newRoom: Omit<StudyMeetRoom, "createdAt" | "updatedAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    roomId,
    hostId: hostUser.uid,
    hostName,
    hostPhotoURL: hostUser.photoURL || "",
    title: title.trim() || "Ruang Belajar Bersama",
    sharedDocument:
      initialNotes ||
      `# 📝 ${title.trim() || "Ruang Belajar Bersama"}\n\nSelamat datang di Ruang Study Meet bersama **${hostName}**!\n\nCatatan dan penjelasan AI "abang ganteng" akan muncul di papan ini secara real-time.`,
    participants: [
      {
        uid: hostUser.uid,
        displayName: hostName,
        photoURL: hostUser.photoURL || "",
        role: "host",
        isMuted: false,
        isSpeaking: false,
        joinedAt: now,
      },
    ],
    invitedFriendIds: [],
    lastAiExplanation: null,
    isAiGenerating: false,
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(roomRef, newRoom);
  return roomId;
}

/**
 * Join an existing Study Meet room by roomId.
 */
export async function joinStudyMeetRoom(
  roomId: string,
  user: User
): Promise<StudyMeetRoom> {
  const roomRef = doc(db, "study_meets", roomId);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) {
    throw new Error("Ruang Study Meet tidak ditemukan atau kode salah.");
  }

  const data = snap.data();
  if (data.status === "ended") {
    throw new Error("Ruang Study Meet ini telah ditutup oleh host.");
  }

  const participants: RoomParticipant[] = Array.isArray(data.participants)
    ? data.participants
    : [];

  const userName =
    user.displayName || user.email?.split("@")[0] || "Scholar Participant";
  const existingIdx = participants.findIndex((p) => p.uid === user.uid);

  if (existingIdx === -1) {
    const newParticipant: RoomParticipant = {
      uid: user.uid,
      displayName: userName,
      photoURL: user.photoURL || "",
      role: user.uid === data.hostId ? "host" : "participant",
      isMuted: false,
      isSpeaking: false,
      joinedAt: new Date().toISOString(),
    };

    await updateDoc(roomRef, {
      participants: arrayUnion(newParticipant),
      updatedAt: serverTimestamp(),
    });
  }

  return parseRoomDoc(snap.id, snap.data());
}

/**
 * Close and delete/archive a Study Meet room (Host-only).
 */
export async function deleteStudyMeetRoom(roomId: string): Promise<void> {
  const roomRef = doc(db, "study_meets", roomId);
  await updateDoc(roomRef, {
    status: "ended",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Subscribe to real-time updates for a single Study Meet Room.
 */
export function subscribeToStudyMeetRoom(
  roomId: string,
  callback: (room: StudyMeetRoom | null) => void
): Unsubscribe {
  const roomRef = doc(db, "study_meets", roomId);

  return onSnapshot(roomRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }
    callback(parseRoomDoc(docSnap.id, docSnap.data()));
  });
}

/**
 * Subscribe to active Study Meet rooms created by or joined by a user ("Ruang Belajar Saya").
 */
export function subscribeToUserActiveStudyMeetRooms(
  userId: string,
  callback: (rooms: StudyMeetRoom[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "study_meets"),
    where("status", "==", "active")
  );

  return onSnapshot(q, (snap) => {
    const allActive = snap.docs.map((d) => parseRoomDoc(d.id, d.data()));
    // Filter rooms where user is host or participant or invited
    const userRooms = allActive.filter(
      (r) =>
        r.hostId === userId ||
        r.participants.some((p) => p.uid === userId) ||
        r.invitedFriendIds.includes(userId)
    );
    callback(userRooms);
  });
}

/* ----------------------------------------------------------------
   Shared Workspace & Document Operations
---------------------------------------------------------------- */

/**
 * Update the shared document text in real time (typically executed by host).
 */
export async function updateSharedDocument(
  roomId: string,
  documentText: string
): Promise<void> {
  const roomRef = doc(db, "study_meets", roomId);
  await updateDoc(roomRef, {
    sharedDocument: documentText,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Reset and clear the shared workspace board to empty (Host-only).
 */
export async function clearSharedBoard(roomId: string): Promise<void> {
  const roomRef = doc(db, "study_meets", roomId);
  await updateDoc(roomRef, {
    sharedDocument: "",
    updatedAt: serverTimestamp(),
  });
}

/**
 * Append imported Study Plan topic content to the shared room document.
 */
export async function importStudyPlanToRoom(
  roomId: string,
  currentDoc: string,
  topicTitle: string,
  topicTasks: Array<{ title: string; description: string }>
): Promise<void> {
  const taskListText = topicTasks
    .map((t, idx) => `  ${idx + 1}. **${t.title}**: ${t.description}`)
    .join("\n");

  const importedBlock = `\n\n---
### 📌 Impor Study Plan: ${topicTitle}
${taskListText || "Materi topik pilihan dari Study Plan."}\n`;

  const updatedDoc = currentDoc + importedBlock;
  await updateSharedDocument(roomId, updatedDoc);
}

/**
 * Append AI "abang ganteng" explanation to the shared room document.
 */
export async function appendAiExplanationToRoom(
  roomId: string,
  currentDoc: string,
  topicQuestion: string,
  explanation: string
): Promise<void> {
  const aiBlock = `\n\n---
### 💡 Penjelasan Abang Ganteng: "${topicQuestion}"
${explanation}\n`;

  const roomRef = doc(db, "study_meets", roomId);
  await updateDoc(roomRef, {
    sharedDocument: currentDoc + aiBlock,
    lastAiExplanation: {
      topic: topicQuestion,
      explanation,
      createdAt: new Date().toISOString(),
    },
    isAiGenerating: false,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Set AI generating status indicator for all participants.
 */
export async function setRoomAiGenerating(
  roomId: string,
  isGenerating: boolean
): Promise<void> {
  const roomRef = doc(db, "study_meets", roomId);
  await updateDoc(roomRef, {
    isAiGenerating: isGenerating,
    updatedAt: serverTimestamp(),
  });
}

/* ----------------------------------------------------------------
   Voice Chat & Participant Mic Real-Time State
---------------------------------------------------------------- */

/**
 * Update a participant's mic mute/speaking state in Firestore room doc.
 */
export async function updateParticipantMicState(
  roomId: string,
  userId: string,
  isMuted: boolean,
  isSpeaking: boolean
): Promise<void> {
  const roomRef = doc(db, "study_meets", roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const participants: RoomParticipant[] = Array.isArray(data.participants)
    ? data.participants
    : [];

  const updatedParticipants = participants.map((p) => {
    if (p.uid === userId) {
      return { ...p, isMuted, isSpeaking };
    }
    return p;
  });

  await updateDoc(roomRef, {
    participants: updatedParticipants,
  });
}

/* ----------------------------------------------------------------
   In-Room Text Chat API (`/study_meets/{roomId}/messages`)
---------------------------------------------------------------- */

/**
 * Send a real-time text chat message in a Study Meet room.
 */
export async function sendMeetChatMessage(
  roomId: string,
  senderUser: User,
  text: string
): Promise<string> {
  const cleanText = text.trim();
  if (!cleanText) return "";

  const messagesCol = collection(db, "study_meets", roomId, "messages");
  const docRef = await addDoc(messagesCol, {
    senderId: senderUser.uid,
    senderName:
      senderUser.displayName || senderUser.email?.split("@")[0] || "Scholar",
    senderPhotoURL: senderUser.photoURL || "",
    text: cleanText,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Subscribe to real-time chat messages in a Study Meet room.
 */
export function subscribeToMeetChatMessages(
  roomId: string,
  callback: (messages: MeetChatMessage[]) => void
): Unsubscribe {
  const messagesCol = collection(db, "study_meets", roomId, "messages");
  const q = query(messagesCol, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        senderId: data.senderId,
        senderName: data.senderName || "Scholar",
        senderPhotoURL: data.senderPhotoURL || "",
        text: data.text || "",
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Baru saja",
      };
    });
    callback(list);
  });
}

/* ----------------------------------------------------------------
   Meet Invitations API (`meet_invites`)
---------------------------------------------------------------- */

/**
 * Send a Meet invitation to a friend.
 */
export async function sendMeetInvite(
  roomId: string,
  roomTitle: string,
  hostUser: User,
  invitedUserId: string,
  invitedUserName: string
): Promise<string> {
  const hostName =
    hostUser.displayName || hostUser.email?.split("@")[0] || "Scholar Host";

  const docRef = await addDoc(collection(db, "meet_invites"), {
    roomId,
    roomTitle,
    hostId: hostUser.uid,
    hostName,
    invitedUserId,
    invitedUserName,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  const roomRef = doc(db, "study_meets", roomId);
  await updateDoc(roomRef, {
    invitedFriendIds: arrayUnion(invitedUserId),
  });

  return docRef.id;
}

/**
 * Respond to a meet invitation (accept or decline).
 */
export async function respondToMeetInvite(
  inviteId: string,
  action: "accept" | "decline"
): Promise<void> {
  const inviteRef = doc(db, "meet_invites", inviteId);
  await updateDoc(inviteRef, {
    status: action === "accept" ? "accepted" : "declined",
  });
}

/**
 * Subscribe to realtime incoming pending meet invites for a user.
 */
export function subscribeToIncomingMeetInvites(
  userId: string,
  callback: (invites: MeetInvite[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "meet_invites"),
    where("invitedUserId", "==", userId),
    where("status", "==", "pending")
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        roomId: data.roomId,
        roomTitle: data.roomTitle || "Ruang Study Meet",
        hostId: data.hostId,
        hostName: data.hostName,
        invitedUserId: data.invitedUserId,
        invitedUserName: data.invitedUserName,
        status: data.status,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : "",
      };
    });
    callback(list);
  });
}

/* Helper to parse raw Firestore document into StudyMeetRoom */
function parseRoomDoc(roomId: string, data: any): StudyMeetRoom {
  return {
    roomId,
    hostId: data.hostId,
    hostName: data.hostName || "Scholar Host",
    hostPhotoURL: data.hostPhotoURL || "",
    title: data.title || "Ruang Study Meet",
    topic: data.topic || "",
    sharedDocument: data.sharedDocument ?? "",
    participants: Array.isArray(data.participants) ? data.participants : [],
    invitedFriendIds: Array.isArray(data.invitedFriendIds)
      ? data.invitedFriendIds
      : [],
    lastAiExplanation: data.lastAiExplanation || null,
    isAiGenerating: Boolean(data.isAiGenerating),
    status: data.status || "active",
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : "",
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate().toISOString()
        : "",
  };
}
