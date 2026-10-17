# ERP Silene — Hub de Eficiência

ERP para loja de cosméticos/perfumes (marca **Silene**). Hub de eficiência com módulos de estoque, vendas, clientes e financeiro.

## 🌐 Demo

- **GitHub Pages:** https://ulifran.github.io/erp-silene/
- **Backend:** Supabase (PostgreSQL + RLS)

## 🧱 Tecnologias

- HTML5 / CSS3 / JavaScript (vanilla, sem framework, sem build step)
- Supabase JS SDK v2 (via CDN)
- Font Awesome (ícones)
- Servidor local de desenvolvimento: Python `http.server`

## 📁 Estrutura

```
erp-silene/
├── index.html
├── style.css
├── script.js
├── REFERENCIA_PROJETO.md   # Contexto completo para desenvolvimento
└── skill/
```

## 🚀 Como rodar localmente

```powershell
cd "C:\Users\umfra\Documents\Projetos\erp-silene"
python -m http.server 8765
```

Acesse: http://localhost:8765/index.html

> Dica: use modo anônimo (Ctrl+Shift+N) + Ctrl+F5 para evitar cache.

## ⚙️ Configuração do Supabase

As credenciais estão em `index.html` (`<head>`):

```js
window.SUPABASE_URL = "https://oxmwibmlnvyzztnntubs.supabase.co";
window.SUPABASE_KEY = "sb_publishable_...";
```

Para migrar para outro projeto (ex.: Supabase do cliente), basta trocar essas duas variáveis e fazer novo push.

## 📦 Módulo de Estoque (implementado)

- CRUD de **Marcas** e **Categorias** (busca, adicionar, editar, excluir)
- CRUD de **Subcategorias/Atributos** (Tipo de produto, Família olfativa, Linha)
- CRUD de **Produtos** (código, nome, marca, categoria, unidade, preços, estoque mínimo, chips de subcategorias)
- **Entrada de Estoque** (quantidade, ciclo, custo, revista, validade, fornecedor, obs.)
- **Estoque Atual** (saldo, alerta de estoque baixo, total investido, filtro por período, impressão A4)
- **Histórico** de movimentações (filtros por produto/tipo/busca)

Buscas e persistência via Supabase (ilike). RLS aberta para testes.

## 🗄️ Schema (Supabase)

Tabelas com prefixo `silene_`:
- `silene_marcas`, `silene_categorias`, `silene_subcategorias`
- `silene_produtos`, `silene_produto_subcategorias` (N:N)
- `silene_estoque_movimentos`
- View `silene_estoque_atual`

Detalhes completos em `REFERENCIA_PROJETO.md`.

## 🛠️ Desenvolvimento

- Verificar sintaxe JS: `node --check script.js`
- Incrementar cache-busting (`?v=N`) em `index.html` ao alterar CSS/JS.
- Encoding: UTF-8.

## 📝 Licença

Uso interno / cliente. Ajustar conforme contrato.
