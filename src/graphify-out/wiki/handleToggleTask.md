# handleToggleTask

> God node · 4 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\dashboard\plan\page.tsx](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/app/dashboard/plan/page.tsx#L762)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as handleToggleTask
    participant P1 as updateStudyPlanTasks()
    participant P2 as normalizeStudyPlanData()
    participant P3 as POST()
    participant P4 as saveStudyPlan()
    participant P5 as generateTaskId()
    participant P6 as toggleTaskCompletion()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P3: calls
    P3-->>- P2: return
    P2->>+ P4: calls
    P4-->>- P2: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P2->>+ P5: calls
    P5-->>- P2: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P0->>+ P6: calls
    P6-->>- P0: return
    P6->>+ P0: calls
    P0-->>- P6: return
```

## Connections by Relation

### calls
- [[updateStudyPlanTasks()]] `INFERRED`
- [[toggleTaskCompletion()]] `INFERRED`

### contains
- [[page.tsx]] `EXTRACTED`
- [[page.tsx]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*