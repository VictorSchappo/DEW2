// Shared JS para validação simples e toasts nas 3 páginas
document.addEventListener('DOMContentLoaded', () => {
  // Helper de toast
  function showToast(message, success=true){
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    t.style.position = 'fixed';
    t.style.left = '50%';
    t.style.transform = 'translateX(-50%)';
    t.style.bottom = '28px';
    t.style.zIndex = 9999;
    t.style.opacity = '0';
    t.style.transition = 'opacity .24s ease, transform .28s ease';
    if(success){
      t.style.background = 'rgba(65,49,38,0.95)';
    } else {
      t.style.background = 'rgba(200,40,40,0.95)';
    }
    document.body.appendChild(t);
    requestAnimationFrame(() => {
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(-6px)';
    });
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(()=>t.remove(), 300);
    }, 2200);
  }

  // Registro (criar-conta.html)
  const registerForm = document.getElementById('register-form');
    if(registerForm){
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(registerForm);
      const name = fd.get('name')?.toString().trim(); // confirme se é name ou nome
      const email = fd.get('email')?.toString().trim();
      const pw = fd.get('senha')?.toString(); // confirme se é senha ou password
      const conf = fd.get('confirm')?.toString();

      if(!name || !email || !pw || !conf){ 
        showToast('Preencha todos os campos.', false); 
        return; 
      }
      if(pw.length < 6){ showToast('A senha precisa ter no mínimo 6 caracteres.', false); return; }
      if(pw !== conf){ showToast('As senhas não coincidem.', false); return; }
      if (/\d/.test (name)){ showToast('Somente letras no nome', false); return; }

      const btn = registerForm.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Criando...';

      fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nome: name, 
          email: email, 
          senha: pw 
        })
      })
      .then(r => r.json())
      .then(data => {
        btn.disabled = false;
        btn.textContent = original;

        if (data.error) {
          showToast(data.error, false);
          return;
        }

        showToast("Conta criada com sucesso! ✔️", true);
        setTimeout(() => { window.location.href = 'login.html'; }, 600);
      })
      .catch(() => {
        btn.disabled = false;
        btn.textContent = original;
        showToast("Erro ao conectar ao servidor.", false);
      });
    });
  } 
  
  // Login (login.html)
  const loginForm = document.getElementById('login-form');
  if(loginForm){
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const email = fd.get('email')?.toString().trim();
      const pw = fd.get('senha')?.toString();

      if(!email || !pw){ showToast('Preencha e-mail e senha.', false); return; }

      const btn = loginForm.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Entrando...';

      fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email, 
          senha: pw 
        })
      })
      .then(r => r.json())
      .then(data => {
        btn.disabled = false;
        btn.textContent = original;

        if (data.error) {
          showToast(data.error, false);
          return;
        }

        showToast("Bem-vindo(a)!", true);
        setTimeout(() => { window.location.href = 'index.html'; }, 800);
      })
      .catch(() => {
        btn.disabled = false;
        btn.textContent = original;
        showToast("Erro ao conectar ao servidor.", false);
      });
      });
  }
});
