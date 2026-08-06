# offsetDate()

> God node · 2 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\chat\route.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/app/api/chat/route.ts#L150)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as offsetDate()
    participant P1 as buildFallbackResponse()
    participant P2 as POST()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
```

## Connections by Relation

### calls
- [[buildFallbackResponse()]] `EXTRACTED`

### contains
- [[route.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*