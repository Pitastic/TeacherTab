"use strict";window.addEventListener("load",function(){document.getElementById("footer").innerHTML=GLOBALS["appversion"];db_readMultiData(function(r){SETTINGS=r[0];db_readMultiData(listLeistung,"leistung",function(){listLeistung([])});handleSchnitt(function(){db_readMultiData(listStudents,"student")})},"settings");addListener();closeListener()});function listStudents(results){if(typeof results==="undefined"){results=[]}results.sort(compareStudents);var c,r,ul,old,row,omndl,ofspz,oschr,len;old=document.getElementById("listStudents").getElementsByTagName("ul")[0];ul=document.createElement("ul");for(var i=0;i<results.length;i++){row=results[i];omndl=row.gesamt.omndl;ofspz=row.gesamt.ofspz.Gesamt;oschr=row.gesamt.oschr;r=document.createElement("li");r.setAttribute("data-rowid",row.id);if(row.name.sort&&row.name.sort!=="-"&&row.name.sort!=="null"){c=document.createElement("div");c.className="s_flag";c.innerHTML=row.name.sort;r.appendChild(c)}c=document.createElement("div");c.className="name";c.innerHTML=row.name.nname+", "+row.name.vname;r.appendChild(c);c=document.createElement("div");c.className="mdl";c.innerHTML=omndl?omndl.toPrecision(2):"-";r.appendChild(c);c=document.createElement("div");c.className="fspz";c.innerHTML=ofspz?"("+ofspz.toPrecision(2)+")":"(-)";r.appendChild(c);c=document.createElement("div");c.className="schr";c.innerHTML=oschr?oschr.toPrecision(2):"-";r.appendChild(c);if(!row.gesamt.eingetragen){c=document.createElement("div");c.className="gesamt";c.innerHTML=row.gesamt.rechnerisch?"&#216; "+row.gesamt.rechnerisch.toPrecision(3):"&#216; - . --";r.appendChild(c)}else{c=document.createElement("div");c.className="gesamt eingetragen";c.innerHTML=row.gesamt.eingetragen;r.appendChild(c)}c=document.createElement("div");c.className="tools right";c.innerHTML="&gt;";r.appendChild(c);ul.appendChild(r)}old.parentNode.replaceChild(ul,old);var tr=ul.getElementsByTagName("li");var item1Content=document.getElementById("item1").getElementsByClassName("content")[0];len=tr.length;if(len){item1Content.classList.remove("emptyList");for(i=0;i<len;i++){tr[i].addEventListener("click",function(){sessionStorage.setItem("student",this.getAttribute("data-rowid"));itemAbort(["item1"],"details_students.htm")})}}else{item1Content.classList.add("emptyList")}var DOMcheck=setInterval(function(){if(document.readyState!=="complete")return;clearInterval(DOMcheck);setTimeout(function(){slide2(sessionStorage.getItem("lastview"))},200)},50)}function listLeistung(results){if(typeof results==="undefined"){results=[]}var c,r,ul,idx,art,Leistung,hasEntries;var old=document.getElementById("listLeistung").getElementsByTagName("ul");var arten=["mndl","fspz","schr"];for(art=0;art<arten.length;art++){hasEntries=false;ul=document.createElement("ul");for(idx=0;idx<results.length;idx++){if(results[idx].subtyp==arten[art]){hasEntries=true;Leistung=results[idx];r=document.createElement("li");r.setAttribute("data-l_subtyp",Leistung.subtyp);r.setAttribute("data-l_id",Leistung.id);c=document.createElement("div");c.className="name";c.innerHTML=Leistung.Bezeichnung;r.appendChild(c);c=document.createElement("div");c.innerHTML=Leistung.Datum;r.appendChild(c);c=document.createElement("div");c.innerHTML="&#160;";c.classList.add(Leistung.Eintragung.toLowerCase());r.appendChild(c);c=document.createElement("div");c.innerHTML=Leistung.Gewichtung+"x";c.className="gewichtung";r.appendChild(c);c=document.createElement("div");c.className="tools right";c.innerHTML="&gt;";r.appendChild(c);ul.appendChild(r)}}if(!hasEntries){r=document.createElement("li");c=document.createElement("div");c.className="keine";c.innerHTML="- keine -";r.appendChild(c);ul.appendChild(r)}old[art].parentNode.replaceChild(ul,old[art])}document.getElementById("notenDatum").value=datum();var tr=document.getElementById("listLeistung").getElementsByTagName("li");for(var i=0;i<tr.length;i++){tr[i].addEventListener("click",function(){var id_Leistung=this.getAttribute("data-l_id");if(id_Leistung){sessionStorage.setItem("leistung_id",this.getAttribute("data-l_id"));sessionStorage.setItem("leistung_art",this.getAttribute("data-l_subtyp"));itemAbort(["item2"],"details_leistungen.htm")}else{var ulList=this.parentNode.parentNode.getElementsByTagName("ul");var ul=this.parentNode;var choose;for(var idx=ulList.length-1;idx>=0;idx--){if(ulList.item(idx)==ul){choose=Array("mndl","fspz","schr")[idx]}}document.getElementById("notenArt").value=choose;if(SETTINGS.fspzDiff){fspz_Bezeichnung()}var add=document.getElementById("btn_Add");popUp(add.getAttribute("data-name"))}})}}function addStudent(el){var vName=document.getElementById("vName").value;var nName=document.getElementById("nName").value;db_addDocument(function(e){popUpClose(el);document.getElementById("vName").value="";document.getElementById("nName").value="";db_readMultiData(listStudents,"student")},formStudent(vName,nName))}function massenAdd(el){var thisUl=document.querySelector("#item1Add form ul:nth-child(2)");var textblock=document.getElementById("item1Add").getElementsByTagName("textarea")[0];var trennZeile=document.getElementById("trennZ").value=="1"?"\n":"\n\n";var trennNamen=document.getElementById("trennN");if(!trennNamen.value){return shake(trennNamen)}var zeilen=[];var namen=[];var fails=[];var spalten;zeilen=textblock.value.split(trennZeile);var alleZeilen=zeilen.length;GLOBALS.dbToGo=0;for(var zeile in zeilen){if(zeilen[zeile]){spalten=zeilen[zeile].split(trennNamen.value);if(spalten.length>1){GLOBALS.dbToGo+=1;namen.push(formStudent(spalten[1].trim(),spalten[0].trim()))}else{console.log("INFO: Eintrag",zeilen[zeile],"enth\xE4lt nicht das richtige Trennzeichen. Skip!");fails.push(zeilen[zeile])}}else{console.log("INFO: Zeile",zeile,"ist leer. Skip!")}}if(thisUl.firstChild.className=="msg error"){thisUl.removeChild(thisUl.firstChild)}if(fails.length){var li=document.createElement("li");li.className="msg error";li.innerHTML="Kein Import durchgef\xFChrt !<br>";li.innerHTML+=fails.length+" (von "+alleZeilen+") haben ein falsches Trennzeichen (z.B. "+fails[0]+")";thisUl.insertBefore(li,thisUl.firstChild);return false}else{db_addDocument(function(){db_readMultiData(listStudents,"student");textblock.value="";trennNamen.value="";popUpClose(el)},namen)}return true}function addLeistung(thisElement){var nBezeichnung=document.getElementById("notenBezeichnung");var nDatum=document.getElementById("notenDatum").value;var nEintragung=document.getElementById("notenEintragung");var nArt=document.getElementById("notenArt").value;var nGewicht=parseFloat(document.getElementById("rangeWert").value);var Leistung=formLeistung(nArt,nBezeichnung.value,nDatum,nEintragung.value,nGewicht);db_addDocument(function(){if(!SETTINGS.fspzDiff||nArt!="fspz"){nBezeichnung.value=""}setTimeout(function(){popUpClose(thisElement,true)},150)},Leistung)}function switchImport(){var i,uls=document.getElementById("item1Add").getElementsByTagName("ul");for(i=0;i<uls.length;i++){uls[i].classList.toggle("hide")}document.getElementById("trennZ").classList.toggle("hide");document.getElementById("trennN").classList.toggle("hide");document.getElementById("saveI").classList.toggle("hide");document.getElementById("saveM").classList.toggle("hide");document.getElementById("switchM").classList.toggle("hide");document.getElementById("switchE").classList.toggle("hide")}