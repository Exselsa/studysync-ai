"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import {
  Video,
  VideoOff,
  Users,
  Plus,
  UserPlus,
  BookOpen,
  Sparkles,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  FileText,
  Send,
  Eye,
  Edit3,
  Shield,
  ShieldCheck,
  Crown,
  Trash2,
  Eraser,
  Mic,
  MicOff,
  MessageSquare,
  Volume2,
  X,
  DoorOpen,
  LogOut,
  Monitor,
  MonitorOff,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useStudyTimer } from "@/hooks/useStudyTimer";
import VoiceChat from "@/components/meet/VoiceChat";
import { getStudyPlans, type StudyPlan } from "@/lib/firebase/db";
import {
  subscribeToFriends,
  type FriendRelationship,
} from "@/lib/firebase/friends";
import {
  createStudyMeetRoom,
  joinStudyMeetRoom,
  deleteStudyMeetRoom,
  permanentlyDeleteStudyMeetRoom,
  leaveStudyMeetRoom,
  subscribeToStudyMeetRoom,
  subscribeToUserActiveStudyMeetRooms,
  updateSharedDocument,
  clearSharedBoard,
  importStudyPlanToRoom,
  appendAiExplanationToRoom,
  setRoomAiGenerating,
  sendMeetInvite,
  sendMeetChatMessage,
  subscribeToMeetChatMessages,
  type StudyMeetRoom,
  type MeetChatMessage,
} from "@/lib/firebase/meet";

/* ----------------------------------------------------------------
   Study Meet Page — Obsidian Glass Overhaul
---------------------------------------------------------------- */

export default function StudyMeetPage() {
  const { user, loading: authLoading } = useAuth();
  useStudyTimer(user?.uid);
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlRoomId = searchParams.get("roomId");

  /* ----------------------------------------------------------------
     State
  ---------------------------------------------------------------- */
  const [currentRoom, setCurrentRoom] = useState<StudyMeetRoom | null>(null);
  const [userActiveRooms, setUserActiveRooms] = useState<StudyMeetRoom[]>([]);
  const [roomLoading, setRoomLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Local Media Control States
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLocalMuted, setIsLocalMuted] = useState(false);

  // Lobby Card Action Target State
  const [targetLobbyRoom, setTargetLobbyRoom] = useState<{
    room: StudyMeetRoom;
    action: "delete" | "leave";
  } | null>(null);
  const [isProcessingLobbyAction, setIsProcessingLobbyAction] = useState(false);

  // Creation / Joining Modal State
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [joinRoomIdInput, setJoinRoomIdInput] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  // Host Action Modals State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showImportPlanModal, setShowImportPlanModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [showClearBoardModal, setShowClearBoardModal] = useState(false);

  // In-Room Text Chat State
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [chatMessages, setChatMessages] = useState<MeetChatMessage[]>([]);
  const [chatInputText, setChatInputText] = useState("");
  const chatScrollEndRef = useRef<HTMLDivElement | null>(null);

  // Friends & Study Plans for Modals
  const [friendsList, setFriendsList] = useState<FriendRelationship[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const [userPlans, setUserPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [aiTopicPrompt, setAiTopicPrompt] = useState("");

  // Shared Board State
  const [localDocText, setLocalDocText] = useState("");
  const [isEditorView, setIsEditorView] = useState(true); // true = edit, false = preview
  const [copiedCode, setCopiedCode] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isHost = user && currentRoom && user.uid === currentRoom.hostId;

  /* ----------------------------------------------------------------
     1. Lobby Persistence: Fetch Active Rooms ("Ruang Belajar Saya")
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (!user) return;
    const unsubUserRooms = subscribeToUserActiveStudyMeetRooms(
      user.uid,
      (rooms) => {
        setUserActiveRooms(rooms);
      }
    );
    return () => unsubUserRooms();
  }, [user]);

  /* ----------------------------------------------------------------
     2. Room Subscription & Sync
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (!urlRoomId || !user) {
      setCurrentRoom(null);
      return;
    }

    setRoomLoading(true);

    // Attempt auto-join
    joinStudyMeetRoom(urlRoomId, user)
      .catch((err) => console.warn("Auto-join note:", err.message))
      .finally(() => setRoomLoading(false));

    // Real-time listener for room document updates
    const unsubscribe = subscribeToStudyMeetRoom(urlRoomId, (roomData) => {
      if (!roomData || roomData.status === "ended") {
        setErrorMsg("Ruang Study Meet telah ditutup oleh host.");
        setCurrentRoom(null);
        setRoomLoading(false);
        router.push("/dashboard/meet");
        return;
      }

      setCurrentRoom(roomData);
      setLocalDocText(roomData.sharedDocument);
      setRoomLoading(false);
    });

    return () => unsubscribe();
  }, [urlRoomId, user, router]);

  /* ----------------------------------------------------------------
     3. Realtime In-Room Text Chat Subscription
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (!urlRoomId || !currentRoom) {
      setChatMessages([]);
      return;
    }

    const unsubChat = subscribeToMeetChatMessages(urlRoomId, (msgs) => {
      setChatMessages(msgs);
      setTimeout(() => {
        chatScrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubChat();
  }, [urlRoomId, currentRoom?.roomId]);

  /* ----------------------------------------------------------------
     4. Fetch Friends & Plans for Host Modals
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (!user) return;
    const unsubFriends = subscribeToFriends(user.uid, (list) => {
      setFriendsList(list);
    });

    getStudyPlans(user.uid)
      .then((plans) => setUserPlans(plans))
      .catch((err) => console.error("Failed to load study plans:", err));

    return () => unsubFriends();
  }, [user]);

  /* ----------------------------------------------------------------
     Handlers
  ---------------------------------------------------------------- */
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isCreatingRoom) return;

    setIsCreatingRoom(true);
    setErrorMsg(null);

    try {
      const newId = await createStudyMeetRoom(
        user,
        newRoomTitle.trim() || "Ruang Belajar Bersama"
      );
      setNewRoomTitle("");
      router.push(`/dashboard/meet?roomId=${newId}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal membuat ruang meet.");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = joinRoomIdInput.trim();
    if (!user || !targetId || isJoiningRoom) return;

    setIsJoiningRoom(true);
    setErrorMsg(null);

    try {
      await joinStudyMeetRoom(targetId, user);
      setJoinRoomIdInput("");
      router.push(`/dashboard/meet?roomId=${targetId}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal bergabung ke ruang.");
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Lobby Card Action Handler (Delete / Leave Room)
  const handleConfirmLobbyAction = async () => {
    if (!user || !targetLobbyRoom || isProcessingLobbyAction) return;
    setIsProcessingLobbyAction(true);

    const { room, action } = targetLobbyRoom;

    try {
      if (action === "delete") {
        await permanentlyDeleteStudyMeetRoom(room.roomId);
      } else {
        await leaveStudyMeetRoom(room.roomId, user.uid);
      }

      setUserActiveRooms((prev) => prev.filter((r) => r.roomId !== room.roomId));
      setTargetLobbyRoom(null);
    } catch (err) {
      console.error(`Failed to ${action} room:`, err);
    } finally {
      setIsProcessingLobbyAction(false);
    }
  };

  // Host: Delete Room inside active room view
  const handleConfirmDeleteRoom = async () => {
    if (!currentRoom || !isHost) return;
    setShowDeleteRoomModal(false);
    try {
      await deleteStudyMeetRoom(currentRoom.roomId);
      router.push("/dashboard/meet");
    } catch (err) {
      console.error("Delete room error:", err);
    }
  };

  // Host: Clear Shared Board
  const handleConfirmClearBoard = async () => {
    if (!currentRoom || !isHost) return;
    setShowClearBoardModal(false);
    try {
      await clearSharedBoard(currentRoom.roomId);
      setLocalDocText("");
    } catch (err) {
      console.error("Clear board error:", err);
    }
  };

  // Send Text Chat Message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !user || !chatInputText.trim()) return;

    const text = chatInputText.trim();
    setChatInputText("");
    try {
      await sendMeetChatMessage(currentRoom.roomId, user, text);
    } catch (err) {
      console.error("Send chat error:", err);
    }
  };

  // Debounced Local Typing -> Firestore Sync for Host
  const handleDocumentChange = (text: string) => {
    setLocalDocText(text);
    if (!isHost || !currentRoom) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      await updateSharedDocument(currentRoom.roomId, text);
    }, 400);
  };

  // Host: Invite Friend
  const handleSendInviteToFriend = async (friend: FriendRelationship) => {
    if (!user || !currentRoom) return;

    const friendId =
      friend.senderId === user.uid ? friend.receiverId : friend.senderId;
    const friendName =
      friend.senderId === user.uid ? friend.receiverName : friend.senderName;

    try {
      await sendMeetInvite(
        currentRoom.roomId,
        currentRoom.title,
        user,
        friendId,
        friendName
      );
      setInvitedFriends((prev) => new Set(prev).add(friendId));
    } catch (err) {
      console.error("Invite error:", err);
    }
  };

  // Host: Import Study Plan Topic
  const handleImportSelectedPlan = async () => {
    if (!currentRoom || !selectedPlanId) return;
    const targetPlan = userPlans.find((p) => p.id === selectedPlanId);
    if (!targetPlan) return;

    setShowImportPlanModal(false);
    try {
      await importStudyPlanToRoom(
        currentRoom.roomId,
        currentRoom.sharedDocument,
        targetPlan.title,
        targetPlan.tasks.map((t) => ({
          title: t.title,
          description: t.description || "",
        }))
      );
    } catch (err) {
      console.error("Import plan error:", err);
    }
  };

  // Host: Request AI Explanation ("abang ganteng")
  const handleRequestAiExplanation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !aiTopicPrompt.trim() || currentRoom.isAiGenerating) return;

    const promptText = aiTopicPrompt.trim();
    setAiTopicPrompt("");
    setShowAiModal(false);

    try {
      await setRoomAiGenerating(currentRoom.roomId, true);

      const res = await fetch("/api/meet/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: currentRoom.title,
          question: promptText,
        }),
      });

      if (!res.ok) throw new Error("AI Endpoint failed.");

      const data = await res.json();
      await appendAiExplanationToRoom(
        currentRoom.roomId,
        currentRoom.sharedDocument,
        promptText,
        data.explanation
      );
    } catch (err) {
      console.error("AI Explanation error:", err);
      await setRoomAiGenerating(currentRoom.roomId, false);
    }
  };

  const copyRoomCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  /* ----------------------------------------------------------------
     Render Loading / Pre-checks
  ---------------------------------------------------------------- */
  if (authLoading || roomLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-cyan-400">
        <Loader2 size={36} className="animate-spin text-cyan-400" />
        <p className="text-xs font-bold text-slate-300 font-display">Menyiapkan Ruang Study Meet...</p>
      </div>
    );
  }

  /* ----------------------------------------------------------------
     LOBBY VIEW (No Active Room Selected)
  ---------------------------------------------------------------- */
  if (!urlRoomId || !currentRoom) {
    return (
      <section className="flex flex-col gap-8 w-full max-w-6xl mx-auto px-4 py-8">
        {/* Header Hero Banner — Pitch Obsidian & Electric Cyan/Violet */}
        <m.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border bg-[#080C14]/90 border-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        >
          <div className="absolute top-0 right-1/4 size-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 size-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-3 max-w-xl z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center gap-1.5">
                <Volume2 size={12} className="text-cyan-400 animate-pulse" /> KOLABORASI REAL-TIME & OPEN MIC 🎙️
              </span>
              <span className="text-[10px] font-extrabold text-violet-300 px-2.5 py-0.5 rounded-full bg-violet-950/80 border border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.25)] flex items-center gap-1">
                <Sparkles size={11} className="fill-violet-300" /> abang ganteng AI Supported
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-display bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent leading-tight tracking-tight mt-1">
              Study Meet — Belajar & Diskusikan Materi Bersama
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Buat ruang belajar live, obrolan suara WebRTC, chat room real-time, impor Study Plan, dan panggil penjelasan materi langsung dari <strong className="text-cyan-300 font-extrabold">abang ganteng</strong>!
            </p>
          </div>

          <m.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="size-20 sm:size-24 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_35px_rgba(6,182,212,0.3)] shrink-0 z-10 backdrop-blur-md"
          >
            <Video size={42} className="animate-pulse text-cyan-300" />
          </m.div>
        </m.div>

        {errorMsg && (
          <m.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/40 text-rose-300 text-xs font-bold text-center shadow-lg"
          >
            ⚠️ {errorMsg}
          </m.div>
        )}

        {/* SECTION: Ruang Belajar Saya */}
        {userActiveRooms.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <DoorOpen size={20} className="text-cyan-400" />
              <h2 className="text-xl font-black text-slate-100 font-display">
                Ruang Belajar Saya 🚪
              </h2>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 shadow-sm">
                {userActiveRooms.length} Ruang Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userActiveRooms.map((room) => {
                const isUserHost = user && room.hostId === user.uid;

                return (
                  <m.div
                    key={room.roomId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -3, borderColor: "rgba(6,182,212,0.5)" }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="p-5 rounded-2xl bg-[#080C14]/90 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-4 transition-all"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          {isUserHost ? "Host Ruang" : "Peserta"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {room.participants.length} Anggota
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-50 line-clamp-1 font-display">
                        {room.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-sans">
                        Host: <strong className="text-cyan-300 font-bold">{room.hostName}</strong>
                      </p>
                    </div>

                    {/* Lobby Room Card Action Buttons */}
                    <div className="flex items-center gap-2">
                      <m.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => router.push(`/dashboard/meet?roomId=${room.roomId}`)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                      >
                        <DoorOpen size={14} /> Masuk Kembali 🚪
                      </m.button>

                      {isUserHost ? (
                        <m.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          id={`meet-card-delete-${room.roomId}`}
                          onClick={() => setTargetLobbyRoom({ room, action: "delete" })}
                          className="py-2.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
                          title="Hapus room ini"
                        >
                          <Trash2 size={14} className="text-rose-400" /> Hapus 🗑️
                        </m.button>
                      ) : (
                        <m.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          id={`meet-card-leave-${room.roomId}`}
                          onClick={() => setTargetLobbyRoom({ room, action: "leave" })}
                          className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
                          title="Keluar dari room ini"
                        >
                          <LogOut size={14} className="text-slate-400" /> Keluar 🚪
                        </m.button>
                      )}
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Cards: Create Room vs Join Room */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Create Room */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-6 border bg-[#080C14]/90 border-white/10 backdrop-blur-xl shadow-xl hover:border-cyan-500/50 transition-all"
          >
            <div className="flex flex-col gap-3">
              <div className="size-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-md">
                <Plus size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-100 font-display">
                Buat Ruang Meet Baru
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Jadilah Host, undang teman-teman kamu, kontrol papan catatan, dan panggil penjelasan dari abang ganteng.
              </p>
            </div>

            <form onSubmit={handleCreateRoom} className="flex flex-col gap-3">
              <input
                type="text"
                value={newRoomTitle}
                onChange={(e) => setNewRoomTitle(e.target.value)}
                placeholder="Judul Ruang Meet (misal: Review Kalkulus BAB 3)"
                className="w-full text-xs px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-slate-100 outline-none focus:border-cyan-400 transition-colors font-sans"
                required
              />
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isCreatingRoom}
                className="py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                {isCreatingRoom ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Membuat Ruang...
                  </>
                ) : (
                  <>
                    <Video size={15} /> Buat Ruang Meet 🚀
                  </>
                )}
              </m.button>
            </form>
          </m.div>

          {/* Card 2: Join Room */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-6 border bg-[#080C14]/90 border-white/10 backdrop-blur-xl shadow-xl hover:border-violet-500/50 transition-all"
          >
            <div className="flex flex-col gap-3">
              <div className="size-12 rounded-2xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300 shadow-md">
                <Users size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-100 font-display">
                Gabung dengan Kode Room
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Punya kode/ID ruang dari teman? Masukkan kode di bawah untuk gabung dan belajar bersama secara real-time.
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="flex flex-col gap-3">
              <input
                type="text"
                value={joinRoomIdInput}
                onChange={(e) => setJoinRoomIdInput(e.target.value)}
                placeholder="Masukkan Kode Room ID"
                className="w-full text-xs px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-slate-100 outline-none focus:border-violet-400 transition-colors font-mono"
                required
              />
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isJoiningRoom || !joinRoomIdInput.trim()}
                className="py-3 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 bg-slate-900 border border-slate-700 text-slate-200 hover:text-white shadow-md"
              >
                {isJoiningRoom ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Menghubungkan...
                  </>
                ) : (
                  <>
                    <Users size={15} /> Gabung Ruang Meet
                  </>
                )}
              </m.button>
            </form>
          </m.div>
        </div>

        {/* LOBBY CARD ACTION CONFIRMATION MODAL */}
        <AnimatePresence>
          {targetLobbyRoom && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
              <m.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="max-w-md w-full rounded-3xl p-6 flex flex-col gap-4 border bg-[#080C14]/95 border-rose-500/40 shadow-2xl text-center backdrop-blur-2xl"
              >
                <div className="size-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mx-auto shadow-md">
                  {targetLobbyRoom.action === "delete" ? (
                    <Trash2 size={24} />
                  ) : (
                    <LogOut size={24} />
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-100 font-display">
                    {targetLobbyRoom.action === "delete"
                      ? "Hapus Room?"
                      : "Keluar dari Room?"}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-2 font-sans">
                    {targetLobbyRoom.action === "delete"
                      ? `Yakin ingin menghapus room "${targetLobbyRoom.room.title}"? Semua data obrolan dan catatan di room ini akan dihapus permanen.`
                      : `Yakin ingin keluar dari room "${targetLobbyRoom.room.title}"?`}
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setTargetLobbyRoom(null)}
                    disabled={isProcessingLobbyAction}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-bold text-xs cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <m.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleConfirmLobbyAction}
                    disabled={isProcessingLobbyAction}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs cursor-pointer shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isProcessingLobbyAction ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Memproses...
                      </>
                    ) : targetLobbyRoom.action === "delete" ? (
                      "Ya, Hapus"
                    ) : (
                      "Ya, Keluar"
                    )}
                  </m.button>
                </div>
              </m.div>
            </div>
          )}
        </AnimatePresence>
      </section>
    );
  }

  /* ----------------------------------------------------------------
     LIVE STUDY MEET WORKSPACE VIEW (Active Room)
  ---------------------------------------------------------------- */
  return (
    <section className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 py-6 relative pb-28">
      {/* Task 1: Header & Room Status Badge */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-[#080C14]/90 border border-white/10 backdrop-blur-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <m.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => router.push("/dashboard/meet")}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Kembali ke Menu Meet"
          >
            <ArrowLeft size={18} />
          </m.button>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black font-display bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent leading-tight">
                {currentRoom.title}
              </h1>
              {isHost && (
                <span className="px-2.5 py-0.5 rounded-full bg-violet-950/90 border border-violet-500/40 text-[10px] font-black text-violet-300 flex items-center gap-1 shadow-sm">
                  <Crown size={11} className="text-violet-400 fill-violet-400" /> HOST
                </span>
              )}
            </div>

            {/* Room Code & WebRTC Encryption Status Badge */}
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-[11px] text-slate-400 font-sans">
                Host: <strong className="text-cyan-300 font-extrabold">{currentRoom.hostName}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <div className="bg-[#080C14]/90 border border-white/10 backdrop-blur-xl shadow-xl px-3 py-1 rounded-full flex items-center gap-2 text-[11px]">
                <ShieldCheck size={13} className="text-cyan-400" />
                <span className="font-mono text-slate-300">
                  ID: {currentRoom.roomId.slice(0, 10)}...
                </span>
                <button
                  type="button"
                  onClick={copyRoomCode}
                  className="hover:text-cyan-300 text-slate-400 flex items-center gap-1 font-mono text-[10px] cursor-pointer transition-colors"
                  title="Salin Kode Room"
                >
                  {copiedCode ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Header Right Actions: VoiceChat Component & Text Chat Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {/* WebRTC Voice Chat Controls & Audio Overlay Trigger */}
          <VoiceChat
            roomId={currentRoom.roomId}
            onMuteStateChange={(muted) => setIsLocalMuted(muted)}
          />

          {/* In-Room Text Chat Panel Toggle */}
          <m.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            id="meet-chat-toggle-btn"
            onClick={() => setShowChatPanel((prev) => !prev)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
              showChatPanel
                ? "bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            <MessageSquare size={14} className="text-cyan-400" />
            <span>Chat ({chatMessages.length})</span>
          </m.button>

          {/* Host Delete Room Button */}
          {isHost && (
            <m.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              id="meet-delete-room-btn"
              onClick={() => setShowDeleteRoomModal(true)}
              className="px-3.5 py-1.5 rounded-full bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-md"
              title="Tutup & Hapus Ruang Meet"
            >
              <Trash2 size={13} className="text-rose-400" /> Hapus Room
            </m.button>
          )}
        </div>
      </div>

      {/* Task 2: Video/Voice Participant HUD Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black tracking-wider uppercase text-cyan-300 flex items-center gap-2 font-display">
            <Volume2 size={14} className="text-emerald-400 animate-pulse" /> Peserta Room ({currentRoom.participants.length}):
          </span>
          {isScreenSharing && (
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-violet-950 border border-violet-500/40 text-violet-300 animate-pulse flex items-center gap-1">
              <Monitor size={12} /> Screen Share Aktif
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentRoom.participants.map((p) => {
            const isUserSpeaking = p.isSpeaking;
            const isUserMuted = p.isMuted;
            const isSelf = user && p.uid === user.uid;

            return (
              <m.div
                key={p.uid}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.35 }}
                className={`rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all relative overflow-hidden backdrop-blur-xl shadow-xl ${
                  isUserSpeaking
                    ? "bg-[#080C14]/90 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-2 ring-cyan-400/50"
                    : "bg-[#080C14]/90 border-white/10"
                }`}
              >
                {/* Header info in card */}
                <div className="flex items-center justify-between gap-2 z-10">
                  <div className="flex items-center gap-1.5">
                    {p.role === "host" && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-950/80 border border-violet-500/40 text-[9px] font-black text-violet-300 flex items-center gap-1">
                        <Crown size={10} className="fill-violet-300" /> Host
                      </span>
                    )}
                    {isSelf && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[9px] font-black text-cyan-300">
                        Kamu
                      </span>
                    )}
                  </div>

                  {/* Mic Mute / Active Badge */}
                  {isUserMuted ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1">
                      <MicOff size={11} className="text-rose-400" /> Muted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                      <Mic size={11} className="text-emerald-400" /> Mic On
                    </span>
                  )}
                </div>

                {/* Cybernetic Avatar Fallback / Video HUD Viewport */}
                <div className="flex flex-col items-center justify-center my-2 relative z-10">
                  {isSelf && isCameraOn ? (
                    <div className="w-full h-28 rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center justify-center relative overflow-hidden shadow-inner">
                      <Video size={24} className="text-cyan-400 animate-pulse" />
                      <span className="absolute bottom-2 left-2 text-[9px] font-mono font-bold text-cyan-300 bg-black/60 px-1.5 py-0.5 rounded">
                        Kamera Aktif
                      </span>
                    </div>
                  ) : (
                    <div className="size-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/40 text-cyan-300 font-display font-black text-xl flex items-center justify-center relative shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                      {p.displayName.charAt(0).toUpperCase()}
                      {isUserSpeaking && (
                        <span className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-60" />
                      )}
                    </div>
                  )}
                </div>

                {/* Footer info in card */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2 z-10">
                  <span className="text-xs font-black text-slate-100 truncate max-w-[120px] font-sans">
                    {p.displayName}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {isUserSpeaking ? "🗣️ Berbicara" : "Hadir"}
                  </span>
                </div>
              </m.div>
            );
          })}
        </div>
      </div>

      {/* Host Action Toolbar & AI Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#080C14]/90 border border-white/10 shadow-md backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Host Action 1: Invite Friends */}
          {isHost && (
            <m.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              id="meet-invite-friends-btn"
              onClick={() => setShowInviteModal(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <UserPlus size={14} className="text-cyan-400" /> Undang Teman ➕
            </m.button>
          )}

          {/* Host Action 2: Import Study Plan */}
          {isHost && (
            <m.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              id="meet-import-plan-btn"
              onClick={() => setShowImportPlanModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <BookOpen size={14} className="text-indigo-400" /> Impor dari Study Plan 📚
            </m.button>
          )}

          {/* Host Action 3: "Minta Penjelasan Abang Ganteng 💡" */}
          {isHost && (
            <m.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              id="meet-ask-ai-btn"
              onClick={() => setShowAiModal(true)}
              disabled={currentRoom.isAiGenerating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all disabled:opacity-50 cursor-pointer font-display"
            >
              {currentRoom.isAiGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" /> abang ganteng Menjelaskan...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="fill-white" /> Minta Penjelasan Abang Ganteng 💡
                </>
              )}
            </m.button>
          )}

          {/* Host Action 4: Clear Shared Board 🧹 */}
          {isHost && (
            <m.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              id="meet-clear-board-btn"
              onClick={() => setShowClearBoardModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Eraser size={14} className="text-rose-400" /> Bersihkan Papan 🧹
            </m.button>
          )}

          {!isHost && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Shield size={12} className="text-cyan-400" /> Mode Participant (Realtime Sync View)
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 ml-auto">
          <button
            type="button"
            onClick={() => setIsEditorView(true)}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isEditorView
                ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Edit3 size={13} /> {isHost ? "Edit Papan" : "Lihat Teks"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditorView(false)}
            className={`px-3.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              !isEditorView
                ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye size={13} /> Pratinjau Rapi
          </button>
        </div>
      </div>

      {/* Realtime AI Generating Banner Indicator */}
      <AnimatePresence>
        {currentRoom.isAiGenerating && (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-2xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 shadow-lg backdrop-blur-md animate-pulse"
          >
            <Loader2 size={16} className="animate-spin text-cyan-400" />
            <span>abang ganteng sedang meracik penjelasan terbaik untuk room ini... Papan akan terupdate otomatis!</span>
          </m.div>
        )}
      </AnimatePresence>

      {/* Main Shared Workspace Board & In-Room Text Chat Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div
          className={`rounded-3xl p-5 sm:p-6 flex flex-col gap-4 border relative min-h-[420px] ${
            showChatPanel ? "lg:col-span-2" : "lg:col-span-3"
          }`}
          style={{
            background:
              "linear-gradient(135deg, rgba(8,12,20,0.95) 0%, rgba(6,182,212,0.04) 100%)",
            borderColor: "rgba(255,255,255,0.1)",
            boxShadow: "0 15px 45px rgba(0,0,0,0.5)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Board Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-cyan-400" />
              <span className="text-xs font-extrabold tracking-wider uppercase text-cyan-300 font-display">
                Papan Catatan Real-Time Room
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isHost && (
                <m.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  id="meet-clear-board-header-btn"
                  onClick={() => setShowClearBoardModal(true)}
                  className="px-3 py-1 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  title="Kosongkan seluruh papan catatan secara real-time"
                >
                  <Eraser size={13} className="text-rose-400" /> Bersihkan Papan 🧹
                </m.button>
              )}

              <span className="text-[10px] text-slate-400 font-mono">
                {isHost ? "Host Edit" : "Realtime View"}
              </span>
            </div>
          </div>

          {isEditorView ? (
            <textarea
              id="meet-shared-workspace-input"
              value={localDocText}
              onChange={(e) => handleDocumentChange(e.target.value)}
              disabled={!isHost}
              rows={16}
              placeholder={
                isHost
                  ? "Tulis catatan ruang meet di sini... (Terhubung real-time ke semua peserta room)"
                  : "Host sedang menyiapkan catatan untuk room..."
              }
              className="w-full resize-none outline-none text-xs sm:text-sm leading-relaxed p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder:italic font-mono disabled:opacity-80 disabled:cursor-not-allowed focus:border-cyan-500/60 transition-colors"
              aria-label="Papan Catatan Bersama Study Meet"
            />
          ) : (
            <div className="w-full min-h-[350px] p-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-100 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans overflow-y-auto">
              {localDocText ? (
                localDocText
              ) : (
                <span className="italic text-slate-400">
                  Papan catatan room masih kosong.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Sidebar Text Chat Panel */}
        <AnimatePresence>
          {showChatPanel && (
            <m.div
              initial={{ opacity: 0, x: 20, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.96 }}
              transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.35 }}
              className="lg:col-span-1 rounded-3xl p-4 flex flex-col gap-3 border bg-[#080C14]/95 border-cyan-500/30 backdrop-blur-xl shadow-2xl h-[520px]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                <div className="flex items-center gap-2 text-cyan-300 font-extrabold text-xs font-display">
                  <MessageSquare size={14} className="text-cyan-400" />
                  <span>Obrolan Teks Room</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChatPanel(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs font-bold"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 p-1">
                {chatMessages.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic text-center py-10">
                    Belum ada pesan di ruang chat ini. Mulai obrolan bersama anggota room!
                  </p>
                ) : (
                  chatMessages.map((msg) => {
                    const isSelf = user && msg.senderId === user.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-1 max-w-[85%] ${
                          isSelf ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="font-bold text-cyan-300">
                            {isSelf ? "Kamu" : msg.senderName}
                          </span>
                          <span>•</span>
                          <span>{msg.createdAt}</span>
                        </div>
                        <div
                          className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                            isSelf
                              ? "bg-cyan-950/90 border border-cyan-500/40 text-cyan-100 rounded-tr-none shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                              : "bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatScrollEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} className="flex items-center gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 outline-none focus:border-cyan-400 font-sans"
                />
                <m.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!chatInputText.trim()}
                  className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-md"
                >
                  <Send size={14} />
                </m.button>
              </form>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task 3: Floating Media Control Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-full bg-[#080C14]/90 border border-white/15 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-3">
        {/* Camera Toggle Button */}
        <m.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setIsCameraOn((prev) => !prev)}
          className={`size-11 rounded-full flex items-center justify-center border transition-all cursor-pointer backdrop-blur-md ${
            isCameraOn
              ? "bg-cyan-950/90 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200"
          }`}
          title={isCameraOn ? "Matikan Kamera" : "Nyalakan Kamera"}
        >
          {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
        </m.button>

        {/* Screen Share Toggle Button */}
        <m.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setIsScreenSharing((prev) => !prev)}
          className={`size-11 rounded-full flex items-center justify-center border transition-all cursor-pointer backdrop-blur-md ${
            isScreenSharing
              ? "bg-violet-950/90 text-violet-300 border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              : "bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200"
          }`}
          title={isScreenSharing ? "Hentikan Share Screen" : "Bagikan Layar"}
        >
          {isScreenSharing ? <Monitor size={18} /> : <MonitorOff size={18} />}
        </m.button>

        {/* In-Room Text Chat Quick Button */}
        <m.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setShowChatPanel((prev) => !prev)}
          className={`size-11 rounded-full flex items-center justify-center border transition-all cursor-pointer backdrop-blur-md ${
            showChatPanel
              ? "bg-cyan-950/90 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200"
          }`}
          title="Buka Chat Room"
        >
          <MessageSquare size={18} />
        </m.button>

        {/* Ask AI ("abang ganteng") Button (Host Only) */}
        {isHost && (
          <m.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowAiModal(true)}
            className="size-11 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 text-white flex items-center justify-center border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            title="Minta Penjelasan Abang Ganteng"
          >
            <Sparkles size={18} className="fill-white" />
          </m.button>
        )}

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Leave Room Button */}
        <m.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => router.push("/dashboard/meet")}
          className="px-4 py-2 rounded-full bg-rose-950/90 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
        >
          <LogOut size={14} /> Keluar
        </m.button>
      </div>

      {/* MODAL 1: Host Invite Friends Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="max-w-md w-full rounded-3xl p-6 flex flex-col gap-4 border bg-[#080C14]/95 border-cyan-500/40 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2 text-cyan-300 font-black text-sm font-display">
                  <UserPlus size={18} />
                  <span>Undang Teman ke Room</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {friendsList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    Belum ada teman terhubung. Tambahkan teman di sidebar terlebih dahulu!
                  </p>
                ) : (
                  friendsList.map((friend) => {
                    const friendId =
                      friend.senderId === user?.uid
                        ? friend.receiverId
                        : friend.senderId;
                    const friendName =
                      friend.senderId === user?.uid
                        ? friend.receiverName
                        : friend.senderName;
                    const isInvited = invitedFriends.has(friendId);

                    return (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800"
                      >
                        <span className="text-xs font-bold text-slate-200">
                          {friendName}
                        </span>
                        <m.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          disabled={isInvited}
                          onClick={() => handleSendInviteToFriend(friend)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                        >
                          {isInvited ? "Terkirim ✉️" : "Undang 📩"}
                        </m.button>
                      </div>
                    );
                  })
                )}
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Host Import Study Plan Modal */}
      <AnimatePresence>
        {showImportPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="max-w-md w-full rounded-3xl p-6 flex flex-col gap-4 border bg-[#080C14]/95 border-indigo-500/40 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                <div className="flex items-center gap-2 text-indigo-300 font-black text-sm font-display">
                  <BookOpen size={18} />
                  <span>Impor Topik dari Study Plan</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImportPlanModal(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs text-slate-300 font-bold">
                  Pilih Study Plan yang Ingin Diimpor:
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none"
                >
                  <option value="">-- Pilih Plan Kamu --</option>
                  {userPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.title} ({plan.tasks.length} tugas)
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowImportPlanModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <m.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    disabled={!selectedPlanId}
                    onClick={handleImportSelectedPlan}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    Impor ke Papan 📚
                  </m.button>
                </div>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Host Exclusive "Minta Penjelasan Abang Ganteng 💡" */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="max-w-md w-full rounded-3xl p-6 flex flex-col gap-4 border bg-[#080C14]/95 border-cyan-500/40 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2 text-cyan-300 font-black text-sm font-display">
                  <Sparkles size={18} />
                  <span>Minta Penjelasan Abang Ganteng 💡</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRequestAiExplanation} className="flex flex-col gap-3">
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Tulis topik atau pertanyaan materi yang ingin dijelaskan oleh <strong className="text-cyan-300">abang ganteng</strong>. Penjelasan akan langsung tampil di papan catatan room untuk semua peserta!
                </p>

                <textarea
                  value={aiTopicPrompt}
                  onChange={(e) => setAiTopicPrompt(e.target.value)}
                  placeholder="Contoh: Jelaskan konsep Backpropagation pada Neural Network dan analogi sederhananya!"
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-cyan-400 transition-colors resize-none font-sans"
                  required
                />

                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowAiModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-bold text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <m.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!aiTopicPrompt.trim()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5 font-display"
                  >
                    <Send size={13} /> Buat Penjelasan ✨
                  </m.button>
                </div>
              </form>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Host Confirm Clear Shared Board Modal */}
      <AnimatePresence>
        {showClearBoardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="max-w-md w-full rounded-3xl p-6 flex flex-col gap-4 border bg-[#080C14]/95 border-rose-500/40 shadow-2xl text-center backdrop-blur-2xl"
            >
              <div className="size-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mx-auto">
                <Eraser size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-100 font-display">
                  Bersihkan Papan Catatan? 🧹
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-2 font-sans">
                  Seluruh teks pada papan catatan ruang meet ini akan dihapus bersih secara real-time untuk seluruh anggota room.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowClearBoardModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleConfirmClearBoard}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs cursor-pointer shadow-lg transition-all"
                >
                  Ya, Bersihkan Papan
                </m.button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: Host Confirm Delete Room Modal */}
      <AnimatePresence>
        {showDeleteRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="max-w-md w-full rounded-3xl p-6 flex flex-col gap-4 border bg-[#080C14]/95 border-rose-500/40 shadow-2xl text-center backdrop-blur-2xl"
            >
              <div className="size-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mx-auto">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-100 font-display">
                  Hapus Ruang Study Meet? 🗑️
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-2 font-sans">
                  Ruang meet akan ditutup dan seluruh anggota yang sedang bergabung akan otomatis dikembalikan ke menu lobby Study Meet.
                </p>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteRoomModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleConfirmDeleteRoom}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs cursor-pointer shadow-lg transition-all"
                >
                  Ya, Hapus Room
                </m.button>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
