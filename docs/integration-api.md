# Integration API v1

Enable **Integration → Enable observer integration API** in Stream Director settings. Open the designated observer, not the GM client. No dependency on OBS or external service.

```js
const api = game.modules.get("greene-gaming-stream-director")?.api?.integration;
console.log(api?.version, api?.getSnapshot());
const stop = api?.subscribe(state => console.log(state));
 // Call stop() when the consumer is destroyed.
```

Wait for Foundry ready or the `ggsdIntegrationReady` hook. Subscribers receive an immediate snapshot and subsequent changed snapshots, coalesced over approximately 100 ms. No polling is required. Each callback receives an independent plain-data copy. Unsubscribe by calling the returned function. Subscribe only on the observer after ready. Disabling integration, losing observer role or tearing down canvas yields an unavailable snapshot. Re-enable to resume. Other clients receive an unavailable snapshot and cannot subscribe. Existing `api.openDirector()` remains GM-only.

## Schema

```json
{
  "apiVersion": 1,
  "available": true,
  "system": "pf2e",
  "sceneId": "scene-id",
  "mode": "broadcast",
  "combat": {"active": true, "round": 2, "activeActorId": "actor-id"},
  "characters": [
    {
      "actorId": "actor-id",
      "actorUuid": "Actor.actor-id",
      "tokenId": "token-id",
      "name": "Example character",
      "health": {"value": 24, "max": 30, "temp": 0},
      "inCombat": true,
      "activeTurn": true
    }
  ]
}
```

Unavailable: available false, system/sceneId/mode null, combat inactive with null round and actor, empty characters. Health is null unless separately enabled and numeric values are supported. Temporary HP may be null. No conditions, initiative numbers, NPC names, raw actor documents, roll data, or images are included. Multiple visible tokens for one actor can produce multiple rows; use actorUuid and tokenId for mapping. Only visible non-hidden character tokens with a player owner and observer permission are eligible. Active turn identifies an eligible non-hidden combatant; otherwise activeActorId is null. No off-scene party members are exported.

## Security and transport

This API is an application-level opt-in, not a sandbox for other scripts already executing in Foundry. It does not create an HTTP endpoint, send socket messages, connect to localhost, or publish browser messages. An external OBS overlay needs a separately configured bridge with its own authentication, origin restrictions and explicit destination. Do not transmit the entire Foundry actor object. Treat all names as untrusted text. A consumer must clear stale state when unavailable or disconnected. The health setting is separate and defaults off. Camera and presentation settings are independent of the API. No camera commands are exposed.

PF2e and SF2e use the common attributes.hp structure where present. Live verification is required in both systems.
