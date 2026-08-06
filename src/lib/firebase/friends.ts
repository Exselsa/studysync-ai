/**
 * Firestore Friends & Match Challenges Module — StudySync AI
 *
 * Implements real-time Firestore operations for:
 * - User profile synchronization and search
 * - Friend request sending, listing, and acceptance
 * - Realtime match challenges (Feynman Duels) with live listeners
 * - Multiplayer match session synchronization
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
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./clientApp";
import type { User } from "firebase/auth";

/* ----------------------------------------------------------------
   Types
---------------------------------------------------------------- */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export interface FriendRelationship {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  status: "pending" | "accepted";
  createdAt: string;
}

export interface MatchChallenge {
  id: string;
  challengerId: string;
  challengerName: string;
  challengedId: string;
  challengedName: string;
  topic: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface MultiplayerMatch {
  matchId: string;
  challengerId: string;
  challengerName: string;
  opponentId: string;
  opponentName: string;
  topic: string;
  challengerHp: number;
  opponentHp: number;
  challengerAnswer?: string | null;
  opponentAnswer?: string | null;
  currentTurn: string;
  status: "in_progress" | "finished";
  winnerId: string | null;
  refereeCommentary?: string;
  lastRoundWinner?: "playerA" | "playerB" | "draw" | null;
  createdAt: string;
}

/* ----------------------------------------------------------------
   User Profile Utilities
---------------------------------------------------------------- */
export async function saveUserProfile(user: User): Promise<void> {
  if (!user || !user.uid) return;
  const userRef = doc(db, "users", user.uid);
  await setDoc(
    userRef,
    {
      uid: user.uid,
      displayName:
        user.displayName || user.email?.split("@")[0] || "Scholar Knight",
      email: (user.email || "").toLowerCase(),
      photoURL: user.photoURL || "",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function findUserByEmail(
  email: string
): Promise<UserProfile | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const q = query(
    collection(db, "users"),
    where("email", "==", normalizedEmail)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const data = snapshot.docs[0].data();
  return {
    uid: data.uid,
    displayName: data.displayName || "Scholar Knight",
    email: data.email,
    photoURL: data.photoURL,
  };
}

/* ----------------------------------------------------------------
   Friends Management API
---------------------------------------------------------------- */

/**
 * Send a friend request to a user by target email address.
 */
export async function sendFriendRequest(
  currentUser: User,
  targetEmail: string
): Promise<string> {
  const cleanEmail = targetEmail.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error("Please enter a valid email address.");
  }

  if (currentUser.email?.toLowerCase() === cleanEmail) {
    throw new Error("You cannot send a friend request to yourself.");
  }

  // Ensure current user profile is up-to-date in Firestore
  await saveUserProfile(currentUser);

  // Search target user in Firestore
  const targetUser = await findUserByEmail(cleanEmail);
  if (!targetUser) {
    throw new Error(
      `No user registered with email "${targetEmail}". Ask them to sign into StudySync AI first!`
    );
  }

  // Check if relationship already exists
  const existingSent = await getDocs(
    query(
      collection(db, "friends"),
      where("senderId", "==", currentUser.uid),
      where("receiverId", "==", targetUser.uid)
    )
  );
  const existingReceived = await getDocs(
    query(
      collection(db, "friends"),
      where("senderId", "==", targetUser.uid),
      where("receiverId", "==", currentUser.uid)
    )
  );

  if (!existingSent.empty || !existingReceived.empty) {
    throw new Error("Friend request already sent or accepted with this user.");
  }

  const docRef = await addDoc(collection(db, "friends"), {
    senderId: currentUser.uid,
    senderName:
      currentUser.displayName || currentUser.email?.split("@")[0] || "Scholar",
    senderEmail: currentUser.email?.toLowerCase() || "",
    receiverId: targetUser.uid,
    receiverName: targetUser.displayName,
    receiverEmail: targetUser.email,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Accept an incoming friend request.
 */
export async function acceptFriendRequest(requestId: string): Promise<void> {
  const reqRef = doc(db, "friends", requestId);
  await updateDoc(reqRef, {
    status: "accepted",
  });
}

/**
 * Decline / Remove a friend relationship or request.
 */
export async function removeFriendRelationship(requestId: string): Promise<void> {
  const reqRef = doc(db, "friends", requestId);
  await deleteDoc(reqRef);
}

/**
 * Subscribe to realtime updates for accepted friends list.
 */
export function subscribeToFriends(
  userId: string,
  callback: (friends: FriendRelationship[]) => void
): Unsubscribe {
  const qSent = query(
    collection(db, "friends"),
    where("senderId", "==", userId),
    where("status", "==", "accepted")
  );
  const qReceived = query(
    collection(db, "friends"),
    where("receiverId", "==", userId),
    where("status", "==", "accepted")
  );

  let sentList: FriendRelationship[] = [];
  let receivedList: FriendRelationship[] = [];

  const updateMerged = () => {
    callback([...sentList, ...receivedList]);
  };

  const unsubSent = onSnapshot(qSent, (snap) => {
    sentList = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        senderId: data.senderId,
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        receiverId: data.receiverId,
        receiverName: data.receiverName,
        receiverEmail: data.receiverEmail,
        status: data.status,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : "",
      };
    });
    updateMerged();
  });

  const unsubReceived = onSnapshot(qReceived, (snap) => {
    receivedList = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        senderId: data.senderId,
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        receiverId: data.receiverId,
        receiverName: data.receiverName,
        receiverEmail: data.receiverEmail,
        status: data.status,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : "",
      };
    });
    updateMerged();
  });

  return () => {
    unsubSent();
    unsubReceived();
  };
}

/**
 * Subscribe to realtime incoming pending friend requests.
 */
export function subscribeToPendingFriendRequests(
  userId: string,
  callback: (requests: FriendRelationship[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "friends"),
    where("receiverId", "==", userId),
    where("status", "==", "pending")
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        senderId: data.senderId,
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        receiverId: data.receiverId,
        receiverName: data.receiverName,
        receiverEmail: data.receiverEmail,
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

/* ----------------------------------------------------------------
   Match Challenge API (Feynman Duels)
---------------------------------------------------------------- */

/**
 * Send a Feynman Duel match challenge to a friend.
 */
export async function sendMatchChallenge(
  challengerId: string,
  challengerName: string,
  challengedId: string,
  challengedName: string,
  topicTitle: string
): Promise<string> {
  const docRef = await addDoc(collection(db, "challenges"), {
    challengerId,
    challengerName: challengerName || "Scholar",
    challengedId,
    challengedName: challengedName || "Friend",
    topic: topicTitle.trim(),
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/**
 * Respond to a match challenge (accept or decline).
 */
export async function respondToChallenge(
  challengeId: string,
  action: "accept" | "decline"
): Promise<void> {
  const challengeRef = doc(db, "challenges", challengeId);
  await updateDoc(challengeRef, {
    status: action === "accept" ? "accepted" : "declined",
  });
}

/**
 * Subscribe to pending incoming challenges targeting the logged in user.
 */
export function subscribeToIncomingChallenges(
  userId: string,
  callback: (challenges: MatchChallenge[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "challenges"),
    where("challengedId", "==", userId),
    where("status", "==", "pending")
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        challengerId: data.challengerId,
        challengerName: data.challengerName,
        challengedId: data.challengedId,
        challengedName: data.challengedName,
        topic: data.topic,
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

/**
 * Subscribe to a single challenge document (to notify challenger when accepted).
 */
export function subscribeToChallengeStatus(
  challengeId: string,
  callback: (challenge: MatchChallenge | null) => void
): Unsubscribe {
  const docRef = doc(db, "challenges", challengeId);
  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }
    const data = docSnap.data();
    callback({
      id: docSnap.id,
      challengerId: data.challengerId,
      challengerName: data.challengerName,
      challengedId: data.challengedId,
      challengedName: data.challengedName,
      topic: data.topic,
      status: data.status,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : "",
    });
  });
}

/* ----------------------------------------------------------------
   Multiplayer Match Session API (`multiplayer_matches`)
---------------------------------------------------------------- */

/**
 * Fetches or initializes a multiplayer match document in Firestore.
 */
export async function createOrGetMultiplayerMatch(
  matchId: string,
  currentUser: User,
  fallbackTopic: string = "Computer Science"
): Promise<MultiplayerMatch> {
  const matchRef = doc(db, "multiplayer_matches", matchId);
  const snap = await getDoc(matchRef);

  if (snap.exists()) {
    const data = snap.data();
    return {
      matchId: snap.id,
      challengerId: data.challengerId,
      challengerName: data.challengerName,
      opponentId: data.opponentId,
      opponentName: data.opponentName,
      topic: data.topic,
      challengerHp: data.challengerHp ?? 100,
      opponentHp: data.opponentHp ?? 100,
      currentTurn: data.currentTurn ?? data.challengerId,
      status: data.status ?? "in_progress",
      winnerId: data.winnerId ?? null,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : "",
    };
  }

  // Check original challenge doc if matchId maps to challengeId
  const challengeRef = doc(db, "challenges", matchId);
  const challengeSnap = await getDoc(challengeRef);

  let challengerId = currentUser.uid;
  let challengerName =
    currentUser.displayName || currentUser.email?.split("@")[0] || "Scholar";
  let opponentId = "opponent";
  let opponentName = "Friend Opponent";
  let topic = fallbackTopic;

  if (challengeSnap.exists()) {
    const cData = challengeSnap.data();
    challengerId = cData.challengerId;
    challengerName = cData.challengerName;
    opponentId = cData.challengedId;
    opponentName = cData.challengedName;
    topic = cData.topic || fallbackTopic;
  }

  const initialMatch: Omit<MultiplayerMatch, "createdAt"> & {
    createdAt: ReturnType<typeof serverTimestamp>;
  } = {
    matchId,
    challengerId,
    challengerName,
    opponentId,
    opponentName,
    topic,
    challengerHp: 100,
    opponentHp: 100,
    currentTurn: challengerId,
    status: "in_progress",
    winnerId: null,
    createdAt: serverTimestamp(),
  };

  await setDoc(matchRef, initialMatch);

  return {
    matchId,
    challengerId,
    challengerName,
    opponentId,
    opponentName,
    topic,
    challengerHp: 100,
    opponentHp: 100,
    currentTurn: challengerId,
    status: "in_progress",
    winnerId: null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Subscribe to realtime updates for a multiplayer match session.
 */
export function subscribeToMultiplayerMatch(
  matchId: string,
  callback: (match: MultiplayerMatch | null) => void
): Unsubscribe {
  const matchRef = doc(db, "multiplayer_matches", matchId);

  return onSnapshot(matchRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null);
      return;
    }

    const data = docSnap.data();
    callback({
      matchId: docSnap.id,
      challengerId: data.challengerId,
      challengerName: data.challengerName,
      opponentId: data.opponentId,
      opponentName: data.opponentName,
      topic: data.topic,
      challengerHp: typeof data.challengerHp === "number" ? data.challengerHp : 100,
      opponentHp: typeof data.opponentHp === "number" ? data.opponentHp : 100,
      challengerAnswer: data.challengerAnswer || null,
      opponentAnswer: data.opponentAnswer || null,
      currentTurn: data.currentTurn ?? data.challengerId,
      status: data.status ?? "in_progress",
      winnerId: data.winnerId ?? null,
      refereeCommentary: data.refereeCommentary || undefined,
      lastRoundWinner: data.lastRoundWinner || undefined,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : "",
    });
  });
}

/**
 * Submit player's answer in a 1v1 duel and check if both answers are ready for Gemini evaluation.
 */
export async function submitDuelAnswer(
  matchId: string,
  userId: string,
  answer: string
): Promise<{ bothSubmitted: boolean; matchData: MultiplayerMatch }> {
  const matchRef = doc(db, "multiplayer_matches", matchId);
  const snap = await getDoc(matchRef);
  if (!snap.exists()) throw new Error("Match not found.");

  const data = snap.data();
  const isChallenger = userId === data.challengerId;

  const updateData: Record<string, any> = {};
  if (isChallenger) {
    updateData.challengerAnswer = answer;
  } else {
    updateData.opponentAnswer = answer;
  }

  await updateDoc(matchRef, updateData);

  const updatedSnap = await getDoc(matchRef);
  const updatedData = updatedSnap.data()!;

  const challengerAnswer = updatedData.challengerAnswer;
  const opponentAnswer = updatedData.opponentAnswer;

  const bothSubmitted = Boolean(challengerAnswer && opponentAnswer);

  return {
    bothSubmitted,
    matchData: {
      matchId: updatedSnap.id,
      challengerId: updatedData.challengerId,
      challengerName: updatedData.challengerName,
      opponentId: updatedData.opponentId,
      opponentName: updatedData.opponentName,
      topic: updatedData.topic,
      challengerHp: updatedData.challengerHp ?? 100,
      opponentHp: updatedData.opponentHp ?? 100,
      challengerAnswer: challengerAnswer || null,
      opponentAnswer: opponentAnswer || null,
      currentTurn: updatedData.currentTurn ?? updatedData.challengerId,
      status: updatedData.status ?? "in_progress",
      winnerId: updatedData.winnerId ?? null,
      refereeCommentary: updatedData.refereeCommentary || undefined,
      lastRoundWinner: updatedData.lastRoundWinner || undefined,
      createdAt: "",
    },
  };
}

/**
 * Commit Gemini Referee evaluation results to Firestore for both players.
 */
export async function commitDuelEvaluation(
  matchId: string,
  playerADamageDealt: number,
  playerBDamageDealt: number,
  refereeCommentary: string,
  winnerOfRound: "playerA" | "playerB" | "draw"
): Promise<void> {
  const matchRef = doc(db, "multiplayer_matches", matchId);
  const snap = await getDoc(matchRef);
  if (!snap.exists()) return;

  const data = snap.data();

  const newChallengerHp = Math.max(0, (data.challengerHp ?? 100) - playerBDamageDealt);
  const newOpponentHp = Math.max(0, (data.opponentHp ?? 100) - playerADamageDealt);

  let status: "in_progress" | "finished" = "in_progress";
  let winnerId: string | null = null;

  if (newChallengerHp <= 0 && newOpponentHp <= 0) {
    status = "finished";
    winnerId = "draw";
  } else if (newChallengerHp <= 0) {
    status = "finished";
    winnerId = data.opponentId;
  } else if (newOpponentHp <= 0) {
    status = "finished";
    winnerId = data.challengerId;
  }

  await updateDoc(matchRef, {
    challengerHp: newChallengerHp,
    opponentHp: newOpponentHp,
    challengerAnswer: null,
    opponentAnswer: null,
    refereeCommentary,
    lastRoundWinner: winnerOfRound,
    status,
    winnerId,
  });
}

/**
 * Update HP and advance turn after a player's attack in a multiplayer match.
 */
export async function submitMultiplayerTurn(
  matchId: string,
  attackerId: string,
  damageDealtToOpponent: number,
  damageTakenByAttacker: number,
  refereeCommentary?: string,
  roundWinner?: "playerA" | "playerB" | "draw"
): Promise<void> {
  const matchRef = doc(db, "multiplayer_matches", matchId);
  const snap = await getDoc(matchRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const isChallenger = attackerId === data.challengerId;

  let newChallengerHp = data.challengerHp ?? 100;
  let newOpponentHp = data.opponentHp ?? 100;

  if (isChallenger) {
    newOpponentHp = Math.max(0, newOpponentHp - damageDealtToOpponent);
    newChallengerHp = Math.max(0, newChallengerHp - damageTakenByAttacker);
  } else {
    newChallengerHp = Math.max(0, newChallengerHp - damageDealtToOpponent);
    newOpponentHp = Math.max(0, newOpponentHp - damageTakenByAttacker);
  }

  let status: "in_progress" | "finished" = "in_progress";
  let winnerId: string | null = null;

  if (newChallengerHp <= 0 && newOpponentHp <= 0) {
    status = "finished";
    winnerId = "draw";
  } else if (newChallengerHp <= 0) {
    status = "finished";
    winnerId = data.opponentId;
  } else if (newOpponentHp <= 0) {
    status = "finished";
    winnerId = data.challengerId;
  }

  const nextTurn = isChallenger ? data.opponentId : data.challengerId;

  await updateDoc(matchRef, {
    challengerHp: newChallengerHp,
    opponentHp: newOpponentHp,
    currentTurn: nextTurn,
    status,
    winnerId,
    refereeCommentary: refereeCommentary || null,
    lastRoundWinner: roundWinner || null,
  });
}
