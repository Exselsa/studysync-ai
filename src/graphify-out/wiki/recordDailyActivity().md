# recordDailyActivity()

> God node · 5 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\firebase\userStats.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/lib/firebase/userStats.ts#L69)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as recordDailyActivity()
    participant P1 as handleToggleTask
    participant P2 as toggleTaskCompletion()
    participant P3 as addStudyMinutes()
    participant P4 as updateStudyPlanTasks()
    participant P5 as normalizeStudyPlanData()
    participant P6 as getLocalDateString()
    participant P7 as getYesterdayDateString()
    participant P8 as getUserStats()
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
    P1->>+ P4: calls
    P4-->>- P1: return
    P4->>+ P5: calls
    P5-->>- P4: return
    P4->>+ P1: calls
    P1-->>- P4: return
    P0->>+ P6: calls
    P6-->>- P0: return
    P6->>+ P0: calls
    P0-->>- P6: return
    P6->>+ P7: calls
    P7-->>- P6: return
    P7->>+ P0: calls
    P0-->>- P7: return
    P7->>+ P6: calls
    P6-->>- P7: return
    P6->>+ P8: calls
    P8-->>- P6: return
    P8->>+ P6: calls
    P6-->>- P8: return
    P0->>+ P7: calls
    P7-->>- P0: return
    P0->>+ P3: calls
    P3-->>- P0: return
```

## Connections by Relation

### calls
- [[handleToggleTask]] `INFERRED`
- [[getLocalDateString()]] `EXTRACTED`
- [[getYesterdayDateString()]] `EXTRACTED`
- [[addStudyMinutes()]] `EXTRACTED`

### contains
- [[userStats.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*