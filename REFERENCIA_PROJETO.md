# REFERÊNCIA DO PROJETO — ERP SILENE

> Documento de contexto para continuação do desenvolvimento no OpenCode (Windows).
> Última atualização: 2026-10-17

---

## 1. VISÃO GERAL

ERP para loja de cosméticos/perfumes (marca "Silene"). Hub de eficiência com módulos:
- Controle de Estoque (principal, integrado ao Supabase)
- Nova Venda (Pedido)
- Clientes & Campanhas
- Financeiro (Contas)

Frontend estático (HTML/CSS/JS puro) + backend Supabase (PostgreSQL + RLS). Sem build step, sem framework.

---

## 2. ESTRUTURA DE ARQUIVOS

```
C:\Users\umfra\Documents\Projetos\erp-silene\
├── index.html          # Página principal (modais, layout)
├── style.css           # Estilos (tema light, fundo mármore/champagne)
├── script.js           # Lógica (busca, modais, vendas, CRM, estoque/Supabase)
├── skill\design de front-end.md
└── (servidor local: python -m http.server 8765)
```

URL local: http://localhost:8765/index.html
Servidor: `python -m http.server 8765` (workdir = pasta do projeto)

---

## 3. TECNOLOGIAS

- HTML5 / CSS3 / JavaScript (vanilla, ES2020+)
- Supabase JS SDK v2 via CDN: `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- Font Awesome (ícones) via CDN (cloudflare)
- Python (servidor local de desenvolvimento)
- Banco: Supabase (PostgreSQL) — projeto de testes

---

## 4. CONFIGURAÇÃO SUPABASE

- **Project URL:** `https://oxmwibmlnvyzztnntubs.supabase.co`
- **Publishable/Anon Key:** `sb_publishable_gnO6-gal4b-TXOkhlQ6CWw_mvvg47zT`
- **Config no código (index.html, <head>):**
  ```js
  window.SUPABASE_URL = "https://oxmwibmlnvyzztnntubs.supabase.co";
  window.SUPABASE_KEY = "sb_publishable_gnO6-gal4b-TXOkhlQ6CWw_mvvg47zT";
  ```
- **Cliente (script.js):** `const sb = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);`
- **RLS:** aberta para testes (anon + authenticated, USING(true)/WITH CHECK(true)). Trocar em produção.
- **Auth:** ainda não implementado (planejado por último).

> Obs: este é projeto de testes. Será migrado para o Supabase da Silene (a criar) depois.

---

## 5. SCHEMA DO BANCO (tabelas Silene)

Todas as tabelas do módulo de estoque usam prefixo `silene_`.

### 5.1 silene_marcas
| coluna | tipo | obs |
|--------|------|-----|
| id | uuid PK (gen_random_uuid) | |
| nome | text NOT NULL UNIQUE | |
| created_at | timestamptz default now() | |

### 5.2 silene_categorias
Mesma estrutura de marcas.

### 5.3 silene_subcategorias (atributos do produto)
| coluna | tipo | obs |
|--------|------|-----|
| id | uuid PK | |
| tipo | text CHECK (tipo_produto, familia_olfativa, linha) | |
| nome | text NOT NULL | |
| created_at | timestamptz | |
| UNIQUE (tipo, nome) | | |

Tipos fixos (frontend): `tipo_produto` = "Tipo de produto", `familia_olfativa` = "Família olfativa", `linha` = "Linha".

### 5.4 silene_produtos
| coluna | tipo | obs |
|--------|------|-----|
| id | uuid PK | |
| codigo | text NOT NULL | |
| nome | text NOT NULL | |
| marca_id | uuid FK → silene_marcas (SET NULL) | |
| categoria_id | uuid FK → silene_categorias (SET NULL) | |
| unidade | text default 'un' | un/ml/g/kg |
| preco_custo | numeric(12,2) default 0 | |
| preco_revista | numeric(12,2) default 0 | |
| estoque_minimo | integer default 0 | |
| ativo | boolean default true | |
| created_at | timestamptz | |

### 5.5 silene_produto_subcategorias (N:N)
PK composta (produto_id, subcategoria_id). FKs com CASCADE.

### 5.6 silene_estoque_movimentos
| coluna | tipo | obs |
|--------|------|-----|
| id | uuid PK | |
| produto_id | uuid FK → silene_produtos (CASCADE) | |
| tipo | text CHECK (entrada, saida) | |
| quantidade | numeric(12,2) > 0 | |
| custo_unitario | numeric(12,2) | |
| preco_revista | numeric(12,2) | |
| ciclo | text | ciclo da revista |
| validade | date | |
| fornecedor | text | |
| observacao | text | |
| created_at | timestamptz | |

### 5.7 View silene_estoque_atual
Agrega por produto: saldo (entradas - saídas), valor_investido, + dados de produto/marca/categoria.

### 5.8 Tabelas antigas do ERP de teste (zeradas)
app_settings, customers, products, cycles, prices, stock_lots, orders, order_items, stock_reservations, receipts, expenses, operators, campaigns. (Dados limpos, estrutura mantida.)

---

## 6. FRONTEND — index.html

### 6.1 Estrutura
- `<head>`: CSS (style.css?v=9), Supabase SDK, config (URL/KEY), Font Awesome.
- `<body>`: navbar (logo HUB SILENE, perfil), container com welcome + busca + grid de cards.
- Modais: `modal-venda`, `modal-estoque` (wide, tabbed), `modal-clientes`.
- Script: script.js?v=3 no final do body.

### 6.2 Modal de Estoque (tabbed)
Abas (`.tab-btn` / `.tab-content`):
1. `tab-marcas` — busca + adicionar + tabela (editar/excluir)
2. `tab-categorias` — idem
3. `tab-subcategorias` — tipo select + valor + busca + tabela
4. `tab-produtos` — busca + form (código, nome, marca, categoria, unidade, custo, revista, mínimo) + chips subcategorias + salvar/limpar + tabela
5. `tab-entrada` — busca + form (produto, qtd, ciclo, custo, revista, validade, fornecedor, obs) + registrar + tabela entradas
6. `tab-estoque-atual` — busca + filtro data (de/até) + filtrar + imprimir A4 + tabela + total investido
7. `tab-historico` — busca + filtros produto/tipo + tabela

### 6.3 IDs importantes
- Modal: `modal-estoque`, `btn-abrir-estoque`, `btn-fechar-estoque`, `btn-cancelar-estoque`
- Tabs container: `estoque-tabs`
- Marcas: `busca-marca`, `nova-marca-nome`, `btn-add-marca`, `tabela-marcas`
- Categorias: `busca-categoria`, `nova-categoria-nome`, `btn-add-categoria`, `tabela-categorias`
- Subcategorias: `sub-tipo`, `nova-sub-nome`, `btn-add-sub`, `busca-sub`, `tabela-subcategorias`
- Produtos: `busca-produto-est`, `prod-codigo`, `prod-nome`, `prod-marca`, `prod-categoria`, `prod-unidade`, `prod-custo`, `prod-revista`, `prod-minimo`, `chips-subcategorias`, `btn-salvar-produto`, `btn-limpar-produto`, `tabela-produtos`
- Entrada: `busca-entrada`, `ent-produto`, `ent-qtd`, `ent-ciclo`, `ent-custo`, `ent-revista`, `ent-validade`, `ent-fornecedor`, `ent-obs`, `btn-registrar-entrada`, `tabela-entradas`
- Estoque atual: `busca-estoque`, `estoque-data-de`, `estoque-data-ate`, `btn-filtrar-estoque`, `btn-imprimir-estoque`, `tabela-estoque-atual`, `estoque-valor-total`
- Histórico: `busca-hist`, `hist-filtro-produto`, `hist-filtro-tipo`, `btn-filtrar-hist`, `tabela-historico`

---

## 7. FRONTEND — script.js

### 7.1 Estrutura
1. **Dados simulados** (estoqueProdutos, baseClientes) para módulos antigos (venda/CRM).
2. **DOMContentLoaded #1** (app principal):
   - Busca de cards na home
   - `gerenciarModal()` genérico
   - Modais: venda, estoque (chama `carregarTudoEstoque()`), clientes
   - Buscador de produtos dentro da venda
   - Lógica do pedido de venda + total
   - Painel CRM (aniversariantes)
3. **Supabase client** (`sb`)
4. **DOMContentLoaded #2** (módulo de estoque): todas as funções `carregar*`, `render*`, handlers.

### 7.2 Helpers
- `$ (id)` → getElementById
- `fmt(n)` → moeda BRL
- `fmtDate(d)` → data BR
- `parseMoeda(s)` → string "R$ 1.234,56" → number
- `maskMoeda(input)` → máscara de digitação
- `switchTab(name)` → troca aba
- `labelTipo(t)` → label do tipo de subcategoria

### 7.3 Funções principais do estoque
- `carregarMarcas(term)`, `renderMarcas()`
- `carregarCategorias(term)`, `renderCategorias()`
- `carregarSubs(term)`, `renderSubs()`, `renderChipsSubcategorias()`
- `carregarProdutos(term)` (Supabase ilike + load subs), `renderProdutos()`
- `carregarEntradas(term)`, `renderEntradas()`
- `carregarEstoqueAtual(term, de, ate)` (view ou agregação por período), `renderEstoqueAtual()`
- `carregarHistorico(term, prod, tipo)`, `renderHistorico()`
- `carregarTudoEstoque()` (carrega tudo) — exposta em `window`

### 7.4 Buscas
Todas via Supabase (`.ilike()`, `.or()`), não frontend. Para poucos dados também funciona.

### 7.5 Edição
- Marcas/Categorias: via `prompt()`.
- Produtos: preenche formulário + chips, salva como update.
- Entradas: carrega no form, remove original (re-registrar).

---

## 8. FRONTEND — style.css

- Tema light (Hub de Eficiência).
- Fundo: champagne/blush com bokeh (rosa/lavanda/pêssego) + textura de seda/grão.
- Navbar: dark navy com textura de pele de cobra + borda cromada.
- Cards brancos, botões escuros.
- Classes utilitárias de estoque: `.tabs`, `.tab-btn`, `.tab-content`, `.form-row`, `.form-grid`, `.form-actions`, `.table-wrap`, `.data-table`, `.chips-area`, `.chip`, `.status-*`, `.resumo-box`, `.modal-box-wide`, `.subtitulo`.
- `@media print` para impressão A4 (oculta tudo exceto #print-estoque — *nota: implementação atual usa window.print() padrão; melhorar se necessário*).

---

## 9. FUNCIONALIDADES IMPLEMENTADAS

### Estoque
- ✅ CRUD Marcas (busca, add, edit, delete)
- ✅ CRUD Categorias (busca, add, edit, delete)
- ✅ CRUD Subcategorias/atributos (3 tipos, busca, add, delete)
- ✅ CRUD Produtos (busca, form completo, chips, edit, delete, código clicável → entrada)
- ✅ Entrada de estoque (registrar, busca, edit, delete, atualiza preço do produto)
- ✅ Estoque atual (busca, filtro por período, alerta baixo, total investido, imprimir)
- ✅ Histórico (busca, filtros produto/tipo)
- ✅ Integração Supabase (anon read/write testado)

### Outros módulos (simulados, em memória)
- Nova Venda (pedido) — não baixa estoque real ainda
- Clientes & Campanhas (aniversariantes, WhatsApp)
- Financeiro — não implementado

---

## 10. PENDÊNCIAS / PRÓXIMOS PASSOS

1. **Saída de estoque / baixa por venda** — venda deveria consumir estoque (reservar/consumir).
2. **Auth** — login de operador (RLS já preparada com `operators`/`is_operator()`).
3. **Financeiro** — contas a pagar/receber.
4. **Impressão PDF A4** — melhorar layout de impressão (atualmente print padrão).
5. **Migração para Supabase da Silene** (produção).
6. **Validação de campos** e tratamento de erros mais robusto.
7. **Módulo de Clientes** integrado ao Supabase (hoje simulado).
8. **Módulo de Vendas** integrado ao Supabase (hoje simulado).

---

## 11. COMANDOS ÚTEIS

```powershell
# Servidor local
cd "C:\Users\umfra\Documents\Projetos\erp-silene"
python -m http.server 8765

# Verificar sintaxe JS
node --check "C:\Users\umfra\Documents\Projetos\erp-silene\script.js"
```

Acesso: http://localhost:8765/index.html

---

## 12. NOTAS IMPORTANTES

- Cache do navegador: usar modo anônimo (`Ctrl+Shift+N`) + `Ctrl+F5` ao testar mudanças.
- Cache-busting: `style.css?v=N` e `script.js?v=N` em index.html — incrementar ao mudar.
- Encoding: arquivos em UTF-8 (acentos podem aparecer corrompidos no terminal, mas o navegador exibe correto).
- RLS aberta para testes — **NÃO usar em produção**.
- Todas as tabelas de teste foram zeradas (100% do zero) em 2026-10-17.
- O modelo usado neste projeto: Beam Free (OpenCode).

## 13. REPOSITÓRIO / DEPLOY

- **GitHub:** https://github.com/UliFran/erp-silene
- **Branch principal:** `main`
- **GitHub Pages:** https://ulifran.github.io/erp-silene/
- **Último commit:** Initial commit (ERP Silene - estoque + Supabase)
- **Remote (sem token):** https://github.com/UliFran/erp-silene.git
- Para novo push: `git add -A && git commit -m "..." && git push`
- Ativar Pages: Settings → Pages → Source: Deploy from branch → main / (root)
