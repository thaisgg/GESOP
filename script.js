// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD4szaF2xY7HdVbC-ZpHzEHKCPchNVo6SE",
  authDomain: "consentiment-rm.firebaseapp.com",
  projectId: "consentiment-rm",
  storageBucket: "consentiment-rm.appspot.com", // corregido aquí
  messagingSenderId: "843641705557",
  appId: "1:843641705557:web:e2f1a5195a068f163b30dc"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Canvas para firma
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

  // Convertir firma a blob
  canvas.toBlob(async (blob) => {
    try {
      // Crear referencia única para firma
      const filename = firmes/${Date.now()}_${dni || 'anonim'}.png;
      const storageRef = storage.ref().child(filename);

      // Subir imagen
      await storageRef.put(blob);

      // Obtener URL de descarga
      const downloadURL = await storageRef.getDownloadURL();

      // Guardar datos en Firestore
      await db.collection("formularis").add({
        nom,
        dni,
        data,
        conformitat,
        firmaURL: downloadURL,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert("Formulari enviat correctament!");
      e.target.reset();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error("Error al enviar el formulari:", error);
      alert("Hi ha hagut un error. Torna-ho a intentar.");
    }
  });
});
