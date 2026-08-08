"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import {
  Video,
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
  Crown,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getStudyPlans, type StudyPlan } from "@/lib/firebase/db";
import {
  subscribeToFriends,
  type FriendRelationship,
} from "@/lib/firebase/friends";
import {
  createStudyMeetRoom,
  joinStudyMeetRoom,
  subscribeToStudyMeetRoom,
  updateSharedDocument,
  importStudyPlanToRoom,
  appendAiExplanationToRoom,
  setRoomAiGenerating,
  sendMeetInvite,
  type StudyMeetRoom,
  type RoomParticipant,
} from "@/lib/firebase/meet";

export default function StudyMeetPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlRoomId = searchParams.get("roomId");

  /* ----------------------------------------------------------------
     State
  ---------------------------------------------------------------- */
  const [currentRoom, setCurrentRoom] = useState<StudyMeetRoom | null>(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Creation / Joining Modal State
  const [newRoomTitle, setNewRoomTitle] = useState("");
  const [joinRoomIdInput, setJoinRoomIdInput] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  // Host Action Modals State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showImportPlanModal, setShowImportPlanModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Friends & Study Plans for Modals
  const [friendsList, setFriendsList] = useState<FriendRelationship[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const [userPlans, setUserPlans] = useState<StudyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [aiTopicPrompt, setAiTopicPrompt] = useState("");

  // Editor State
  const [localDocText, setLocalDocText] = useState("");
  const [isEditorView, setIsEditorView] = useState(true); // true = edit, false = preview
  const [copiedCode, setCopiedCode] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isHost = user && currentRoom && user.uid === currentRoom.hostId;

  /* ----------------------------------------------------------------
     1. Room Subscription & Sync
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (!urlRoomId || !user) {
      setCurrentRoom(null);
      return;
    }

    setRoomLoading(true);

    // First attempt to join room if user is not yet in participants
    joinStudyMeetRoom(urlRoomId, user)
      .catch((err) => {
        console.warn("Auto-join note:", err.message);
      })
      .finally(() => {
        setRoomLoading(false);
      });

    // Real-time listener for room changes
    const unsubscribe = subscribeToStudyMeetRoom(urlRoomId, (roomData) => {
      if (!roomData) {
        setErrorMsg("Ruang Study Meet tidak ditemukan.");
        setCurrentRoom(null);
        setRoomLoading(false);
        return;
      }

      setCurrentRoom(roomData);
      setLocalDocText(roomData.sharedDocument);
      setRoomLoading(false);
    });

    return () => unsubscribe();
  }, [urlRoomId, user]);

  /* ----------------------------------------------------------------
     2. Fetch Friends & Plans for Host Actions
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
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-cyan-400">
        <Loader2 size={32} className="animate-spin" />
        <p className="text-xs font-bold text-slate-300">Menyiapkan Study Meet...</p>
      </div>
    );
  }

  /* ----------------------------------------------------------------
     3. LOBBY VIEW (No Active Room Selected)
  ---------------------------------------------------------------- */
  if (!urlRoomId || !currentRoom) {
    return (
      <section className="flex flex-col gap-8 w-full max-w-5xl mx-auto px-4 py-8">
        {/* Header Hero Banner */}
        <m.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border"
          style={{
            background:
              "linear-gradient(135deg, rgba(6,182,212,0.14) 0%, rgba(3,11,34,0.92) 100%)",
            borderColor: "rgba(56,189,248,0.3)",
            boxShadow: "0 20px 60px rgba(6,182,212,0.15)",
          }}
        >
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                KOLABORASI REAL-TIME
              </span>
              <span className="text-[10px] font-extrabold text-amber-300 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30">
                ✨ abang ganteng AI Supported
              </span>
            </div>

            <h1
              className="text-2xl sm:text-3xl font-black text-slate-50 leading-tight"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Study Meet — Belajar & Diskusikan Materi Bersama
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Buat ruang belajar live, undang teman-teman kamu, salin materi dari Study Plan, dan minta bantuan penjelasan langsung dari **abang ganteng** secara real-time!
            </p>
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-xl shrink-0">
            <Video size={40} className="animate-pulse" />
          </div>
        </m.div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold text-center animate-fadeIn">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Action Cards: Create Room vs Join Room */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Create Room */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-6 border bg-slate-900/70 border-cyan-500/30 backdrop-blur-xl shadow-xl hover:border-cyan-500/60 transition-all"
          >
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                <Plus size={24} />
              </div>
              <h2
                className="text-xl font-black text-slate-100"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Buat Ruang Meet Baru
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Jadilah Host, undang teman-teman kamu, impor materi, dan kontrol penjelasan dari abang ganteng.
              </p>
            </div>

            <form onSubmit={handleCreateRoom} className="flex flex-col gap-3">
              <input
                type="text"
                value={newRoomTitle}
                onChange={(e) => setNewRoomTitle(e.target.value)}
                placeholder="Judul Ruang Meet (misal: Review Kalkulus BAB 3)"
                className="w-full text-xs px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-slate-100 outline-none focus:border-cyan-400 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={isCreatingRoom}
                className="skeuo-btn py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(6,182,212,0.25) 0%, rgba(6,182,212,0.08) 100%)",
                  border: "1px solid rgba(56,189,248,0.4)",
                  color: "#38bdf8",
                }}
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
              </button>
            </form>
          </m.div>

          {/* Card 2: Join Room */}
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-6 border bg-slate-900/70 border-slate-800 backdrop-blur-xl shadow-xl hover:border-slate-700 transition-all"
          >
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Users size={24} />
              </div>
              <h2
                className="text-xl font-black text-slate-100"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Gabung dengan Kode Room
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Punya kode/ID ruang dari teman? Masukkan kode di bawah untuk gabung dan belajar bersama secara real-time.
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="flex flex-col gap-3">
              <input
                type="text"
                value={joinRoomIdInput}
                onChange={(e) => setJoinRoomIdInput(e.target.value)}
                placeholder="Masukkan Kode Room ID"
                className="w-full text-xs px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-700/80 text-slate-100 outline-none focus:border-indigo-400 transition-colors font-mono"
                required
              />
              <button
                type="submit"
                disabled={isJoiningRoom || !joinRoomIdInput.trim()}
                className="skeuo-btn py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 bg-slate-900 border border-slate-700 text-slate-200 hover:text-white"
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
              </button>
            </form>
          </m.div>
        </div>
      </section>
    );
  }

  /* ----------------------------------------------------------------
     4. LIVE STUDY MEET WORKSPACE VIEW (Active Room)
  ---------------------------------------------------------------- */
  return (
    <section className="flex flex-col gap-5 w-full max-w-6xl mx-auto px-4 py-6">
      {/* Room Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/meet")}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Kembali ke Menu Meet"
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-lg font-black text-slate-50 leading-tight"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                {currentRoom.title}
              </h1>
              {isHost && (
                <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-[10px] font-black text-amber-300 flex items-center gap-1">
                  <Crown size={11} /> HOST
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Host: <strong className="text-cyan-300">{currentRoom.hostName}</strong></span>
              <span>•</span>
              <button
                type="button"
                onClick={copyRoomCode}
                className="hover:text-cyan-300 flex items-center gap-1 font-mono text-[10px] cursor-pointer transition-colors"
                title="Klik untuk menyalin kode room"
              >
                ID: {currentRoom.roomId.slice(0, 10)}... {copiedCode ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
            </p>
          </div>
        </div>

        {/* Participants Avatars & Invite Quick Action */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center -space-x-2 overflow-hidden">
            {currentRoom.participants.map((p) => (
              <div
                key={p.uid}
                className="w-8 h-8 rounded-full border-2 border-slate-900 bg-cyan-950 text-cyan-300 font-extrabold text-[11px] flex items-center justify-center shadow-md relative group"
                title={`${p.displayName} (${p.role})`}
              >
                {p.displayName.charAt(0).toUpperCase()}
                {p.role === "host" && (
                  <Crown size={10} className="absolute -top-1 -right-1 text-amber-400 fill-amber-400" />
                )}
              </div>
            ))}
          </div>

          <span className="text-[11px] text-slate-400 font-bold">
            {currentRoom.participants.length} Anggota
          </span>
        </div>
      </div>

      {/* Host Action Toolbar & AI Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          {/* Host Action 1: Invite Friends */}
          {isHost && (
            <button
              type="button"
              id="meet-invite-friends-btn"
              onClick={() => setShowInviteModal(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <UserPlus size={14} className="text-cyan-400" /> Undang Teman ➕
            </button>
          )}

          {/* Host Action 2: Import Study Plan */}
          {isHost && (
            <button
              type="button"
              id="meet-import-plan-btn"
              onClick={() => setShowImportPlanModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <BookOpen size={14} className="text-indigo-400" /> Impor dari Study Plan 📚
            </button>
          )}

          {/* Host Action 3: Exclusive "Minta Penjelasan Abang Ganteng 💡" */}
          {isHost && (
            <button
              type="button"
              id="meet-ask-ai-btn"
              onClick={() => setShowAiModal(true)}
              disabled={currentRoom.isAiGenerating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {currentRoom.isAiGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin text-slate-950" /> abang ganteng Menjelaskan...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="fill-slate-950" /> Minta Penjelasan Abang Ganteng 💡
                </>
              )}
            </button>
          )}

          {!isHost && (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <Shield size={12} className="text-amber-400" /> Mode Participant (Realtime Sync View)
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
            className="p-3.5 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 shadow-lg backdrop-blur-md animate-pulse"
          >
            <Loader2 size={16} className="animate-spin text-amber-400" />
            <span>abang ganteng sedang meracik penjelasan terbaik untuk room ini... Papan akan terupdate otomatis!</span>
          </m.div>
        )}
      </AnimatePresence>

      {/* Main Shared Workspace Editor Board */}
      <div
        className="rounded-3xl p-5 sm:p-6 flex flex-col gap-4 border relative min-h-[420px]"
        style={{
          background:
            "linear-gradient(135deg, rgba(3,11,34,0.92) 0%, rgba(6,182,212,0.04) 100%)",
          borderColor: "rgba(255,255,255,0.08)",
          boxShadow: "0 15px 45px rgba(0,0,0,0.5)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-cyan-400" />
            <span className="text-xs font-extrabold tracking-wider uppercase text-cyan-300">
              Papan Catatan Real-Time Room
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {isHost ? "Host can edit directly" : "Synced via Firestore onSnapshot"}
          </span>
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
            style={{ fontFamily: "var(--font-inter)" }}
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

      {/* MODAL 1: Host Invite Friends Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="max-w-md w-full rounded-3xl p-6 flex flex-col gap-4 border bg-slate-900/95 border-cyan-500/40 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                <div className="flex items-center gap-2 text-cyan-300 font-black text-sm">
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
                        <button
                          type="button"
                          disabled={isInvited}
                          onClick={() => handleSendInviteToFriend(friend)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {isInvited ? "Terkirim ✉️" : "Undang 📩"}
                        </button>
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
              className="max-w-md w-full rounded-3xl p-6 flex flex-col gap-4 border bg-slate-900/95 border-indigo-500/40 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                <div className="flex items-center gap-2 text-indigo-300 font-black text-sm">
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
                  <button
                    type="button"
                    disabled={!selectedPlanId}
                    onClick={handleImportSelectedPlan}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    Impor ke Papan 📚
                  </button>
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
              className="max-w-md w-full rounded-3xl p-6 flex flex-col gap-4 border bg-slate-900/95 border-amber-500/40 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
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
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tulis topik atau pertanyaan materi yang ingin dijelaskan oleh <strong>abang ganteng</strong>. Penjelasan akan langsung tampil di papan catatan room untuk semua peserta!
                </p>

                <textarea
                  value={aiTopicPrompt}
                  onChange={(e) => setAiTopicPrompt(e.target.value)}
                  placeholder="Contoh: Jelaskan konsep Backpropagation pada Neural Network dan analogi lapangannya!"
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 outline-none focus:border-amber-400 transition-colors resize-none"
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
                  <button
                    type="submit"
                    disabled={!aiTopicPrompt.trim()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Send size={13} /> Buat Penjelasan ✨
                  </button>
                </div>
              </form>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
