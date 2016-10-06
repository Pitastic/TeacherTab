<!doctype html>
<head>
	<meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
	<style>
	* {margin: 0; padding: 0;}
	body {
		}
	section {
		width: 93%;
		margin: auto;
		page-break-after: always;
		page-breakr-inside: avoid;
		}
	h1 {
		margin: 1em 0;
		border-bottom: 2px solid grey;
		}
		.ersteseite h1 {
			border-color: black;
			}
		h1 span {
			float: right;
			color: grey;
			}
	h2 {
		margin: 0.5em 0;
		font-family: 'sans-serif';
		font-size: 20px;
		}
	table {
		border-spacing: 25px 5px;
		table-layout:fixed;
		width:100%;
		}
		thead td {
			border: none;
			text-align: center;
			}
			thead .namen {width: 210px;}
			thead .fspz, div .fspz, h2.fspz {color: #38AC92;}
			thead .mndl, div .mndl, h2.mndl {color: #3898A5;}
			thead .schr, div .schr, h2.schr {color: #FF9E53;}
			thead .rechnerisch {color: grey;}
		tbody td {
				border: 2px solid black;
				text-align: center;
			}
			tbody .namen {
				text-align: right;
				padding-right: 5px;
				white-space: nowrap;
				overflow: hidden;
				}
			tbody .fspz {border-color: #38AC92;}
			tbody .mndl {border-color: #3898A5;}
			tbody .schr {border-color: #FF9E53;}
			tbody .rechnerisch {border-color: grey;}
			tbody .eingetragen {border: none;}
			tbody .komp {border-color: grey;}

		tab_gesamt thead .namen {width: 14em;}
		tab_gesamt tbody .namen {
			border:none; border-left: 4px solid silver;
			}
		%if not settings['sex']['fspzDiff']:
			table.tab_gesamt {
				border-spacing: 45px 5px;
				}
		%end
		table.tab_leistung, table.tab_allgemein {
			border-spacing: 0;
			border-collapse: collapse;
			}
			.tab_leistung thead td, .tab_allgemein thead td {
					font-weight: bold;
				}
			.tab_leistung tbody {
					border: 2px solid black;
				}
			.tab_leistung tbody td, .tab_allgemein td {
					padding-top: 4px;
					padding-bottom: 4px;
					border-width: 1px;
				}
		table.tab_allgemein thead .nummer {
			width: 5%;
			}
		.tab_allgemein thead .verteilungen {
			width: 33%;
			}
		.tab_allgemein thead .gewichtung {
			width: 5%;
			}
		div{
			margin-bottom: 2em;
			}
			div.nobreak {page-breakr-inside: avoid;}
			div.breaker {
				page-break-before: always;
				margin: auto;
				}
			.hide {display: none;}
	</style>
	<title>Export</title>
</head>
<body>

<!-- Funktionen und Skripte -->
<script>
function zensur(zeilen_objekt, spezKey, digit){
	result = "";
	result = JSON.parse(decodeURIComponent(zeilen_objekt));
	if (spezKey){
		result = result[spezKey];
	}
	return Math.round(result*digit)/digit || "-"
}
</script>
%alle_zeilen=[]
%for row in cur:
	%alle_zeilen.append(row)
%end


<section class="ersteseite">
    <h1>Gesamtübersicht <span>{{klasse}}</span></h1>
    <table border="0" class="tab_gesamt">
    <thead>
    	<tr>
    		<td class="namen"></td>
    		<td class="mndl">&#216; mndl.</td>
		%if settings['sex']['fspzDiff']:
    		<td class="fspz">&#216; fspz.V</td>
    		<td class="fspz">&#216; fspz.G</td>
		%end
    		<td class="fspz">&#216; fspz.</td>
    		<td class="schr">&#216; schr.</td>
    		<td class="rechnerisch">&#216; gesamt</td>
    		<td class="eingetragen">eingetragen</td>
    	</tr>
    </thead>
    <tbody>
	%for row in alle_zeilen:
		<tr>
		<td class="namen">{{row['nName']}}, {{row['vName']}}</td>
		<td class="mndl"><script>document.write(this.innerHTML = zensur("{{row['omndl']}}", false, 100))</script></td>
			%if settings['sex']['fspzDiff']:
				<td class="fspz"><script>document.write(zensur("{{row['ofspz']}}", 'Vokabeln', 100))</script></td>
				<td class="fspz"><script>document.write(zensur("{{row['ofspz']}}", 'Grammatik', 100))</script></td>
			%end
		<td class="fspz"><script>document.write(zensur("{{row['ofspz']}}", 'Gesamt', 100))</script></td>
		<td class="schr"><script>document.write(this.innerHTML = zensur("{{row['oschr']}}", false, 100))</script></td>
		<td class="rechnerisch"><script>document.write(this.innerHTML = zensur("{{row['gesamt']}}", 'rechnerisch', 100))</script></td>
		<td class="eingetragen"><script>document.write(this.innerHTML = zensur("{{row['gesamt']}}", 'eingetragen', 1))</script></td>
		</tr>
	%end
	</tbody>
	</table>
</section>

<section>
    <h1>mündlich <span>{{klasse}}</span></h1>
	%alle_leistungen = settings['mndl']['alle']
    <table border="0" class="tab_leistung">
    <thead>
	    </tr>
	    	<td class="mndl namen">Schülernamen</td>
	    %for i in range(len(alle_leistungen)):
	    	<td class="mndl">Nr. {{i+1}}</td>
	    %end
	    </tr>
    </thead>
    <tbody>
    %for row in alle_zeilen:
    	<tr>
			<td class="namen">{{row['nName']}}, {{row['vName']}}</td>
			<script>var tempO = JSON.parse(decodeURIComponent("{{row['mndl']}}")) || {}</script>
		%for leistung in alle_leistungen:
			<td class="mndl">
			<script>
				var l, p = "";
				if (tempO[{{leistung}}]){
					if (tempO[{{leistung}}]['Gesamt']){
						p = "("+tempO[{{leistung}}]['Gesamt']+") ";
					}
					l = tempO[{{leistung}}]['Note'] || "-";
				}else{
					l = "-";
				}
				document.write(this.innerHTML = p+l);
			</script>
			</td>
		%end
		</tr>
    %end
    </tbody>
    </table>
</section>

<section>
    <h1>fachspezifische Leistungen <span>{{klasse}}</span></h1>
	%alle_leistungen = settings['fspz']['alle']
    <table border="0" class="tab_leistung">
    <thead>
	    </tr>
	    	<td class="fspz namen">Schülernamen</td>
	    %for i in range(len(alle_leistungen)):
	    	<td class="fspz">Nr. {{i+1}}</td>
	    %end
	    </tr>
    </thead>
    <tbody>
    %for row in alle_zeilen:
    	<tr>
			<td class="namen">{{row['nName']}}, {{row['vName']}}</td>
			<script>var tempO = JSON.parse(decodeURIComponent("{{row['fspz']}}")) || {}</script>
		%for leistung in alle_leistungen:
			<td class="fspz">
			<script>
				var l, p = "";
				if (tempO[{{leistung}}]){
					if (tempO[{{leistung}}]['Gesamt']){
						p = "("+tempO[{{leistung}}]['Gesamt']+") ";
					}
					l = tempO[{{leistung}}]['Note'] || "-";
				}else{
					l = "-";
				}
				document.write(this.innerHTML = p+l);
			</script>
			</td>
		%end
		</tr>
    %end
    </tbody>
    </table>
</section>

<section>
    <h1>schriftlich <span>{{klasse}}</span></h1>
	%alle_leistungen = settings['schr']['alle']
    <table border="0" class="tab_leistung">
    <thead>
	    </tr>
	    	<td class="schr namen">Schülernamen</td>
	    %for i in range(len(alle_leistungen)):
	    	<td class="schr">Nr. {{i+1}}</td>
	    %end
	    </tr>
    </thead>
    <tbody>
    %for row in alle_zeilen:
    	<tr>
			<td class="namen">{{row['nName']}}, {{row['vName']}}</td>
			<script>var tempO = JSON.parse(decodeURIComponent("{{row['schr']}}")) || {}</script>
		%for leistung in alle_leistungen:
			<td class="schr">
			<script>
				var l = "";
				if (tempO[{{leistung}}] && tempO[{{leistung}}]['Mitschreiber'] == "true"){
					if (tempO[{{leistung}}]['Verteilung']){
						l = "("+
							tempO[{{leistung}}]['Kat1']+"/"+
							tempO[{{leistung}}]['Kat2']+"/"+
							tempO[{{leistung}}]['Kat3']+"/"+
							tempO[{{leistung}}]['Kat4']+"_"+
							tempO[{{leistung}}]['Gesamt']+") "+
							tempO[{{leistung}}]['Note']
					}else if (tempO[{{leistung}}]['Gesamt']){
						l = "("+tempO[{{leistung}}]['Gesamt']+") "+tempO[{{leistung}}]['Note']
					}else{
						l = tempO[{{leistung}}]['Note'];
					}
				}else{
					l = "-"
				}
				document.write(this.innerHTML = l);
			</script>
			</td>
		%end
		</tr>
    %end
    </tbody>
    </table>
</section>

<section>
    <h1>Kompetenzen <span>{{klasse}}</span></h1>
	%kats = settings['nName']
    <table border="0" class="tab_leistung">
    <thead>
	    </tr>
	    	<td class="komp namen">Schülernamen</td>
    		<td class="komp">1. {{kats['Kat1']}}</td>
    		<td class="komp">2. {{kats['Kat2']}}</td>
    		<td class="komp">3. {{kats['Kat3']}}</td>
    		<td class="komp">4. {{kats['Kat4']}}</td>
	    </tr>
    </thead>
    <tbody>
    %for row in alle_zeilen:
    	<tr>
			<td class="namen">{{row['nName']}}, {{row['vName']}}</td>
			<script>
				var tempO = JSON.parse(decodeURIComponent("{{row['Kompetenzen']}}")) || {}
				for (var i=0;i<tempO.length;i++){
					document.write('<td class="komp">'+tempO[i]+' %</td>');
				}
			</script>
			</td>
		</tr>
    %end
    </tbody>
    </table>
</section>

<!-- Legende für alle Nummern die in mndl, schr und fspz benutzt wurden (Bezeichnungen / Verteilungen / Bewertungssystem etc) -->
<!-- Allgemeine Informationen zur Gewichtung, Zeitraum und evtl. Statistik -->
<section>
    <h1>allgemeine Informationen <span>{{klasse}}</span></h1>
    <div>
	Eintragungen als ganze Note, Gesamtpunktzahl oder Rohpunktzahl mit Unterteilung in Kompetenzen (K.). Export-Muster:
	<table border="0" class="tab_allgemein">
		<thead>
		<tr>
			<td>Note</td><td>Punkte</td><td>Rohpunkte</td>
		</tr>
		</thead>
		<tbody>
		<tr>
			<td>Zahl</td><td>(Gesamtpunkte) Note</td><td>(K.1/K.2/K.3/K.4_Gesamtpunkte) Note</td>
		</tr>
		</tbody>
    </table>
    </div>
    <div>
    Im Bewertungszeitraum lag die Gewichtung bei <span class="mndl">{{int(float(settings['gesamt'][u'm\xfcndlich'])*100)}} %</span> mündlicher (<span class="fspz">{{int(float(settings['gesamt']['davon fachspezifisch'])*100)}} %</span> hiervon aus fachspezifischen Leistungen) und <span class="schr">{{int(float(settings['gesamt']['schriftlich'])*100)}} %</span> schriftlicher Leistung.
    </div>

    <div>
    Die Notengebung erfolgte nach dieser Abstufung (Note ab x %):
	<table border="0" class="tab_allgemein">
		<thead>
		<tr>
			<td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td>
		</tr>
		</thead>
		<tbody>
		<tr>
			<td>{{settings['vName']['1']}} %</td><td>{{settings['vName']['2']}} %</td><td>{{settings['vName']['3']}} %</td><td>{{settings['vName']['4']}} %</td><td>{{settings['vName']['5']}} %</td><td>0 %</td>
		</tr>
		</tbody>
    </table>
    </div>
    
    <div class="nobreak">
    <h2 class="mndl">mündliche Leistungen</h2>
	%alle_leistungen = settings['mndl']['alle']
    <table border="0" class="tab_allgemein">
    <thead>
	    </tr>
	    	<td class="nummer">&#35;</td>
	    	<td>Datum</td>
	    	<td>Bezeichnung</td>
	    	<td class="gewichtung">Gewichtung</td>
	    	<td>Eintragung</td>
	    	<td class="verteilungen">Verteilungen</td>
	    </tr>
    </thead>
    <tbody>
    %i_m = 0
    %for row in alle_leistungen:
    	%i_m += 1
    	%row = unicode(row)
    	<tr>
    	<td class="nummer">{{i_m}}</td>
    	<td>{{settings['mndl'][row]['Datum']}}</td>
    	<td>{{settings['mndl'][row]['Bezeichnung']}}</td>
    	<td>{{settings['mndl'][row]['Gewichtung']}}</td>
    	<td>{{settings['mndl'][row]['Eintragung']}}</td>
    	<td>
    	%if settings['mndl'][row]['Eintragung'] == "Rohpunkte":
			%verteilungen = settings['mndl'][row]['Verteilungen']
			%for v in verteilungen:
				{{v}}:	({{settings['mndl'][row][v]['Kat1']}}/
						{{settings['mndl'][row][v]['Kat2']}}/
						{{settings['mndl'][row][v]['Kat3']}}/
						{{settings['mndl'][row][v]['Kat4']}})
						{{settings['mndl'][row][v]['Gesamt']}} Punkte
				<br>
			%end
		%elif settings['mndl'][row]['Eintragung'] == "Punkte":
			{{settings['mndl'][row]['Standard']['Gesamt']}} Punkte
		%else:
			-
		%end
		</td>
    	</tr>
    %end
    </tbody>
    </table>
    </div>
    
    <div class="nobreak">
    <h2 class="fspz">fachspezifische Leistungen</h2>
	%alle_leistungen = settings['fspz']['alle']
    <table border="0" class="tab_allgemein">
    <thead>
	    </tr>
	    	<td class="nummer">&#35;</td>
	    	<td>Datum</td>
	    	<td>Bezeichnung</td>
	    	<td class="gewichtung">Gewichtung</td>
	    	<td>Eintragung</td>
	    	<td class="verteilungen">Verteilungen</td>
	    </tr>
    </thead>
    <tbody>
    %i_f = 0
    %for row in alle_leistungen:
	    %i_f += 1
    	%row = unicode(row)
    	<tr>
    	<td class="nummer">{{i_f}}</td>
    	<td>{{settings['fspz'][row]['Datum']}}</td>
    	<td>{{settings['fspz'][row]['Bezeichnung']}}</td>
    	<td>{{settings['fspz'][row]['Gewichtung']}}</td>
    	<td>{{settings['fspz'][row]['Eintragung']}}</td>
    	<td>
    	%if settings['fspz'][row]['Eintragung'] == "Rohpunkte":
			%verteilungen = settings['mndl'][row]['Verteilungen']
			%for v in verteilungen:
				{{v}}:	({{settings['fspz'][row][v]['Kat1']}}/
						{{settings['fspz'][row][v]['Kat2']}}/
						{{settings['fspz'][row][v]['Kat3']}}/
						{{settings['fspz'][row][v]['Kat4']}})
						{{settings['fspz'][row][v]['Gesamt']}} Punkte
				<br>
			%end
		%elif settings['fspz'][row]['Eintragung'] == "Punkte":
			{{settings['fspz'][row]['Standard']['Gesamt']}} Punkte
		%else:
			-
		%end
		</td>
    	</tr>
    %end
    </tbody>
    </table>
    </div>
    
    <div class="nobreak">
    <h2 class="schr">schriftliche Leistungen</h2>
   	%alle_leistungen = settings['schr']['alle']
    <table border="0" class="tab_allgemein">
    <thead>
	    </tr>
	    	<td class="nummer">&#35;</td>
	    	<td>Datum</td>
	    	<td>Bezeichnung</td>
	    	<td class="gewichtung">Gewichtung</td>
	    	<td>Eintragung</td>
	    	<td class="verteilungen">Verteilungen</td>
	    </tr>
    </thead>
    <tbody>
    %i_s = 0
    %for row in alle_leistungen:
    	%i_s += 1
    	%row = unicode(row)
    	<tr>
    	<td class="nummer">{{i_s}}</td>
    	<td>{{settings['schr'][row]['Datum']}}</td>
    	<td>{{settings['schr'][row]['Bezeichnung']}}</td>
    	<td>{{settings['schr'][row]['Gewichtung']}}</td>
    	<td>{{settings['schr'][row]['Eintragung']}}</td>
    	<td>
    	%if settings['schr'][row]['Eintragung'] == "Rohpunkte":
			%verteilungen = settings['schr'][row]['Verteilungen']
			%for v in verteilungen:
				{{v}}:	({{settings['schr'][row][v]['Kat1']}}/
						{{settings['schr'][row][v]['Kat2']}}/
						{{settings['schr'][row][v]['Kat3']}}/
						{{settings['schr'][row][v]['Kat4']}})
						{{settings['schr'][row][v]['Gesamt']}} Punkte
				<br>
			%end
		%elif settings['schr'][row]['Eintragung'] == "Punkte":
			{{settings['schr'][row]['Standard']['Gesamt']}} Punkte
		%else:
			-
		%end
		</td>
    	</tr>
    %end
    </tbody>
    </table>
    </div>
</section>
%conn.close()
</body>
</html>
