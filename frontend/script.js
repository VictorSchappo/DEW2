/* =========================================
   CONFIGURAÇÃO GLOBAL
   ========================================= */
// Aqui definimos onde está o Backend.
// Isso corrige o erro de "Unexpected end of JSON input"
const API_BASE = 'http://localhost:3000'; 

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Helper: Toast visual (mensagem curta) ---------- */
  function showToast(message, success = true) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    // estilo inline simples pra garantir que funcione sem depender de CSS adicional
    t.style.position = 'fixed';
    t.style.left = '50%';
    t.style.transform = 'translateX(-50%)';
    t.style.bottom = '28px';
    t.style.zIndex = 9999;
    t.style.opacity = '0';
    t.style.transition = 'opacity .24s ease, transform .28s ease';
    t.style.padding = '10px 14px';
    t.style.borderRadius = '10px';
    t.style.color = '#fff';
    t.style.fontWeight = '600';
    t.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
    t.style.background = success ? 'rgba(65,49,38,0.95)' : 'rgba(200,40,40,0.95)';
    document.body.appendChild(t);
    
    requestAnimationFrame(() => {
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(-6px)';
    });
    
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(() => t.remove(), 300);
    }, 2200);
  }

  /* ---------- Registro (criar-conta.html) ---------- */
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(registerForm);
      const name = fd.get('name')?.toString().trim();
      const email = fd.get('email')?.toString().trim();
      const pw = fd.get('password')?.toString();
      const conf = fd.get('confirm')?.toString();

      // validações simples no front-end
      if (!name || !email || !pw || !conf) { showToast('Preencha todos os campos.', false); return; }
      if (pw.length < 6) { showToast('A senha precisa ter no mínimo 6 caracteres.', false); return; }
      if (pw !== conf) { showToast('As senhas não coincidem.', false); return; }

      const btn = registerForm.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Criando...';

      // envia dados para o backend:
      try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password: pw })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');

        showToast('Conta criada com sucesso! ✔️', true);
        setTimeout(() => { window.location.href = 'login.html'; }, 700);
      } catch (err) {
        showToast(err.message || 'Erro', false);
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }

  /* ---------- Login (login.html) ---------- */
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const email = fd.get('email')?.toString().trim();
      const pw = fd.get('password')?.toString();

      if (!email || !pw) { showToast('Preencha e-mail e senha.', false); return; }

      const btn = loginForm.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Entrando...';

      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pw })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Credenciais inválidas');

        // Login com sucesso
        showToast('Bem-vindo(a)!', true);
        setTimeout(() => { window.location.href = 'loja.html'; }, 700);
      } catch (err) {
        showToast(err.message || 'Erro no login', false);
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }

  /* ---------- Admin: Cadastro, Edição e Lista (admin.html) ---------- */
  const productForm = document.getElementById('product-form');
  const imageInput = document.getElementById('image-input');
  const preview = document.getElementById('preview');
  const previewMeta = document.getElementById('preview-meta');
  const productsList = document.getElementById('products-list');
  const refreshBtn = document.getElementById('refresh-list');

  // Preview simples da imagem
  if (imageInput) {
    imageInput.addEventListener('change', () => {
      const f = imageInput.files[0];
      if (!f) {
        preview.style.display = 'none';
        preview.src = '';
        previewMeta.textContent = '';
        return;
      }
      const url = URL.createObjectURL(f);
      preview.src = url;
      preview.style.display = 'block';
      previewMeta.textContent = `${f.name} • ${(f.size/1024).toFixed(1)} KB`;
    });
  }

  // Função para buscar produtos existentes
  window.fetchProducts = async function() {
    if (!productsList) return;
    productsList.innerHTML = '<p style="color:var(--muted-600)">Carregando...</p>';
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      const data = await res.json();
      productsList.innerHTML = '';
      
      if (!Array.isArray(data) || data.length === 0) {
        productsList.innerHTML = '<div style="color:var(--muted-600)">Nenhum produto cadastrado.</div>';
        return;
      }
      
      data.forEach(p => {
        // Corrige URL da imagem
        const imgUrl = p.image_url ? (p.image_url.startsWith('http') ? p.image_url : API_BASE + p.image_url) : '';

        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '12px';
        card.innerHTML = `
          <img src="${imgUrl}" alt="${p.title}" style="width:100%; height:180px; object-fit:cover; border-radius:10px; margin-bottom:10px;">
          <strong style="display:block">${p.title}</strong>
          <div style="color:var(--muted-600); font-size:13px; margin:6px 0">${p.description || ''}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px">
            <span>R$ ${Number(p.price).toFixed(2)}</span>
            <div style="display:flex; gap:8px">
              <button data-id="${p.id}" class="btn outline btn-edit" style="font-size:12px; padding:6px 10px;">Editar</button>
              <button data-id="${p.id}" class="btn outline btn-delete" style="font-size:12px; padding:6px 10px; color:red; border-color:red;">Apagar</button>
            </div>
          </div>
        `;
        productsList.appendChild(card);
      });
    } catch (err) {
      productsList.innerHTML = '<div style="color:crimson">Erro ao carregar produtos</div>';
    }
  }

  // Carrega lista se estiver no admin
  if (productsList) fetchProducts();
  if (refreshBtn) refreshBtn.addEventListener('click', fetchProducts);

  // Lógica do Formulário (Criar / Editar)
  if (productForm) {
    let editingId = null; // Variável de controle

    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(productForm);
      const title = fd.get('title');
      const price = fd.get('price');
      
      if (!title || !price) {
        showToast('Preencha os campos obrigatórios.', false);
        return;
      }

      // Se for novo cadastro, exige imagem
      if (!editingId && imageInput.files.length === 0) {
        showToast('A imagem é obrigatória para novos produtos.', false);
        return;
      }

      const btn = productForm.querySelector('button[type="submit"]');
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = editingId ? 'Salvando...' : 'Cadastrando...';

      try {
        const url = editingId ? `${API_BASE}/api/products/${editingId}` : `${API_BASE}/api/products`;
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method: method,
          body: fd 
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro na operação');

        showToast(editingId ? 'Produto atualizado!' : 'Produto cadastrado!', true);
        
        // Reset
        productForm.reset();
        preview.style.display = 'none';
        editingId = null;
        btn.textContent = 'Cadastrar Produto';
        
        fetchProducts();
      } catch (err) {
        showToast(err.message || 'Erro', false);
        btn.textContent = orig;
      } finally {
        btn.disabled = false;
      }
    });

    // Eventos da lista (Editar / Apagar)
    if (productsList) {
      productsList.addEventListener('click', async (e) => {
        const t = e.target;
        
        // APAGAR
        if (t.matches('.btn-delete')) {
          if (!confirm('Deseja realmente apagar?')) return;
          const id = t.dataset.id;
          try {
            await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
            showToast('Produto removido', true);
            fetchProducts();
          } catch (err) {
            showToast('Erro ao apagar', false);
          }
        }
        
        // EDITAR
        if (t.matches('.btn-edit')) {
          const id = t.dataset.id;
          try {
            const res = await fetch(`${API_BASE}/api/products/${id}`);
            const p = await res.json();
            
            productForm.querySelector('[name="title"]').value = p.title;
            productForm.querySelector('[name="description"]').value = p.description || '';
            productForm.querySelector('[name="price"]').value = p.price;
            productForm.querySelector('[name="stock"]').value = p.stock;
            
            if (p.image_url) {
              preview.src = p.image_url.startsWith('http') ? p.image_url : API_BASE + p.image_url;
              preview.style.display = 'block';
            }

            editingId = id;
            productForm.querySelector('button[type="submit"]').textContent = 'Salvar Alterações';
            productForm.scrollIntoView({ behavior: 'smooth' });
            showToast('Modo de edição ativado', true);

          } catch (err) {
            showToast('Erro ao carregar edição', false);
          }
        }
      });
    }
  }

  /* ---------- VITRINE / LOJA (loja.html) ---------- */
  const fashionGrid = document.getElementById('fashion-grid');
  if (fashionGrid) {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        const products = await res.json();
        
        fashionGrid.innerHTML = '';

        if (!Array.isArray(products) || products.length === 0) {
          fashionGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center">Nenhum produto encontrado.</p>';
          return;
        }

        products.forEach(p => {
          // Lógica fake para imitar a foto (Gatabakana)
          const priceNumber = parseFloat(p.price);
          const oldPrice = (priceNumber * 1.4).toFixed(2).replace('.', ',');
          const currentPrice = priceNumber.toFixed(2).replace('.', ',');
          const installmentValue = (priceNumber / 4).toFixed(2).replace('.', ',');
          
          // Corrige URL da imagem para a loja
          const imgUrl = p.image_url ? (p.image_url.startsWith('http') ? p.image_url : API_BASE + p.image_url) : '';

          const card = document.createElement('div');
          card.className = 'fashion-card';
          
          card.innerHTML = `
            <div class="card-img-container">
              <span class="badge-off">NEW</span>
              <img src="${imgUrl}" alt="${p.title}" class="fashion-img">
            </div>
            
            <div class="card-info">
              <div class="card-title-fashion">${p.title}</div>
              
              <div class="card-prices">
                <span class="old-price">R$ ${oldPrice}</span>
                <span class="current-price">R$ ${currentPrice}</span>
              </div>
              
              <div class="installments">4x R$ ${installmentValue}</div>
              <span class="color-swatch"></span>
            </div>
          `;
          
          fashionGrid.appendChild(card);
        });
      } catch (err) {
        console.error(err);
        fashionGrid.innerHTML = '<p style="text-align:center; color:red">Erro ao carregar produtos.</p>';
      }
    })();
  }
});