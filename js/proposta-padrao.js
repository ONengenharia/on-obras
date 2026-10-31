// Textos padrão da proposta em revista (compartilhados): mudou aqui, muda em todas as propostas ainda não enviadas.
// Propostas enviadas guardam uma cópia completa no momento do envio.
window.PROP_PADRAO = {
  capa: { chip: "Proposta comercial", titulo: "Serviços de engenharia e execução de <b>infraestrutura eletromecânica</b> para eletrificação e iluminação pública de loteamento urbano." },
  cliente: { nome: "", projeto: "", cidade: "" },
  orc: { numero: "", versao: "", data: "", validade: "" },
  projeto: { kicker: "Seu projeto", titulo: "Redes de distribuição e <b>iluminação pública</b>", sub: "Incorporação · planta do projeto", planta: "", sat: "", legSat: "Localização da obra" },
  resumo: { kicker: "Resumo da obra", titulo: "O que será <b>entregue</b>", stats: [], texto: "Tudo o que está descrito nas próximas páginas é entregue <b>completo, testado e energizado</b>: do fornecimento dos materiais à execução em campo, com ART, equipe própria e acompanhamento da obra pelo seu link exclusivo." },
  materiais: { chip: "Proposta técnica · 1", titulo: "Fornecimento de <b>materiais</b>", itens: [] },
  mao: { chip: "Proposta técnica · 2", titulo: "Execução e <b>mão de obra</b>", itens: [
    { t: "Infraestrutura e montagem", d: "Hincamento e alinhamento dos postes, lançamento de rede compacta (MT) e multiplexada (BT), com tensionamento e fixação de mensageiros." },
    { t: "Equipamentos", d: "Instalação e interligação dos transformadores, com todos os sistemas de aterramento e proteção." },
    { t: "Iluminação pública", d: "Montagem do parque de IP: luminárias LED e braços tipo cisne, fixados com cintas e parafusos de alta resistência." },
    { t: "Gestão logística e técnica", d: "Transporte de materiais, ART de execução e acompanhamento de todas as etapas de vistoria até a ligação pela concessionária." }] },
  escopo: { kicker: "Considerações finais", titulo: "Escopo e <b>responsabilidades</b>",
    texto: "O escopo contempla materiais, equipamentos, infraestrutura e mão de obra especializada para a execução completa da rede, conforme a concessionária local, a ABNT e o projeto apresentado. Todos os materiais são novos, de primeira linha e homologados pela concessionária.",
    resp: ["ART de projeto e execução", "Testes elétricos e comissionamento", "Alojamento, alimentação e deslocamento de equipes", "Interações e programações com a concessionária", "Solicitações documentais e contrato de incorporação junto à concessionária"],
    nao: ["Taxas da concessionária ou de órgãos públicos", "Licenciamentos ambientais", "Adequações civis não especificadas", "Recomposição de acabamentos nobres", "Projeto e execução em via pública da concessionária", "Segurança dos materiais no canteiro", "Abertura de cavas em solo “C”, laje ou rocha", "Podas e supressão de vegetação"],
    rodape: "Orçamento baseado em projeto técnico da contratada, pendente de aprovação final pela concessionária. Solicitações excepcionais podem levar à revisão dos valores. Normas: NR-10, NBR 14039, NBR 5410 e padrões construtivos da concessionária." },
  valores: { kicker: "Valores globais", titulo: "Investimento <b>total</b>", material: 0, mao: 0, total: 0, lotes: 0, porLote: 0,
    p1: "<b>Faturamento.</b> A mão de obra é faturada direto pela ON Engenharia. Os valores de materiais foram estimados à vista, com faturamento emitido pelo fornecedor direto à contratante. Os preços de mercado oscilam semanalmente, então o orçamento final será atualizado pelas tabelas vigentes na data da compra.",
    p2: "<b>Flexibilidade de negociação.</b> Prazos, parcelamentos e demais condições podem ser renegociados entre contratante, contratada e fornecedores, de acordo com o cronograma físico-financeiro e as políticas dos fornecedores." },
  curva: { kicker: "Curva de preços dos materiais", titulo: "Onde está o <b>dinheiro</b>", texto: "", linhas: [] },
  cron: { kicker: "Cronogramas", titulo: "Pagamento e <b>execução</b>", fin: "Cronograma financeiro", parcelas: [], exec: "Cronograma executivo",
    cols: ["01", "30", "60", "90", "120", "150"],
    rows: [{ a: "Assinatura de contrato", x: [1, 0, 0, 0, 0, 0] }, { a: "Início de mobilização de mat.", x: [0, 1, 0, 0, 0, 0] }, { a: "Término de mobilização de mat.", x: [0, 0, 1, 0, 0, 0] }, { a: "Início da execução de obra", x: [0, 0, 0, 1, 0, 0] }, { a: "Término da execução de obra", x: [0, 0, 0, 0, 1, 1] }] },
  fotos: { kicker: "Nossas obras", titulo: "Fotos <b>executivas</b>", sub1: "Infraestruturas elétricas", sub2: "Infraestruturas civis", eletricas: ["", "", "", ""], civis: ["", "", ""] },
  acomp: { chip: "Diferencial · OrçaRede", titulo: "Sua obra na <b>palma da mão</b>", texto: "Cada cliente ON recebe um <b>link exclusivo da sua obra</b> para acompanhar tudo em tempo real, pelo celular ou computador: progresso, linha do tempo, fotos da equipe em campo e materiais instalados.", foto: "", demo: "https://orcaredeteste.vercel.app/obra/tracking-1789564957239", demoNota: "Toque no botão para abrir um exemplo real de acompanhamento." },
  aceite: { kicker: "Termo de aceite", titulo: "Vamos <b>começar?</b>",
    texto: "Agradecemos a oportunidade de apresentar nossa proposta técnica e comercial para o <b>{projeto}</b>. Nosso compromisso é entregar uma infraestrutura de energia e iluminação que alie segurança normativa, eficiência tecnológica e durabilidade. Estamos à disposição para eventuais ajustes técnicos.",
    resp: "Eng. Luan Stefanello Pianesso · CREA/RS 278122", local: "ON Engenharia · Ibirubá / RS", fone: "(55) 9 9133-7296", email: "contato@onengenhariaeletrica.com.br", whats: "5555991337296" },
  paginas: {},   // { id: false } oculta a página
  obs: {}        // observações internas por página (nunca aparecem para o cliente)
};
// Páginas da proposta, na ordem: id → rótulo
window.PROP_PAGINAS = [["capa", "Capa"], ["projeto", "Projeto (planta e satélite)"], ["resumo", "Resumo da obra"], ["materiais", "Materiais"], ["mao", "Mão de obra"], ["escopo", "Escopo e responsabilidades"], ["valores", "Valores globais"], ["curva", "Curva de preços"], ["cron", "Cronogramas"], ["fotos", "Fotos executivas"], ["acomp", "Acompanhamento da obra"], ["clientes", "Nossos clientes"], ["aceite", "Termo de aceite"]];
window.propMerge = function m(a, b) {   // b sobrepõe a; objetos mesclam, arrays e valores substituem
  if (b === undefined || b === null) return a;
  if (Array.isArray(a) || Array.isArray(b) || typeof a !== "object" || typeof b !== "object" || a === null) return b;
  const o = { ...a }; for (const k of Object.keys(b)) o[k] = m(a[k], b[k]); return o;
};
