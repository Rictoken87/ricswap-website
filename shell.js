/* Shared header for ricswap.com. Injects into #ric-shell. */
(function () {
  "use strict";

  var KEY = "ricswap.chain";
  var mount = document.getElementById("ric-shell");
  if (!mount) return;

  var page = mount.getAttribute("data-page") || "";
  var forced = mount.getAttribute("data-chain");
  var chain = forced || readChain();

  var LINKS = {
    "109": [
      ["swap.html", "Swap", "swap"],
      ["liquidity.html", "Liquidity", "liquidity"],
      ["pools.html", "Pools", "pools"],
      ["launchpad.html", "Launch", "launch"],
      ["lock.html", "Lock", "lock"]
    ],
    "421018": [
      ["drive-swap.html", "Swap 42", "drive-swap"],
      ["drive-liquidity.html", "Add 42 LP", "drive-liquidity"],
      ["x42.html", "Stake x42", "x42"],
      ["drive.html", "Drive launchpad", "drive"],
      ["https://bridge.zaphod.one/", "Bridge", "bridge"]
    ]
  };
  var ALWAYS = [
    ["contracts.html", "Contracts", "contracts"],
    ["about.html", "About", "about"]
  ];

  var bar = document.createElement("header");
  bar.className = "ric-bar";
  var links = document.createElement("nav");
  links.className = "ric-links";
  links.setAttribute("aria-label", "RicSwap");
  var chainBox = document.createElement("div");
  chainBox.className = "ric-chain";
  chainBox.setAttribute("role", "group");
  chainBox.setAttribute("aria-label", "Network");
  var shibBtn = chainButton("109", "Shibarium");
  var infBtn = chainButton("421018", "Infinite");
  chainBox.appendChild(shibBtn);
  chainBox.appendChild(infBtn);
  var burger = document.createElement("button");
  burger.className = "ric-burger";
  burger.type = "button";
  burger.setAttribute("aria-label", "Open menu");
  burger.setAttribute("aria-expanded", "false");
  burger.innerHTML = "<span></span><span></span><span></span>";

  bar.appendChild(brand());
  bar.appendChild(links);
  bar.appendChild(chainBox);
  bar.appendChild(burger);

  var warn = document.createElement("div");
  warn.className = "ric-warn";
  var warnBtn = document.createElement("button");
  warnBtn.className = "ric-warn-toggle";
  warnBtn.type = "button";
  warnBtn.setAttribute("aria-expanded", "false");
  warnBtn.textContent = "109 and 421018 are different networks.";
  var more = document.createElement("div");
  more.className = "ric-warn-more";
  more.hidden = true;
  more.appendChild(document.createTextNode("Shibarium 109 is trade and launch (BONE / RIC). Infinite Drive 421018 is native 42 and x42. Never send 42 on 109 or BONE on 421018. "));
  var about = document.createElement("a");
  about.href = "/about.html";
  about.textContent = "What this is / is not";
  more.appendChild(about);

  warn.appendChild(warnBtn);
  warn.appendChild(more);
  mount.appendChild(bar);
  mount.appendChild(warn);
  render();

  shibBtn.addEventListener("click", function () { setChain("109"); });
  infBtn.addEventListener("click", function () { setChain("421018"); });
  burger.addEventListener("click", function () {
    var open = bar.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  warnBtn.addEventListener("click", function () {
    var open = more.hidden;
    more.hidden = !open;
    warnBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  function readChain() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === "421018" || saved === "109") return saved;
    } catch (e) {}
    return "109";
  }

  function setChain(next) {
    chain = next === "421018" ? "421018" : "109";
    if (!forced) {
      try { localStorage.setItem(KEY, chain); } catch (e) {}
    }
    bar.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
    render();
  }

  function render() {
    shibBtn.setAttribute("aria-pressed", chain === "109" ? "true" : "false");
    infBtn.setAttribute("aria-pressed", chain === "421018" ? "true" : "false");
    links.textContent = "";
    LINKS[chain].concat(ALWAYS).forEach(function (item) {
      var a = document.createElement("a");
      a.href = abs(item[0]);
      a.textContent = item[1];
      if (item[0].indexOf("http") === 0) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
      if (item[2] === page) a.setAttribute("aria-current", "page");
      a.addEventListener("click", function () {
        bar.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      });
      links.appendChild(a);
    });
  }

  function brand() {
    var a = document.createElement("a");
    a.className = "ric-brand";
    a.href = "/index.html";
    a.setAttribute("aria-label", "RicSwap home");
    var img = document.createElement("img");
    img.src = "/riclogo.png";
    img.alt = "";
    img.width = 40;
    img.height = 40;
    var name = document.createElement("span");
    name.textContent = "RICSWAP";
    a.appendChild(img);
    a.appendChild(name);
    return a;
  }

  function abs(path) {
    if (path.indexOf("http") === 0 || path.charAt(0) === "/") return path;
    return "/" + path;
  }

  function chainButton(id, label) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.setAttribute("aria-pressed", "false");
    return b;
  }

  var NETS = {
    109: {
      hex: "0x6d",
      name: "Shibarium",
      native: { name: "BONE", symbol: "BONE", decimals: 18 },
      rpc: ["https://rpc.shibarium.shib.io"],
      explorer: "https://www.shibariumscan.io"
    },
    421018: {
      hex: "0x66c9a",
      name: "Infinite Improbability Drive",
      native: { name: "Improbability", symbol: "42", decimals: 18 },
      rpc: ["https://evm-rpc.infinitedrive.xyz", "https://evm.infinitedrive.xyz"],
      explorer: "https://scan.infinitedrive.xyz"
    }
  };

  function chainNum(id) {
    if (typeof id === "number" && isFinite(id)) return id;
    if (typeof id === "bigint") return Number(id);
    var s = String(id == null ? "" : id).trim();
    if (/^0x/i.test(s)) return parseInt(s, 16);
    return parseInt(s, 10);
  }

  function wrongChainMessage(id) {
    if (id === 421018) return "Wrong network. Switch to Infinite Drive (421018) before you sign.";
    return "Wrong network. Switch to Shibarium (109) before you sign.";
  }

  function numericCode(v) {
    if (typeof v === "number" && isFinite(v)) return v;
    if (typeof v === "string" && /^-?\d+$/.test(v)) return parseInt(v, 10);
    return 0;
  }

  // ethers wraps a wallet 4902 as UNKNOWN_ERROR and keeps the real code on
  // error.error.code. A string code such as "UNKNOWN_ERROR" is not the wallet code.
  function switchCode(err) {
    var seen = [];
    function walk(e, depth) {
      if (!e || depth > 5 || seen.indexOf(e) !== -1) return 0;
      seen.push(e);
      var direct = numericCode(e.code);
      if (direct) return direct;
      var orig = e.data && e.data.originalError;
      var fromOrig = orig ? numericCode(orig.code) : 0;
      if (fromOrig) return fromOrig;
      if (e.error) {
        var inner = walk(e.error, depth + 1);
        if (inner) return inner;
      }
      if (e.info) {
        var info = walk(e.info, depth + 1);
        if (info) return info;
      }
      if (e.cause) return walk(e.cause, depth + 1);
      return 0;
    }
    return walk(err, 0);
  }

  function errorText(err) {
    var parts = [];
    function push(v) {
      if (v == null) return;
      var s = String(v);
      if (s && parts.indexOf(s) === -1) parts.push(s);
    }
    if (!err) return "";
    push(err.shortMessage);
    push(err.message);
    push(err.error && err.error.message);
    push(err.data && err.data.message);
    return parts.join(" ");
  }

  // Talk to the same injected provider the signer will use. A raw EIP-1193
  // object has request(); an ethers provider has send().
  function ethRequest(eth, method, params) {
    if (eth && typeof eth.request === "function") {
      return eth.request({ method: method, params: params });
    }
    if (eth && typeof eth.send === "function") {
      return eth.send(method, params || []);
    }
    var w = window.ethereum;
    if (!w || typeof w.request !== "function") throw new Error("No wallet. Install MetaMask or Rabby.");
    return w.request({ method: method, params: params });
  }

  // Read the wallet chain. If it is wrong, ask for a switch, read again, and
  // refuse when it is still wrong. This never sends a transaction.
  window.ricRequireChain = async function (want, eth) {
    var target = chainNum(want);
    var meta = NETS[target];
    if (!meta) throw new Error("Unknown network");
    var now = chainNum(await ethRequest(eth, "eth_chainId"));
    if (now === target) return true;
    try {
      await ethRequest(eth, "wallet_switchEthereumChain", [{ chainId: meta.hex }]);
    } catch (e) {
      var code = switchCode(e);
      var msg = errorText(e);
      if (code === 4902 || /unrecognized chain|not been added|wallet_addEthereumChain/i.test(msg)) {
        try {
          await ethRequest(eth, "wallet_addEthereumChain", [{
            chainId: meta.hex,
            chainName: meta.name,
            nativeCurrency: meta.native,
            rpcUrls: meta.rpc,
            blockExplorerUrls: [meta.explorer]
          }]);
        } catch (addErr) { /* re-read below; still wrong means no signature */ }
      }
    }
    var after = chainNum(await ethRequest(eth, "eth_chainId"));
    if (after !== target) throw new Error(wrongChainMessage(target));
    return true;
  };

  // Every later send or typed signature on this signer re-checks the chain
  // immediately before the wallet confirm. The check uses that signer's
  // provider, so a second injected wallet cannot answer for it.
  window.ricGuardSigner = function (signer, want) {
    if (!signer) return signer;
    var target = chainNum(want);
    if (signer.__ricGuarded === target) return signer;
    var bound = (signer.provider && typeof signer.provider.send === "function")
      ? signer.provider
      : null;
    var origSend = signer.sendTransaction && signer.sendTransaction.bind(signer);
    var origTyped = signer.signTypedData && signer.signTypedData.bind(signer);
    if (origSend) {
      signer.sendTransaction = async function (tx) {
        await window.ricRequireChain(target, bound);
        return origSend(tx);
      };
    }
    if (origTyped) {
      signer.signTypedData = async function (domain, types, value) {
        await window.ricRequireChain(target, bound);
        return origTyped(domain, types, value);
      };
    }
    try { signer.__ricGuarded = target; } catch (e) {}
    return signer;
  };
})();
