$(document).ready(function() {
    var student = sessionStorage.getItem('student');
	
	// Event-Listener
    closeListener();
    touchListener(['header', 'footer', 'fadeBlack', 'KeyBar'])

    // List first View
    firstListing();
    // Füllen und Eventlistener
    var pop = document.getElementById('item0edit');
    pop.getElementsByClassName('button OK')[0].addEventListener('click', function(){
        var id = sessionStorage.getItem('student');
        updateDB('nName', document.getElementById('nName').value, id);
        updateDB('vName', document.getElementById('vName').value, id);
        updateDB('sex', document.getElementById('s_flag').value, id);
        pop.classList.remove('showPop');
        setTimeout(function() {
            window.location = 'uebersicht.htm';
        }, 500);
    });
    pop.getElementsByClassName('button ABORT')[0].addEventListener('click', function(){
        if (window.confirm('Bist du sicher, dass du diesen Schüler inklusive allen Eintragungen unwiderruflich löschen möchtest ?')){dropStudent(student)}
    });
    setTimeout(function() {
        studentDetails(student);
        var i, liAll = document.getElementsByClassName('uebersicht')[0].getElementsByTagName('li');
        for (i=0; i<liAll.length; i++){
            liAll[i].addEventListener('click', function(){
                sessionStorage.setItem('leistung_id', this.id);
                sessionStorage.setItem('leistung_column', this.getAttribute('data-column'));
                sessionStorage.setItem('jump_id', true);
                setTimeout(function(){
                    window.location = 'details_leistungen.htm';
                }, 400);
                
            });
        }
    }, 200);
});

function firstListing() {
    // - Alle Leistungen vorbereiten und auflisten
    db.transaction(function(transaction) {
    transaction.executeSql(
        "SELECT mndl, fspz, schr, nName FROM "+klasse+" WHERE id=0", [], function(t,r){
        var i, i2, span, div;
        var ul, li, h3;
        var row = r.rows.item(0);
        // - Leistungsindex speichern
        var mndl = JSON.parse(decodeURIComponent(row.mndl));
        var fspz = JSON.parse(decodeURIComponent(row.fspz));
        var schr = JSON.parse(decodeURIComponent(row.schr));
        var katNames = JSON.parse(decodeURIComponent(row.nName));
        
        // Vordruck erstellen
        // -- Gesamtleistung
        // -- -- im Markup enthalten
        // -- -- Gewichtung
        var gew_mndl = sessionStorage.gew_mndl*100;
        var gew_fspz = sessionStorage.gew_fspz*100;
        var gew_schr = sessionStorage.gew_schr*100;
        var gew_divs = document.getElementById('item1_gewichtung').getElementsByTagName('div');
        gew_divs[0].style.width = gew_mndl+"%";
            span = document.createElement('span');
            span.innerHTML = "mündlich : "+gew_mndl+" %";
            gew_divs[0].appendChild(span);
        gew_divs[1].style.width = gew_fspz+"%";
            span = document.createElement('span');
            span.innerHTML = "("+gew_fspz+" %)";
            gew_divs[1].appendChild(span);
        gew_divs[2].style.width = gew_schr+"%";
            span = document.createElement('span');
            span.innerHTML = "schriftlich : "+gew_schr+" %";
            gew_divs[2].appendChild(span);
        // - -
        var _id;
        // -- mündlich
        var mndl_div = document.getElementById("item1_mndl");
        ul = document.createElement('ul');
        for (i=0;i<mndl.alle.length;i++){
            _id = mndl.alle[i];
            li= document.createElement('li');
                li.id = _id;
                li.setAttribute('data-column', 'mndl');
                span = document.createElement('span');
                    span.innerHTML = mndl[_id].Bezeichnung;
                li.appendChild(span);
                span = document.createElement('span');
                    span.innerHTML = mndl[_id].Datum;
                li.appendChild(span);
                span = document.createElement('span'); // Gewichtung
                	span.innerHTML = mndl[_id].Gewichtung + "x";
                	span.className = 'gewichtung';
                li.appendChild(span);
                span = document.createElement('span'); // Lupe
					span.className = 'lupe';
                li.appendChild(span);
                span = document.createElement('span');
                	span.className = "note";
                    span.innerHTML = "-";
                li.appendChild(span);
            ul.appendChild(li);
            mndl_div.appendChild(ul);
        }
        var fspz_div = document.createElement("div");
            fspz_div.className = "fspz_div";
        var fspz_Vok = document.createElement("ul");
        var fspz_Gra = document.createElement("ul");
        // -- -- -- Vok oder Gra
        if (sessionStorage.getItem('set_fspzDiff') == "false"){
            // -- -- fspz zusammenfassen
            for (i=0;i<fspz.alle.length;i++){
                _id = fspz.alle[i];
                li= document.createElement('li');
                    li.id = _id;
                    li.setAttribute('data-column', 'fspz');
                span = document.createElement('span');
                    span.innerHTML = fspz[_id].Bezeichnung;
                li.appendChild(span);
                span = document.createElement('span');
                    span.innerHTML = fspz[_id].Datum;
                li.appendChild(span);
                span = document.createElement('span'); // Gewichtung
                	span.innerHTML = fspz[_id].Gewichtung + "x";
                	span.className = 'gewichtung';
                li.appendChild(span);
                span = document.createElement('span'); // Lupe
					span.className = 'lupe';
                li.appendChild(span);
                span = document.createElement('span');
                	span.className = "note";
                    span.innerHTML = "-";
                li.appendChild(span);
                fspz_Vok.appendChild(li);
            }
            h3 = document.createElement("h3");
                h3.innerHTML = "Fachspezifisches";
                h3.id = "ds_fspz";
                span = document.createElement('span');
                    span.className = "Notendurchschnitt";
                h3.appendChild(span);
            fspz_div.appendChild(h3);
            fspz_div.appendChild(fspz_Vok);
        }else{
            // -- -- fspz differenzieren
            for (i=0;i<fspz.alle.length;i++){
                _id = fspz.alle[i];
                li= document.createElement('li');
                    li.id = _id;
                    li.setAttribute('data-column', 'fspz');
                span = document.createElement('span');
                li.appendChild(span);
                span = document.createElement('span');
                    span.innerHTML = fspz[_id].Datum;
                li.appendChild(span);
                span = document.createElement('span'); // Gewichtung
                	span.innerHTML = fspz[_id].Gewichtung + "x";
                	span.className = 'gewichtung';
                li.appendChild(span);
                span = document.createElement('span'); // Lupe
					span.className = 'lupe';
                li.appendChild(span);
                span = document.createElement('span');
                	span.className = "note";
                    span.innerHTML = "-";
                li.appendChild(span);
                if (fspz[_id].Bezeichnung.substring(0,3) == "Vok"){
                    fspz_Vok.appendChild(li);
                }else{
                    fspz_Gra.appendChild(li);
                }
            }
            h3 = document.createElement("h3");
                h3.innerHTML = "Vokabeln";
                h3.id = "ds_fspz_vok";
                span = document.createElement('span');
                    span.className = "Notendurchschnitt";
                h3.appendChild(span);
            fspz_div.appendChild(h3);
            fspz_div.appendChild(fspz_Vok);
            h3 = document.createElement("h3");
                h3.innerHTML = "Grammatik";
                h3.id = "ds_fspz_gra";
                span = document.createElement('span');
                    span.className = "Notendurchschnitt";
                h3.appendChild(span);
            fspz_div.appendChild(h3);
            fspz_div.appendChild(fspz_Gra);
        }
        mndl_div.appendChild(fspz_div);

        // -- schriftlich
        var schr_div = document.getElementById("item1_schr");
        ul = document.createElement('ul');
        for (i=0;i<schr.alle.length;i++){
            _id = schr.alle[i];
            li= document.createElement('li');
                li.id = _id;
                li.setAttribute('data-column', 'schr');
                span = document.createElement('span');
                    span.innerHTML = schr[_id].Bezeichnung;
                li.appendChild(span);
                span = document.createElement('span');
                    span.innerHTML = schr[_id].Datum;
                li.appendChild(span);
                span = document.createElement('span'); // Gewichtung
                	span.innerHTML = schr[_id].Gewichtung + "x";
                	span.className = 'gewichtung';
                li.appendChild(span);
                span = document.createElement('span'); // Lupe
					span.className = 'lupe';
                li.appendChild(span);
                span = document.createElement('span');
                	span.className = "note";
                    span.innerHTML = "-";
                li.appendChild(span);
            ul.appendChild(li);
            schr_div.appendChild(ul);
        }
        h3 = document.createElement("h3");
            h3.innerHTML = "Kategorien";
        ul = document.createElement('div');
            ul.id = "differenzierteLeistung";
            
            li= document.createElement('div');
            li.className = "Kategorien";
                span = document.createElement('span');
                    span.classList.add('katSpans');
                li.appendChild(span);
                span = document.createElement('span');
                    span.innerHTML = katNames.Kat1;
                li.appendChild(span);
            ul.appendChild(li);
                
            li= document.createElement('div');
            li.className = "Kategorien";
                span = document.createElement('span');
                    span.classList.add('katSpans');
                li.appendChild(span);
                span = document.createElement('span');
                    span.innerHTML = katNames.Kat2;
                li.appendChild(span);
            ul.appendChild(li);
            
            li= document.createElement('div');
            li.className = "Kategorien";
                span = document.createElement('span');
                    span.classList.add('katSpans');
                li.appendChild(span);
                span = document.createElement('span');
                    span.innerHTML = katNames.Kat3;
                li.appendChild(span);
            ul.appendChild(li);
            
            li= document.createElement('div');
            li.className = "Kategorien";
                span = document.createElement('span');
                    span.classList.add('katSpans');
                li.appendChild(span);
                span = document.createElement('span');
                    span.innerHTML = katNames.Kat4;
                li.appendChild(span);
            ul.appendChild(li);
            
        schr_div.appendChild(h3);
        schr_div.appendChild(ul);
    })});
    // Save-Button
    document.getElementById('Save').onclick = function(){
        item1Save();
    };
}

function studentDetails(id){
    var i, temp_el, temp_leistung, temp_id, note, fake_el = {"Note":"-"};
    var arr_mndl = JSON.parse(decodeURIComponent(sessionStorage.getItem('arr_mndl')));
    var arr_schr = JSON.parse(decodeURIComponent(sessionStorage.getItem('arr_schr')));
    var arr_fspz = JSON.parse(decodeURIComponent(sessionStorage.getItem('arr_fspz')));
    
    var target_el = document.getElementById("item1details");
    db.transaction(
        function(transaction){
            transaction.executeSql(
            'SELECT * FROM '+klasse+' WHERE id='+id+';', [], function(t, results){
                var row = results.rows.item(0);
                document.getElementById('header').getElementsByTagName('h1')[0].innerHTML = row.vName+" "+row.nName;
                var mndl = JSON.parse(decodeURIComponent(row.mndl));
                var fspz = JSON.parse(decodeURIComponent(row.fspz));
                var schr = JSON.parse(decodeURIComponent(row.schr));
                document.getElementById('vName').value = row.vName;
                document.getElementById('nName').value =row.nName;
				if (row.sex !== "-"){
	                document.getElementById('s_flag').value = row.sex;
				}else{
					document.getElementById('s_flag').value = "-";
				}
                // Einzelne Leistungen
                var l_id;
                // -- mündlich
                for (i=0;i<mndl.alle.length;i++){
                    l_id = mndl.alle[i];
                    temp_el = document.getElementById(l_id).getElementsByTagName('span')[4];
                    if (mndl[l_id].Note && mndl[l_id].Prozent){
                        note = mndl[l_id].Note+" ("+mndl[l_id].Prozent+")";
                    }else{
                        note = mndl[l_id].Note;
                    }
                    temp_el.innerHTML = note || "-";
                }
                // -- fachspezifisch
                for (i=0;i<fspz.alle.length;i++){
                    l_id = fspz.alle[i];
                    temp_el = document.getElementById(l_id).getElementsByTagName('span')[4];
                    if (fspz[l_id].Note && fspz[l_id].Prozent){
                        note = "("+fspz[l_id].Prozent+") "+fspz[l_id].Note;
                    }else{
                        note = fspz[l_id].Note;
                    }
                    temp_el.innerHTML = note || "-";
                }
                // -- schriftlich
                for (i=0;i<schr.alle.length;i++){
                    l_id = schr.alle[i];
                    temp_el = document.getElementById(l_id).getElementsByTagName('span')[4];
                    if (schr[l_id].Note && schr[l_id].Prozent){
                        note = schr[l_id].Note+" ("+schr[l_id].Prozent+") ";
                    }else{
                        note = schr[l_id].Note;
                    }
                    temp_el.innerHTML = note || "-";
                }
                // Gesamt Noten (bestehende Ergebnisse aus der Datenbank)
                var ogesamt = JSON.parse(decodeURIComponent(row.gesamt));
                var ofspz = JSON.parse(decodeURIComponent(row.ofspz));
                if (sessionStorage.getItem('set_showVorjahr') == "true") {
                    var vorjahr = JSON.parse(decodeURIComponent(row.vorjahr));
                    var vorjSpan = document.getElementById('ds_gesamt').getElementsByClassName('Vorjahresnote')[0];
                    vorjSpan.innerHTML += (vorjahr) ? vorjahr.eingetragen+") " : "n/a) ";
                    vorjSpan.classList.remove('hide');
                }
                document.getElementById('ds_gesamt').getElementsByClassName('Notendurchschnitt')[0].innerHTML = (ogesamt.rechnerisch) ? ogesamt.rechnerisch.toPrecision(3) : "-";
                document.getElementById('ds_gesamt_eingetragen').getElementsByTagName('select')[0].value = ogesamt.eingetragen;
                document.getElementById('ds_mndl').getElementsByClassName('Notendurchschnitt')[0].innerHTML = row.omndl || "-";
                if (sessionStorage.getItem('set_fspzDiff') == "false"){
                    document.getElementById('ds_fspz').getElementsByClassName('Notendurchschnitt')[0].innerHTML = ofspz.Gesamt || "-";
                }else{
                    document.getElementById('ds_fspz_vok').getElementsByClassName('Notendurchschnitt')[0].innerHTML = ofspz.Vokabeln || "-";
                    document.getElementById('ds_fspz_gra').getElementsByClassName('Notendurchschnitt')[0].innerHTML = ofspz.Grammatik || "-";
                }
                document.getElementById('ds_schr').getElementsByClassName('Notendurchschnitt')[0].innerHTML = row.oschr || "-";
				// Kompetenzen
				var kat_S = JSON.parse(decodeURIComponent(row.Kompetenzen));
				var katDivs = document.getElementById('differenzierteLeistung').getElementsByClassName('katSpans');
				for (i=0;i<katDivs.length;i++){
					katDivs[i].innerHTML = kat_S[i]+" &#037;";
				}
            });
		});
		setTimeout(function() {
            target_el.classList.add('show');
		}, 250);
		return;
}

// >>>>>>>> Speichern und Verlassen
function item1Save(){
//--> Note eintragen
    var rechnerisch = document.getElementById('ds_gesamt').getElementsByClassName('Notendurchschnitt')[0].innerHTML;
    var note = document.getElementById('ds_gesamt_eingetragen').getElementsByTagName('select')[0].value;
    var student = sessionStorage.getItem('student');
    var newObject = {
        "rechnerisch": rechnerisch,
        "eingetragen": note,
        };
    var item1 = document.getElementById('item1details');
    updateDB("gesamt", JSON.stringify(newObject), student);
    item1.classList.remove('show');
    setTimeout(function() {
        window.location = "uebersicht.htm";
    }, 400);
}

function dropStudent(id){
    db.transaction(
            function(transaction){
            transaction.executeSql(
            'DELETE FROM '+klasse+' WHERE ID='+id+';', [], function(t, results){
            });
            });
    if (navigator.onLine){
        function deleteStudent(id);
    }else{
        alert("Kein Kontakt zum SyncServer.\nDer Schüler wurde nur von diesem Gerät entfernt.");
    }
    setTimeout(function() {
        window.location = 'uebersicht.htm';
    }, 500);
}