# handleAttack()

> God node · 4 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\components\BossFightArena.tsx](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/components/BossFightArena.tsx#L689)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as handleAttack()
    participant P1 as handleKeyDown()
    participant P2 as submitDuelAnswer()
    participant P3 as commitDuelEvaluation()
    P0->>+ P1: calls
    P1-->>- P0: return
    P1->>+ P0: calls
    P0-->>- P1: return
    P0->>+ P2: calls
    P2-->>- P0: return
    P2->>+ P0: calls
    P0-->>- P2: return
    P0->>+ P3: calls
    P3-->>- P0: return
    P3->>+ P0: calls
    P0-->>- P3: return
```

## Connections by Relation

### calls
- [[handleKeyDown()]] `EXTRACTED`
- [[submitDuelAnswer()]] `INFERRED`
- [[commitDuelEvaluation()]] `INFERRED`

### contains
- [[BossFightArena.tsx]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*