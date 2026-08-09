# recordDailyActivity()

> God node · 6 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\firebase\userStats.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/lib/firebase/userStats.ts#L69)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as recordDailyActivity()
    participant P1 as data
    participant P2 as joinStudyMeetRoom()
    participant P3 as parseRoomDoc()
    participant P4 as handleJoinRoom()
    participant P5 as findUserByEmail()
    participant P6 as sendFriendRequest()
    participant P7 as surrenderMatch()
    participant P8 as async()
    participant P9 as submitDuelAnswer()
    participant P10 as handleAttack
    participant P11 as commitDuelEvaluation()
    participant P12 as leaveStudyMeetRoom()
    participant P13 as getUserStats()
    participant P14 as createOrGetMultiplayerMatch()
    participant P15 as setPlayerReadyInMatch()
    participant P16 as getMatchStatus()
    participant P17 as updateMatchHeartbeat()
    participant P18 as submitMultiplayerTurn()
    participant P19 as updateParticipantMicState()
    participant P20 as handleToggleTask
    participant P21 as getLocalDateString()
    participant P22 as getYesterdayDateString()
    participant P23 as addStudyMinutes()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P1->>+ P5: calls
    P5-->>- P1: return
    P5->>+ P1: calls
    P1-->>- P5: return
    P5->>+ P6: calls
    P6-->>- P5: return
    P1->>+ P7: calls
    P7-->>- P1: return
    P7->>+ P1: calls
    P1-->>- P7: return
    P7->>+ P8: calls
    P8-->>- P7: return
    P1->>+ P9: calls
    P9-->>- P1: return
    P9->>+ P1: calls
    P1-->>- P9: return
    P9->>+ P10: calls
    P10-->>- P9: return
    P1->>+ P11: calls
    P11-->>- P1: return
    P1->>+ P12: calls
    P12-->>- P1: return
    P1->>+ P13: calls
    P13-->>- P1: return
    P1->>+ P14: calls
    P14-->>- P1: return
    P1->>+ P15: calls
    P15-->>- P1: return
    P1->>+ P16: calls
    P16-->>- P1: return
    P1->>+ P17: calls
    P17-->>- P1: return
    P1->>+ P18: calls
    P18-->>- P1: return
    P1->>+ P19: calls
    P19-->>- P1: return
    P0->>+ P20: calls
    P20-->>- P0: return
    P0->>+ P21: calls
    P21-->>- P0: return
    P0->>+ P22: calls
    P22-->>- P0: return
    P0->>+ P23: calls
    P23-->>- P0: return
```

## Connections by Relation

### calls
- [[data]] `INFERRED`
- [[handleToggleTask]] `INFERRED`
- [[getLocalDateString()]] `EXTRACTED`
- [[getYesterdayDateString()]] `EXTRACTED`
- [[addStudyMinutes()]] `EXTRACTED`

### contains
- [[userStats.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*