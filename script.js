// ==========================================================================
// BANCO DE DADOS SIMULADO (PRODUTOS EM ESTOQUE)
// ==========================================================================
const estoqueProdutos = [
    { id: 1, codigo: "101", nome: "Malbec Desodorante Colônia 100ml", preco: 189.90 },
    { id: 2, codigo: "102", nome: "Lily Eau de Parfum 75ml", preco: 279.90 },
    { id: 3, codigo: "201", nome: "Batom Matte Intense Incrível", preco: 34.90 },
    { id: 4, codigo: "202", nome: "Base Líquida Protetora Make B.", preco: 119.90 },
    { id: 5, codigo: "301", nome: "Perfume Elysée Succès 50ml", preco: 299.00 }
];

let itensCarrinhoVenda = [];

// Base simulada de clientes para o CRM
const baseClientes = [
    { id: 1, nome: "Maria Silva", telefone: "11988887777", nascimento: "16/10" },
    { id: 2, nome: "Ana Oliveira", telefone: "11966665555", nascimento: "25/11" },
    { id: 3, nome: "Carlos Souza", telefone: "11955554444", nascimento: "16/10" },
    { id: 4, nome: "Juliana Lima", telefone: "11944443333", nascimento: "03/02" }
];

// Executa assim que a página estiver totalmente carregada
document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================================================
    // 1. MOTOR DE BUSCA DA TELA PRINCIPAL (FILTRAR CARDS)
    // ==========================================================================
    const buscadorPrincipal = document.getElementById('buscador');
    if (buscadorPrincipal) {
        buscadorPrincipal.addEventListener('input', function(e) {
            const termoBusca = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.card');

            cards.forEach(card => {
                const keywords = card.getAttribute('data-name') || "";
                const title = card.querySelector('h3').textContent.toLowerCase();
                
                if (title.includes(termoBusca) || keywords.includes(termoBusca)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // ==========================================================================
    // 2. FUNÇÃO GENÉRICA PARA CONTROLAR ABERTURA/FECHAMENTO DE QUALQUER MODAL
    // ==========================================================================
    function gerenciarModal(idBotaoAbrir, idModal, idBotaoFechar, idBotaoCancelar, acaoAdicional = null) {
        const btnAbrir = document.getElementById(idBotaoAbrir);
        const modal = document.getElementById(idModal);
        const btnFechar = document.getElementById(idBotaoFechar);
        const btnCancelar = document.getElementById(idBotaoCancelar);

        if (btnAbrir && modal) {
            btnAbrir.addEventListener('click', () => {
                modal.style.display = 'flex';
                if (acaoAdicional) acaoAdicional();
            });
        }

        const fechar = () => { if (modal) modal.style.display = 'none'; };
        if (btnFechar) btnFechar.addEventListener('click', fechar);
        if (btnCancelar) btnCancelar.addEventListener('click', fechar);
    }

    // Ativando Módulo 1: Nova Venda
    gerenciarModal('btn-abrir-venda', 'modal-venda', 'btn-fechar-venda', 'btn-cancelar-venda', () => {
        document.getElementById('venda-cliente').value = "";
        document.getElementById('busca-produto').value = "";
        document.getElementById('venda-desconto').value = "0";
        itensCarrinhoVenda = [];
        renderizarItensPedido();
    });

    // Ativando Módulo 2: Controle de Estoque
    gerenciarModal('btn-abrir-estoque', 'modal-estoque', 'btn-fechar-estoque', 'btn-cancelar-estoque', () => {
        carregarTudoEstoque();
    });

    // Ativando Módulo 3: Clientes & Campanhas
    gerenciarModal('btn-abrir-clientes', 'modal-clientes', 'btn-fechar-clientes', 'btn-cancelar-clientes', () => {
        renderizarPainelClientes();
    });

    // ==========================================================================
    // 3. INTELIGÊNCIA DO BUSCADOR INTERNO DE PRODUTOS (DENTRO DA VENDA)
    // ==========================================================================
    const inputBuscaProd = document.getElementById('busca-produto');
    const listaResultados = document.getElementById('resultados-produtos');

    if (inputBuscaProd && listaResultados) {
        inputBuscaProd.addEventListener('input', function(e) {
            const termo = e.target.value.toLowerCase().trim();
            listaResultados.innerHTML = "";

            if (termo === "") {
                listaResultados.style.display = 'none';
                return;
            }

            const filtrados = estoqueProdutos.filter(p => 
                p.codigo.includes(termo) || 
                p.nome.toLowerCase().includes(termo) || 
                p.preco.toFixed(2).includes(termo)
            );

            if (filtrados.length > 0) {
                filtrados.forEach(prod => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'item-busca';
                    itemDiv.innerHTML = `
                        <span><span class="sku">[Cód: ${prod.codigo}]</span>${prod.nome}</span>
                        <span class="preco">R$ ${prod.preco.toFixed(2)}</span>
                    `;
                    itemDiv.addEventListener('click', () => {
                        itensCarrinhoVenda.push(prod);
                        renderizarItensPedido();
                        inputBuscaProd.value = "";
                        listaResultados.style.display = 'none';
                    });
                    listaResultados.appendChild(itemDiv);
                });
                listaResultados.style.display = 'block';
            } else {
                listaResultados.innerHTML = `<div class="item-busca" style="color: #64748b; cursor:default;">Nenhum produto</div>`;
                listaResultados.style.display = 'block';
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target !== inputBuscaProd) listaResultados.style.display = 'none';
        });
    }

    // ==========================================================================
    // 4. LÓGICA DE ATUALIZAÇÃO DO PEDIDO DE VENDA
    // ==========================================================================
    function renderizarItensPedido() {
        const container = document.getElementById('venda-produtos-adicionados');
        if (!container) return;
        container.innerHTML = "";

        if (itensCarrinhoVenda.length === 0) {
            container.innerHTML = `<p class="txt-vazio">Nenhum produto adicionado ainda.</p>`;
            atualizarTotalVenda();
            return;
        }

        itensCarrinhoVenda.forEach((prod, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item-adicionado';
            itemDiv.innerHTML = `
                <span>${prod.nome}</span>
                <div>
                    <span style="color: #16a34a; margin-right: 15px; font-weight:600;">R$ ${prod.preco.toFixed(2)}</span>
                    <button class="btn-remove" data-idx="${index}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            itemDiv.querySelector('.btn-remove').addEventListener('click', () => {
                itensCarrinhoVenda.splice(index, 1);
                renderizarItensPedido();
            });
            container.appendChild(itemDiv);
        });

        atualizarTotalVenda();
    }

    const inputDesconto = document.getElementById('venda-desconto');
    if (inputDesconto) {
        inputDesconto.addEventListener('input', atualizarTotalVenda);
    }

    function atualizarTotalVenda() {
        let subtotal = itensCarrinhoVenda.reduce((acc, p) => acc + p.preco, 0);
        let desconto = parseFloat(inputDesconto.value) || 0;
        let totalFinal = subtotal - (subtotal * (desconto / 100));
        
        const txtTotal = document.getElementById('venda-total-exibicao');
        if (txtTotal) txtTotal.textContent = `R$ ${totalFinal.toFixed(2)}`;
    }

    // Confirmar Venda
    const btnSalvarVenda = document.getElementById('btn-salvar-venda');
    if (btnSalvarVenda) {
        btnSalvarVenda.addEventListener('click', () => {
            if (!document.getElementById('venda-cliente').value) return alert("Selecione a cliente!");
            if (itensCarrinhoVenda.length === 0) return alert("Adicione produtos!");
            alert("Venda Registrada com Sucesso! Produto reservado no estoque.");
            document.getElementById('modal-venda').style.display = 'none';
        });
    }

    // ==========================================================================
    // 5. MOTOR DO PAINEL DE CRM (CLIENTES E WHATSAPP)
    // ==========================================================================
    function renderizarPainelClientes() {
        const containerAniversariantes = document.getElementById('lista-aniversariantes');
        const containerGeral = document.getElementById('lista-geral-clientes');
        if (!containerAniversariantes || !containerGeral) return;

        containerAniversariantes.innerHTML = "";
        containerGeral.innerHTML = "";

        const hoje = new Date();
        const diaMesAtual = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}`;
        let temNiver = false;

        baseClientes.forEach(cliente => {
            const criarItemCliente = () => {
                const item = document.createElement('div');
                item.className = 'item-busca';

                const nome = document.createElement('span');
                nome.textContent = `${cliente.nome} – Aniversário: ${cliente.nascimento}`;
                item.appendChild(nome);

                const linkWhatsApp = document.createElement('a');
                linkWhatsApp.href = `https://wa.me/${cliente.telefone}`;
                linkWhatsApp.target = '_blank';
                linkWhatsApp.rel = 'noopener noreferrer';
                linkWhatsApp.textContent = ' WhatsApp';
                item.appendChild(linkWhatsApp);

                return item;
            };

            containerGeral.appendChild(criarItemCliente());

            if (cliente.nascimento === diaMesAtual) {
                containerAniversariantes.appendChild(criarItemCliente());
                temNiver = true;
            }
        });

        if (!temNiver) {
            const mensagem = document.createElement('p');
            mensagem.className = 'txt-vazio';
            mensagem.textContent = 'Nenhum aniversariante hoje.';
            containerAniversariantes.appendChild(mensagem);
        }
    }
});

// SUPABASE CLIENT + MODULO DE ESTOQUE (completo)
const sb = (typeof supabase !== 'undefined' && window.SUPABASE_URL)
    ? supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY)
    : null;

document.addEventListener("DOMContentLoaded", () => {
    if (!sb) { console.warn("Supabase SDK não carregado."); return; }

    const $ = (id) => document.getElementById(id);
    const fmt = (n) => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';
    const parseMoeda = (s) => {
        if (s == null) return 0;
        const n = parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.'));
        return isNaN(n) ? 0 : n;
    };
    const maskMoeda = (input) => {
        if (!input) return;
        input.addEventListener('input', () => {
            let v = input.value.replace(/\D/g, '');
            v = (parseInt(v || '0', 10) / 100).toFixed(2);
            input.value = 'R$ ' + v.replace('.', ',');
        });
    };

    let cacheMarcas = [];
    let cacheCategorias = [];
    let cacheSubs = [];
    let cacheProdutos = [];
    let editandoProdutoId = null;
    let selectedSubIds = new Set();

    // init currency masks
    ['prod-custo','prod-revista','ent-custo','ent-revista'].forEach(id => maskMoeda($(id)));

    // tabs
    function initTabs() {
        const btns = document.querySelectorAll('#estoque-tabs .tab-btn');
        btns.forEach(b => {
            b.addEventListener('click', () => {
                btns.forEach(x => x.classList.remove('active'));
                document.querySelectorAll('#modal-estoque .tab-content').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                const t = $(b.dataset.tab);
                if (t) t.classList.add('active');
            });
        });
    }
    initTabs();

    function switchTab(name) {
        const btn = document.querySelector(`#estoque-tabs .tab-btn[data-tab="${name}"]`);
        if (btn) btn.click();
    }

    // ---------- MARCAS ----------
    async function carregarMarcas(term = '') {
        let q = sb.from('silene_marcas').select('*').order('nome');
        if (term) q = q.ilike('nome', `%${term}%`);
        const { data, error } = await q;
        if (error) { console.error(error); return; }
        cacheMarcas = data || [];
        renderMarcas();
        popularSelectMarcas();
    }
    function renderMarcas() {
        const tbody = $('tabela-marcas').querySelector('tbody');
        tbody.innerHTML = '';
        if (cacheMarcas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="txt-vazio">Nenhuma marca.</td></tr>';
            return;
        }
        cacheMarcas.forEach(m => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${m.nome}</td>
                <td>${fmtDate(m.created_at)}</td>
                <td>
                    <button class="btn-icon edit" data-id="${m.id}" data-act="edit-marca" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon" data-id="${m.id}" data-act="del-marca" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    $('btn-add-marca').addEventListener('click', async () => {
        const nome = $('nova-marca-nome').value.trim();
        if (!nome) return alert('Informe o nome da marca.');
        const { error } = await sb.from('silene_marcas').insert({ nome });
        if (error) {
            if (error.code === '23505') return alert('Já existe uma marca com esse nome.');
            return alert('Erro: ' + error.message);
        }
        $('nova-marca-nome').value = '';
        await carregarMarcas($('busca-marca').value.trim());
    });
    $('busca-marca').addEventListener('input', (e) => carregarMarcas(e.target.value.trim()));
    $('tabela-marcas').addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.act === 'del-marca') {
            if (!confirm('Excluir esta marca?')) return;
            const { error } = await sb.from('silene_marcas').delete().eq('id', id);
            if (error) return alert('Erro: ' + error.message);
            await carregarMarcas($('busca-marca').value.trim());
            await carregarProdutos($('busca-produto-est').value.trim());
        } else if (btn.dataset.act === 'edit-marca') {
            const m = cacheMarcas.find(x => x.id === id);
            const novo = prompt('Novo nome da marca:', m?.nome || '');
            if (!novo || novo.trim() === m?.nome) return;
            const { error } = await sb.from('silene_marcas').update({ nome: novo.trim() }).eq('id', id);
            if (error) {
                if (error.code === '23505') return alert('Já existe uma marca com esse nome.');
                return alert('Erro: ' + error.message);
            }
            await carregarMarcas($('busca-marca').value.trim());
            await carregarProdutos($('busca-produto-est').value.trim());
        }
    });

    // ---------- CATEGORIAS ----------
    async function carregarCategorias(term = '') {
        let q = sb.from('silene_categorias').select('*').order('nome');
        if (term) q = q.ilike('nome', `%${term}%`);
        const { data, error } = await q;
        if (error) { console.error(error); return; }
        cacheCategorias = data || [];
        renderCategorias();
        popularSelectCategorias();
    }
    function renderCategorias() {
        const tbody = $('tabela-categorias').querySelector('tbody');
        tbody.innerHTML = '';
        if (cacheCategorias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="txt-vazio">Nenhuma categoria.</td></tr>';
            return;
        }
        cacheCategorias.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.nome}</td>
                <td>${fmtDate(c.created_at)}</td>
                <td>
                    <button class="btn-icon edit" data-id="${c.id}" data-act="edit-cat" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon" data-id="${c.id}" data-act="del-cat" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    $('btn-add-categoria').addEventListener('click', async () => {
        const nome = $('nova-categoria-nome').value.trim();
        if (!nome) return alert('Informe o nome da categoria.');
        const { error } = await sb.from('silene_categorias').insert({ nome });
        if (error) {
            if (error.code === '23505') return alert('Já existe uma categoria com esse nome.');
            return alert('Erro: ' + error.message);
        }
        $('nova-categoria-nome').value = '';
        await carregarCategorias($('busca-categoria').value.trim());
    });
    $('busca-categoria').addEventListener('input', (e) => carregarCategorias(e.target.value.trim()));
    $('tabela-categorias').addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.act === 'del-cat') {
            if (!confirm('Excluir esta categoria?')) return;
            const { error } = await sb.from('silene_categorias').delete().eq('id', id);
            if (error) return alert('Erro: ' + error.message);
            await carregarCategorias($('busca-categoria').value.trim());
            await carregarProdutos($('busca-produto-est').value.trim());
        } else if (btn.dataset.act === 'edit-cat') {
            const c = cacheCategorias.find(x => x.id === id);
            const novo = prompt('Novo nome da categoria:', c?.nome || '');
            if (!novo || novo.trim() === c?.nome) return;
            const { error } = await sb.from('silene_categorias').update({ nome: novo.trim() }).eq('id', id);
            if (error) {
                if (error.code === '23505') return alert('Já existe uma categoria com esse nome.');
                return alert('Erro: ' + error.message);
            }
            await carregarCategorias($('busca-categoria').value.trim());
            await carregarProdutos($('busca-produto-est').value.trim());
        }
    });

    // ---------- SUBCATEGORIAS ----------
    const TIPOS_SUB = [
        { key: 'tipo_produto', label: 'Tipo de produto' },
        { key: 'familia_olfativa', label: 'Família olfativa' },
        { key: 'linha', label: 'Linha' },
    ];
    async function carregarSubs(term = '') {
        let q = sb.from('silene_subcategorias').select('*').order('tipo').order('nome');
        if (term) q = q.ilike('nome', `%${term}%`);
        const { data, error } = await q;
        if (error) { console.error(error); return; }
        cacheSubs = data || [];
        renderSubs();
        renderChipsSubcategorias();
    }
    function labelTipo(t) { return TIPOS_SUB.find(x => x.key === t)?.label || t; }
    function renderSubs() {
        const tbody = $('tabela-subcategorias').querySelector('tbody');
        tbody.innerHTML = '';
        if (cacheSubs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="txt-vazio">Nenhuma subcategoria.</td></tr>';
            return;
        }
        cacheSubs.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${labelTipo(s.tipo)}</td>
                <td>${s.nome}</td>
                <td>${fmtDate(s.created_at)}</td>
                <td><button class="btn-icon" data-id="${s.id}" data-act="del-sub" title="Excluir"><i class="fa-solid fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
    }
    $('btn-add-sub').addEventListener('click', async () => {
        const tipo = $('sub-tipo').value;
        const nome = $('nova-sub-nome').value.trim();
        if (!nome) return alert('Informe o nome.');
        const { error } = await sb.from('silene_subcategorias').insert({ tipo, nome });
        if (error) {
            if (error.code === '23505') return alert('Já existe esse valor para este tipo.');
            return alert('Erro: ' + error.message);
        }
        $('nova-sub-nome').value = '';
        await carregarSubs($('busca-sub').value.trim());
    });
    $('busca-sub').addEventListener('input', (e) => carregarSubs(e.target.value.trim()));
    $('tabela-subcategorias').addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-act="del-sub"]');
        if (!btn) return;
        if (!confirm('Excluir esta subcategoria?')) return;
        const { error } = await sb.from('silene_subcategorias').delete().eq('id', btn.dataset.id);
        if (error) return alert('Erro: ' + error.message);
        await carregarSubs($('busca-sub').value.trim());
        await carregarProdutos($('busca-produto-est').value.trim());
    });

    function renderChipsSubcategorias() {
        const area = $('chips-subcategorias');
        if (!area) return;
        area.innerHTML = '';
        TIPOS_SUB.forEach(tipo => {
            const vals = cacheSubs.filter(s => s.tipo === tipo.key);
            if (vals.length === 0) return;
            const group = document.createElement('div');
            group.className = 'chip-group';
            group.style.width = '100%';
            const label = document.createElement('span');
            label.className = 'chip-group-label';
            label.textContent = tipo.label;
            group.appendChild(label);
            const wrap = document.createElement('div');
            wrap.style.display = 'flex';
            wrap.style.flexWrap = 'wrap';
            wrap.style.gap = '6px';
            vals.forEach(v => {
                const chip = document.createElement('span');
                chip.className = 'chip' + (selectedSubIds.has(v.id) ? ' selected' : '');
                chip.textContent = v.nome;
                chip.dataset.id = v.id;
                chip.addEventListener('click', () => {
                    if (selectedSubIds.has(v.id)) selectedSubIds.delete(v.id);
                    else selectedSubIds.add(v.id);
                    chip.classList.toggle('selected');
                });
                wrap.appendChild(chip);
            });
            group.appendChild(wrap);
            area.appendChild(group);
        });
        if (area.children.length === 0) {
            area.innerHTML = '<span class="txt-vazio">Cadastre subcategorias primeiro.</span>';
        }
    }

    // ---------- PRODUTOS ----------
    function popularSelectMarcas() {
        const sel = $('prod-marca');
        if (!sel) return;
        const cur = sel.value;
        sel.innerHTML = '<option value="">-- Sem marca --</option>';
        cacheMarcas.forEach(m => {
            const o = document.createElement('option');
            o.value = m.id; o.textContent = m.nome;
            sel.appendChild(o);
        });
        if (cur) sel.value = cur;
    }
    function popularSelectCategorias() {
        const sel = $('prod-categoria');
        if (!sel) return;
        const cur = sel.value;
        sel.innerHTML = '<option value="">-- Sem categoria --</option>';
        cacheCategorias.forEach(c => {
            const o = document.createElement('option');
            o.value = c.id; o.textContent = c.nome;
            sel.appendChild(o);
        });
        if (cur) sel.value = cur;
    }
    function popularSelectProdutos() {
        const sel = $('ent-produto');
        if (!sel) return;
        const cur = sel.value;
        sel.innerHTML = '<option value="">-- Selecione o produto --</option>';
        cacheProdutos.forEach(p => {
            const o = document.createElement('option');
            o.value = p.id; o.textContent = `${p.codigo} - ${p.nome}`;
            sel.appendChild(o);
        });
        if (cur) sel.value = cur;
        const hsel = $('hist-filtro-produto');
        if (hsel) {
            const hcur = hsel.value;
            hsel.innerHTML = '<option value="">Todos os produtos</option>';
            cacheProdutos.forEach(p => {
                const o = document.createElement('option');
                o.value = p.id; o.textContent = `${p.codigo} - ${p.nome}`;
                hsel.appendChild(o);
            });
            if (hcur) hsel.value = hcur;
        }
    }

    async function carregarProdutos(term = '') {
        let q = sb.from('silene_produtos')
            .select('*, silene_marcas(nome), silene_categorias(nome)')
            .order('nome');
        if (term) q = q.or(`nome.ilike.%${term}%,codigo.ilike.%${term}%`);
        const { data, error } = await q;
        if (error) { console.error(error); return; }
        cacheProdutos = data || [];
        // load subcategorias for each product
        if (cacheProdutos.length) {
            const ids = cacheProdutos.map(p => p.id);
            const { data: ps } = await sb.from('silene_produto_subcategorias')
                .select('produto_id, silene_subcategorias(id,nome,tipo)')
                .in('produto_id', ids);
            const map = {};
            (ps || []).forEach(r => {
                if (!map[r.produto_id]) map[r.produto_id] = [];
                if (r.silene_subcategorias) map[r.produto_id].push(r.silene_subcategorias);
            });
            cacheProdutos.forEach(p => { p._subs = map[p.id] || []; });
        }
        renderProdutos();
        popularSelectProdutos();
    }

    function renderProdutos() {
        const tbody = $('tabela-produtos').querySelector('tbody');
        tbody.innerHTML = '';
        if (cacheProdutos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="txt-vazio">Nenhum produto.</td></tr>';
            return;
        }
        // saldo map
        sb.from('silene_estoque_atual').select('produto_id,saldo').then(({ data }) => {
            const saldoMap = {};
            (data || []).forEach(r => { saldoMap[r.produto_id] = r.saldo; });
            cacheProdutos.forEach(p => {
                const tr = document.createElement('tr');
                const saldo = saldoMap[p.id] || 0;
                const subs = (p._subs || []).map(s => s.nome).join(', ') || '-';
                tr.innerHTML = `
                    <td><a href="#" class="link-codigo" data-id="${p.id}" data-act="entrada-prod">${p.codigo}</a></td>
                    <td>${p.nome}</td>
                    <td>${p.silene_marcas?.nome || '-'}</td>
                    <td>${p.silene_categorias?.nome || '-'}</td>
                    <td style="font-size:0.75rem;">${subs}</td>
                    <td>${fmt(p.preco_custo)}</td>
                    <td>${fmt(p.preco_revista)}</td>
                    <td>${saldo} ${p.unidade}</td>
                    <td>
                        <button class="btn-icon edit" data-id="${p.id}" data-act="edit-prod" title="Editar"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon" data-id="${p.id}" data-act="del-prod" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
    }

    $('busca-produto-est').addEventListener('input', (e) => carregarProdutos(e.target.value.trim()));

    function limparFormProduto() {
        editandoProdutoId = null;
        selectedSubIds = new Set();
        $('prod-codigo').value = '';
        $('prod-nome').value = '';
        $('prod-marca').value = '';
        $('prod-categoria').value = '';
        $('prod-unidade').value = 'un';
        $('prod-custo').value = '';
        $('prod-revista').value = '';
        $('prod-minimo').value = '0';
        const btn = $('btn-salvar-produto');
        btn.innerHTML = '<i class="fa-solid fa-plus"></i> Salvar Produto';
        renderChipsSubcategorias();
    }
    $('btn-limpar-produto').addEventListener('click', limparFormProduto);

    $('btn-salvar-produto').addEventListener('click', async () => {
        const codigo = $('prod-codigo').value.trim();
        const nome = $('prod-nome').value.trim();
        if (!codigo || !nome) return alert('Código e nome são obrigatórios.');
        const payload = {
            codigo,
            nome,
            marca_id: $('prod-marca').value || null,
            categoria_id: $('prod-categoria').value || null,
            unidade: $('prod-unidade').value,
            preco_custo: parseMoeda($('prod-custo').value),
            preco_revista: parseMoeda($('prod-revista').value),
            estoque_minimo: parseInt($('prod-minimo').value) || 0,
        };
        let prodId = editandoProdutoId;
        let error;
        if (editandoProdutoId) {
            ({ error } = await sb.from('silene_produtos').update(payload).eq('id', editandoProdutoId));
        } else {
            const { data, error: e } = await sb.from('silene_produtos').insert(payload).select('id').single();
            error = e;
            if (data) prodId = data.id;
        }
        if (error) return alert('Erro: ' + error.message);
        // sync subcategorias
        await sb.from('silene_produto_subcategorias').delete().eq('produto_id', prodId);
        if (selectedSubIds.size > 0) {
            const rows = Array.from(selectedSubIds).map(sid => ({ produto_id: prodId, subcategoria_id: sid }));
            const { error: e2 } = await sb.from('silene_produto_subcategorias').insert(rows);
            if (e2) console.error(e2);
        }
        alert(editandoProdutoId ? 'Produto atualizado!' : 'Produto cadastrado!');
        limparFormProduto();
        await carregarProdutos($('busca-produto-est').value.trim());
        await carregarEstoqueAtual();
    });

    $('tabela-produtos').addEventListener('click', async (e) => {
        const link = e.target.closest('[data-act="entrada-prod"]');
        if (link) {
            e.preventDefault();
            const id = link.dataset.id;
            await carregarProdutos($('busca-produto-est').value.trim());
            switchTab('tab-entrada');
            $('ent-produto').value = id;
            return;
        }
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.act === 'del-prod') {
            if (!confirm('Excluir este produto e seu histórico?')) return;
            const { error } = await sb.from('silene_produtos').delete().eq('id', id);
            if (error) return alert('Erro: ' + error.message);
            await carregarProdutos($('busca-produto-est').value.trim());
            await carregarEstoqueAtual();
            await carregarHistorico();
        } else if (btn.dataset.act === 'edit-prod') {
            const p = cacheProdutos.find(x => x.id === id);
            if (!p) return;
            editandoProdutoId = id;
            $('prod-codigo').value = p.codigo;
            $('prod-nome').value = p.nome;
            $('prod-marca').value = p.marca_id || '';
            $('prod-categoria').value = p.categoria_id || '';
            $('prod-unidade').value = p.unidade;
            $('prod-custo').value = p.preco_custo ? 'R$ ' + Number(p.preco_custo).toFixed(2).replace('.', ',') : '';
            $('prod-revista').value = p.preco_revista ? 'R$ ' + Number(p.preco_revista).toFixed(2).replace('.', ',') : '';
            $('prod-minimo').value = p.estoque_minimo;
            selectedSubIds = new Set((p._subs || []).map(s => s.id));
            renderChipsSubcategorias();
            const btnS = $('btn-salvar-produto');
            btnS.innerHTML = '<i class="fa-solid fa-pen"></i> Atualizar Produto';
            $('tab-produtos').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // ---------- ENTRADA DE ESTOQUE ----------
    async function carregarEntradas(term = '') {
        let q = sb.from('silene_estoque_movimentos')
            .select('*, silene_produtos(nome,codigo)')
            .eq('tipo', 'entrada')
            .order('created_at', { ascending: false })
            .limit(200);
        const { data, error } = await q;
        if (error) { console.error(error); return; }
        let rows = data || [];
        if (term) {
            const t = term.toLowerCase();
            rows = rows.filter(m =>
                (m.silene_produtos?.nome || '').toLowerCase().includes(t) ||
                (m.silene_produtos?.codigo || '').toLowerCase().includes(t) ||
                (m.ciclo || '').toLowerCase().includes(t)
            );
        }
        renderEntradas(rows);
    }
    function renderEntradas(rows) {
        const tbody = $('tabela-entradas').querySelector('tbody');
        tbody.innerHTML = '';
        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="txt-vazio">Nenhuma entrada.</td></tr>';
            return;
        }
        rows.forEach(m => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${fmtDate(m.created_at)}</td>
                <td>${m.silene_produtos?.nome || '-'}</td>
                <td>${m.quantidade}</td>
                <td>${m.ciclo || '-'}</td>
                <td>${fmt(m.custo_unitario)}</td>
                <td>
                    <button class="btn-icon edit" data-id="${m.id}" data-act="edit-ent" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon" data-id="${m.id}" data-act="del-ent" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    $('busca-entrada').addEventListener('input', (e) => carregarEntradas(e.target.value.trim()));

    $('btn-registrar-entrada').addEventListener('click', async () => {
        const produto_id = $('ent-produto').value;
        const quantidade = parseFloat($('ent-qtd').value);
        if (!produto_id) return alert('Selecione um produto.');
        if (!quantidade || quantidade <= 0) return alert('Quantidade inválida.');
        const payload = {
            produto_id,
            tipo: 'entrada',
            quantidade,
            ciclo: $('ent-ciclo').value.trim() || null,
            custo_unitario: parseMoeda($('ent-custo').value),
            preco_revista: parseMoeda($('ent-revista').value),
            validade: $('ent-validade').value || null,
            fornecedor: $('ent-fornecedor').value.trim() || null,
            observacao: $('ent-obs').value.trim() || null,
        };
        const { error } = await sb.from('silene_estoque_movimentos').insert(payload);
        if (error) return alert('Erro: ' + error.message);
        if (payload.preco_revista > 0) {
            await sb.from('silene_produtos').update({ preco_revista: payload.preco_revista }).eq('id', produto_id);
        }
        if (payload.custo_unitario > 0) {
            await sb.from('silene_produtos').update({ preco_custo: payload.custo_unitario }).eq('id', produto_id);
        }
        alert('Entrada registrada com sucesso!');
        $('ent-qtd').value = '1';
        $('ent-ciclo').value = '';
        $('ent-custo').value = '';
        $('ent-revista').value = '';
        $('ent-validade').value = '';
        $('ent-fornecedor').value = '';
        $('ent-obs').value = '';
        await carregarEntradas($('busca-entrada').value.trim());
        await carregarEstoqueAtual();
        await carregarProdutos($('busca-produto-est').value.trim());
    });

    $('tabela-entradas').addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.act === 'del-ent') {
            if (!confirm('Excluir esta entrada?')) return;
            const { error } = await sb.from('silene_estoque_movimentos').delete().eq('id', id);
            if (error) return alert('Erro: ' + error.message);
            await carregarEntradas($('busca-entrada').value.trim());
            await carregarEstoqueAtual();
            await carregarProdutos($('busca-produto-est').value.trim());
        } else if (btn.dataset.act === 'edit-ent') {
            // fetch the movement
            const { data, error } = await sb.from('silene_estoque_movimentos').select('*').eq('id', id).single();
            if (error || !data) return alert('Erro ao carregar.');
            $('ent-produto').value = data.produto_id;
            $('ent-qtd').value = data.quantidade;
            $('ent-ciclo').value = data.ciclo || '';
            $('ent-custo').value = data.custo_unitario ? 'R$ ' + Number(data.custo_unitario).toFixed(2).replace('.', ',') : '';
            $('ent-revista').value = data.preco_revista ? 'R$ ' + Number(data.preco_revista).toFixed(2).replace('.', ',') : '';
            $('ent-validade').value = data.validade || '';
            $('ent-fornecedor').value = data.fornecedor || '';
            $('ent-obs').value = data.observacao || '';
            // delete original; user re-registers (simplest edit flow)
            if (confirm('Os dados foram carregados no formulário. A entrada original será removida ao registrar a nova. Continuar?')) {
                await sb.from('silene_estoque_movimentos').delete().eq('id', id);
                await carregarEntradas($('busca-entrada').value.trim());
            }
        }
    });

    // ---------- ESTOQUE ATUAL ----------
    async function carregarEstoqueAtual(term = '', de = '', ate = '') {
        let rows = [];
        if (de || ate) {
            // aggregate from movements within range
            let q = sb.from('silene_estoque_movimentos').select('*, silene_produtos(id,nome,codigo,unidade,estoque_minimo,preco_custo,preco_revista,marca_id,categoria_id,silene_marcas(nome),silene_categorias(nome))');
            if (de) q = q.gte('created_at', de + 'T00:00:00');
            if (ate) q = q.lte('created_at', ate + 'T23:59:59');
            const { data, error } = await q;
            if (error) { console.error(error); return; }
            const map = {};
            (data || []).forEach(m => {
                const p = m.silene_produtos;
                if (!p) return;
                if (!map[p.id]) map[p.id] = { ...p, saldo: 0, valor_investido: 0 };
                if (m.tipo === 'entrada') { map[p.id].saldo += Number(m.quantidade); map[p.id].valor_investido += Number(m.quantidade) * Number(m.custo_unitario || p.preco_custo || 0); }
                else { map[p.id].saldo -= Number(m.quantidade); }
            });
            rows = Object.values(map);
        } else {
            const { data, error } = await sb.from('silene_estoque_atual').select('*').order('nome');
            if (error) { console.error(error); return; }
            rows = data || [];
        }
        if (term) {
            const t = term.toLowerCase();
            rows = rows.filter(r =>
                (r.nome || '').toLowerCase().includes(t) ||
                (r.marca || '').toLowerCase().includes(t) ||
                (r.categoria || '').toLowerCase().includes(t) ||
                (r.codigo || '').toLowerCase().includes(t)
            );
        }
        renderEstoqueAtual(rows);
    }
    function renderEstoqueAtual(rows) {
        const tbody = $('tabela-estoque-atual').querySelector('tbody');
        tbody.innerHTML = '';
        let total = 0;
        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="txt-vazio">Nenhum produto.</td></tr>';
        }
        rows.forEach(r => {
            const baixo = r.estoque_minimo > 0 && Number(r.saldo) < r.estoque_minimo;
            const status = baixo ? '<span class="status-baixo">⚠ Baixo</span>' : '<span class="status-ok">OK</span>';
            const subs = (r._subs || []).map(s => s.nome).join(', ') || '-';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.nome || r.codigo}</td>
                <td>${r.marca || '-'}</td>
                <td>${r.categoria || '-'}</td>
                <td style="font-size:0.75rem;">${subs}</td>
                <td>${r.saldo} ${r.unidade || 'un'}</td>
                <td>${r.estoque_minimo || 0}</td>
                <td>${status}</td>
            `;
            tbody.appendChild(tr);
            total += Number(r.valor_investido) || 0;
        });
        $('estoque-valor-total').textContent = fmt(total);
    }
    $('btn-filtrar-estoque').addEventListener('click', () => {
        carregarEstoqueAtual($('busca-estoque').value.trim(), $('estoque-data-de').value, $('estoque-data-ate').value);
    });
    $('busca-estoque').addEventListener('input', (e) => {
        // debounce simple
        clearTimeout(window._buscaEstoqueT);
        window._buscaEstoqueT = setTimeout(() => carregarEstoqueAtual(e.target.value.trim(), $('estoque-data-de').value, $('estoque-data-ate').value), 300);
    });
    $('btn-imprimir-estoque').addEventListener('click', () => {
        window.print();
    });

    // ---------- HISTÓRICO ----------
    async function carregarHistorico(term = '', filtroProd = '', filtroTipo = '') {
        let q = sb.from('silene_estoque_movimentos')
            .select('*, silene_produtos(nome,codigo)')
            .order('created_at', { ascending: false })
            .limit(300);
        if (filtroProd) q = q.eq('produto_id', filtroProd);
        if (filtroTipo) q = q.eq('tipo', filtroTipo);
        const { data, error } = await q;
        if (error) { console.error(error); return; }
        let rows = data || [];
        if (term) {
            const t = term.toLowerCase();
            rows = rows.filter(m =>
                (m.silene_produtos?.nome || '').toLowerCase().includes(t) ||
                (m.silene_produtos?.codigo || '').toLowerCase().includes(t) ||
                (m.ciclo || '').toLowerCase().includes(t) ||
                (m.observacao || '').toLowerCase().includes(t)
            );
        }
        renderHistorico(rows);
    }
    function renderHistorico(rows) {
        const tbody = $('tabela-historico').querySelector('tbody');
        tbody.innerHTML = '';
        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="txt-vazio">Nenhuma movimentação.</td></tr>';
            return;
        }
        rows.forEach(m => {
            const tr = document.createElement('tr');
            const tipoCls = m.tipo === 'entrada' ? 'status-entrada' : 'status-saida';
            tr.innerHTML = `
                <td>${fmtDate(m.created_at)}</td>
                <td>${m.silene_produtos?.nome || '-'}</td>
                <td class="${tipoCls}">${m.tipo}</td>
                <td>${m.quantidade}</td>
                <td>${m.ciclo || '-'}</td>
                <td>${fmt(m.custo_unitario)}</td>
                <td>${m.observacao || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    $('btn-filtrar-hist').addEventListener('click', () => {
        carregarHistorico($('busca-hist').value.trim(), $('hist-filtro-produto').value, $('hist-filtro-tipo').value);
    });
    $('busca-hist').addEventListener('input', (e) => {
        clearTimeout(window._buscaHistT);
        window._buscaHistT = setTimeout(() => carregarHistorico(e.target.value.trim(), $('hist-filtro-produto').value, $('hist-filtro-tipo').value), 300);
    });

    // ---------- carregar tudo ----------
    async function carregarTudoEstoque() {
        await Promise.all([carregarMarcas(), carregarCategorias(), carregarSubs()]);
        await carregarProdutos();
        await carregarEstoqueAtual();
        await carregarEntradas();
        await carregarHistorico();
    }
    // expose for modal open callback
    window.carregarTudoEstoque = carregarTudoEstoque;
});
