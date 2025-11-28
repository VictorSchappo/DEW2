/* =========================================
   CONFIGURAÇÃO GLOBAL
   ========================================= */
const API_BASE = 'http://localhost:3000'; 

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Helper: Toast visual (mensagem curta) ---------- */
  function showToast(message, success = true) {
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

  /* ==================================================================
     1. LÓGICA DE USUÁRIO (Logout e Proteção de Página)
     ================================================================== */
  const token = localStorage.getItem('user_token');
  
  // A. Configura botão de Sair (Logout)
  const userLink = document.querySelector('a[href="login.html"]');
  if (token && userLink) {
    userLink.href = "#";
    userLink.innerHTML = '<span class="material-symbols-outlined" title="Sair (Logout)">logout</span>';
    userLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user_token');
        showToast('Você saiu da conta.', true);
        setTimeout(() => { window.location.href = 'login.html'; }, 1000);
    });
  }

  // B. BLOQUEIO DA PÁGINA VESTIDOS (Se não estiver logado)
  if (window.location.pathname.includes('vestidos.html') && !token) {
      document.body.style.display = 'none';
      alert('Área restrita. Faça login para ver a coleção.');
      window.location.href = 'login.html';
      return;
  }

  /* ==================================================================
     2. FORMULÁRIOS DE AUTENTICAÇÃO
     ================================================================== */
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      // ... (Lógica de registro mantida igual) ...
      const fd = new FormData(registerForm);
      const name = fd.get('name')?.toString().trim();
      const email = fd.get('email')?.toString().trim();
      const pw = fd.get('password')?.toString();
      const conf = fd.get('confirm')?.toString();
      
      if(!name || !email || !pw || !conf) { showToast('Preencha tudo.', false); return; }
      if(pw !== conf) { showToast('Senhas não batem.', false); return; }

      try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
           method: 'POST', headers: {'Content-Type': 'application/json'},
           body: JSON.stringify({name, email, password: pw})
        });
        if(!res.ok) throw new Error('Erro ao criar conta');
        showToast('Conta criada!', true);
        setTimeout(()=> window.location.href='login.html', 1000);
      } catch(err) { showToast(err.message, false); }
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const email = fd.get('email');
      const pw = fd.get('password');

      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
           method: 'POST', headers: {'Content-Type': 'application/json'},
           body: JSON.stringify({email, password: pw})
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.error || 'Erro no login');
        
        localStorage.setItem('user_token', data.token || 'temp-token');
        showToast('Bem-vindo!', true);
        setTimeout(()=> window.location.href='loja.html', 1000);
      } catch(err) { showToast(err.message, false); }
    });
  }

  /* ==================================================================
     3. ADMINISTRAÇÃO (Cores, Imagens, CRUD)
     ================================================================== */
  
  /* --- A. NOVA LÓGICA DE CORES (PREVIEW) --- */
  // Mapeia o "value" do <option> para uma cor Hexadecimal real
  const colorMap = {
    'preto': '#000000',
    'branco': '#ffffff',
    'bege': '#eaddcf',
    'marrom': '#8b4513',
    'café': '#4b3621',
    'cinza': '#808080',
    'azul_marinho': '#000080',
    'azul_claro': '#add8e6',
    'verde_militar': '#4b5320',
    'verde_claro': '#90ee90',
    'vermelho': '#800000',
    'rosa': '#fa8072',
    'mostarda': '#e1ad01',
    'lilas': '#e6e6fa',
    'dourado': '#ffd700',
    'prateado': '#c0c0c0',
    'estampado': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #f6d365 100%)'
  };

  const selPrimary = document.getElementById('primary_color');
  const divPrimary = document.getElementById('preview-primary-circle');
  const selSecondary = document.getElementById('secondary_color');
  const divSecondary = document.getElementById('preview-secondary-circle');

  function updateColorPreview(selectInfo, divPreview) {
    if (!selectInfo || !divPreview) return;
    const val = selectInfo.value;
    const color = colorMap[val];

    if (color) {
      divPreview.style.background = color;
      divPreview.classList.remove('empty');
      // Borda sutil para branco
      divPreview.style.border = (val === 'branco') ? '1px solid #ccc' : '1px solid rgba(0,0,0,0.1)';
    } else {
      divPreview.style.background = 'transparent';
      divPreview.classList.add('empty');
    }
  }

  // Adiciona os eventos para mudar a bolinha quando troca o select
  if (selPrimary) selPrimary.addEventListener('change', () => updateColorPreview(selPrimary, divPrimary));
  if (selSecondary) selSecondary.addEventListener('change', () => updateColorPreview(selSecondary, divSecondary));

  /* --- B. Lógica do Formulário --- */
  const productForm = document.getElementById('product-form');
  const imageInput = document.getElementById('image-input');
  const preview = document.getElementById('preview');
  const previewMeta = document.getElementById('preview-meta');
  const productsList = document.getElementById('products-list');
  const refreshBtn = document.getElementById('refresh-list');

  // Preview da Imagem
  if (imageInput) {
    imageInput.addEventListener('change', () => {
      const f = imageInput.files[0];
      if (!f) {
        preview.style.display = 'none'; preview.src = ''; previewMeta.textContent = ''; return;
      }
      preview.src = URL.createObjectURL(f);
      preview.style.display = 'block';
      previewMeta.textContent = `${f.name}`;
    });
  }

  // Buscar Produtos
  window.fetchProducts = async function() {
    if (!productsList) return;
    productsList.innerHTML = '<p style="color:var(--muted-600)">Carregando...</p>';
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      const data = await res.json();
      productsList.innerHTML = '';
      
      if (!data || data.length === 0) {
        productsList.innerHTML = '<div style="color:var(--muted-600)">Nenhum produto.</div>';
        return;
      }
      
      data.forEach(p => {
        const imgUrl = p.image_url ? (p.image_url.startsWith('http') ? p.image_url : API_BASE + p.image_url) : '';
        const card = document.createElement('div');
        card.className = 'card';
        card.style.padding = '12px';
        card.innerHTML = `
          <img src="${imgUrl}" alt="${p.title}" style="width:100%; height:180px; object-fit:cover; border-radius:10px; margin-bottom:10px;">
          <strong style="display:block">${p.title}</strong>
          <div style="font-size:12px; color:gray">Cor: ${p.primary_color || '-'}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px">
            <span>R$ ${Number(p.price).toFixed(2)}</span>
            <div style="display:flex; gap:8px">
              <button data-id="${p.id}" class="btn outline btn-edit" style="font-size:12px; padding:6px 10px;">Editar</button>
              <button data-id="${p.id}" class="btn outline btn-delete" style="font-size:12px; padding:6px 10px; color:red; border-color:red;">X</button>
            </div>
          </div>
        `;
        productsList.appendChild(card);
      });
    } catch (err) { productsList.innerHTML = 'Erro ao carregar'; }
  }

  if (productsList) fetchProducts();
  if (refreshBtn) refreshBtn.addEventListener('click', fetchProducts);

  // Envio do Formulário (Salvar)
  if (productForm) {
    let editingId = null;

    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(productForm);
      
      if (!fd.get('title') || !fd.get('price')) { showToast('Preencha os campos.', false); return; }
      if (!editingId && imageInput.files.length === 0) { showToast('Imagem obrigatória.', false); return; }

      const btn = productForm.querySelector('button[type="submit"]');
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Salvando...';

      try {
        const url = editingId ? `${API_BASE}/api/products/${editingId}` : `${API_BASE}/api/products`;
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, { method: method, body: fd });
        if (!res.ok) throw new Error('Erro ao salvar');

        showToast(editingId ? 'Atualizado!' : 'Cadastrado!', true);
        
        productForm.reset();
        
        // Reseta as bolinhas de cor
        if(divPrimary) { divPrimary.style.background = 'transparent'; divPrimary.classList.add('empty'); }
        if(divSecondary) { divSecondary.style.background = 'transparent'; divSecondary.classList.add('empty'); }
        
        preview.style.display = 'none';
        editingId = null;
        btn.textContent = 'Cadastrar Produto';
        fetchProducts();
      } catch (err) {
        showToast('Erro ao salvar', false);
        btn.textContent = orig;
      } finally { btn.disabled = false; }
    });

    // Botões de Editar / Apagar
    if (productsList) {
      productsList.addEventListener('click', async (e) => {
        const t = e.target;
        if (t.matches('.btn-delete')) {
          if (!confirm('Apagar?')) return;
          try {
            await fetch(`${API_BASE}/api/products/${t.dataset.id}`, { method: 'DELETE' });
            fetchProducts();
          } catch(err) { showToast('Erro ao apagar', false); }
        }
        if (t.matches('.btn-edit')) {
          const id = t.dataset.id;
          try {
            const res = await fetch(`${API_BASE}/api/products/${id}`);
            const p = await res.json();
            
            // Preenche os campos de texto
            productForm.querySelector('[name="title"]').value = p.title;
            productForm.querySelector('[name="description"]').value = p.description || '';
            productForm.querySelector('[name="price"]').value = p.price;
            productForm.querySelector('[name="stock"]').value = p.stock;

            // Preenche as CORES e atualiza as bolinhas
            if (p.primary_color) {
                const el = productForm.querySelector('[name="primary_color"]');
                if(el) { el.value = p.primary_color; updateColorPreview(el, divPrimary); }
            }
            if (p.secondary_color) {
                const el = productForm.querySelector('[name="secondary_color"]');
                if(el) { el.value = p.secondary_color; updateColorPreview(el, divSecondary); }
            }

            // Preenche imagem
            if (p.image_url) {
              preview.src = p.image_url.startsWith('http') ? p.image_url : API_BASE + p.image_url;
              preview.style.display = 'block';
            }

            editingId = id;
            productForm.querySelector('button[type="submit"]').textContent = 'Salvar Alterações';
            productForm.scrollIntoView({ behavior: 'smooth' });
            showToast('Editando...', true);
          } catch(err) { showToast('Erro ao carregar', false); }
        }
      });
    }
  }

  /* ==================================================================
     4. VITRINE E FILTRAGEM
     ================================================================== */
  const fashionGrid = document.getElementById('fashion-grid') || document.getElementById('vestidos-grid');
  
  if (fashionGrid) {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        const allProducts = await res.json();
        
        fashionGrid.innerHTML = '';
        let displayList = allProducts;

        // Se estiver na página de vestidos, filtra
        if (window.location.pathname.includes('vestidos.html')) {
            displayList = allProducts.filter(p => p.title && p.title.toLowerCase().includes('vestido'));
        }

        if (!displayList || displayList.length === 0) {
          fashionGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center">Nenhum produto encontrado.</p>';
          return;
        }

        displayList.forEach(p => {
          const price = parseFloat(p.price);
          const old = (price * 1.4).toFixed(2).replace('.', ',');
          const current = price.toFixed(2).replace('.', ',');
          const parc = (price / 4).toFixed(2).replace('.', ',');
          const img = p.image_url ? (p.image_url.startsWith('http') ? p.image_url : API_BASE + p.image_url) : 'img/placeholder.jpg';
          
          // Usa a cor cadastrada para a bolinha da vitrine, ou bege se não tiver
          const colorHex = colorMap[p.primary_color] || '#dcd0c2';

          const card = document.createElement('div');
          card.className = 'fashion-card';
          card.innerHTML = `
            <div class="card-img-container">
              <span class="badge-off">NEW</span>
              <img src="${img}" alt="${p.title}" class="fashion-img">
            </div>
            <div class="card-info">
              <div class="card-title-fashion">${p.title}</div>
              <div class="card-prices">
                <span class="old-price">R$ ${old}</span>
                <span class="current-price">R$ ${current}</span>
              </div>
              <div class="installments">4x R$ ${parc}</div>
              <span class="color-swatch" style="background-color: ${colorHex};"></span>
            </div>
          `;
          fashionGrid.appendChild(card);
        });
      } catch (err) { console.error(err); }
    })();
  }
});