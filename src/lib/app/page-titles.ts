export function titleForPath(pathname: string): string {
  if (pathname === "/dashboard") return "Painel";
  if (pathname === "/products/new") return "Novo produto";
  if (/^\/products\/[^/]+\/edit$/.test(pathname)) return "Editar produto";
  if (pathname.startsWith("/products")) return "Gestão de estoque";
  if (pathname === "/clients/new") return "Novo cliente";
  if (/^\/clients\/[^/]+$/.test(pathname)) return "Cliente";
  if (pathname.startsWith("/clients")) return "Clientes";
  if (pathname === "/sales/new") return "Nova venda";
  if (/^\/sales\/[^/]+$/.test(pathname)) return "Detalhe da venda";
  if (pathname.startsWith("/sales")) return "Vendas";
  if (pathname.startsWith("/reports")) return "Relatórios financeiros";
  if (pathname.startsWith("/stock-low")) return "Alertas de estoque";
  if (pathname.startsWith("/users")) return "Equipe e usuários";
  return "Fluxo+";
}
