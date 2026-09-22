/**
 * Recebe os contatos da landing do Hefesto e grava numa aba da planilha.
 *
 * COMO INSTALAR (5 minutos)
 * ────────────────────────────────────────────────────────────────────────────
 *  1. Crie uma planilha nova no Google Sheets.
 *  2. Extensões › Apps Script. Apague o que estiver lá e cole ESTE arquivo.
 *  3. Troque o valor de TOKEN abaixo por uma frase secreta sua.
 *  4. Implantar › Nova implantação › tipo "App da Web".
 *       Executar como:   Eu
 *       Quem pode acessar: Qualquer pessoa
 *  5. Copie a URL que termina em /exec e cadastre no Cloudflare:
 *       npx wrangler secret put SHEET_URL     (cole a URL)
 *       npx wrangler secret put SHEET_TOKEN   (cole a mesma frase do passo 3)
 *
 * Para conferir se ficou de pé, abra a URL /exec no navegador: deve responder
 * {"ok":true,"vivo":true}.
 */

var TOKEN = 'TROQUE-POR-UMA-FRASE-SECRETA';
var ABA = 'Lista de espera';

var COLUNAS = [
  'Recebido em', 'Nome', 'Empresa', 'E-mail', 'WhatsApp',
  'Comando', 'Origem', 'País', 'Referer'
];

function pegarAba_() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(ABA);
  if (!aba) {
    aba = planilha.insertSheet(ABA);
  }
  if (aba.getLastRow() === 0) {
    aba.appendRow(COLUNAS);
    aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight('bold');
    aba.setFrozenRows(1);
  }
  return aba;
}

function responder_(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Teste de vida: abrir a URL no navegador. */
function doGet() {
  return responder_({ ok: true, vivo: true });
}

function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);

    if (TOKEN && dados.token !== TOKEN) {
      return responder_({ ok: false, erro: 'token invalido' });
    }

    var quando = dados.recebido_em ? new Date(dados.recebido_em) : new Date();

    // Bloqueio por poucos segundos: duas abas gravando ao mesmo tempo não
    // podem escrever na mesma linha.
    var trava = LockService.getScriptLock();
    trava.waitLock(15000);
    try {
      pegarAba_().appendRow([
        quando,
        dados.nome || '',
        dados.empresa || '',
        dados.email || '',
        dados.whatsapp || '',
        dados.comando || '',
        dados.origem || '',
        dados.pais || '',
        dados.referer || ''
      ]);
    } finally {
      trava.releaseLock();
    }

    return responder_({ ok: true });
  } catch (erro) {
    return responder_({ ok: false, erro: String(erro) });
  }
}
