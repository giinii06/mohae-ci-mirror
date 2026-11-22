# MOHAE — Discord Player Guide

> **New to MOHAE? Start here.** This guide explains how an ordinary Discord server member can play the game. You do **not** need to install software, create your own bot, or manage API keys. For hosting and development, use the [Developer README](README.md).
>
> **Current status:** Version 1 uses **placeholder characters, minigames, cosmetics, and season content**. A live deployment with all three Discord bots has **not yet been verified**. If the commands are unavailable on your server, ask its moderators.

**Language note:** This guide is written in English, but the **actual Discord slash-command names and option labels are Korean**. They are shown exactly as you must enter or select them. English alternatives such as `/attendance` do not exist in this version.

## Table of contents

1. [Getting started](#getting-started)
2. [Your daily routine](#your-daily-routine)
3. [Currencies and rewards](#currencies-and-rewards)
4. [Drawing characters and managing cards](#drawing-characters-and-managing-cards)
5. [Minigames, affinity, and cosmetics](#minigames-affinity-and-cosmetics)
6. [Seasons, events, and cooperative goals](#seasons-events-and-cooperative-goals)
7. [Privacy, journals, and account data](#privacy-journals-and-account-data)
8. [Reporting a problem with Polly](#reporting-a-problem-with-polly)
9. [Complete command reference](#complete-command-reference)
10. [Frequently asked questions](#frequently-asked-questions)

## Getting started

MOHAE is a game played through bots **already installed on a Discord server**. Three independent bots have separate jobs:

| Bot | What it does | What you do |
|---|---|---|
| **MOHAE** | Attendance, quests, draws, cards, seasons, and shop | Use its slash commands in a text channel |
| **Collector** | Tracks eligible text and voice activity in designated channels | Chat or join eligible voice channels; no command required |
| **Polly** | Accepts private reports and lets you check their status | Use `/신고` when you need to report someone |

### Your first five steps

1. Join a Discord server where the moderators have added all three bots.
2. Open a text channel, type `/`, and select MOHAE's `/도움말` command to see the available commands.
3. Run `/게임` or `/프로필` to check your account. The game creates a player record automatically on first use.
4. Run `/출석` for your attendance reward, then complete `/일퀘`.
5. Once you have enough MOHAE currency, try `/뽑기` to obtain a character. Use `/카드` to see your cards.

**How slash commands work:** Type `/`, select a command under the correct bot, fill in Discord's option fields, and submit. Game replies and Polly report receipts are designed to be **ephemeral**: visible only to the person who used the command.

## Your daily routine

The game day resets every day at **5:00 AM Korea Standard Time (Asia/Seoul)**, not at midnight. Regular activities can award up to **150 MOHAE per game day**, before any weekly or special-event rewards.

| Activity | How to do it | Normal daily reward |
|---|---|---|
| Attendance | `/출석` | **40 MOHAE + 20 XP** |
| Daily reflection quest | `/일퀘`, then choose a topic | **60 MOHAE + 40 XP**; an additional **80 season XP** during an active season |
| Minigames | `/미니게임`, then choose an answer button | **10 MOHAE + 10 XP per rewarded game**, up to 4 games (**40 MOHAE**) |
| Eligible text and voice activity | Participate in channels configured by moderators | **10 MOHAE total** across both activities |
| **Daily total** | Complete all of the above | **Up to 150 MOHAE** |

### Daily quest and optional journal

With `/일퀘`, choose one of five topics:

- Compliment (`praise`)
- A good day (`good_day`)
- Gratitude (`thanks`)
- Self-comfort (`self_comfort`)
- Rest (`rest`)

Writing an entry is **optional**. If you do want to keep a personal entry, fill in the `기록` text field and explicitly select **`저장: true`**. Entries are **not saved by default**. Saved journals are encrypted at rest, and you can read or delete your own entries later.

### Automatic activity rewards from Collector

**Text messages:** In approved channels, every **five qualifying messages**, spaced at least **60 seconds apart**, award **5 MOHAE**, subject to the shared activity cap. Sending five messages in quick succession does not qualify.

**Voice:** The channel must be approved, must not be an AFK channel, and must contain **at least two non-bot users**. Once you accumulate **20 minutes of eligible voice time**, you may earn up to **10 MOHAE**. A connection change or recent channel join may prevent some time from counting.

**Important:** Text and voice rewards **share one daily cap of 10 MOHAE**. You cannot get 10 from each. Collector processes activity events without storing message bodies or recording voice audio.

### Weekly quests

Run `/주간퀘` to see your progress. Complete **any three of the following five distinct goals**:

| Goal | Requirement |
|---|---|
| Daily quest: three days | Finish a daily quest on 3 separate days |
| Daily quest: five days | Finish a daily quest on 5 separate days |
| Qualifying chat messages | Reach 15 messages |
| Eligible voice time | Reach 45 minutes |
| Rewarded minigame completions | Finish 8 rewarded minigames |

The weekly reward is **300 MOHAE + 200 permanent XP + 300 season XP** when a season is active. Once eligible, run `/주간퀘` with **`수령: true`** to claim it. A new game week starts **Monday at 5:00 AM KST**.

## Currencies and rewards

| Currency | What it is used for | Where it comes from |
|---|---|---|
| **MOHAE** | Character draws | Attendance, quests, minigames, eligible activity, weekly rewards, events |
| **SHARD** | Cosmetics in the shop | Dismantling duplicate cards and some season rewards |
| **TICKET** | Character draws without spending MOHAE | Season pass rewards |

Use `/프로필` to check your balances, level, and collection counts. Weekly and event rewards can be earned **in addition to** the regular daily maximum.

## Drawing characters and managing cards

### How to draw

1. Check your MOHAE balance and tickets with `/프로필`.
2. Run `/뽑기`, select the banner (`상시` = standard or `한정` = limited), and choose `횟수` (1 or 10 draws).
3. Review the results with `/카드`, `/도감`, or `/뽑기기록`.

**Cost:** One draw costs **150 MOHAE**; ten cost **1,500 MOHAE**. Tickets are used **before** MOHAE, so you only pay currency for draws not covered by tickets. The limited banner is only available when a server season is active.

| Gacha rule | Details |
|---|---|
| Base rarity rates | 1-star **83%**, 2-star **15%**, 3-star **2%** |
| 2-star or higher | Guaranteed by the **10th** draw |
| 3-star | Guaranteed by the **60th** draw |
| Soft pity | 3-star probability starts rising from draw **41** |
| Limited featured character | Guaranteed within **70 limited draws** |
| Limited 50/50 | If you miss the featured 3-star, your next limited 3-star is guaranteed to be featured |

Use `/천장` to inspect the counters. Standard and limited banners maintain separate pity state. All 27 characters currently have **placeholder names** (`person1` through `person27`).

### Card inventory and duplicates

| Command | What it does |
|---|---|
| `/카드` | Shows your recent cards and each card's unique ID |
| `/도감` | Shows which characters you have discovered |
| `/뽑기기록` | Shows your 20 most recent draw records |
| `/대표 캐릭터:person1` | Sets a character you own as your representative (example) |
| `/카드잠금 카드id:<ID> 잠금:true` | Locks a card to protect it |
| `/분해 카드id:<ID> 확인:true` | Dismantles an unlocked duplicate card |
| `/자동분해설정` | Shows your automatic-dismantle settings |
| `/자동분해 등급:1 사용:true` | Automatically dismantles eligible duplicate 1-star cards (2-star also supported) |

A **card ID is not the same as a character name**. Copy the unique ID from `/카드`. You **cannot dismantle your last copy** of a character or a locked card. Automatic dismantling only applies to **duplicate 1-star and 2-star cards**, never 3-star cards.

Dismantling yields **1 SHARD** for a 1-star, **5 SHARD** for a 2-star, and **40 SHARD** for a 3-star card.

## Minigames, affinity, and cosmetics

### Minigames

Use `/미니게임` with a game code such as `quiz`. The bot sends a question and answer buttons.

| Game code | Type |
|---|---|
| `deduction` | Number/deduction puzzle |
| `memory` | Memory challenge |
| `treasure` | Treasure choice |
| `quiz` | General quiz |
| `dice` | Dice interaction |

Select an answer **within 10 minutes** of starting. An answer submitted **less than two seconds** after starting can be rejected. A valid completed session can grant **10 MOHAE and 10 XP**, up to **four rewarded sessions per day**, **regardless of whether the answer is correct**. Abandoned sessions give no reward. You cannot keep more than three unfinished active games open.

### Affinity

First choose a character you own with `/대표`, for example `/대표 캐릭터:person1`. Then use `/호감도 행동:talk` to talk or `/호감도 행동:gift` to give a gift. The first use of **each action per game day** grants **10 affinity points** to your representative character. Character stories, dialogues, and AI chat are **not implemented**.

### Shop and cosmetic items

Run `/상점` to view items and their **SKU codes**. Buy an item with `/구매 상품:shop_expression` and equip it with `/꾸미기 상품:shop_expression`. Shop cosmetics use **SHARD**. Some rewards are season-only and cannot be bought directly.

## Seasons, events, and cooperative goals

### Season pass

When your server's moderators enable a season, use `/시즌` to see your progress.

- **Duration:** 56 days, starting on a moderator-scheduled **Monday at 5:00 AM KST**.
- **Progression:** 20 tiers, each requiring **250 season XP** (5,000 total XP for tier 20).
- **Rewards:** 10 draw tickets in total, 100 SHARD, placeholder cosmetics, and a season character.
- **Claiming:** Once you unlock a tier, use `/시즌보상 단계:3` to claim tier 3 (example).
- **End of season:** The game is designed to automatically grant unlocked, unclaimed tier rewards when a season expires.

If `/시즌` shows no active season, limited draws and some event or cooperative features may be unavailable.

### Seasonal events

Use `/이벤트` to view available events and progress. Moderators can enable placeholder events scheduled for **weeks 2, 4, and 6**. After meeting the event conditions, claim with a command such as `/이벤트보상 이벤트:dummy_event_04`. Each event awards **200 MOHAE**. Events do **not** start automatically; moderators must enable them.

### Server-wide cooperative goals

Use `/협동` to see the shared target and your contribution. Participate with `/협동참여`, up to **three contributions per person per day**. Once the server reaches its goal, **users who participated** can claim a placeholder cooperative badge with `/협동보상`. The server's moderators must first enable the cooperative challenge.

## Privacy, journals, and account data

Your profile is **private by default**. You control whether other players can see a limited public profile.

| Command | Explanation |
|---|---|
| `/프로필` | View your own account |
| `/공개설정 공개:true` | Allow others to view your limited public profile |
| `/공개설정 공개:false` | Make your profile private again |
| `/다른프로필 대상:@user` | View someone else's profile **only if they opted in** |
| `/일지` or `/일지 날짜:YYYY-MM-DD` | Read your saved journal entry |
| `/일지삭제 확인:true` | Delete today's journal (or specify a date) |
| `/내보내기` | Download a **JSON file** containing your account data, saved journals, and reports you submitted |
| `/계정삭제 확인:DELETE` | Anonymize your account and remove journal and public-profile settings; **not reversible** |

**Journal storage is opt-in.** Enter text in `기록` and explicitly set `저장` to true when submitting `/일퀘`. Journal bodies are encrypted while stored in the database.

**Protect your exported JSON file.** It may contain your private notes and report details in **readable form**. Do not post it publicly or send it to strangers.

**What account deletion means:** `/계정삭제` anonymizes your user identifier and removes journal entries and profile visibility settings. It does **not guarantee permanent physical deletion of every game or moderation record**. Ask server moderators about their data-retention policy.

## Reporting a problem with Polly

If another member is harassing you, spamming, or suspected of fraud, use **Polly**, not the MOHAE game bot.

1. Run `/신고` under the **Polly** bot.
2. Fill in `대상` (the reported user), `사유` (reason), and `설명` (5–1,500 characters). The reason choices cover **harassment, spam, suspected fraud, and other**.
3. After submission, **save the report receipt ID** displayed in the private response.
4. Check progress later with `/신고상태 번호:<receipt-ID>`.

- You can submit **at most three reports within five minutes**.
- Receipt and status replies are intended to be visible only to you.
- **Reports are not anonymous to moderators.** Details are stored so authorized staff can investigate them.
- You cannot use your own status command to view reports submitted by other users.
- `/신고목록` and `/신고처리` are restricted to moderators with the **Manage Server** permission.
- Check your server's moderation and privacy policy for handling and retention rules.

## Complete command reference

### Regular members — MOHAE

| Category | Commands |
|---|---|
| Getting started and account | `/게임`, `/프로필`, `/도움말` |
| Daily play | `/출석`, `/일퀘`, `/주간퀘`, `/미니게임` |
| Character draws | `/뽑기`, `/뽑기기록`, `/천장` |
| Collection | `/도감`, `/카드`, `/카드잠금`, `/분해`, `/대표`, `/호감도` |
| Automatic dismantling | `/자동분해설정`, `/자동분해` |
| Shop and cosmetics | `/상점`, `/구매`, `/꾸미기`, `/닉네임색` |
| Seasons and events | `/시즌`, `/시즌보상`, `/이벤트`, `/이벤트보상` |
| Cooperation | `/협동`, `/협동참여`, `/협동보상` |
| Privacy and account data | `/공개설정`, `/다른프로필`, `/일지`, `/일지삭제`, `/내보내기`, `/계정삭제` |

**Nickname colors:** `/닉네임색` works only if your server has configured **12 pre-existing color roles** and granted the bot sufficient role permissions. Use `/닉네임색 번호:1` through `번호:12` to choose a color or **`번호:0`** to remove your game color role.

### Regular members — Polly

| Command | Purpose |
|---|---|
| `/신고` | Submit a private report |
| `/신고상태` | Check the status of a report you submitted |

### Moderator-only commands

**MOHAE:** `/시즌시작`, `/이벤트시작`, `/협동시작`.  
**Polly:** `/신고목록`, `/신고처리`.

These commands require Discord's **Manage Server** permission.

## Frequently asked questions

### I cannot see the slash commands. Why?

One or more bots may not have been added to the server, may be offline, or may not have permission to register commands. Select the correct bot in Discord's command menu and ask a moderator if necessary.

### I checked in already. Why didn't I receive another reward?

Attendance rewards are granted **once per game day**. The reset is at **5:00 AM KST**, not midnight.

### What does `INSUFFICIENT_MOHAE` mean?

You do not have enough MOHAE to cover the draw cost. Check `/프로필`. `BANNER_INACTIVE` means the limited banner is not active.

### Why can't I dismantle a card?

`CARD_LOCKED` means the card is locked. `LAST_COPY_PROTECTED` means it is your only remaining copy of that character. Use `/카드` to find the correct card ID.

### Why did a minigame give no reward?

You may have already claimed four daily minigame rewards, waited longer than ten minutes, submitted an answer too quickly, or abandoned the game.

### Why can't I view another person's profile?

`PROFILE_PRIVATE` means that player has not opted into sharing their public profile. Privacy is the default.

### Why can't I check a report?

Make sure you copied the exact report receipt ID. `REPORT_NOT_FOUND` also appears when that report is not yours or cannot be found in the current server.

### Why are the command names still Korean?

**Those are the actual commands registered with Discord.** This English guide translates the explanations, not the bot's command identifiers. Do not replace them with invented English aliases.

### Are there character stories, AI chat, or card trading?

**No, not in v1.** The current characters and season content are placeholders. These features are outside the implementation's defined scope.

---

**For moderators and developers:** [Developer README](README.md) · [Game rules](docs/game-rules.md) · [Operations guide](docs/operations.md)

_This guide describes the code in the repository. Live Discord command behavior and production readiness still require separate verification._
