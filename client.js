import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ==============================================================
//  Auth
// ==============================================================

const loginBtn = document.getElementById("loginBtn");
const clientApp = document.getElementById("clientApp");

loginBtn.onclick = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};

onAuthStateChanged(auth, (user) => {
  const isAllowed =
    user &&
    user.email &&
    user.email.endsWith("@bargaincarrentals.com.au"); // keep your domain check

  if (isAllowed) {
    clientApp.style.display = "block";
    loginBtn.style.display = "none";
    init(); 
  } else {
    clientApp.style.display = "none";
    loginBtn.style.display = "block";
  }
});



// ==============================================================
// App
// ==============================================================

let dataCache = null;
const container = document.getElementById("tagInputsContainer");
const LOGO_URL = "./BCRLogo_rgb.jpg";
const QR_URL = "./QR-Code.png"

async function init() {
    const snap = await getDoc(doc(db, "vehicleData", "main"));
    if (snap.exists()) {
        dataCache = snap.data();
        populateGlobalDatalists();
        addTagRow();
    }
}

function populateGlobalDatalists() {
    // Sort Makes
    const sortedMakes = Object.keys(dataCache.makes || {}).sort();
    document.getElementById("makeList").innerHTML = sortedMakes
        .map(m => `<option value="${m.toUpperCase()}">`).join("");
    
    // Sort Colours
    const sortedColours = (dataCache.colours || []).sort();
    document.getElementById("colorList").innerHTML = sortedColours
        .map(c => `<option value="${c.toUpperCase()}">`).join("");
}

function addTagRow() {
    const rowId = Date.now();
    const row = document.createElement("div");
    row.className = "tag-row";
    row.innerHTML = `
        <input type="text" placeholder="Make" class="make-in" list="makeList" autocomplete="off">
        <input type="text" placeholder="Model" class="model-in" list="modelList-${rowId}" autocomplete="off">
        <input type="text" placeholder="Category" class="cat-in" list="catList-${rowId}" autocomplete="off">
        <input type="text" placeholder="Colour" class="color-in" list="colorList" autocomplete="off">
        <input type="text" placeholder="Rego" class="rego-in" autocomplete="off">
        <button class="remove-btn" onclick="this.parentElement.remove()">Remove</button>
        <datalist id="modelList-${rowId}"></datalist>
        <datalist id="catList-${rowId}"></datalist>
    `;
    container.appendChild(row);

    const mIn = row.querySelector(".make-in");
    const modIn = row.querySelector(".model-in");
    const catIn = row.querySelector(".cat-in");
    const modL = row.querySelector(`#modelList-${rowId}`);
    const catL = row.querySelector(`#catList-${rowId}`);

    mIn.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();
    modIn.value = ""; catIn.value = ""; catL.innerHTML = "";
    if (dataCache.makes[val]) {
        const sortedModels = Object.keys(dataCache.makes[val].models).sort();
        modL.innerHTML = sortedModels.map(m => `<option value="${m.toUpperCase()}">`).join("");
    }
});

    modIn.addEventListener("input", (e) => {
        const makeVal = mIn.value.toLowerCase();
        const modVal = e.target.value.toLowerCase();
        catIn.value = "";
        const categories = dataCache.makes[makeVal]?.models[modVal]?.categories || [];
        catL.innerHTML = categories.sort().map(c => `<option value="${c.toUpperCase()}">`).join("");
    });
}

document.getElementById("printBtn").onclick = async () => {
    const printArea = document.getElementById("printArea");
    printArea.innerHTML = ""; 

    const rows = document.querySelectorAll(".tag-row");
    
    // --- VALIDATION CHECK ---
    let allValid = true;
    rows.forEach(row => {
        const inputs = row.querySelectorAll("input");
        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = "red"; // Highlight missing fields
                allValid = false;
            } else {
                input.style.borderColor = "";
            }
        });
    });

    if (!allValid) {
        alert("Please fill in ALL fields for every car before printing.");
        return;
    }

    rows.forEach(row => {
        const make = row.querySelector(".make-in").value.toUpperCase();
        const model = row.querySelector(".model-in").value.toUpperCase();
        const cat = row.querySelector(".cat-in").value.toUpperCase();
        const color = row.querySelector(".color-in").value.toUpperCase();
        const rego = row.querySelector(".rego-in").value.toUpperCase();

        const fullRow = document.createElement("div");
        fullRow.className = "print-row";

        const createTagContainer = (isSpare = false) => `
            <div class="tag-container">
                <div class="crop-mark v-tick v-top tick-left"></div>
                <div class="crop-mark v-tick v-top tick-right"></div>
                
                <div class="crop-mark h-tick h-left tick-y"></div>
                <div class="crop-mark h-tick h-right tick-y"></div>
                <div class="crop-mark h-tick h-left tick-y-end"></div>
                <div class="crop-mark h-tick h-right tick-y-end"></div>

                <div class="crop-mark v-tick v-bottom tick-left"></div>
                <div class="crop-mark v-tick v-bottom tick-right"></div>

                <div class="tag-pair">
                    <div class="keytag-box front">
                        ${isSpare ? '<span class="spare-label">SPARE</span>' : ''}
                        <div class="tag-title">${make}</div>
                        <div class="tag-title">${model}</div>
                        <div class="tag-sub">${cat}</div>
                        <div class="tag-sub">${color}</div>
                        <div class="rego-badge">${rego || '------'}</div>
                    </div>
                    <div class="keytag-box back">
                        <div class="logo-area"><img src="${LOGO_URL}"></div>
                        <div class="bottom-area">
                            <div class="qr-box">
                                <img src="${QR_URL}" class="qr-img">
                            </div>
                            <div class="contact-box">
                                <div class="contact-info">Ph: +61 3 6165 0838<br>bargaincarrentals.com.au</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        fullRow.innerHTML = `
            ${createTagContainer(false)}
            <div class="spacer"></div>
            ${createTagContainer(true)}
        `;
        printArea.appendChild(fullRow);
    });

    // Wait for images logic
    const allImages = printArea.querySelectorAll("img");
    const imagePromises = Array.from(allImages).map(img => {
        return new Promise((resolve) => {
            if (img.complete) resolve();
            else { img.onload = () => resolve(); img.onerror = () => resolve(); }
        });
    });

    await Promise.all(imagePromises);
    setTimeout(() => { window.print(); }, 250);
};


// --- DOM Elements ---
const generateBtn = document.getElementById("generateBtn");
const finalPrintBtn = document.getElementById("finalPrintBtn");
const clearPreviewBtn = document.getElementById("clearPreviewBtn");
const printActionBar = document.getElementById("printActionBar");
const printArea = document.getElementById("printArea");

// --- GENERATE PREVIEW LOGIC ---
generateBtn.onclick = async () => {
    printArea.innerHTML = ""; // Reset
    const rows = document.querySelectorAll(".tag-row");
    
    // 1. Validation
    let allValid = true;
    rows.forEach(row => {
        row.querySelectorAll("input").forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = "red";
                allValid = false;
            } else {
                input.style.borderColor = "";
            }
        });
    });

    if (!allValid) return alert("Please fill in all fields before generating.");

    // 2. Build the Preview
    rows.forEach(row => {
        const make = row.querySelector(".make-in").value.toUpperCase();
        const model = row.querySelector(".model-in").value.toUpperCase();
        const cat = row.querySelector(".cat-in").value.toUpperCase();
        const color = row.querySelector(".color-in").value.toUpperCase();
        const rego = row.querySelector(".rego-in").value.toUpperCase();

        const fullRow = document.createElement("div");
        fullRow.className = "print-row";

        const createTagContainer = (isSpare = false) => `
            <div class="tag-container">
                <div class="crop-mark v-tick v-top tick-left"></div>
                <div class="crop-mark v-tick v-top tick-right"></div>
                <div class="crop-mark h-tick h-left tick-y"></div>
                <div class="crop-mark h-tick h-right tick-y"></div>
                <div class="crop-mark h-tick h-left tick-y-end"></div>
                <div class="crop-mark h-tick h-right tick-y-end"></div>
                <div class="crop-mark v-tick v-bottom tick-left"></div>
                <div class="crop-mark v-tick v-bottom tick-right"></div>

                <div class="tag-pair">
                    <div class="keytag-box front">
                        ${isSpare ? '<span class="spare-label">SPARE</span>' : ''}
                        <div class="tag-title">${make}</div>
                        <div class="tag-title">${model}</div>
                        <div class="tag-sub">${cat}</div>
                        <div class="tag-sub">${color}</div>
                        <div class="rego-badge">${rego || '------'}</div>
                    </div>
                    <div class="keytag-box back">
                        <div class="logo-area"><img src="${LOGO_URL}"></div>
                        <div class="bottom-area">
                            <div class="qr-box">
                                <img src="${QR_URL}" class="qr-img">
                            </div>
                            <div class="contact-box">
                                <div class="contact-info">Ph: +61 3 6165 0838<br>bargaincarrentals.com.au</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        fullRow.innerHTML = `${createTagContainer(false)}<div class="spacer"></div>${createTagContainer(true)}`;
        printArea.appendChild(fullRow);
    });

    // 3. Show the preview
    printArea.classList.add("visible");
    printActionBar.style.display = "block";
    
    // Scroll smoothly to the preview
    printArea.scrollIntoView({ behavior: 'smooth' });
};

// --- FINAL PRINT TRIGGER ---
finalPrintBtn.onclick = async () => {
    // Wait for images one last time just in case
    const allImages = printArea.querySelectorAll("img");
    const imagePromises = Array.from(allImages).map(img => {
        return new Promise((resolve) => {
            if (img.complete) resolve();
            else { img.onload = () => resolve(); img.onerror = () => resolve(); }
        });
    });

    await Promise.all(imagePromises);
    window.print();
};


// --- CLEAR LOGIC ---
clearPreviewBtn.onclick = () => {
    printArea.innerHTML = "";
    printArea.classList.remove("visible");
    printActionBar.style.display = "none";
    window.scrollTo({ top: 0, behavior: 'smooth' });
};


document.getElementById("addTagBtn").onclick = addTagRow;
