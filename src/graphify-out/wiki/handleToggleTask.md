# handleToggleTask

> God node · 5 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\dashboard\plan\page.tsx](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/app/dashboard/plan/page.tsx#L573)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as handleToggleTask
    participant P1 as recordDailyActivity()
    participant P2 as data
    participant P3 as joinStudyMeetRoom()
    participant P4 as findUserByEmail()
    participant P5 as surrenderMatch()
    participant P6 as submitDuelAnswer()
    participant P7 as commitDuelEvaluation()
    participant P8 as leaveStudyMeetRoom()
    participant P9 as getUserStats()
    participant P10 as createOrGetMultiplayerMatch()
    participant P11 as setPlayerReadyInMatch()
    participant P12 as getMatchStatus()
    participant P13 as updateMatchHeartbeat()
    participant P14 as submitMultiplayerTurn()
    participant P15 as updateParticipantMicState()
    participant P16 as getLocalDateString()
    participant P17 as getYesterdayDateString()
    participant P18 as addStudyMinutes()
    participant P19 as toggleTaskCompletion()
    participant P20 as updateStudyPlanTasks()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P2->>+ P5: calls
    P5-->>- P2: return
    P2->>+ P6: calls
    P6-->>- P2: return
    P2->>+ P7: calls
    P7-->>- P2: return
    P2->>+ P8: calls
    P8-->>- P2: return
    P2->>+ P9: calls
    P9-->>- P2: return
    P2->>+ P10: calls
    P10-->>- P2: return
    P2->>+ P11: calls
    P11-->>- P2: return
    P2->>+ P12: calls
    P12-->>- P2: return
    P2->>+ P13: calls
    P13-->>- P2: return
    P2->>+ P14: calls
    P14-->>- P2: return
    P2->>+ P15: calls
    P15-->>- P2: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P16: calls
    P16-->>- P1: return
    P1->>+ P17: calls
    P17-->>- P1: return
    P1->>+ P18: calls
    P18-->>- P1: return
    P0->>+ P19: calls
    P19-->>- P0: return
    P0->>+ P20: calls
    P20-->>- P0: return
```

## Connections by Relation

### calls
- [[recordDailyActivity()]] `INFERRED`
- [[toggleTaskCompletion()]] `INFERRED`
- [[updateStudyPlanTasks()]] `INFERRED`

### contains
- [[page.tsx]] `EXTRACTED`
- [[page.tsx]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*