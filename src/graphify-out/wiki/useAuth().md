# useAuth()

> God node · 3 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\contexts\AuthContext.tsx](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/lib/contexts/AuthContext.tsx#L106)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as useAuth()
    participant P1 as ChallengeNotificationToast()
    participant P2 as DashboardSidebar()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P0->>+ P2: calls
    P2-->>- P0: return
    P2->>+ P0: calls
    P0-->>- P2: return
```

## Connections by Relation

### calls
- [[ChallengeNotificationToast()]] `INFERRED`
- [[DashboardSidebar()]] `INFERRED`

### contains
- [[AuthContext.tsx]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*