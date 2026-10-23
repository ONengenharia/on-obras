// Conexão com o Supabase (chave publicável: pode ficar no site, o acesso é controlado pelas regras do banco)
window.ON_CONFIG = {
  url: "https://qphayphqrwyvhesykpmb.supabase.co",
  key: "sb_publishable_xOlRcmtdSVpXPxFjLHr4bA_VkAdGQIE",
  bucket: "obras"
};

// Guarda o tipo de link (convite / nova senha) antes do Supabase ler e limpar o endereço
window.ON_LINK_TIPO = (location.hash.match(/type=(invite|recovery|signup)/) || [])[1] || "";
