# handleToggleTask

> God node · 5 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\dashboard\plan\page.tsx](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/app/dashboard/plan/page.tsx#L762)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as handleToggleTask
    participant P1 as recordDailyActivity()
    participant P2 as getLocalDateString()
    participant P3 as getYesterdayDateString()
    participant P4 as getUserStats()
    participant P5 as addStudyMinutes()
    participant P6 as toggleTaskCompletion()
    participant P7 as updateStudyPlanTasks()
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
    P1->>+ P3: calls
    P3-->>- P1: return
    P3->>+ P1: calls
    P1-->>- P3: return
    P3->>+ P2: calls
    P2-->>- P3: return
    P1->>+ P5: calls
    P5-->>- P1: return
    P5->>+ P1: calls
    P1-->>- P5: return
    P5->>+ P6: calls
    P6-->>- P5: return
    P0->>+ P6: calls
    P6-->>- P0: return
    P6->>+ P0: calls
    P0-->>- P6: return
    P6->>+ P5: calls
    P5-->>- P6: return
    P0->>+ P7: calls
    P7-->>- P0: return
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