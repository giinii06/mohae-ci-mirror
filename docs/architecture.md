# MOHAE v1 architecture

## Runtime isolation

Three independent Discord bot clients use three distinct token secrets. The fourth Docker container, game-api, is the exclusive SQLite writer. Each bot sends authenticated requests to the API with an individual role-restricted internal API key. Collector can only send chat and voice activity; Polly can only manage reporting; MOHAE handles core gameplay.

~~~mermaid
flowchart TD
 A[Discord MOHAE app] --> B[mohae-bot]
 C[Discord Collector app] --> D[collector-bot]
 E[Discord Polly app] --> F[polly-bot]
 B --> G[game-api]
 D --> G
 F --> G
 G --> H[(SQLite WAL volume)]
~~~

No raw chat content or audio is collected; only activity metadata. Journals are saved only when expressly requested and are encrypted using an independently managed AES-256-GCM key. Game profiles are private by default.

## Idempotent economy

~~~mermaid
sequenceDiagram
 participant User
 participant Bot
 participant Core
 participant SQLite
 User->>Bot: draw / button interaction
 Bot->>Core: request, idempotency key
 Core->>SQLite: BEGIN IMMEDIATE
 Core->>SQLite: look up prior request
 alt prior receipt exists
   SQLite-->>Core: original receipt
 else new request
   Core->>SQLite: charge wallet, append ledger
   Core->>SQLite: draw sequential results and create card instances
   Core->>SQLite: update pity and receipt, COMMIT
 end
 Core-->>Bot: stable receipt
 Bot-->>User: ephemeral result
~~~

Requests are atomic; a pre-commit failure rolls back the operation. Two draws with the same request ID return one original receipt and do not debit twice. The game's persistence model distinguishes character definitions from each owned card instance, discoveries and affinity points. The last copy of a character cannot be dismantled.

The API validates guild allowlists, per-role API key hash and per-action permissions. Guild admin functions also check Discord Manage Guild permissions in their individual bot adapters. Because one-node SQLite is the only data store, multi-writer game API replicas are not supported.

## Gacha and time

Base 1/2/3-star rarity chance 83/15/2%. At ten consecutive 1-star rolls, 2+ is guaranteed. 3-star soft pity increases starting pull 41 by three percentage points per roll, from 2% at 40 to 59% at 59. Pull 60 is forced 3-star. Limited 3-star has a 50:50 pickup chance, lost 50:50 guarantees next 3-star pickup, and limited 70-pull non-pickup guarantee is highest priority. Standard and limited pity are separate; limited banner changes carry pity and 50:50 guarantee.

Game days change at 05:00 Asia/Seoul, weeks on Monday 05:00, seasons last 56 days. Season settlement runs once on startup and hourly; expired/unclaimed unlocked tier rewards are committed atomically.

## Scope boundaries

User requested dummy persons person1 to person27 and dummy cosmetics, minigames, events and seasons. User expressly requested NO story, dialogue, narrative, AI chats. Trading is intentionally deferred as specified by the source guide. Production-grade schema migrations, long-term retention policy, true Discord 3-token smoke test and offsite backup restore remain release gates, not completed proofs.
