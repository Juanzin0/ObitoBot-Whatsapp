const fs = require('fs');
const path = require('path');

const BANK_PATH = path.join(__dirname, '..', 'database', 'bank.json');

function bankPadrao() {
  return {
    saldo: 0,
    taxaDeposito: 5,
    taxaEmprestimo: 10,
    totalEmprestimos: 0,
    totalDepositos: 0,
    totalTaxas: 0,
  };
}

function loadBank() {
  if (!fs.existsSync(BANK_PATH)) {
    fs.mkdirSync(path.dirname(BANK_PATH), { recursive: true });
    const inicial = bankPadrao();
    fs.writeFileSync(BANK_PATH, JSON.stringify(inicial, null, 2));
    return inicial;
  }
  try {
    return { ...bankPadrao(), ...JSON.parse(fs.readFileSync(BANK_PATH, 'utf8')) };
  } catch { return bankPadrao(); }
}

function saveBank(bank) {
  fs.writeFileSync(BANK_PATH, JSON.stringify(bank, null, 2));
}

function updateBank(patch) {
  const bank = loadBank();
  const novo = { ...bank, ...patch };
  saveBank(novo);
  return novo;
}

function incrementBank(campo, valor) {
  const bank = loadBank();
  bank[campo] = (bank[campo] || 0) + valor;
  saveBank(bank);
  return bank;
}

module.exports = { loadBank, saveBank, updateBank, incrementBank, bankPadrao };
