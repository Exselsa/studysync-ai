# buildFallbackResponse()

> God node · 3 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\app\api\chat\route.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/app/api/chat/route.ts#L121)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as buildFallbackResponse()
    participant P1 as POST()
    participant P2 as buildFallback()
    participant P3 as offsetDate()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P1->>+ P2: calls
    P2-->>- P1: return
    P2->>+ P1: calls
    P1-->>- P2: return
    P0->>+ P3: calls
    P3-->>- P0: return
    P3->>+ P0: calls
    P0-->>- P3: return
```

## Connections by Relation

### calls
- [[POST()]] `EXTRACTED`
- [[offsetDate()]] `EXTRACTED`

### contains
- [[route.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*