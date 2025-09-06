let db;

async function init() {
  const SQL = await initSqlJs({ locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}` });
  db = new SQL.Database();

  // Cria tabela direto no JS
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    phone TEXT,
    created_at TEXT NOT NULL
  );`);

  showMsg("Banco inicializado!");
}

function showMsg(msg, color="green") {
  const el = document.getElementById("msg");
  el.textContent = msg;
  el.style.color = color;
}

// Hash SHA-256
async function hash(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

// Registrar usuário
async function register() {
  const u = document.getElementById("regUser").value;
  const p = document.getElementById("regPass").value;
  const ph = document.getElementById("regPhone").value;
  if(!u || !p){ showMsg("Preencha usuário e senha.", "red"); return; }
  const salt = Math.random().toString(36).slice(2);
  const passHash = await hash(p + salt);
  const created = new Date().toISOString();

  try {
    db.run("INSERT INTO users (username,password_hash,salt,phone,created_at) VALUES (?,?,?,?,?)",
           [u, passHash, salt, ph, created]);
    showMsg("Usuário registrado com sucesso!");
  } catch(e) {
    showMsg("Erro: " + e.message, "red");
  }
}

// Login
async function login() {
  const u = document.getElementById("logUser").value;
  const p = document.getElementById("logPass").value;
  if(!u || !p){ showMsg("Preencha login e senha.", "red"); return; }

  const stmt = db.prepare("SELECT * FROM users WHERE username=?");
  stmt.bind([u]);
  if(stmt.step()) {
    const row = stmt.getAsObject();
    const passHash = await hash(p + row.salt);
    if(passHash === row.password_hash) showMsg("Login OK! Bem-vindo " + u);
    else showMsg("Senha incorreta!", "red");
  } else {
    showMsg("Usuário não encontrado!", "red");
  }
}

// Eventos
window.addEventListener("DOMContentLoaded", () => {
  init();
  document.getElementById("btnRegister").addEventListener("click", register);
  document.getElementById("btnLogin").addEventListener("click", login);
});
