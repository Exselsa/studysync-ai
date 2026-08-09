"use client";

import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Swords,
  Check,
  X,
  Search,
  Loader2,
  BookOpen,
  Sparkles,
  Shield,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { cn } from "@/lib/cn";
import { getStudyPlans } from "@/lib/firebase/db";
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendRelationship,
  subscribeToFriends,
  subscribeToPendingFriendRequests,
  sendMatchChallenge,
  subscribeToChallengeStatus,
  type FriendRelationship,
} from "@/lib/firebase/friends";
import { useRouter } from "next/navigation";

const DEFAULT_CS_TOPICS = [
  "Binary Search Trees",
  "Gradient Descent in ML",
  "HTTP REST APIs",
  "Recursion & Call Stack",
  "Neural Networks & Backpropagation",
  "Database Indexing & B-Trees",
  "Event Loop in JavaScript",
  "Docker Containers vs VMs",
  "Big O Time Complexity",
  "Garbage Collection & Memory",
];

/* ---------------------------------------------------------------
   Topic Picker Modal
   --------------------------------------------------------------- */
interface TopicPickerModalProps {
  friend: FriendRelationship;
  currentUserId: string;
  currentUserName: string;
  onClose: () => void;
}

function TopicPickerModal({
  friend,
  currentUserId,
  currentUserName,
  onClose,
}: TopicPickerModalProps) {
  const router = useRouter();
  const [studyPlanTopics, setStudyPlanTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [waitingForFriend, setWaitingForFriend] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetFriendId =
    friend.senderId === currentUserId ? friend.receiverId : friend.senderId;
  const targetFriendName =
    friend.senderId === currentUserId ? friend.receiverName : friend.senderName;

  // Load study plan topics
  useEffect(() => {
    async function loadTopics() {
      try {
        const plans = await getStudyPlans(currentUserId);
        const extracted: string[] = [];
        plans.forEach((p) => {
          if (p.subject) extracted.push(p.subject);
          p.tasks?.forEach((t) => {
            if (t.title) extracted.push(t.title);
          });
        });
        const unique = Array.from(new Set(extracted));
        setStudyPlanTopics(unique);
        if (unique.length > 0) {
          setSelectedTopic(unique[0]);
        } else {
          setSelectedTopic(DEFAULT_CS_TOPICS[0]);
        }
      } catch (err) {
        console.warn("Error loading study plan topics:", err);
        setSelectedTopic(DEFAULT_CS_TOPICS[0]);
      }
    }
    loadTopics();
  }, [currentUserId]);

  // Subscribe to sent challenge status
  useEffect(() => {
    if (!challengeId) return;
    const unsub = subscribeToChallengeStatus(challengeId, (challenge) => {
      if (!challenge) return;
      if (challenge.status === "accepted") {
        // Auto-close / unmount challenge modal
        onClose();
        // Redirect to game page with matchId & topic
        router.push(
          `/dashboard/game?topic=${encodeURIComponent(
            challenge.topic
          )}&matchId=${challenge.id}`
        );
      } else if (challenge.status === "declined") {
        setError(`${targetFriendName} declined the challenge.`);
        setWaitingForFriend(false);
      }
    });
    return unsub;
  }, [challengeId, router, targetFriendName, onClose]);

  async function handleSendChallenge() {
    const finalTopic = (customTopic.trim() || selectedTopic).trim();
    if (!finalTopic || loading) return;

    setLoading(true);
    setError(null);

    try {
      await sendMatchChallenge(
        currentUserId,
        currentUserName,
        targetFriendId,
        targetFriendName,
        finalTopic
      );
      onClose();
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { message: "Tantangan telah dikirim!", type: "success" },
          })
        );
      }
    } catch (err) {
      console.error("Failed to send challenge:", err);
      setError(
        err instanceof Error ? err.message : "Failed to send match challenge."
      );
      setLoading(false);
    }
  }

  return (
    <m.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(2, 7, 26, 0.85)",
        backdropFilter: "blur(12px)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <m.div
        className="w-full max-w-lg rounded-3xl p-6 sm:p-8 flex flex-col gap-5 text-slate-100"
        style={{
          background:
            "linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(3,11,34,0.96) 100%)",
          border: "1px solid rgba(56,189,248,0.3)",
          boxShadow: "0 25px 70px rgba(0,0,0,0.6)",
        }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
              <Swords size={18} className="text-cyan-300" />
            </div>
            <div>
              <h3
                className="text-lg font-black tracking-tight"
                style={{ fontFamily: "var(--font-outfit)" }}
              >
                Tantang {targetFriendName}
              </h3>
              <p className="text-[11px] text-slate-400">
                Feynman Duel — Pilih topik duel kamu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {waitingForFriend ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
                <Swords size={28} className="text-cyan-400 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] text-slate-950 font-bold">
                <Clock size={12} className="animate-spin" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-base">
                Tantangan Terkirim!
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Menunggu <span className="text-cyan-300 font-semibold">{targetFriendName}</span> menerima duel untuk topik:
              </p>
              <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-semibold text-xs">
                {customTopic.trim() || selectedTopic}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Active Study Plan Topics */}
            {studyPlanTopics.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <BookOpen size={13} /> Dari Study Plan Kamu
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {studyPlanTopics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        setSelectedTopic(topic);
                        setCustomTopic("");
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border ${
                        selectedTopic === topic && !customTopic
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md"
                          : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Core CS Topics */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Sparkles size={13} /> Topik Teknologi Standar
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {DEFAULT_CS_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setSelectedTopic(topic);
                      setCustomTopic("");
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border ${
                      selectedTopic === topic && !customTopic
                        ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-md"
                        : "bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Topic Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Atau Tulis Topik Kustom
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g. Quantum Computing, Backpropagation..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSendChallenge}
                disabled={loading}
                className="skeuo-btn text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Mengirim...
                  </>
                ) : (
                  <>
                    <Swords size={14} /> Kirim Tantangan ⚔️
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </m.div>
    </m.div>
  );
}

/* ---------------------------------------------------------------
   Main FriendsPanel Drawer / Component
   --------------------------------------------------------------- */
export interface FriendsPanelProps {
  isCollapsed?: boolean;
}

export default function FriendsPanel({ isCollapsed }: FriendsPanelProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"friends" | "pending" | "add">(
    "friends"
  );

  const [friends, setFriends] = useState<FriendRelationship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRelationship[]>(
    []
  );

  const [addEmail, setAddEmail] = useState("");
  const [addStatus, setAddStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  const [challengeFriend, setChallengeFriend] =
    useState<FriendRelationship | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Listen for custom toast notifications
  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEv = e as CustomEvent<{ message: string }>;
      if (customEv.detail?.message) {
        setToastMessage(customEv.detail.message);
        setTimeout(() => setToastMessage(null), 4000);
      }
    };
    window.addEventListener("show-toast", handleToast);
    return () => window.removeEventListener("show-toast", handleToast);
  }, []);

  // Subscribe to friends & pending requests
  useEffect(() => {
    if (!user) return;

    const unsubFriends = subscribeToFriends(user.uid, (list) => {
      setFriends(list);
    });

    const unsubPending = subscribeToPendingFriendRequests(user.uid, (list) => {
      setPendingRequests(list);
    });

    const handleCloseModals = () => {
      setChallengeFriend(null);
      setIsOpen(false);
    };

    window.addEventListener("close-challenge-modals", handleCloseModals);

    return () => {
      unsubFriends();
      unsubPending();
      window.removeEventListener("close-challenge-modals", handleCloseModals);
    };
  }, [user]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !addEmail.trim() || addLoading) return;

    setAddLoading(true);
    setAddStatus(null);

    try {
      await sendFriendRequest(user, addEmail.trim());
      setAddStatus({
        type: "success",
        msg: `Friend request sent to ${addEmail.trim()}!`,
      });
      setAddEmail("");
    } catch (err) {
      setAddStatus({
        type: "error",
        msg: err instanceof Error ? err.message : "Failed to send request.",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleAcceptRequest = async (id: string) => {
    try {
      await acceptFriendRequest(id);
    } catch (err) {
      console.error("Accept friend error:", err);
    }
  };

  const handleRemoveFriend = async (id: string) => {
    try {
      await removeFriendRelationship(id);
    } catch (err) {
      console.error("Remove friend error:", err);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <m.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-cyan-950/90 border border-cyan-400/50 text-cyan-200 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            <Sparkles size={16} className="text-cyan-300 animate-pulse" />
            <span>{toastMessage}</span>
          </m.div>
        )}
      </AnimatePresence>

      {/* Trigger Button in Sidebar/Header */}
      <button
        type="button"
        id="friends-panel-trigger"
        onClick={() => setIsOpen(true)}
        title={isCollapsed ? "Friends" : undefined}
        className={cn(
          "relative flex items-center gap-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all shadow-sm group cursor-pointer",
          isCollapsed ? "w-10 h-10 p-0 justify-center mx-auto" : "w-full px-3 py-2"
        )}
      >
        <Users size={15} className="text-cyan-400 group-hover:scale-110 transition-transform flex-shrink-0" />
        {!isCollapsed && <span>Friends</span>}

        {/* Badge counter for pending requests */}
        {pendingRequests.length > 0 && (
          <span
            className={cn(
              "rounded-full font-black bg-rose-500 text-white animate-pulse flex items-center justify-center",
              isCollapsed ? "absolute -top-1 -right-1 w-4 h-4 text-[9px]" : "px-1.5 py-0.5 text-[10px]"
            )}
          >
            {pendingRequests.length}
          </span>
        )}
      </button>

      {/* Slide-over Drawer & Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay */}
            <m.div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-30 cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <m.div
              className="fixed top-16 right-0 w-full max-w-md h-[calc(100vh-4rem)] bg-slate-950 border-l border-slate-800 p-6 flex flex-col gap-6 shadow-2xl z-40 overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                    <Users size={18} className="text-cyan-300" />
                  </div>
                  <div>
                    <h2
                      className="text-lg font-black text-slate-100"
                      style={{ fontFamily: "var(--font-outfit)" }}
                    >
                      StudySync Friends
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Connect & duel with fellow scholars
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("friends")}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                    activeTab === "friends"
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Teman ({friends.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("pending")}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all relative ${
                    activeTab === "pending"
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Pending ({pendingRequests.length})
                  {pendingRequests.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-bold">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("add")}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 ${
                    activeTab === "add"
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-500/30 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <UserPlus size={13} /> Tambah
                </button>
              </div>

              {/* Tab 1: Friends List */}
              {activeTab === "friends" && (
                <div className="flex flex-col gap-3 flex-1">
                  {friends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 gap-2">
                      <Users size={32} className="opacity-40" />
                      <p className="text-xs">No friends added yet.</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("add")}
                        className="text-xs text-cyan-400 hover:underline font-semibold"
                      >
                        Add your first friend
                      </button>
                    </div>
                  ) : (
                    friends.map((rel) => {
                      const friendName =
                        rel.senderId === user.uid
                          ? rel.receiverName
                          : rel.senderName;
                      const friendEmail =
                        rel.senderId === user.uid
                          ? rel.receiverEmail
                          : rel.senderEmail;

                      return (
                        <div
                          key={rel.id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-300">
                              {friendName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-100 truncate">
                                {friendName}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate">
                                {friendEmail}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setChallengeFriend(rel)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600/80 to-rose-500/80 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                            >
                              <Swords size={13} /> Challenge ⚔️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFriend(rel.id)}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="Remove friend"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2: Pending Requests */}
              {activeTab === "pending" && (
                <div className="flex flex-col gap-3 flex-1">
                  {pendingRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 gap-2">
                      <Clock size={32} className="opacity-40" />
                      <p className="text-xs">No pending friend requests.</p>
                    </div>
                  ) : (
                    pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-950 border border-amber-500/40 flex items-center justify-center text-xs font-bold text-amber-300">
                            {req.senderName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-100 truncate">
                              {req.senderName}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {req.senderEmail}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAcceptRequest(req.id)}
                            className="p-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-all"
                            title="Accept request"
                          >
                            <Check size={14} /> Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFriend(req.id)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 transition-colors"
                            title="Decline request"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Add Friend */}
              {activeTab === "add" && (
                <form
                  onSubmit={handleAddFriend}
                  className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <UserPlus size={14} className="text-cyan-400" /> Kirim Permintaan Pertemanan
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Masukkan alamat email terdaftar dari teman kamu.
                    </p>
                  </div>

                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="email"
                      required
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      placeholder="email.teman@example.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  {addStatus && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        addStatus.type === "success"
                          ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-300"
                          : "bg-rose-950/60 border border-rose-500/30 text-rose-300"
                      }`}
                    >
                      {addStatus.type === "success" ? (
                        <CheckCircle2 size={14} className="flex-shrink-0" />
                      ) : (
                        <X size={14} className="flex-shrink-0" />
                      )}
                      <span>{addStatus.msg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={addLoading || !addEmail.trim()}
                    className="skeuo-btn text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {addLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Mengirim...
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} /> Kirim Permintaan
                      </>
                    )}
                  </button>
                </form>
              )}
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* Topic Picker Modal */}
      <AnimatePresence>
        {challengeFriend && (
          <TopicPickerModal
            friend={challengeFriend}
            currentUserId={user.uid}
            currentUserName={user.displayName || user.email || "Scholar"}
            onClose={() => setChallengeFriend(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
