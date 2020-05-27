
// - - - - - - V A R I A B L E S - - - - - - - - 

var etat = 'accueil';
// Variable d'état de l'application.
// Peut prendre les valeurs : 'accueil', 'chargement', 'info', 'jeu', 'resultats', 'correction', 'fin'.
// Elle détermine ce qui doit être affiché ou pas (voir le template)

var stats = {loc: {}, theme: {}, glob : {} }; // différentes contextes de stats

// pour les bonus:
var combo = 0; // barre de combo : nb de réponses correctes depuis la dernière faute
var bonus = {total:0,liste:[],html:""}; // infos sur les bonus

var nbQuestions = 1; // nb de questions à afficher dans chaque partie
var data = []; // le pointeur vers l'objet courant contenant les questions, 
var themes = []; // le tableau qui contient les thèmes
var t = {"nom":"","info":"","data":[]}; // le thème choisi
var c = "loc"; // contexte actuel d'affichage de stats, peut aussi valoir "theme"

var liste = []; // longueur nbQuestions, la liste des numéros des questions posées à chaque partie
var resultatsLoc = []; // longueur idem, valeurs 1, 0 ou -1 suivant le résultat 


// - - - - - - F O N C T I O N S - - - - - - - - 


function choisirTheme(nom){ // lorsqu'on clique sur un thème dans le menu

	nbQuestions=1; // si ça a changé à la fin du thème précédent
	if(themes[nom]==undefined){// le thème n'est pas encore chargé
		etat="chargement";
		actualiserAffichage(); // afficher l'écran de chargement
		$.get('data/' + nom + '.json', function (d) {
			// création et affectation d'un objet 'theme' vide:
			themes[nom]= {"nom":nom, "info":"", "data":{}};
			if($.type(d[0]) === "string")
				themes[nom].info=d.splice(0,1);
			themes[nom].data=d;//remplissage avec les données:
			demarrerTheme(nom);
		},"json"); //getJSON ne marche pas, pb de callback  ?... 
		
	} else {// le thème est déjà chargé
		demarrerTheme(nom);
	}
	
	
}


function demarrerTheme(nom){
	
	t = JSON.parse(JSON.stringify(themes[nom])); //duplication du thème
	data=t.data; //data contient les données
	console.log("Le thème "+nom+" contient "+data.length+" questions");
	liste=[]; // nettoyer la liste d'un éventuel thème précédent
	reinitialiser(stats['theme']);
	if(t.info!=""){
		etat="info";
		actualiserAffichage();
		actualiserMathJax(); // au cas où il y a des maths dans un exemple ou dans les consignes
	}else{
		nouvellePartie();
	}
}
function test(index){
	
	if( $('#rep'+index).is(':checked') ){
		$('#rep'+index).prop('checked', false);
		console.log($('#rep'+index).is(':checked'))
	}else{
		$('#rep'+index).prop('checked', true);
		console.log($('#rep'+index).is(':checked'))
	}
	

}

function nouvellePartie(){
		
		$( ".card" ).remove("");
		
		
	c="loc";
	reinitialiser(stats['loc']);
	if(nbQuestions>data.length){ // s'il reste trop peu de questions
		nbQuestions=data.length;
	}
	liste=sousListe(nbQuestions,data.length); // choisir les questions de cette partie dans le thème
	console.log('il reste '+data.length+'questions. Choix : '+liste);
	
	$('#vf tr').each(function(){ if($(this).attr('id')!='tr-modele') $(this).remove();}); // vide tout sauf le modèle
	
	for(var i=0;i<nbQuestions;i++){// attribution des id et noms aux clones
		var quest=$('#tr-modele').clone().insertAfter('#tr-modele').toggle(true);
		quest.find('.question').html(data[liste[i]].question); // lier du latex ne passe pas bien avec l'eval
		if(data[liste[i]].comment != undefined){
			quest.find('.commentaire').html(data[liste[i]].comment);
		} else{
			quest.find('.affichageCommentaire').remove();
		}
		quest.find('input').attr('name','q'+i);
		quest.find("*[id]").andSelf().each(function() { $(this).attr("id", $(this).attr("id") + i); });
		
	}
	etat="jeu";
	console.log(data[liste[0]])
	var rep ='';
		var textrep = '';
		for (let index = 0; index < data[liste[0]].answers.length; index++) {
			textrep = ' ' + data[liste[0]].answers[index].value
			var info = (typeof data[liste[0]].type == 'undefined' ? 'checkbox' : 'radio');

			rep = rep + '<div class="card"><label><div class="card-body" id="' + index + '" > <h5 class="card-title">Réponse  ' + (index +1) +'</h5>' + textrep + '<input style="opacity:100" type="'+ info + '" id="rep'+ index +'" onclick="test('+index+')"></label></div> </div>' ;
			
			
		}

		
		$( ".card-deck" ).append(rep);
	
	actualiserAffichage();
	actualiserMathJax();
}

function resultats(){
	var tabRep = [];
	for (let index = 0; index < data[liste[0]].answers.length; index++) {
		if( $('#rep'+index).is(':checked') ){
			tabRep.push('#rep'+index)
		}
	}

	console.log(tabRep)


	var nbRepVrai = 0;
	var nbRepFausses = 0;
	for (let index = 0; index < data[liste[0]].answers.length; index++) {
		if(data[liste[0]].answers[index].correct){
			for(var i=0; i<tabRep.length; i++) {
				if('#rep'+index === tabRep[i]) {
					console.log('Il a bon');
					nbRepVrai++;
				}
			}
		}else{
			for(var i=0; i<tabRep.length; i++) {
				if('#rep'+index === tabRep[i]) {
					console.log('Il a faux');
					nbRepFausses++;
				}
			}
		}
	}

	// CODER L'Affichage du résultat



	etat="resultats";
	resultatsLoc=[];

	actualiserStats();


	actualiserBonus();
	actualiserAffichage();
}

function modifier(){
	etat="jeu";
	reinitialiser(stats['loc']);
	actualiserAffichage();
}

function correction(){
	// barrer, souligner, colorier.
	for(var i=0;i<liste.length;i++){
		$('#q'+(data[liste[i]].answer?'V':'F')+i).next().css({'text-decoration':'underline'});
		if(resultatsLoc[i]==0){ // pas répondu
			$('#q'+'N'+i).parent().attr('class', 'btn btn-warning');
		} else if(resultatsLoc[i]==1){ // correct
			$('#q'+(data[liste[i]].answer?'V':'F')+i).parent().attr('class', 'btn btn-success');
		} else { // incorrect
			$('#q'+(data[liste[i]].answer?'F':'V')+i).parent().attr('class', 'btn btn-danger');
			$('#q'+(data[liste[i]].answer?'F':'V')+i).next().css({'text-decoration':'line-through'});
		}
	}
	etat="correction";
	//enlever les questions répondues correctement
	liste.sort(function(a,b){ return b - a; }); // trier dans l'ordre décroissant pour le splice
	for(var i=0;i<liste.length;i++){
		if(resultatsLoc[i]==1)
			data.splice(liste[i],1); 
		//if(resultatsLoc[i]==-1)
		//	data.push(data.splice(liste[i],0)); //dupliquer une question répondue incorrectement
		// un peu méchant
	}
	actualiserAffichage();
	actualiserMathJax();
}

function fin(){ // Calcul des bonus de fin et affichage des stats de fin :
	etat="fin";
	c="theme"
	if(Math.ceil(stats.theme.note)>0){
		bonus.liste.push({nom: "Bonus pour la note", valeur:Math.ceil(stats.theme.note)});// bonus égal à la note
	}
	if(Math.ceil(stats.theme.note)==20){
		bonus.liste.push({nom: "Bonus spécial 20/20", valeur:10});
	}
	if(Math.floor(stats.theme.efficacite/2)>0){// et un bonus de rapidité
		bonus.liste.push({nom:"Bonus efficacité",valeur:Math.floor(stats.theme.efficacite/2)});
	}
	actualiserBonus();
	actualiserAffichage();
}
// - - - -   A C T U A L I S A T I O N   A F F I C H A G E - - - - 

function actualiserAffichage(){

	actualiserStats(); //d'abord, et ensuite, l'affichage:
	$(".sync").each(function(){
		if(typeof($(this)[$(this).data('action')])=='function'){
			$(this)[$(this).data('action')](eval($(this).data('param')));
		}// l'eval est un peu moche mais bon
	});
}
function actualiserMathJax(){
	if(typeof(MathJax)!= 'undefined') {// si MathJax est chargé, on relance le rendu
		MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
	} else { // sinon, on le recharge et on relance le rendu en callback
		$.getScript('https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML', function() {
    	MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
		});
	}
}
function basculerStatsGlobales(){// afficher/masquer la boite de dialogue de stats globales
	actualiserStats();
	actualiserAffichage(); // l'affichage
	$('#modalStats').modal('toggle');
}
// - - - -   A C T U A L I S A T I O N   D E   D O N N E E S  - - - - 

function actualiserStats(){
	var fin=new Date();
	for(var c in stats){// actualise tous les contextes : stats locales, du thème, et globales
		if(stats[c].rep!=stats[c].repJustes+stats[c].repFausses+stats[c].repNeutres)
			stats[c].rep=stats[c].repJustes+stats[c].repFausses+stats[c].repNeutres;
		stats[c].points=stats[c].repJustes-stats[c].repFausses; // pts gagnés
		stats[c].note=(20*stats[c].points/stats[c].rep); // calcul de la note locale avec signe
		stats[c].note=(stats[c].note<0?0:stats[c].note); // on ramène à zéro le cas échéant
		stats[c].note=Math.floor(2*stats[c].note+0.5)/2; // arrondi au demi-point le + proche
		stats[c].temps=Math.floor((fin-stats[c].debut)/1000); // temps écoulé
		stats[c].efficacite= 60*stats[c].points/stats[c].temps; // points gagnés par minute
		stats[c].efficacite=Math.floor(10*stats[c].efficacite)/10; //arrondi
		
	}
}
function actualiserBonus(){// actualise bonus.total et bonus.html d'après la pile des derniers bonus
	bonus.html="";
	for(var i=0;i<bonus.liste.length;i++){
		bonus.total+=bonus.liste[i].valeur;
		bonus.html+="<tr><td>"+bonus.liste[i].nom+"</td><td>+ "+bonus.liste[i].valeur+"</td></tr>";
	}
	bonus.liste=[];// vide la pile de bonus
}
function reinitialiser(pp){
		pp.debut=new Date(),
		pp.repJustes=0;
		pp.repFausses=0;
		pp.repNeutres=0;
		pp.rep=0;
		pp.note=0;
		pp.points=0;
		pp.temps=0;
		pp.efficacite=0;
}
// - - - - - - - - - - - - - - - - - - - - - - - - -

function sousListe(a,b){
	// retourne un tableau de longueur a
	//contenant des nombres entre 0 et b-1 différents
	// (ordonnés aléatoirement)
	var r=[]; //tableau à retourner
	var tab=[]; //tableau contenant les nombres de 0 à b dans l'ordre.
	for(var i=0;i<b;i++){
		tab[i]=i;
	}
	while(r.length<a){
		r.push(tab.splice(Math.floor(Math.random()*tab.length),1)[0]);
	}
	return r;
}
// - - - - - - - - - - - - - - - - - - - - - - - - -

function demarrage(){
	
	for(var c in stats) { // initialisation
		reinitialiser(stats[c]);
	}
	// --- FONT-AWESOME
  	$("head").append($("<link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css' type='text/css' media='screen' />"));
	// --- MATHJAX
	$('#accueil').append('<span id="secret" style="visibility:hidden">Test MathJax: $\\int_{\\mathbb R} e^{-x^2} dx = \\sqrt\\pi$.<br></span>'); // formule mathématique invisible
	actualiserMathJax(); //chargement et rendu du test invisible
	// --- compteur (masqué) :
	$('#secret').append('<img src="compteur.php" width="2" height="2">');
}