import { auth, db } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let dataCache = null;

// --- DOM ELEMENTS ---
const makeInput = document.getElementById("makeInput");
const modelInput = document.getElementById("modelInput");
const categoryInput = document.getElementById("categoryInput");
const removeMakeInput = document.getElementById("removeMakeInput");
const removeModelInput = document.getElementById("removeModelInput");
const removeCategoryInput = document.getElementById("removeCategoryInput");
const colorInput = document.getElementById("colorInput");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");

// --- EVENT LISTENERS (Filtering Logic) ---

makeInput.addEventListener("input", (e) => {
  populateModelList(e.target.value.toLowerCase());
  modelInput.value = "";
  categoryInput.value = "";
});

modelInput.addEventListener("input", (e) => {
  populateCategoryList(makeInput.value.toLowerCase(), e.target.value.toLowerCase());
  categoryInput.value = "";
});

removeMakeInput.addEventListener("input", (e) => {
  populateModelList(e.target.value.toLowerCase());
  removeModelInput.value = "";
  removeCategoryInput.value = "";
});

removeModelInput.addEventListener("input", (e) => {
  populateCategoryList(removeMakeInput.value.toLowerCase(), e.target.value.toLowerCase());
  removeCategoryInput.value = "";
});

// --- AUTH LOGIC ---
loginBtn.onclick = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Login Error:", error);
  }
};

onAuthStateChanged(auth, (user) => {
  if (user && user.email.endsWith("@bargaincarrentals.com.au")) {
    adminPanel.style.display = "block";
    loginBtn.style.display = "none"; // Hide login button when authenticated
    loadData();
  } else {
    adminPanel.style.display = "none";
    loginBtn.style.display = "block";
  }
});

async function loadData() {
  const snap = await getDoc(doc(db, "vehicleData", "main"));
  dataCache = snap.exists() ? snap.data() : { makes: {}, colours: [] };
  updateAllDatalists();
}

// --- UI UPDATES ---
function updateAllDatalists() {
  populateMakeList();
  populateColorList();
}

function populateMakeList() {
  const list = document.getElementById("makeList");
  // Get the keys, sort them alphabetically, then map to options
  const sortedMakes = Object.keys(dataCache.makes || {}).sort();
  
  list.innerHTML = sortedMakes
    .map(m => `<option value="${m.toUpperCase()}">`).join("");
}

function populateModelList(make) {
  const list = document.getElementById("modelList");
  if (!make || !dataCache.makes[make]) {
    list.innerHTML = "";
    return;
  }
  // Get models, sort them, then map
  const sortedModels = Object.keys(dataCache.makes[make].models).sort();
  
  list.innerHTML = sortedModels
    .map(m => `<option value="${m.toUpperCase()}">`).join("");
}

function populateCategoryList(make, model) {
  const list = document.getElementById("categoryList");
  const categories = dataCache.makes[make]?.models[model]?.categories || [];
  
  // Sort the categories array alphabetically
  list.innerHTML = categories.sort()
    .map(c => `<option value="${c.toUpperCase()}">`).join("");
}

function populateColorList() {
  const list = document.getElementById("colorList");
  const colors = dataCache.colours || [];
  
  // Sort the colors array alphabetically
  list.innerHTML = colors.sort()
    .map(c => `<option value="${c.toUpperCase()}">`).join("");
}

// --- DATABASE ACTIONS ---

// ADD / UPDATE
document.getElementById("addEntryBtn").onclick = async () => {
  const make = makeInput.value.trim().toLowerCase();
  const model = modelInput.value.trim().toLowerCase();
  const category = categoryInput.value.trim().toLowerCase();

  if (!make || !model) return alert("Make and Model required");

  let updatedData = JSON.parse(JSON.stringify(dataCache));

  if (!updatedData.makes[make]) updatedData.makes[make] = { models: {} };
  if (!updatedData.makes[make].models[model]) updatedData.makes[make].models[model] = { categories: [] };
  
  if (category && !updatedData.makes[make].models[model].categories.includes(category)) {
    updatedData.makes[make].models[model].categories.push(category);
  }

  try {
    await setDoc(doc(db, "vehicleData", "main"), updatedData);
    dataCache = updatedData;
    updateAllDatalists();
    alert("Saved Successfully");
  } catch (e) { 
    handleFirebaseError(e, "Saving Entry")
  }
};

// REMOVE ENTRY
document.getElementById("removeEntryBtn").onclick = async () => {
  const make = removeMakeInput.value.trim().toLowerCase();
  const model = removeModelInput.value.trim().toLowerCase();
  const category = removeCategoryInput.value.trim().toLowerCase();

  if (!make) return alert("Enter at least a Make to delete.");

  let displayPath = [make, model, category].filter(Boolean).map(s => s.toUpperCase()).join(" > ");
  if (!confirm(`Are you sure you want to delete "${displayPath}"?`)) return;

  let updatedData = JSON.parse(JSON.stringify(dataCache));

  if (updatedData.makes[make]) {
    if (!model) {
      delete updatedData.makes[make];
    } else if (updatedData.makes[make].models[model]) {
      if (!category) {
        delete updatedData.makes[make].models[model];
      } else {
        updatedData.makes[make].models[model].categories = 
          updatedData.makes[make].models[model].categories.filter(c => c !== category);
      }
    }
  }

  try {
    await setDoc(doc(db, "vehicleData", "main"), updatedData);
    dataCache = updatedData;
    updateAllDatalists();
    removeMakeInput.value = "";
    removeModelInput.value = "";
    removeCategoryInput.value = "";
    alert("Deleted successfully");
  } catch (e) { 
    handleFirebaseError(e, "Saving Entry")
   }
};

// COLOUR MANAGEMENT
document.getElementById("addColorBtn").onclick = async () => {
  const color = colorInput.value.trim().toLowerCase();
  if (!color || dataCache.colours.includes(color)) return;

  let updatedData = JSON.parse(JSON.stringify(dataCache));
  updatedData.colours.push(color);

  try {
    await setDoc(doc(db, "vehicleData", "main"), updatedData);
    dataCache = updatedData;
    updateAllDatalists();
    colorInput.value = "";
    alert("Colour added");
  } catch (e) { 
    handleFirebaseError(e, "Saving Entry")
   }
};

document.getElementById("removeColorBtn").onclick = async () => {
  const color = colorInput.value.trim().toLowerCase();
  if (!color || !dataCache.colours.includes(color)) return;

  if (!confirm(`Delete colour "${color.toUpperCase()}"?`)) return;

  let updatedData = JSON.parse(JSON.stringify(dataCache));
  updatedData.colours = updatedData.colours.filter(c => c !== color);

  try {
    await setDoc(doc(db, "vehicleData", "main"), updatedData);
    dataCache = updatedData;
    updateAllDatalists();
    colorInput.value = "";
    alert("Colour removed");
  } catch (e) { 
    handleFirebaseError(e, "Saving Entry")
   }
};

function handleFirebaseError(error, action) {
    console.error(`❌ ${action} failed:`, error.code, error.message);
    
    if (error.code === 'permission-denied') {
        alert("⛔ Access Denied: You do not have permission to edit the database. Please contact the administrator.");
    } else {
        alert(`❌ Error: ${error.message}`);
    }
}