# match

> God node · 5 connections · [C:\Users\Asus\.gemini\antigravity\scratch\studysync-ai\src\components\study\MaterialUploader.tsx](file:///C:/Users/Asus/.gemini/antigravity/scratch/studysync-ai/src/components/study/MaterialUploader.tsx#L129)

## Call Trace Diagram

```mermaid
sequenceDiagram
    participant P0 as match
    participant P1 as extractTextFromDocx()
    participant P2 as parseFileBuffer()
    participant P3 as POST()
    participant P4 as extractTextFromPdf()
    participant P5 as sanitizeText()
    participant P6 as extractPrintableStrings()
    participant P7 as parseDayNumber()
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
    P1->>+ P6: calls
    P6-->>- P1: return
    P6->>+ P0: calls
    P0-->>- P6: return
    P6->>+ P1: calls
    P1-->>- P6: return
    P6->>+ P4: calls
    P4-->>- P6: return
    P0->>+ P4: calls
    P4-->>- P0: return
    P4->>+ P2: calls
    P2-->>- P4: return
    P4->>+ P0: calls
    P0-->>- P4: return
    P4->>+ P6: calls
    P6-->>- P4: return
    P0->>+ P6: calls
    P6-->>- P0: return
    P0->>+ P7: calls
    P7-->>- P0: return
```

## Connections by Relation

### calls
- [[extractTextFromDocx()]] `INFERRED`
- [[extractTextFromPdf()]] `INFERRED`
- [[extractPrintableStrings()]] `INFERRED`
- [[parseDayNumber()]] `INFERRED`

### contains
- [[MaterialUploader.tsx]] `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [[index]] to navigate.*