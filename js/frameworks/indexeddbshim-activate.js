// --- activate Shim !
// Zum Anhängen an Shim-Module beim packen

window.shimIndexedDB.__useShim();
window.SHIMindexedDB = window.shimIndexedDB;
//window.shimIndexedDB.__debug(true);
