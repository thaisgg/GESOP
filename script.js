// Firebase modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

// Configuración del proyecto
const firebaseConfig = {
  apiKey: "AIzaSyD4szaF2xY7HdVbC-ZpHzEHKCPchNVo6SE",
  authDomain: "consentiment-rm.firebaseapp.com",
  projectId: "consentiment-rm",
  storageBucket: "consentiment-rm.appspot.com", // <- Corregido
  messagingSenderId: "843641705557",
  appId: "1:843641705557:web:e2f1a5195a068f163b30dc"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Firma canvas
const canvas = document.getElementById("signature-pad");
const ctx = canvas.getContext("2d");
let drawing = false;

canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => {
  drawing = false;
  ctx.beginPath();
});
canvas.addEventListener("mouseleave", () => drawing = false);
canvas.addEventListener("mousemove", draw);

function draw(e) {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";

  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

document.getElementById("clear").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Formulario
document.getElementById("consent-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nom = document.getElementById("nom").value;
  const dni = document.getElementById("dni").value;
  const data = document.getElementById("data").value;
  const conformitat = document.getElementById("conformitat").value;

  if (conformitat === "") {
    alert("Si us plau, selecciona si dones conformitat.");
    return;
  }

  canvas.toBlob(async (blob) => {
    try {
      const filename = firmes/${Date.now()}_${dni || 'anonim'}.png;
      const firmaRef = ref(storage, filename);
      await uploadBytes(firmaRef, blob);
      const downloadURL = await getDownloadURL(firmaRef);

      await addDoc(collection(db, "formularis"), {
        nom,
        dni,
        data,
        conformitat,
        firmaURL: downloadURL,
        timestamp: serverTimestamp()
      });

      alert("Formulari enviat correctament!");
      e.target.reset();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } catch (err) {
      console.error("Error enviant el formulari:", err);
      alert("Error. Torna-ho a provar.");
    }
  });
});
