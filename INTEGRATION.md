# Integrate `*.ric` name resolution (Shibarium)

Any wallet, DEX, bot, or dApp can resolve **`name.ric` → `0x…`** with two contracts.  
No permission, API key, or fee required.

**Safety:** Always show the full resolved address and ask the user to confirm before sending funds. Names are UX, not identity guarantees.

---

## Chain & contracts (live)

| Item | Value |
|------|--------|
| Network | **Shibarium** |
| Chain ID | **109** (`0x6d`) |
| Explorer | https://www.shibariumscan.io |
| **RICRegistry** | `0x9689B3d52c8EC938D17B211c47B18F8C546aBC2b` |
| **RICResolver** | `0xE21b46f1161793644468ffF7b1c6aebc87a2F231` |
| **RICRegistrarV2** (mint) | `0x6A19491B4136cC335EF44af9D36fB30e31909534` |
| TLD | `.ric` |
| `namehash("ric")` | `0xd08a790ab3e21305fa5c768150b5940f292548d6f0cff5c158788a20e3df6218` |

RPC (canonical): `https://rpc.shibarium.shib.io`

---

## Resolve algorithm

```text
1. Normalize: lowercase, strip trailing ".ric" if present → label
2. labelHash = keccak256(utf8(label))
3. node      = keccak256( abi.encodePacked( namehash("ric"), labelHash ) )
4. addr      = RICResolver.addr(node)
5. If addr == 0x0 → name not set / not registered → reject send
```

Optional checks:

- `RICRegistry.owner(node)` — who owns the name  
- `RICResolver.primaryName(wallet)` — reverse: wallet → primary `name.ric`

---

## Minimal ABIs

```text
// RICResolver
function addr(bytes32 node) view returns (address)
function primaryName(address) view returns (string)

// RICRegistry (optional)
function owner(bytes32 node) view returns (address)
function resolver(bytes32 node) view returns (address)
```

---

## JavaScript (ethers v6) — copy/paste

```js
import { ethers } from "ethers";

const CHAIN_ID = 109;
const TLD_NODE =
  "0xd08a790ab3e21305fa5c768150b5940f292548d6f0cff5c158788a20e3df6218";
const RESOLVER = "0xE21b46f1161793644468ffF7b1c6aebc87a2F231";
const REGISTRY = "0x9689B3d52c8EC938D17B211c47B18F8C546aBC2b";

const RESOLVER_ABI = [
  "function addr(bytes32 node) view returns (address)",
  "function primaryName(address) view returns (string)",
];

/** @param {string} input - "alice" or "alice.ric" */
export function normalizeRicLabel(input) {
  let s = String(input || "").trim().toLowerCase();
  if (s.endsWith(".ric")) s = s.slice(0, -4);
  return s;
}

export function namehashRic(label) {
  const labelHash = ethers.keccak256(ethers.toUtf8Bytes(label));
  return ethers.keccak256(ethers.concat([TLD_NODE, labelHash]));
}

/**
 * Resolve name.ric → address.
 * @returns {Promise<string|null>} checksum address or null if unset
 */
export async function resolveRic(provider, input) {
  const label = normalizeRicLabel(input);
  if (!label || !/^[a-z0-9-]{1,32}$/.test(label)) return null;
  if (label.startsWith("-") || label.endsWith("-")) return null;

  const node = namehashRic(label);
  const resolver = new ethers.Contract(RESOLVER, RESOLVER_ABI, provider);
  const addr = await resolver.addr(node);
  if (!addr || addr === ethers.ZeroAddress) return null;
  return ethers.getAddress(addr);
}

// Example
// const provider = new ethers.JsonRpcProvider("https://rpc.shibarium.shib.io", CHAIN_ID);
// const to = await resolveRic(provider, "alice.ric");
// if (!to) throw new Error("Name does not resolve");
// await token.transfer(to, amount);
```

### Browser one-liner pattern (after ethers is loaded)

```js
async function resolveRicName(name) {
  const label = name.trim().toLowerCase().replace(/\.ric$/, "");
  const tld =
    "0xd08a790ab3e21305fa5c768150b5940f292548d6f0cff5c158788a20e3df6218";
  const node = ethers.keccak256(
    ethers.concat([tld, ethers.keccak256(ethers.toUtf8Bytes(label))])
  );
  const resolver = new ethers.Contract(
    "0xE21b46f1161793644468ffF7b1c6aebc87a2F231",
    ["function addr(bytes32) view returns (address)"],
    new ethers.JsonRpcProvider("https://rpc.shibarium.shib.io", 109)
  );
  const a = await resolver.addr(node);
  return a === ethers.ZeroAddress ? null : a;
}
```

---

## Solidity (view helper)

```solidity
interface IRICResolver {
    function addr(bytes32 node) external view returns (address);
}

bytes32 constant RIC_TLD =
    0xd08a790ab3e21305fa5c768150b5940f292548d6f0cff5c158788a20e3df6218;

function resolveRic(address resolver, string memory label) internal view returns (address) {
    bytes32 node = keccak256(abi.encodePacked(RIC_TLD, keccak256(bytes(label))));
    return IRICResolver(resolver).addr(node);
}
```

---

## Suggested UX

1. User enters `alice` or `alice.ric`  
2. Debounce → call `resolveRic`  
3. Show full `0x…` + short form + explorer link  
4. Disable **Send** if resolve is `null`  
5. On submit, **resolve again** immediately before the tx (avoid stale UI)

---

## Public mint (optional)

Users mint via **RICRegistrarV2** (not required to *resolve*):

| Length | Path |
|--------|------|
| 3–32 | Public `registerSelf(label)` — fee in RIC |
| 1–2 | Owner assign only (premium) |

Registrar: `0x6A19491B4136cC335EF44af9D36fB30e31909534`  
Product UI: RicSwap `names.html`

---

## Contact / product

- Site: RicSwap Names (`names.html`)  
- This doc: `sns/INTEGRATION.md`  
- Source: `sns/RICRegistry.sol`, `RICResolver.sol`, `RICRegistrarV2.sol`

**TL;DR for partners:** On Shibarium, for `*.ric`, call  
`RICResolver.addr(namehash)` at `0xE21b46f1161793644468ffF7b1c6aebc87a2F231`.
