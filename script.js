// ---------------- Config ----------------
const prices = {
  "youtube-subs": 400,        // ₹ per 100
  "youtube-likes": 150,
  "instagram-followers": 300,
  "instagram-likes": 100
};
const WHATSAPP_NUMBER = "916294529365"; // your WhatsApp (country code + number, no plus)

// ---------------- DOM Ready ----------------
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initTheme();
  initAccordion();
  initWhatsApp();
  initOrderForm();    // order.html
  initTrack();        // track.html
  initMyOrders();     // progress.html
  initContact();      // contact form
});

// ---------------- NAV & mobile toggle ----------------
function initNav(){
  document.querySelectorAll(".nav-toggle").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const header = btn.closest(".header-inner");
      const nav = header.querySelector(".main-nav");
      nav.classList.toggle("open");
      // mobile sub toggles
      header.querySelectorAll(".has-sub").forEach(h=>{
        h.addEventListener("click", e=>{
          if(window.innerWidth <= 880){ h.classList.toggle("open"); e.stopPropagation(); }
        });
      });
    });
  });
}

// ---------------- THEME ----------------
function initTheme(){
  const tbtns = document.querySelectorAll("[id^=theme-toggle], .dark-toggle");
  tbtns.forEach(b=>{
    b.addEventListener("click", ()=>{
      document.documentElement.classList.toggle("light-mode");
      const isLight = document.documentElement.classList.contains("light-mode");
      tbtns.forEach(x=>x.textContent = isLight ? "Light" : "Dark");
      localStorage.setItem("sr-theme", isLight ? "light":"dark");
    });
  });
  const stored = localStorage.getItem("sr-theme");
  if(stored === "light"){
    document.documentElement.classList.add("light-mode");
    tbtns.forEach(x=>x.textContent = "Light");
  }
}

// ---------------- Accordion FAQ ----------------
function initAccordion(){
  document.querySelectorAll(".acc-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const panel = btn.nextElementSibling;
      const open = panel.style.display === "block";
      document.querySelectorAll(".acc-panel").forEach(p=>p.style.display="none");
      if(!open) panel.style.display = "block";
    });
  });
}

// ----------------- WhatsApp button ----------------
function initWhatsApp(){
  document.querySelectorAll("[id^=wa-chat]").forEach(el=>{
    const text = encodeURIComponent("Hello, I need help with my SocialRoad order.");
    el.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
    el.title = "Chat on WhatsApp";
  });
}

// ----------------- ORDERS (order.html) -----------------
function initOrderForm(){
  const svc = document.getElementById("service");
  const qty = document.getElementById("quantity");
  const unitPriceEl = document.getElementById("unit-price");
  const totalPriceEl = document.getElementById("total-price");
  const placeBtn = document.getElementById("place-order");
  const checkoutBtn = document.getElementById("checkout");
  const orderResult = document.getElementById("order-result");

  if(!svc) return;

  // update prices
  function updatePrices(){
    const s = svc.value;
    const q = parseInt(qty.value) || 0;
    if(!s){ unitPriceEl.textContent = "₹0"; totalPriceEl.textContent = "₹0.00"; return; }
    const up = prices[s];
    unitPriceEl.textContent = `₹${up} / 100`;
    const total = (up/100) * q;
    totalPriceEl.textContent = `₹${total.toFixed(2)}`;
    return total;
  }
  svc.addEventListener("change", updatePrices);
  qty.addEventListener("input", updatePrices);

  // prefill from query param
  const params = new URLSearchParams(location.search);
  if(params.get("service")){ svc.value = params.get("service"); updatePrices(); window.scrollTo({top:200,behavior:"smooth"}); }

  function saveOrder(isCheckout=false){
    const s = svc.value;
    const q = parseInt(qty.value) || 0;
    const link = document.getElementById("link").value.trim();
    const email = document.getElementById("email").value.trim();
    if(!s || q<1 || !link || !email){ alert("Please fill service, link, quantity and email."); return; }
    const up = prices[s];
    const total = (up/100) * q;
    const orderId = "SR-" + Math.floor(Math.random()*90000 + 10000);
    const now = new Date().toISOString();
    const order = {
      id: orderId,
      service: s,
      serviceLabel: svc.options[svc.selectedIndex].text,
      link, quantity: q, email, total,
      status: "Queued",
      progress: [ { ts: now, status: "Queued", note: "Order placed" } ],
      createdAt: now
    };
    // retrieve array from localStorage
    const all = JSON.parse(localStorage.getItem("sr_orders") || "[]");
    all.push(order);
    localStorage.setItem("sr_orders", JSON.stringify(all));
    // show result
    orderResult.innerHTML = `<div class="order-card"><div>Order placed — <strong>${orderId}</strong></div>
      <div><a href="track.html" class="btn">Track</a> <button class="btn outline" onclick="copyText('${orderId}')">Copy ID</button></div></div>`;
    // if checkout flow, simulate payment success and advance progress
    if(isCheckout){
      setTimeout(()=>{
        // simulate payment success
        simulateAdvance(orderId, "Processing", "Payment received");
        alert(`Demo payment successful. Order ID: ${orderId}`);
      }, 800);
    } else {
      alert(`Order placed! Order ID: ${orderId}\nYou can track it on Track Order page.`);
    }
  }

  // place order button
  placeBtn && placeBtn.addEventListener("click", ()=> saveOrder(false));
  checkoutBtn && checkoutBtn.addEventListener("click", ()=> saveOrder(true));
}

// helper to copy text
function copyText(t){
  navigator.clipboard?.writeText(t).then(()=> alert("Copied order ID to clipboard."));
}

// ----------------- TRACK (track.html) -----------------
function initTrack(){
  const trackBtn = document.getElementById("track-btn");
  if(!trackBtn) return;
  trackBtn.addEventListener("click", ()=>{
    const id = document.getElementById("order-id").value.trim();
    const out = document.getElementById("track-result");
    if(!id){ alert("Enter order ID"); return; }
    const all = JSON.parse(localStorage.getItem("sr_orders") || "[]");
    const order = all.find(o => o.id === id);
    if(!order){ alert("Order not found (demo stores orders in this browser only)."); return; }
    // populate fields
    document.getElementById("t-order-id").textContent = order.id;
    document.getElementById("t-service").textContent = order.serviceLabel || order.service;
    document.getElementById("t-quantity").textContent = order.quantity;
    document.getElementById("t-total").textContent = order.total.toFixed(2);
    document.getElementById("t-status").textContent = order.status;
    // progress percent based on steps length (simple mapping)
    const steps = ["Queued","Processing","In Progress","Completed"];
    let pindex = Math.max(0, steps.indexOf(order.status));
    if(pindex < 0) pindex = 0;
    const percent = Math.round(((pindex+1)/steps.length)*100);
    const bar = document.getElementById("progress-bar");
    bar.style.width = percent + "%";
    out.style.display = "block";

    // download report
    const downloadBtn = document.getElementById("download-report");
    downloadBtn.onclick = ()=> downloadProgressReport(order);

    // advance (admin demo)
    document.getElementById("advance-progress").onclick = ()=> {
      // advance to next status
      const next = advanceOrderStatus(order.id);
      if(next) alert("Order advanced to: " + next);
      else alert("Order is already completed.");
      // refresh view
      document.getElementById("track-btn").click();
    };
  });
}

// advance order status (demo admin)
function advanceOrderStatus(orderId){
  const all = JSON.parse(localStorage.getItem("sr_orders") || "[]");
  const idx = all.findIndex(o=>o.id===orderId);
  if(idx<0) return null;
  const order = all[idx];
  const steps = ["Queued","Processing","In Progress","Completed"];
  const cur = order.status;
  const i = steps.indexOf(cur);
  if(i===-1 || i===steps.length-1) return null;
  const next = steps[i+1];
  order.status = next;
  const now = new Date().toISOString();
  order.progress = order.progress || [];
  order.progress.push({ ts: now, status: next, note: `Status updated to ${next}` });
  localStorage.setItem("sr_orders", JSON.stringify(all));
  return next;
}

// simulate advancing (used after demo checkout)
function simulateAdvance(orderId, status, note){
  const all = JSON.parse(localStorage.getItem("sr_orders") || "[]");
  const idx = all.findIndex(o=>o.id===orderId);
  if(idx<0) return;
  const now = new Date().toISOString();
  all[idx].status = status;
  all[idx].progress.push({ ts: now, status, note });
  localStorage.setItem("sr_orders", JSON.stringify(all));
}

// ----------------- Download progress report CSV -----------------
function downloadProgressReport(order){
  // prepare CSV rows: header + progress entries
  const rows = [
    ["Order ID", order.id],
    ["Service", order.serviceLabel || order.service],
    ["Quantity", order.quantity],
    ["Total (₹)", order.total],
    ["Email", order.email],
    ["Created At", order.createdAt],
    [],
    ["Timestamp","Status","Note"]
  ];
  (order.progress || []).forEach(p => {
    rows.push([p.ts, p.status, p.note || ""]);
  });
  // convert to CSV
  const csv = rows.map(r => r.map(field => `"${String(field).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${order.id}_progress_report.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ----------------- MY ORDERS (progress.html) -----------------
function initMyOrders(){
  const btn = document.getElementById("myorders-btn");
  if(!btn) return;
  btn.addEventListener("click", ()=>{
    const email = document.getElementById("myorders-email").value.trim();
    const list = document.getElementById("myorders-list");
    list.innerHTML = "";
    if(!email){ alert("Enter email used to place orders (demo)."); return; }
    const all = JSON.parse(localStorage.getItem("sr_orders") || "[]");
    const mine = all.filter(o => o.email && o.email.toLowerCase() === email.toLowerCase());
    if(mine.length === 0){ list.innerHTML = "<p>No orders found for this email in this browser (demo).</p>"; return; }
    mine.forEach(o => {
      const div = document.createElement("div");
      div.className = "order-card";
      div.innerHTML = `<div>
          <strong>${o.id}</strong><br><small>${o.serviceLabel || o.service} • ${o.quantity} • ₹${o.total.toFixed(2)}</small>
        </div>
        <div>
          <button class="btn" onclick="location.href='track.html?order=${o.id}'">View</button>
          <button class="btn outline" onclick='downloadProgressReport(${JSON.stringify(o)})'>Report</button>
        </div>`;
      list.appendChild(div);
    });
  });

  // if page opened with query ?email=..., prefill
  const params = new URLSearchParams(location.search);
  if(params.get("email")){
    document.getElementById("myorders-email").value = params.get("email");
    btn.click();
  }
}

// ----------------- CONTACT demo -----------------
function initContact(){
  const send = document.getElementById("contact-send");
  if(!send) return;
  send.addEventListener("click", ()=>{
    const name = document.getElementById("contact-name").value.trim();
    const email = document.getElementById("contact-email").value.trim();
    const msg = document.getElementById("contact-message").value.trim();
    if(!name||!email||!msg){ alert("Please fill all fields."); return; }
    alert("Message sent (demo). We'll reply soon.");
    document.getElementById("contact-name").value = "";
    document.getElementById("contact-email").value = "";
    document.getElementById("contact-message").value = "";
  });
}

// ----------------- Helper: If track.html loaded with ?order=ID, auto-fill and submit -----------------
(function autoOpenFromQuery(){
  if(location.pathname.endsWith("track.html")){
    const params = new URLSearchParams(location.search);
    const oid = params.get("order");
    if(oid){
      window.addEventListener("DOMContentLoaded", ()=>{
        document.getElementById("order-id").value = oid;
        document.getElementById("track-btn").click();
      });
    }
  }
})();