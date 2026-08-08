# Graph Report - C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src  (2026-08-08)

## Corpus Check
- 37 files · ~85,533 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 405 nodes · 439 edges · 23 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]

## God Nodes (most connected - your core abstractions)
1. `POST()` - 13 edges
2. `parseFileBuffer()` - 5 edges
3. `router` - 4 edges
4. `RESPONSE_SCHEMA` - 4 edges
5. `EASE` - 4 edges
6. `handleAttack()` - 4 edges
7. `useAuth()` - 4 edges
8. `saveStudyPlan()` - 4 edges
9. `getStudyPlans()` - 4 edges
10. `sendFriendRequest()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `parseFileBuffer()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\utils\file-parser.ts
- `POST()` --calls--> `buildFallbackExplanation()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\ai\study-materials.ts
- `POST()` --calls--> `buildFallbackStudyPlan()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\ai\study-materials.ts
- `POST()` --calls--> `buildFallbackExplanation()`  [EXTRACTED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\study-materials\parse\route.ts → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\meet\explain\route.ts
- `handleToggleTask` --calls--> `updateStudyPlanTasks()`  [INFERRED]
  C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\dashboard\plan\page.tsx → C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\firebase\db.ts

## Communities

### Community 0 - "Community 0"

Cohesion: 0.03
Nodes (63): appendAiExplanationToRoom(), clearSharedBoard(), createStudyMeetRoom(), deleteStudyMeetRoom(), importStudyPlanToRoom(), joinStudyMeetRoom(), parseRoomDoc(), sendMeetChatMessage() (+55 more)

### Community 1 - "Community 1"

Cohesion: 0.04
Nodes (51): [activeTaunt, setActiveTaunt], [animPhase, setAnimPhase], [attackText, setAttackText], [battleLog, setBattleLog], BOSS_MAX_HP, [bossHp, setBossHp], [combo, setCombo], [currentQuestion, setCurrentQuestion] (+43 more)

### Community 2 - "Community 2"

Cohesion: 0.05
Nodes (37): [aiInsights, setAiInsights], allPendingTasks, canProceedStep2, canProceedStep3, canProceedStep4, containerVariants, [customMajor, setCustomMajor], dateString (+29 more)

### Community 3 - "Community 3"

Cohesion: 0.06
Nodes (29): removeFriendRelationship(), sendMatchChallenge(), [activeTab, setActiveTab], [addEmail, setAddEmail], [addLoading, setAddLoading], [addStatus, setAddStatus], [challengeFriend, setChallengeFriend], [challengeId, setChallengeId] (+21 more)

### Community 4 - "Community 4"

Cohesion: 0.07
Nodes (20): accent, [actionLoading, setActionLoading], avgPct, cardVariants, circ, [collapsed, setCollapsed], completedCount, dash (+12 more)

### Community 5 - "Community 5"

Cohesion: 0.08
Nodes (23): [days, setDays], [dragActive, setDragActive], EASE, [error, setError], [explainResult, setExplainResult], fileInputRef, handleDrag, handleDrop (+15 more)

### Community 6 - "Community 6"

Cohesion: 0.09
Nodes (12): async(), handleAttack(), handleKeyDown(), acceptFriendRequest(), commitDuelEvaluation(), findUserByEmail(), saveUserProfile(), sendDuelTaunt() (+4 more)

### Community 7 - "Community 7"

Cohesion: 0.13
Nodes (15): BASE_SYSTEM_INSTRUCTION, buildFallback(), buildFallbackExplanation(), buildFallbackResponse(), FALLBACK_QUESTIONS, offsetDate(), POST(), RESPONSE_SCHEMA (+7 more)

### Community 8 - "Community 8"

Cohesion: 0.12
Nodes (15): containerRef, coreFeatures, EASE_SMOOTH, fadeUp, heroOpacity, parallaxY, prefersReduced, processSteps (+7 more)

### Community 9 - "Community 9"

Cohesion: 0.15
Nodes (8): AuthContext, googleProvider, useAuth(), ChallengeNotificationToast(), active, DashboardSidebar(), navItems, MeetInviteNotificationToast()

### Community 10 - "Community 10"

Cohesion: 0.19
Nodes (9): fetchPlans(), getStudyPlans(), sanitizeStudyPlan(), saveStudyPlan(), updateStudyPlanTasks(), userPlansCollection(), loadTopics(), handleSaveToFirestore() (+1 more)

### Community 11 - "Community 11"

Cohesion: 0.17
Nodes (10): containerRef, [isHovered, setIsHovered], isIcon, mount, parent, rippleIdRef, [ripples, setRipples], SHADER_COLOR_BACK (+2 more)

### Community 12 - "Community 12"
_Unable to determine domain due to missing code entities._
Cohesion: 0.25
Nodes (4): inter, metadata, outfit, viewport

### Community 13 - "Community 13"
_Unable to determine domain due to missing code entities._
Cohesion: 0.29
Nodes (5): isActive, navLinks, pathname, [signingIn, setSigningIn], { user, loading, signInWithGoogle }

### Community 14 - "Community 14"
_Unable to determine domain due to missing code entities._
Cohesion: 0.33
Nodes (5): containerVariants, isMountedRef, router, spinnerVariants, { user, loading }

### Community 15 - "Community 15"
_Unable to determine domain due to missing code entities._
Cohesion: 0.67
Nodes (5): extractPrintableStrings(), extractTextFromDocx(), extractTextFromPdf(), parseFileBuffer(), sanitizeText()

### Community 16 - "Community 16"
_Unable to determine domain due to missing code entities._
Cohesion: 0.4
Nodes (4): app, auth, db, firebaseConfig

### Community 17 - "Community 17"
_Unable to determine domain due to missing code entities._
Cohesion: 0.5
Nodes (1): metadata

### Community 18 - "Community 18"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (1): orbs

### Community 20 - "Community 20"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **245 isolated node(s):** `inter`, `outfit`, `viewport`, `EASE_SMOOTH`, `fadeUp` (+240 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 18`** (2 nodes): `loading.tsx`, `SkeletonPulse()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `orbs`, `BackgroundCanvas.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `cn.ts`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `loading.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `Providers.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.