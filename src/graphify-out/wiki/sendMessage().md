# sendMessage()

> God node · 4 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\dashboard\tutor\page.tsx](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/app/dashboard/tutor/page.tsx#L387)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as sendMessage()
    participant P1 as saveStudyPlan()
    participant P2 as userPlansCollection()
    participant P3 as getStudyPlans()
    participant P4 as handleSaveToFirestore()
    participant P5 as pushToast
    participant P6 as handleKeyDown()
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
    P4->>+ P1: calls
    P1-->>- P4: return
    P0->>+ P5: calls
    P5-->>- P0: return
    P5->>+ P0: calls
    P0-->>- P5: return
    P0->>+ P6: calls
    P6-->>- P0: return
    P6->>+ P0: calls
    P0-->>- P6: return
```

## Connections by Relation

### calls
- [[saveStudyPlan()]] `INFERRED`
- [[pushToast]] `EXTRACTED`
- [[handleKeyDown()]] `EXTRACTED`

### contains
- [[page.tsx]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*