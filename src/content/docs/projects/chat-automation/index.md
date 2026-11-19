---
title: Telegram Business Assistant
description: Overview and architecture documentation for Telegram Business Assistant, an automated workflow engine for managing Telegram Business chats.
---

Telegram Business Assistant automates customer replies, rule-based message routing, and structured workflows for Telegram Business accounts.

## Architecture Overview

```mermaid
flowchart LR
  User[Telegram Client] --> Bot[Business Assistant]
  Bot --> Engine[Automation Engine]
  Engine --> Reply[Automated Response]
```

Return to the [AZiPA home page](/).
