function testCreds(callback) {
// eingetragene Credentials testen
	$.ajax({
		url: GLOBALS.SyncServer + '/' + btoa(GLOBALS.userID) + '/check/',
		type: 'GET',
		headers: {
			"Authorization": "Basic " + btoa(GLOBALS.userID + ":" + GLOBALS.passW)
		},
		timeout: GLOBALS.timeout,
		success: function(data, status, jqXHR){
			callback(jqXHR.status);
		},
		error: function(jqXHR, status, msg){
			callback(jqXHR.status);
		},
	});
}

function sync_getAccount(callback, localAccount) {
// Klassenliste und Metainfos für den Benutzer abfragen, mergen und weitergeben
	if (GLOBALS.AUTH) {
		console.log("ACCOUNT: sync/merge");
		$.ajax({
			url: GLOBALS.SyncServer + '/' + btoa(GLOBALS.userID) + '/account',
			type: 'GET',
			headers: {
				"Authorization": "Basic " + btoa(GLOBALS.userID + ":" + GLOBALS.passW)
			},
			timeout: GLOBALS.timeout,
			success: function(data, status, jqXHR){
				// GET
				var newData = (data.payload && isObject(data.payload)) ? decryptData(data.payload.data) : {};
				// Merge
				var merged = mergeAccount(newData, localAccount);
				//DEV console.log("SYNC: Merged", merged);
				// Save and Push back
				db_replaceData(function(){
					sync_pushBack(callback, merged, "account");
				}, merged, "account");
			},
			error: function(data, status, jqXHR){
				console.log("SYNC-ERROR: Kein Sync des Accounts durchgeführt !");
				console.log("SYNC-ERROR (status, data, jqXHR):", status, data, jqXHR);
				callback(localAccount); 
			},
		});
	}else{
		callback(localAccount);
	}
}


function sync_getKlasse(callback, classObjectArray) {
// Eine Klasse des Benutzers abfragen, mergen und weitergeben

	var klassenHash = classObjectArray[0];
	// Klasse vorhanden oder nur Hash übereben ?
	klassenObject = (classObjectArray.length === 1) ? {} : classObjectArray[1];

	if (GLOBALS.AUTH) {
		console.log("SYNC:", klassenHash);
		$.ajax({
			url: GLOBALS.SyncServer + '/' + btoa(GLOBALS.userID) + '/class/' + klassenHash,
			type: 'GET',
			headers: {
				"Authorization": "Basic " + btoa(GLOBALS.userID + ":" + GLOBALS.passW)
			},
			timeout: GLOBALS.timeout,
			success: function(data, status, jqXHR){
				// GET Klasse
				//DEV console.log("SYNC local:", klassenObject);
				var newData = (data.payload && isObject(data.payload)) ? decryptData(data.payload.data) : {};
				//DEV console.log("SYNC recieved:", newData);
				// Merge Klasse
				var merged = mergeKlasse(newData, klassenObject);
				if (merged) {
					//DEV console.log("SYNC merged to:", merged);
					// (Create)
					db_neueKlasse(function(){
						// Save lokal
						db_replaceData(function(){
							// Push zurück zu Server
							sync_pushBack(callback, merged, ["class", klassenHash]);
						}, merged, klassenHash, true);
					}, klassenHash, merged[1].name)
				}else{
					alert("Die Klasse konnte nicht abgerufen werden, weil weder auf dem Server noch auf deinem Gerät Daten dazu gefunden wurden !\nDer Eintrag ist eine Karteileiche !");
				}
			},
			error: function(data, status, jqXHR){
				console.log("SYNC-ERROR: Kein Sync der Klasse "+klassenObject.name+" ("+klassenHash+") durchgeführt !");
				console.log("SYNC-ERROR (status, data, jqXHR):", status, data, jqXHR);
				callback(klassenObject); 
			},
		});
	}else{
		callback(klassenObject);
	}
}


/* Erst interessant für Offline-Verfügbar oder Bereinigung
function sync_getMultiKlasses(callback, klassenListe) {
// Mehrere Klasse des Benutzers abfragen, mergen und weitergeben
	if (GLOBALS.AUTH) {
		var hashList = ""; // Join Klassenhashes aus den Objekten zu kommagetrennter Liste
		$.ajax({
			url: GLOBALS.SyncServer + '/' + btoa(GLOBALS.userID) + '/classes',
			type: 'GET',
			dataType: 'json',
			data: { 'ids' : hashList },
			headers: {
				"Authorization": "Basic " + btoa(GLOBALS.userID + ":" + GLOBALS.passW)
			},
			timeout: GLOBALS.timeout,
			success: function(data, status, jqXHR){
				//
				// Klassen abrufen und mergen (eigene Funtkion)
				//
			},
			error: function(data, status, jqXHR){
				console.log("SYNC-ERROR: Kein Sync der Klassenliste", hashList, "durchgeführt !");
				console.log("SYNC-ERROR (status, data, jqXHR):", status, data, jqXHR);
				callback(klassenObject); 
			},
		});
	}else{
		callback(klassenObject);
	}
}
*/


function sync_pushBack(callback, Data, uri) {
// Daten an den Server schicken (generic Function)
	if (GLOBALS.AUTH) {
		// keine lokalen Daten pushen
		var pushData = Object.assign({}, Data);
		if (pushData.hasOwnProperty('local')) {pushData.local = null;}
		var encrypted = encryptData(pushData);
		var url = (Array.isArray(uri)) ? uri.filter(function (val) {return val;}).join("/") : uri;
		url = "/" + url + "/";
		$.ajax({
			url: GLOBALS.SyncServer + '/' + btoa(GLOBALS.userID) + url,
			type: 'PUT',
			dataType: 'json',
			data: { 'payload' : encrypted },
			headers: {
				"Authorization": "Basic " + btoa(GLOBALS.userID + ":" + GLOBALS.passW)
			},
			timeout: GLOBALS.timeout,
			success: function(data, status, jqXHR){
				//DEV console.log("Push:", pushData);
				//DEV console.log("Response:", jqXHR);
				console.log("SYNC:", data.payload, " changed dataset(s) on server");
				callback(Data); // Callback bekommt gepushten Daten im Klartext
			},
			error: function(data, status, jqXHR){
				console.log("Failed !", data);
			},
		});
	}else{
		console.log("Keine Synchronisierung...");
		callback(Data); // Callback bekommt gepushten Daten im Klartext
	}
}


function sync_deleteKlasse(id, callback){
//-> Daten zur Klasse auf Server löschen
	if (GLOBALS.AUTH) {
		console.log("SYNC: lösche", id, "vom Server");
		$.ajax({
			url: GLOBALS.SyncServer + '/' + btoa(GLOBALS.userID) + '/class/' + id,
			type: 'DELETE',
			headers: {
				"Authorization": "Basic " + btoa(GLOBALS.userID + ":" + GLOBALS.passW)
			},
			timeout: GLOBALS.timeout,
			success: function(data, status, jqXHR){
				console.log("SYNC: erfolgreich !");
				callback();
			},
			error: function(data, status, jqXHR){
				console.log("SYNC-ERROR: Löschen auf dem Server nicht möglich");
				console.log("SYNC-ERROR (status, data, jqXHR):", status, data, jqXHR);
				callback(true);
			},
		});
	}else{
		console.log("SYNC: Kein Account mit entsprechenden Berechtigungen eingerichtet");
		callback("Lösche Klassendaten: Nur lokal (kein Account vorhanden) !")
	}
}


function mergeAccount(newData, localData) {
//-> Metadaten mergen: Grundvorraussetzungen für Folgeoperationen
	var account = createAccount(localData.username);
	account.klassenliste = localData.klassenliste; // wird um lokale Klassenliste ergänzt, wenn Eintrag nicht auf Blacklist
	account.blacklist = localData.blacklist; // wird um lokale Blacklist ergänzt und anschließend ge-uniqued
	account.local = localData.local; // (wird vom Client behalten und nicht gemerged)

	// ggf. Doppelte aufräumen
	account.blacklist = removeDups(account.blacklist);
	account.local = removeDups(account.local);


	if (Object.keys(newData).length > 0) {

		// Blacklist ergänzen
		if (newData.blacklist) {
			// Konflikt beseitigen (zusammenführen und unique)
			var newBlacklist = localData.blacklist.concat(newData.blacklist);
			account.blacklist = removeDups(newBlacklist);
		}

		// Lokale Klassenliste mit (ggf. neuer) Blacklist bereinigen (Verzeichnis)
		var localHashes = Object.keys(account.klassenliste);
		var delHash;
		GLOBALS.dbToGo = 0;
		GLOBALS.dbFinished = 0;
		for (var i = account.blacklist.length - 1; i >= 0; i--) {
			if (localHashes.indexOf(account.blacklist[i]) > -1){
				// Immer Eintrag aus Verzeichnis löschen
				delHash = account.blacklist[i];
				delete account.klassenliste[delHash]
				// ...und wenn vorhanden auch oStore aus DB
				GLOBALS.dbToGo += 1;
				db_dropKlasse(delHash, function(){
					GLOBALS.dbFinished += 1;
					console.log("IDB: Deleted", GLOBALS.dbFinished, "( von", GLOBALS.dbToGo, ")");
				})
			}
		}

		// Auf eventuelle Lösch-Operationen der DB warten
		waitForDB(function(){
			//DEV console.log("...merge Klassenliste...");
			// Klassenliste ergänzen
			if (Object.keys(newData.klassenliste).length > 0) {
				for (var hash in newData.klassenliste){
					if (account.blacklist.indexOf(hash) === -1) {
						// Hash nicht lokal vorhanden und nicht auf Blacklist
						//DEV console.log("...check Hash", hash);
						if (account.klassenliste.hasOwnProperty(hash)) {
							// -- Konflikt beseitigen (nur neueste übernehmen)
							//DEV console.log("...Konflikt (recieved / lokal)", newData.klassenliste[hash], account.klassenliste[hash]);
							account.klassenliste[hash] = (newData.klassenliste[hash].changed > account.klassenliste[hash].changed) ? newData.klassenliste[hash] : account.klassenliste[hash];
						}else{
							// -- einfach hinzufügen
							//DEV console.log("...einfaches Einfügen", newData.klassenliste[hash]);
							account.klassenliste[hash] = newData.klassenliste[hash];
						}
					}
				}
			}
			
			return account;
		});
	}

	return account;
}


function mergeKlasse(newData, localData) {
//-> Klasse mergen: Liste mit Objekten rekursiv zusammenführen

	if(Object.keys(newData).length === 0 && Object.keys(localData).length === 0) {
		// Weder Daten auf Server noch lokal - Something went wrong...
		console.log("MERGE-ERROR: Object-Key ist weder in neuen noch in lokalen Daten vorhanden ?!");
		return false;

	}else if (Object.keys(newData).length === 0) {

		// Es sind keine Daten auf dem Server vorhanden => localData zurückgeben
		console.log("MERGE: no action - return localData");
		return localData;

	}else if (Object.keys(localData).length === 0) {

		// Es sind keine Daten lokal vorhanden => newData zurückgeben
		console.log("MERGE: no action - return newData");
		return newData;

	}else{

		// Es sind Daten vorhanden => TRICKY Merge - Loop
		console.log("MERGE: localData and newData - return TRICKY");
		var Klasse = {};

		// -- Key-Blacklist mergen (alle Keys dieser Liste werden im Folgenden ausgeschlossen)
		var Blacklist = localData[1].blacklist.concat(newData[1].blacklist);
		Blacklist = removeDups(Blacklist);

		// -- Liste mit allen Keys beider Objecte (unique und gefiltert)
		var keyList = Object.keys(localData).concat(Object.keys(newData));
		keyList = removeDups(keyList, Blacklist);


		// -- Loop mittels Key-Liste
		for (var row, i = keyList.length - 1; i >= 0; i--) {
			row = keyList[i]

			if (isObject(newData[row]) && isObject(localData[row])) {

				// -- Konflikt beseitigen (nur neueste übernehmen)
				
				if (newData[row].typ != "student") {
					// changed der Kategorien vergleichen
					//DEV console.log("MERGE: id", row, " NORMAL mode");
					Klasse[row] = (newData[row].changed > localData[row].changed) ? newData[row] : localData[row];

				}else{
					// Attribut 'changed' bei Typ 'student' differenzierter betrachten
					//DEV console.log("MERGE: id", row, "TRICKY mode");
					Klasse[row] = Object.assign({}, localData[row]);
					
					// Name
					delete Klasse[row].name
					Klasse[row].name = (newData[row].name.changed > localData[row].name.changed) ? newData[row].name : localData[row].name;
					
					// Gesamt
					delete Klasse[row].gesamt
					Klasse[row].gesamt = (newData[row].gesamt.changed > localData[row].gesamt.changed) ? newData[row].gesamt : localData[row].gesamt;
					
					// Leistungen mündlich
					// -- Leistungs-Loop
					var leistungsArten = ["mndl", "fspz", "schr"];
					for (var l = leistungsArten.length - 1; l >= 0; l--) {
						var lArt = leistungsArten[l];
						Klasse[row][lArt] = {};
						
						// -- Liste mit allen Keys beider Objecte (unique)
						var artKeyList = Object.keys(localData[row][lArt]).concat(Object.keys(newData[row][lArt]));
						artKeyList = removeDups(artKeyList);

						// -- Alle Leistungen einer Art (nach ID)
						for (var k in artKeyList){
							var lID = artKeyList[k];

							if (isObject(newData[row][lArt][lID]) && isObject(localData[row][lArt][lID])) {
								// -- Konflikt beseitigen (nur neueste übernehmen)
								Klasse[row][lArt][lID] = (newData[row][lArt][lID].changed > localData[row][lArt][lID].changed) ? newData[row][lArt][lID] : localData[row][lArt][lID];
								//DEV console.log("MERGE: art", lArt, ", lID", lID, " is TRICKY");

							}else if (isObject(newData[row][lArt][lID]) && !isObject(localData[row][lArt][lID])) {
								// -- nur in neuen Daten vorhanden
								Klasse[row][lArt][lID] = newData[row][lArt][lID];
								//DEV console.log("MERGE: art", lArt, ", lID", lID, "von newData");

							}else if (!isObject(newData[row][lArt][lID]) && isObject(localData[row][lArt][lID])) {
								// -- nur in lokalen Daten vorhanden
								Klasse[row][lArt][lID] = localData[row][lArt][lID];
								//DEV console.log("MERGE: art", lArt, ", lID", lID, "von localData");

							}else{
								console.log("MERGE-ERROR: art", lArt, ", lID", lID, " ist nirgends vorhanden ?!"); //DEV

							}
						}
					}

				}

			}else if (isObject(newData[row]) && !isObject(localData[row])) {
				// -- nur in neuen Daten vorhanden
				//DEV console.log("MERGE: id", row, "von newData");
				Klasse[row] = newData[row];

			}else if (!isObject(newData[row]) && isObject(localData[row])) {
				// -- nur in lokalen Daten vorhanden
				//DEV console.log("MERGE: id", row, "von localData");
				Klasse[row] = localData[row];

			}
		}

		// Merged die Blacklist hinzufügen und zurückgeben
		Klasse[1].blacklist = Blacklist;
		return Klasse;

	}
}



// =================================================== //
// =============== Export- Functions ================= //
// =================================================== //



// =================================================== //
// ================ Helper Functions ================= //
// =================================================== //


function encryptData(readAble){
//-> Daten verschlüsseln
	if (readAble != "" && readAble) {
		readAble = JSON.stringify(readAble);
		return CryptoJS.AES.encrypt(readAble, GLOBALS.passW).toString();
	}else{
		return "";
	}
}

function decryptData(unKnown){
//-> JSON Daten entschlüsseln
	var readAble = CryptoJS.AES.decrypt(unKnown, GLOBALS.passW).toString(CryptoJS.enc.Utf8);
	return JSON.parse(readAble);
}

function hashData(readAble){
//-> Daten hashen
	return CryptoJS.SHA1(readAble).toString();
}