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

    // Ativando Módulo 2: Controle de Estoque (abrir/fechar fica no script.js - módulo Supabase)

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
