# sendFriendRequest()

> God node · 4 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\lib\firebase\friends.ts](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/lib/firebase/friends.ts#L132)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as sendFriendRequest()
    participant P1 as saveUserProfile()
    participant P2 as findUserByEmail()
    participant P3 as handleAddFriend()
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
- [[saveUserProfile()]] `EXTRACTED`
- [[findUserByEmail()]] `EXTRACTED`
- [[handleAddFriend()]] `INFERRED`

### contains
- [[friends.ts]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*