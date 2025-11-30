/* =========================================
   CONFIGURAÇÃO GLOBAL
   ========================================= */
const API_BASE = "http://localhost:3000";
// [NOVO] Configure seu número aqui (55 + DDD + Numero)
const WHATSAPP_NUMBER = "5547988374587"; 

/* =========================================
   MAPA DE CORES (Nome -> Hex)
   ========================================= */
const colorMap = {
  // Neutras
  preto: "#000000",
  branco: "#ffffff",
  cinza: "#808080",
  bege: "#eaddcf",
  marrom: "#5d4037",

  // Primárias
  azul: "#0000ff",
  vermelho: "#ff0000",
  amarelo: "#ffd700",

  // Secundárias / Variações
  verde: "#008000",
  verde_militar: "#556b2f",
  azul_marinho: "#000080",
  azul_claro: "#add8e6",
  rosa: "#ff1493",
  rosa_claro: "#ffb6c1",
  roxo: "#800080",
  lilas: "#e6e6fa",
  laranja: "#ff8c00",
  mostarda: "#e1ad01",
  vinho: "#800000",

  // Especiais
  dourado: "linear-gradient(45deg, #ffd700, #fdb931)",
  prateado: "linear-gradient(45deg, #c0c0c0, #e0e0e0)",
  estampado: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #f6d365 100%)",
};

/* Helper para pegar HEX */
function getColorHex(id) {
  return colorMap[id] || (typeof colorMap[id] === 'string' ? colorMap[id] : null);
}

/* =========================================
   ESTADO DO CARRINHO
   ========================================= */
let cart = JSON.parse(localStorage.getItem('shop_cart')) || [];
let currentProduct = null; // Produto aberto no modal atualmente

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Helper: Toast (Mensagem flutuante) ---------- */
  function showToast(message, success = true) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = message;
    t.style.background = success
      ? "rgba(65,49,38,0.95)"
      : "rgba(200,40,40,0.95)";
    document.body.appendChild(t);
    requestAnimationFrame(() => {
      t.style.opacity = "1";
      t.style.transform = "translateX(-50%) translateY(-10px)";
    });
    setTimeout(() => {
      t.style.opacity = "0";
      setTimeout(() => t.remove(), 300);
    }, 2500);
  }

  /* ==================================================================
     1. INJEÇÃO E LÓGICA DA SACOLA (CARRINHO)
     ================================================================== */
  
  // 1.1 Injetar HTML da Sacola
  // [ALTERADO] Botão agora chama finalizePurchase()
  const cartHTML = `
    <div class="cart-overlay" id="cart-overlay"></div>
    <aside class="cart-sidebar" id="cart-sidebar">
      <div class="cart-header">
        <h3>Sua Sacola</h3>
        <button id="close-cart-btn" class="cart-close-btn">&times;</button>
      </div>
      <div class="cart-items-container" id="cart-items">
         <!-- Itens serão renderizados aqui -->
      </div>
      <div class="cart-footer">
         <div class="cart-total">
            <span>Total</span>
            <span id="cart-total-price">R$ 0,00</span>
         </div>
         <button class="btn-checkout" onclick="finalizePurchase()">Finalizar no WhatsApp</button>
      </div>
    </aside>
  `;
  document.body.insertAdjacentHTML('beforeend', cartHTML);

  // 1.2 Configurar Ícone da Sacola (Header)
  const headerIcons = document.querySelector('.header-icons');
  if (headerIcons) {
      const icons = headerIcons.querySelectorAll('span');
      let bagIcon = null;
      icons.forEach(icon => {
          if(icon.textContent.includes('shopping_bag')) bagIcon = icon;
      });

      if (bagIcon) {
          const wrapper = document.createElement('div');
          wrapper.className = 'bag-icon-container';
          wrapper.style.cursor = 'pointer';
          
          if(bagIcon.parentNode) {
              bagIcon.parentNode.insertBefore(wrapper, bagIcon);
              wrapper.appendChild(bagIcon);
          }
          
          const badge = document.createElement('span');
          badge.className = 'bag-badge';
          badge.id = 'cart-count';
          badge.style.display = 'none';
          wrapper.appendChild(badge);

          wrapper.addEventListener('click', openCart);
      }
  }

  // 1.3 Funções da Sacola
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartOverlay = document.getElementById('cart-overlay');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total-price');
  const cartCountEl = document.getElementById('cart-count');
  const closeCartBtn = document.getElementById('close-cart-btn');

  function openCart() {
      cartSidebar.classList.add('open');
      cartOverlay.classList.add('open');
      renderCart();
  }

  function closeCart() {
      cartSidebar.classList.remove('open');
      cartOverlay.classList.remove('open');
  }

  if(closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if(cartOverlay) cartOverlay.addEventListener('click', closeCart);

  function saveCart() {
      localStorage.setItem('shop_cart', JSON.stringify(cart));
      updateCartBadge();
  }

  function updateCartBadge() {
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      if (cartCountEl) {
          cartCountEl.textContent = totalItems;
          cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
      }
  }

  // Função global para adicionar
  window.addToCart = function(product) {
      const existing = cart.find(item => item.id === product.id);
      if (existing) {
          existing.quantity++;
      } else {
          cart.push({ ...product, quantity: 1 });
      }
      saveCart();
      showToast('Produto adicionado à sacola!');
      openCart(); 
  };

  // Função global para remover
  window.removeFromCart = function(id) {
      cart = cart.filter(item => item.id !== id);
      saveCart();
      renderCart();
  };

  function renderCart() {
      cartItemsContainer.innerHTML = '';
      let total = 0;

      if (cart.length === 0) {
          cartItemsContainer.innerHTML = '<p style="text-align:center; color:#999; margin-top:30px;">Sua sacola está vazia.</p>';
      } else {
          cart.forEach(item => {
              const itemTotal = item.price * item.quantity;
              total += itemTotal;
              
              const imgUrl = item.image_url.startsWith('http') ? item.image_url : API_BASE + item.image_url;

              cartItemsContainer.innerHTML += `
                  <div class="cart-item">
                      <img src="${imgUrl}" alt="${item.title}">
                      <div class="cart-item-info">
                          <div class="cart-item-title">${item.title}</div>
                          <div style="font-size:12px; color:#777;">Qtd: ${item.quantity}</div>
                          <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
                          <button class="cart-remove-btn" onclick="removeFromCart(${item.id})">Remover</button>
                      </div>
                  </div>
              `;
          });
      }
      cartTotalEl.textContent = `R$ ${total.toFixed(2)}`;
  }

  updateCartBadge();

  // --- [NOVO] FUNÇÃO PARA FINALIZAR NO WHATSAPP ---
  window.finalizePurchase = function() {
      if (cart.length === 0) {
          showToast("Sua sacola está vazia!", false);
          return;
      }

      // 1. Solicita informações
      const name = prompt("Por favor, digite seu nome para o pedido:");
      if (!name) return; 

      const address = prompt("Digite seu endereço de entrega (Rua, Número, Bairro):");
      if (!address) return; 

      // 2. Monta a mensagem
      let message = `*NOVO PEDIDO - LOJA TRÊS LAÇOS*\n\n`;
      message += `👤 *Cliente:* ${name}\n`;
      message += `📍 *Endereço:* ${address}\n\n`;
      message += `*ITENS DO PEDIDO:*\n`;

      let total = 0;
      cart.forEach(item => {
          const subtotal = item.price * item.quantity;
          total += subtotal;
          message += `▪️ ${item.quantity}x ${item.title}\n   (Cor: ${item.primary_color || 'Padrão'})\n   Valor: R$ ${item.price.toFixed(2)}\n`;
      });

      message += `\n💰 *TOTAL DO PEDIDO: R$ ${total.toFixed(2)}*`;
      message += `\n\nAguardo confirmação e dados para pagamento!`;

      // 3. Envia para o WhatsApp
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
  };


  /* ==================================================================
     2. LÓGICA DE USUÁRIO (LOGIN / LOGOUT / BOTÃO ADMIN)
     ================================================================== */
  const token = localStorage.getItem("user_token");

  // Botão Admin: Mostra apenas se estiver logado
  const btnAdmin = document.getElementById("btn-admin");
  if (btnAdmin && token) {
    btnAdmin.style.display = "inline-flex"; 
  }

  // Logout
  const userLink = document.querySelector('a[href="login.html"]');
  if (token && userLink) {
    userLink.href = "#";
    userLink.innerHTML = '<span class="material-symbols-outlined" title="Sair">logout</span>';
    userLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("user_token");
      window.location.href = "login.html";
    });
  }

  /* ==================================================================
     3. FORMULÁRIOS DE AUTH
     ================================================================== */
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(fd)),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro no login");

        localStorage.setItem("user_token", data.token || "temp-token");
        showToast("Bem-vindo!", true);
        setTimeout(() => (window.location.href = "loja.html"), 1000);
      } catch (err) {
        showToast(err.message, false);
      }
    });
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(registerForm);
      const data = Object.fromEntries(fd);

      if (data.password !== data.confirm) {
        showToast("As senhas não conferem", false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            password: data.password,
          }),
        });
        if (!res.ok) throw new Error("Erro ao criar conta");
        showToast("Conta criada! Faça login.", true);
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } catch (err) {
        showToast(err.message, false);
      }
    });
  }

  /* ==================================================================
     4. ADMINISTRAÇÃO (CRUD + CATEGORIAS)
     ================================================================== */

  // Geração de Cores Automática
  function populateColorSelects() {
    const selects = [document.getElementById('primary_color'), document.getElementById('secondary_color')];
    selects.forEach(select => {
      if (!select) return;
      const firstOption = select.querySelector('option');
      select.innerHTML = ''; 
      if(firstOption) select.appendChild(firstOption);

      const optgroup = document.createElement('optgroup');
      optgroup.label = "Cores Disponíveis";
      Object.keys(colorMap).sort().forEach(key => {
          const option = document.createElement('option');
          option.value = key;
          option.textContent = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
          optgroup.appendChild(option);
      });
      select.appendChild(optgroup);
    });
  }
  populateColorSelects();

  // A. Preview de Cor
  const selPrimary = document.getElementById("primary_color");
  const divPrimary = document.getElementById("preview-primary-circle");
  const selSecondary = document.getElementById("secondary_color");
  const divSecondary = document.getElementById("preview-secondary-circle");

  function updateColorPreview(selectElem, previewDiv) {
    if (!selectElem || !previewDiv) return;
    const val = selectElem.value;
    const hex = getColorHex(val);

    if (hex) {
      previewDiv.style.background = hex;
      previewDiv.classList.remove("empty");
      previewDiv.style.border = val === "branco" ? "1px solid #ccc" : "2px solid #fff";
    } else {
      previewDiv.style.background = "transparent";
      previewDiv.classList.add("empty");
    }
  }

  if (selPrimary)
    selPrimary.addEventListener("change", () =>
      updateColorPreview(selPrimary, divPrimary)
    );
  if (selSecondary)
    selSecondary.addEventListener("change", () =>
      updateColorPreview(selSecondary, divSecondary)
    );

  // B. Preview de Imagem e Listagem
  const productForm = document.getElementById("product-form");
  const imageInput = document.getElementById("image-input");
  const previewImg = document.getElementById("preview");
  const productsList = document.getElementById("products-list");
  const refreshBtn = document.getElementById("refresh-list");
  let editingId = null; 

  if (imageInput && previewImg) {
    imageInput.addEventListener("change", () => {
      const f = imageInput.files[0];
      if (f) {
        previewImg.src = URL.createObjectURL(f);
        previewImg.style.display = "block";
      }
    });
  }

  window.fetchProducts = async function () {
    if (!productsList) return;
    productsList.innerHTML = '<p style="color:var(--muted-600)">Carregando...</p>';
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      const data = await res.json();
      productsList.innerHTML = "";

      if (!data || data.length === 0) {
        productsList.innerHTML =
          '<div style="color:var(--muted-600)">Nenhum produto cadastrado.</div>';
        return;
      }

      data.forEach((p) => {
        const imgUrl = p.image_url
          ? p.image_url.startsWith("http")
            ? p.image_url
            : API_BASE + p.image_url
          : "";
        const card = document.createElement("div");
        card.className = "card";
        card.style.padding = "0"; 
        card.style.overflow = "hidden";

        // Nota: Altura da imagem no admin
        const adminColorHex = getColorHex(p.primary_color) || "#eaddcf";

        card.innerHTML = `
          <img src="${imgUrl}" style="width:100%; height:250px; object-fit:cover; border-bottom:1px solid #eee;">
          <div style="padding: 12px;">
            <strong style="display:block; font-size:14px;">${p.title}</strong>
            <div style="display:flex; align-items:center; gap:5px; margin:5px 0;">
                <div style="font-size:11px; background:#f0f0f0; display:inline-block; padding:2px 6px; border-radius:4px; color:#666; font-weight:700;">
                   ${p.category ? p.category.toUpperCase() : "SEM CATEGORIA"}
                </div>
                <div style="width:12px; height:12px; border-radius:50%; background:${adminColorHex}; border:1px solid #ddd;"></div>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span style="font-weight:bold; color:var(--accent-700)">R$ ${Number(p.price).toFixed(2)}</span>
                <div>
                    <button data-id="${p.id}" class="btn-edit" style="cursor:pointer; border:none; background:none; color:blue;">✎</button>
                    <button data-id="${p.id}" class="btn-delete" style="cursor:pointer; border:none; background:none; color:red;">✕</button>
                </div>
            </div>
          </div>
        `;
        productsList.appendChild(card);
      });
    } catch (err) {
      productsList.innerHTML = "Erro ao carregar lista.";
    }
  };

  // Eventos de Click na lista (Editar/Excluir)
  if (productsList) {
    fetchProducts();
    productsList.addEventListener("click", async (e) => {
      const btnDel = e.target.closest(".btn-delete");
      const btnEdit = e.target.closest(".btn-edit");

      if (btnDel) {
        if (confirm("Tem certeza que deseja excluir?")) {
          await fetch(`${API_BASE}/api/products/${btnDel.dataset.id}`, {
            method: "DELETE",
          });
          fetchProducts();
        }
      }

      if (btnEdit) {
        const id = btnEdit.dataset.id;
        try {
          const res = await fetch(`${API_BASE}/api/products/${id}`);
          const p = await res.json();

          productForm.querySelector('[name="title"]').value = p.title;
          productForm.querySelector('[name="description"]').value = p.description || "";
          productForm.querySelector('[name="price"]').value = p.price;
          productForm.querySelector('[name="stock"]').value = p.stock;

          const catSelect = productForm.querySelector('[name="category"]');
          if (catSelect && p.category) catSelect.value = p.category;

          const secSelect = productForm.querySelector('[name="section"]');
          if (secSelect && p.section) secSelect.value = p.section;

          if (p.primary_color && selPrimary) {
            selPrimary.value = p.primary_color;
            updateColorPreview(selPrimary, divPrimary);
          }
          if (p.secondary_color && selSecondary) {
            selSecondary.value = p.secondary_color;
            updateColorPreview(selSecondary, divSecondary);
          }

          if (p.image_url) {
            previewImg.src = p.image_url.startsWith("http")
              ? p.image_url
              : API_BASE + p.image_url;
            previewImg.style.display = "block";
          }

          editingId = id;
          const submitBtn = productForm.querySelector('button[type="submit"]');
          submitBtn.textContent = "Salvar Alterações";
          submitBtn.style.background = "#4CAF50"; 
          productForm.scrollIntoView({ behavior: "smooth" });

        } catch (err) {
          showToast("Erro ao carregar produto", false);
        }
      }
    });
  }

  // Envio do Form (Salvar)
  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(productForm);
      const url = editingId
        ? `${API_BASE}/api/products/${editingId}`
        : `${API_BASE}/api/products`;
      const method = editingId ? "PUT" : "POST";

      try {
        const res = await fetch(url, { method: method, body: fd });
        if (!res.ok) throw new Error("Erro ao salvar");

        showToast(editingId ? "Produto atualizado!" : "Produto cadastrado!");
        productForm.reset();
        previewImg.style.display = "none";
        updateColorPreview(selPrimary, divPrimary);
        updateColorPreview(selSecondary, divSecondary);
        editingId = null;
        const submitBtn = productForm.querySelector('button[type="submit"]');
        submitBtn.textContent = "Cadastrar Produto";
        submitBtn.style.background = "";
        fetchProducts();
      } catch (err) {
        showToast("Erro ao salvar.", false);
      }
    });
  }

  /* ==================================================================
     5. VITRINE (LOJA) - RENDERIZAÇÃO & FILTROS & LÓGICA DE COMPRA
     ================================================================== */
  const fashionGrid = document.getElementById("fashion-grid");
  const priceBtn = document.getElementById("price-filter-btn");
  const priceDropdown = document.getElementById("price-dropdown");
  const applyBtn = document.getElementById("btn-apply-filter");
  const minInput = document.getElementById("price-min");
  const maxInput = document.getElementById("price-max");

  if (fashionGrid) {
    
    // INJEÇÃO DO MODAL DE DETALHES
    const modalHTML = `
      <div id="product-modal" class="product-modal-overlay">
        <div class="product-modal-content">
           <button id="close-product-modal" class="modal-close-btn">&times;</button>
           <div class="modal-img-col">
              <img id="p-modal-img" src="" alt="Produto">
           </div>
           <div class="modal-info-col">
              <h2 id="p-modal-title" class="p-modal-title"></h2>
              <div class="p-modal-price-box">
                 <span id="p-modal-price" class="p-price"></span>
                 <span id="p-modal-installments" class="p-installments"></span>
              </div>
              <div class="modal-desc-block">
                 <h4>Descrição da Peça</h4>
                 <p id="p-modal-desc" class="p-desc-text"></p>
              </div>
              <button class="btn-buy-modal">Adicionar à Sacola</button>
           </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const prodModal = document.getElementById('product-modal');
    const closeBtn = document.getElementById('close-product-modal');
    const mImg = document.getElementById('p-modal-img');
    const mTitle = document.getElementById('p-modal-title');
    const mPrice = document.getElementById('p-modal-price');
    const mInst = document.getElementById('p-modal-installments');
    const mDesc = document.getElementById('p-modal-desc');
    const mBuyBtn = document.querySelector('.btn-buy-modal');

    const closeModal = () => prodModal.classList.remove('open');
    if(closeBtn) closeBtn.onclick = closeModal;
    window.onclick = (e) => { if(e.target == prodModal) closeModal(); }

    if(mBuyBtn) {
        mBuyBtn.addEventListener('click', () => {
            if(currentProduct) {
                window.addToCart(currentProduct);
                closeModal();
            }
        });
    }

    if(priceBtn) priceBtn.addEventListener("click", (e) => { if(e.target.tagName !== 'INPUT') priceDropdown.classList.toggle("show"); });

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        const allProducts = await res.json();

        let categoryProducts = [];
        const path = window.location.pathname;

        // FILTRO POR PÁGINA
        if (path.includes("vestidos.html")) {
          categoryProducts = allProducts.filter(
            (p) =>
              p.category === "vestidos" ||
              (p.title && p.title.toLowerCase().includes("vestido"))
          );
        } 
        else if (path.includes("blusas.html")) {
          categoryProducts = allProducts.filter(p => 
            p.category === 'blusas' || 
            p.category === 'cropped' || 
            (p.title && p.title.toLowerCase().includes('blusa')) || 
            (p.title && p.title.toLowerCase().includes('cropped'))
          );
        } 
        else if (path.includes("calcas.html")) {
          categoryProducts = allProducts.filter(p => 
            p.category === "calcas" || 
            p.category === "saias" || 
            (p.title && p.title.toLowerCase().includes("calça")) || 
            (p.title && p.title.toLowerCase().includes("saia"))
          );
        }
        else {
          categoryProducts = allProducts;
        }

        // Função de Renderizar Grid
        function renderGrid(productsList) {
            fashionGrid.innerHTML = "";

            if (!productsList || productsList.length === 0) {
                fashionGrid.innerHTML =
                  '<div style="grid-column:1/-1; text-align:center; padding:50px;"><h3 style="color:#888;">Nenhum produto encontrado.</h3></div>';
                return;
            }

            productsList.forEach((p) => {
                const price = parseFloat(p.price);
                const oldPrice = (price * 1.2).toFixed(2).replace(".", ",");
                const currentPrice = price.toFixed(2).replace(".", ",");
                const installmentVal = (price / 4).toFixed(2).replace(".", ",");

                const img = p.image_url
                  ? p.image_url.startsWith("http")
                    ? p.image_url
                    : API_BASE + p.image_url
                  : "img/placeholder.jpg";
                const colorHex = getColorHex(p.primary_color) || "#eaddcf";
                const badge =
                  p.section === "destaque"
                    ? '<span class="badge-off" style="background:#000;">HOT</span>'
                    : '<span class="badge-off">NEW</span>';

                const card = document.createElement("div");
                card.className = "fashion-card";
                card.innerHTML = `
                    <div class="card-img-container">
                    ${badge}
                    <img src="${img}" alt="${p.title}" class="fashion-img">
                    </div>
                    <div class="card-info">
                    <div class="card-title-fashion">${p.title}</div>
                    <div class="card-prices">
                        <span class="old-price">R$ ${oldPrice}</span>
                        <span class="current-price">R$ ${currentPrice}</span>
                    </div>
                    <div class="installments">4x de R$ ${installmentVal}</div>
                    <span class="color-swatch" style="background: ${colorHex};" title="${p.primary_color}"></span>
                    </div>
                `;

                // CLIQUE NO CARD ABRE MODAL
                card.addEventListener('click', () => {
                    currentProduct = p; 
                    mImg.src = img;
                    mTitle.textContent = p.title;
                    mPrice.textContent = `R$ ${currentPrice}`;
                    mInst.textContent = `4x de R$ ${installmentVal} sem juros`;
                    mDesc.textContent = p.description ? p.description : "Sem descrição detalhada.";
                    prodModal.classList.add('open');
                });

                fashionGrid.appendChild(card);
            });
        }

        renderGrid(categoryProducts);

        if(applyBtn) {
            applyBtn.addEventListener("click", () => {
                const min = parseFloat(minInput.value) || 0;
                const max = parseFloat(maxInput.value) || 999999;

                const filteredByPrice = categoryProducts.filter(p => {
                    const price = parseFloat(p.price);
                    return price >= min && price <= max;
                });

                renderGrid(filteredByPrice);
                priceDropdown.classList.remove("show");
            });
        }

      } catch (err) {
        console.error(err);
        fashionGrid.innerHTML = "<p>Erro de conexão com o servidor.</p>";
      }
    })();
  }
});