var latitude = 0;
var longitude = 0;
var accuracy;
var googleMap;
var body_width =0;
var body_height=0;
var time_resize;
var watchposition;
var marker;
var secteur;
var secteur_NW_lat;
var secteur_SE_lat;
var secteur_NW_lng;
var secteur_SE_lng;
var API_call = 0;
var show_map = false;
var page = 'accueil';
var cnt;
var date_expire_cookie = new Date();
var morsure = null;
var master = null;
var objet = null;

var opt_chart = {"segmentStrokeWidth":1};
var data_pie;
var ctx_race;
var ctx_secteur;

var API_URL='http://vps36292.ovh.net/mordu/';


var stylesGM = [
                {
                    "featureType": "water",
                    "stylers": [
                      { "gamma": 0.77 },
                      { "hue": "#0011ff" },
                      { "saturation": 39 },
                      { "color": "#027bff" }
                    ]
                  },{
                    "stylers": [
                      { "hue": "#0008ff" },
                      { "saturation": 49 },
                      { "lightness": -45 },
                      { "gamma": 0.39 }
                    ]
                  },{
                    "featureType": "landscape",
                    "stylers": [
                      { "hue": "#004cff" },
                      { "saturation": -12 },
                      { "lightness": 9 }
                    ]
                  },{
                    "featureType": "road",
                    "stylers": [
                      { "hue": "#ff0008" },
                      { "saturation": 70 },
                      { "lightness": -57 },
                      { "gamma": 0.84 }
                    ]
                  },{
                    "elementType": "labels.icon",
                    "stylers": [
                      { "visibility": "off" }
                    ]
                  },{
                    "elementType": "labels.text.fill",
                    "stylers": [
                      { "color": "#808080" }
                    ]
                  },{
                    "featureType": "water"  }
                ];

date_expire_cookie.setTime(date_expire_cookie.getTime() + (12 * 30.4 * 24 * 60 * 60 * 1000));

function onDeviceReady() {
    navigator.splashscreen.hide();
    setInterval(checkConnection, 3000);
}

document.addEventListener("deviceready", onDeviceReady, false);

$(window).on("orientationchange", function(event) {
    if(typeof cordova =='undefined') reload();
});

function checkConnection() {
    
   /* states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.CELL]     = 'Cell generic connection';
    states[Connection.NONE]     = 'No network connection';*/
    
    if(navigator.connection.type==Connection.NONE || navigator.connection.type==Connection.UNKNOWN){
    	$('#check_connection').hide(500);
    }
    else{
    	$('#check_connection').show(500);
    }

}

function camembert(){
			
	$.ajax({
		type : 'GET',
		url : API_URL+'API.php',
		jsonpCallback : 'call_' + (++API_call),
		contentType : "application/json",
		dataType : 'jsonp',
		data : 'action=stats_race',
		async : true,
		success : function(data) {
			
			if(typeof data.err != 'undefined'){
				show_popin(data.err);
			}else{
				data_pie = new Array();
				$('#legend_race').html('');
				for(var i=0;i<data.nb_result;i++){
					data_pie[i] = {"value":parseInt(data[i].nb),"color":data[i].couleur};
					$('#legend_race').append('<div><span style="width:63px;display:inline-block;height:20px;margin:5px;background:'+data[i].couleur+'">&nbsp;</span>'+data[i].nom+'</div>');
				}
				new Chart(ctx_race).Pie(data_pie,opt_chart);
				$('.chart').width(300);
				$('.chart').height(150);
				
			}
			
		},
		error : function(e) {
			loading(false);
			debug(e.message);
		}
	});
	
	$.ajax({
		type : 'GET',
		url : API_URL+'API.php',
		jsonpCallback : 'call_' + (++API_call),
		contentType : "application/json",
		dataType : 'jsonp',
		data : 'action=stats_secteur',
		async : true,
		success : function(data) {
			
			if(typeof data.err != 'undefined'){
				show_popin(data.err);
			}else{
				data_pie = new Array();
				$('#legend_secteur').html('');
				for(var i=0;i<data.nb_result;i++){
					data_pie[i] = {"value":parseInt(data[i].nb),"color":data[i].couleur};
					$('#legend_secteur').append('<div><span style="width:63px;display:inline-block;height:20px;margin:5px;background:'+data[i].couleur+'">&nbsp;</span>'+data[i].nom+'</div>');
				}
				new Chart(ctx_secteur).Pie(data_pie,opt_chart);
				$('.chart').width(300);
				$('.chart').height(150);
				
			}
			
		},
		error : function(e) {
			loading(false);
			debug(e.message);
		}
	});
	
}

$(document).ready(function() {
	body_width = $(window).width();
	body_height = $(window).height();
	get_info_user();
	master = check_morsure();

	
	ctx_race = $("#chart_race").get(0).getContext("2d");
	ctx_secteur = $("#chart_secteur").get(0).getContext("2d");	
	if(master){
		//on stock la morsure jusqu'a ce que l'user soit inscrit et loggué
		//si deja cookie on fait rien
		if( !$.cookie('morsure')){
			$.cookie('morsure',master, { expires: date_expire_cookie });
			var d = new Date();
			var date_morsure = d.toISOString().substr(0, 10);
			$.cookie('date_morsure',date_morsure, { expires: date_expire_cookie });
		}
	}
	
	objet = check_objet();
	if(objet){
        if(!$.cookie('id_user')){
            show_popin('Vous devez vous connecter pour récuperer des objets');
        }
        else{
            $.ajax({
                type : 'GET',
                url : API_URL+'API.php',
                jsonpCallback : 'call_' + (++API_call),
                contentType : "application/json",
                dataType : 'jsonp',
                data : 'action=set_objet&id_user='+$.cookie('id_user')+'&id_objet='+objet,
                async : true,
                success : function(data) {

                    if(typeof data.err != 'undefined'){
                        show_popin(data.err);
                    }else{
                        if (data.nom){
                            show_popin('Vous recevez : 1x '+data.nom);
                        }
                        else{
                            //morsure ineffective :
                            show_popin('cet objet est inutilisable');
                        }

                    }

                },
                error : function(e) {
                    loading(false);
                    debug(e.message);
                }
            });
        }
	}
	
	if(check_perte_territoire()){
		$.ajax({
			type : 'GET',
			url : API_URL+'API.php',
			jsonpCallback : 'call_' + (++API_call),
			contentType : "application/json",
			dataType : 'jsonp',
			data : 'action=perte_territoire',
			async : true,
			success : function(data) {
				
				if(typeof data.err != 'undefined'){
					show_popin(data.err);
				}
				
			},
			error : function(e) {
				loading(false);
				debug(e.message);
			}
		});
	}
	
	if($.cookie('morsure') && $.cookie('id_user')){
		var force = 0;
		if(typeof $.cookie('resiste_pas')!='undefined'){
			force = 1;
		}
		$.ajax({
			type : 'GET',
			url : API_URL+'API.php',
			jsonpCallback : 'call_' + (++API_call),
			contentType : "application/json",
			dataType : 'jsonp',
			data : 'action=set_morsure&id_user='+$.cookie('id_user')+'&morsure='+$.cookie('morsure')+'&date='+$.cookie('date_morsure')+'&force='+force,
			async : true,
			success : function(data) {
				
				if(typeof data.err != 'undefined'){
					show_popin(data.err);
				}else{
					if (data.morsure){
						var calcul = calcul_lvl(data.master.xp);
						var msg = 'Vous vous êtes fait mordre par  '+data.master.nom+' (<span style="color:'+data.master.couleur+'">'+data.master.race+' lvl '+calcul.level+'</span>) !<br />';
						if(data.transformation){
							var msg_perte='';
							if(data.perte_xp){
								msg_perte ='<br />La morsure vous a affaibli.<br />Perte XP : '+data.perte_xp;
							}
							if(data.hybride){
								show_popin(msg+'Vous vous transformé en <span style="color:'+data.master.couleur+'">hybride</span>...'+msg_perte);
							}
							else{
								show_popin(msg+'Vous vous transformé à votre tour...'+msg_perte);
							}
							$.cookie('morsure','');
							$.cookie('alerte_morsure','');
						}
						else{
							$('#description2').html(msg+'Il vous reste '+data.reste_jour+' jour'+(data.reste_jour>1?'s':'')+' pour trouvez et utilisez un antidote!');
							$('#description2').append('<p><input type="button" value="ne pas resister et se transformer" id="se_transformer" /></p>');
							if(typeof $.cookie('alerte_morsure')=='undefined'){
							show_popin(msg+'Il vous reste '+data.reste_jour+' jour'+(data.reste_jour>1?'s':'')+' pour trouvez et utilisez un antidote!');
							}
							$.cookie('alerte_morsure','1', { expires: date_expire_cookie });
						}
						
					}
					else{
						//morsure ineffective : 
						if(data.perte_xp){
							show_popin('Un <span style="color:'+data.master.couleur+'">'+data.master.race+'</span> vous a mordu.<br />Cette morsure vous affaibli.<br />Perte XP : '+data.perte_xp);
						}
						$.cookie('morsure','');
					}
					
				}
				
			},
			error : function(e) {
				loading(false);
				debug(e.message);
			}
		});
		
	}
	
	
	
	init_gmap();
	
	$('#info_secteur').click(function(){
		$('#affiche_info_secteur').html('Pas d’information disponible.');
		$.get('http://vps36292.ovh.net/mordu/logs/secteurs/'+$(this).attr('id_secteur')+'.html', function(data){
			$('#affiche_info_secteur').html(data);
		});
	});
	
	$('#cherche_objet').click(function(){
		$.ajax({
			type : 'GET',
			url : API_URL+'API.php',
			jsonpCallback : 'call_' + (++API_call),
			contentType : "application/json",
			dataType : 'jsonp',
			data : 'action=cherche_objet&id_user='+$.cookie('id_user')+'&NW_lat='+secteur_NW_lat+'&SE_lat='+secteur_SE_lat+'&NW_lng='+secteur_NW_lng+'&SE_lng='+secteur_SE_lng,
			async : false,
			success : function(data) {
				loading(false);
				if(typeof data.err != 'undefined'){
					show_popin(data.err);
				}else{
					var msg=data.liste;
					if(data.gain_xp>0){
						msg+='<br />Gain d’xp: '+data.gain_xp+'<br /> <span class="ouvre_inventaire">Ouvrez votre inventaire pour utiliser vos trouvailles</span>';
					}
					show_popin(msg);
				}
				
			},
			error : function(e) {
				loading(false);
				debug(e.message);
			}
		});
	});
	
	$('#btn_renommer_secteur').click(function() {
		$.ajax({
			type : 'GET',
			url : API_URL+'API.php',
			jsonpCallback : 'call_' + (++API_call),
			contentType : "application/json",
			dataType : 'jsonp',
			data : 'action=set_nom_secteur&nom='+$('#renommer_secteur').val()+'&id_user='+$.cookie('id_user')+'&NW_lat='+secteur_NW_lat+'&SE_lat='+secteur_SE_lat+'&NW_lng='+secteur_NW_lng+'&SE_lng='+secteur_SE_lng,
			async : false,
			success : function(data) {
				loading(false);
				if(typeof data.err != 'undefined'){
					show_popin(data.err);
				}else{
					show_popin('Renommage effectué');
					setTimeout(go_home,2000);
				}
				
			},
			error : function(e) {
				loading(false);
				debug(e.message);
			}
		});
	});

	$('#submit_inscription').click(function() {
		var err_txt = '';

		$('.inscription .champ_formulaire').each(function( index ) {

			  if( !$( this ).val()){
	
				  err_txt += 'le champs '+$(this).attr('name')+' doit être rempli<br />';
			  }
			  if($(this).attr('regexp')){
				  var reg = new RegExp($(this).attr('regexp'), 'i');

					if(!reg.test($(this).val()))
					{
						err_txt +=$(this).attr('err')+'<br />';
					}

			  }
		});
		if(err_txt){
			show_popin(err_txt);
			return false;
		}
		loading(true);
		$.ajax({
			type : 'GET',
			url : API_URL+'API.php',
			jsonpCallback : 'call_' + (++API_call),
			contentType : "application/json",
			dataType : 'jsonp',
			data : 'action=set_info_users&nom='+$('#nom').val()+'&mdp='+$('#mdp').val()+'&email='+$('#email').val(),
			async : false,
			success : function(data) {
				loading(false);
				if(typeof data.err != 'undefined'){
					show_popin(data.err);
				}else{
					$.cookie('id_user', data.id_user, { expires: date_expire_cookie });
					get_info_user();
					$('#need_inscription').hide(300);
				}
				
			},
			error : function(e) {
				loading(false);
				debug(e.message);
			}
		});
		
	});
	
	$('#submit_log').click(function() {
		var err_txt = '';
		$('.log .champ_formulaire').each(function( index ) {
			  if( !$( this ).val()){
				  err_txt += 'le champs '+$(this).attr('name')+' doit être rempli<br />';
			  }
			  if($(this).attr('regexp')){
				  var reg = new RegExp($(this).attr('regexp'), 'i');

					if(!reg.test($(this).val()))
					{
						err_txt +=$(this).attr('err')+'<br />';
					}

			  }
		});
		if(err_txt){
			show_popin(err_txt);
			return false;
		}
		loading(true);
		$.ajax({
			type : 'GET',
			url : API_URL+'API.php',
			jsonpCallback : 'call_' + (++API_call),
			contentType : "application/json",
			dataType : 'jsonp',
			data : 'action=log_info_users&mdp='+$('#mdp').val()+'&email='+$('#email').val(),
			async : false,
			success : function(data) {
				loading(false);
				if(typeof data.err != 'undefined'){
					show_popin(data.err);
				}else{
					$.cookie('id_user', data.user.id, { expires: date_expire_cookie });
					get_info_user();
					$('#need_inscription').hide(300);
				}
				
			},
			error : function(e) {
				loading(false);
				debug(e.message);
			}
		});
		
	});
	
	$('body').delegate('.tuto','click',function(){
		var id=$(this).attr('affiche');
		if($('#'+id).is(":visible")){
			$('#'+id).hide(300);
		}
		else{
			$('#'+id).show(300);
		}
	});
	
	$('body').delegate('#jeton_action','change',function(){
		$('.btn_secteur').filter(':visible').effect('shake');
	});
	
	$('body').delegate('.combat_first','click',function(){
		$('.combat_first').hide(100);
		$('#combat_0').show(1000);
	});
	$('body').delegate('.combat','click',function(){
		var id = parseInt($(this).attr('next_combat'));
		if(!id) {
			go_home();
			return false;
		}
		$('.combat').hide(100);
		$('#combat_'+id).show(1000);
	});
	
	$('body').delegate('#se_transformer','click',function(){
		$.cookie('resiste_pas',1);
		reload();
	});
	
	$('body').delegate('#search_position','click',function(){
		var prec = $('.precision').html();
		if(!prec) prec='0';
		show_popin('Vous avez une précision de '+$('.precision').html());
	});
	
	
	$('body').delegate('.nom_disciple','click', function(){
		var nom_disciple = $(this).attr('nom');
		$('.page').hide(300);
		get_secteurs($(this).attr('id'));
		$('.qui_possede').html(nom_disciple+' possede');

		$('#nom_proprio').html(nom_disciple);
		$('.secteurs').show(300);
		
	});
	$('.no_click').click(function(){
		show_popin('Cliquez sur l’icone a gauche pour effectuer l’action.');
	});

	$('.menu').click(function() {
		$('.logo').html('Revenir au menu');
		$(this).html('chargement...');
		page = $(this).attr('show');
		var elem = $(this);
		$('.page').hide(300);

		if (page == 'radar') {
			
			show_map = true;
			init_gmap();
			get_secteur();
		}else if(page == 'disciples'){
			get_disciple();
		}
		else if(typeof cordova !='undefined' && page =='scanner'){
			var scanner = cordova.require("cordova/plugin/BarcodeScanner");
			scanner.scan(
		    	      function (result) {
                          var result_url = result.text;
                          //result.format
                          $('.result_scanner').html('lecture du Qrcode  :url: '+result_url+' ('+result.format+')');
                          if(!result.cancelled){

                              var reg = new RegExp('master=([a-z0-9]+)','i');

                              var morsure = result_url.match(reg);

                              var typemorsure = typeof morsure;
                              if(typeof morsure =='object' && morsure){

                                  if( !$.cookie('morsure') ){
                                      $.cookie('morsure',morsure[1], { expires: date_expire_cookie });
                                      var d = new Date();
                                      var date_morsure = d.toISOString().substr(0, 10);
                                      $.cookie('date_morsure',date_morsure, { expires: date_expire_cookie });
                                      if(!$.cookie('id_user')){
                                          $('.result_scanner').html('Vous devez vous connecter pour récuperer des objets');
                                      }else{
                                          $('.result_scanner').html('Vous venez d’etre mordu');
                                      }
                                  }
                                  else {
                                      $('.result_scanner').html('Vous êtes déjà mordu');
                                  }

                              }


                              var objet = result_url.match(/objet=([a-z0-9]+)/i);

                              if(typeof objet =='object' && objet){
                                  if(!$.cookie('id_user')){
                                      $('.result_scanner').html('Vous devez vous connecter pour récuperer des objets');
                                  }
                                  else{
                                      $.ajax({
                                          type : 'GET',
                                          url : API_URL+'API.php',
                                          jsonpCallback : 'call_' + (++API_call),
                                          contentType : "application/json",
                                          dataType : 'jsonp',
                                          data : 'action=set_objet&id_user='+$.cookie('id_user')+'&id_objet='+objet[1],
                                          async : true,
                                          success : function(data) {

                                              if(typeof data.err != 'undefined'){
                                                  $('.result_scanner').append(data.err);
                                              }else{
                                                  if (data.nom){
                                                      $('.result_scanner').html('Vous recevez : 1x '+data.nom);
                                                  }
                                                  else{
                                                      $('.result_scanner').html('cet objet est inutilisable');
                                                  }

                                              }

                                          },
                                          error : function(e) {
                                              loading(false);
                                              debug(e.message);
                                          }
                                      });
                                  }
                              }

                          }
                          else{
                              $('.result_scanner').html("Scann arreté.");
                          }
		    	      }, 
		    	      function (error) {
		    	    	  $('.result_scanner').html("Scan echoué: " + error);
		    	      }
		    	   );
		}
		else if(page=='perso'){
			get_info_user();
		}
		else if(page == 'secteurs'){
			get_info_user();
			get_secteurs($.cookie('id_user'));
		}
		else if(page == 'inventaire'){
			get_inventaire();
		}
		else if(page=='stats'){
			camembert();
		}
		else if(page =='accueil' && typeof secteur_NW_lat !='undefined'){
			reload(); //recharge pour les fuite memoire gmap
			return true;
		}
		$('.' + page).show(300, function(){
			elem.html(elem.attr('title'));
		});
		
	});
	
	$('body').delegate('.nom_objet','click',function(){
		var uniqid = $(this).attr('use');
		$(this).parent().hide(300);
		use_objet(uniqid);
	});
	
	$('body').delegate('.ouvre_inventaire','click',function(){
		get_inventaire();
		$('.page').hide(300);	
		$('.inventaire').show(300);
	});	
	
	
	$('body').delegate('.drop_objet','click',function(){
		var uniqid = $(this).attr('use');
		$(this).parent().hide(300);
		var ok =confirm('Enregistrer le code barre, si vous souhaitez le donner ou le recuperer apres.\nÊtes vous sur d\'abandonner cet objet?');
		if(ok){
			drop_objet(uniqid);
		}
		else{
			$(this).parent().show(300);
		}
	});
	
	$('body').delegate('.mes_secteurs','click', function(){
		//pas de recherche dans les secteurs hors porté
		$('.cherche_objet').hide();
		$('.affiche_precision').hide();
		var nom = $(this).attr('nom');
		secteur_NW_lng = $(this).attr('NW_lng');
		secteur_NW_lat = $(this).attr('NW_lat');
		secteur_SE_lng = $(this).attr('SE_lng');
		secteur_SE_lat = $(this).attr('SE_lat');
		var center_lat = (parseFloat(secteur_NW_lat)+parseFloat(secteur_SE_lat))/2;
		var center_lng = (parseFloat(secteur_NW_lng)+parseFloat(secteur_SE_lng))/2;
		
		body_width = $(document).width()-20; // -35 on laisse de la place au scrollbarr : pas de scrollbar sur mobile !
		body_height = $(document).height();

		$("#googleMap").width(Math.min(body_width, 925));
		$("#googleMap").width(body_width);
		$("#googleMap").height(Math.min(body_width, 300));
		
		if(!nom){
			nom='sans nom';
		}
		$('#renommer_secteur').val(nom);
		$('.nom_secteur').html(nom);
		$('#pt_renfort').html($(this).attr('def'));
        $('#img_mini_soldat').removeClass().addClass( 'mini_soldat_'+$(this).attr('race_id') );
		$('#capture, .page, .capturable, #capturable,  .btn_secteur, #search_position').hide();
		
		
		if($(this).attr('id_proprio') == $.cookie('id_user')){
			$('.renom_secteur').show();
		}
		else{
			$('.renom_secteur').hide();
		}
		
		var calcul = calcul_lvl($(this).attr('xp_proprio'));
		$('#nom_proprio').html($(this).attr('nom_proprio'));
		$('#race_proprio').html($(this).attr('race')+' lvl '+calcul.level);
		$('#race_proprio').css('color',$(this).attr('race_couleur'));
		if($(this).attr('race_groupe') != $.cookie('groupe')){
			$('#capture, .attaque').show();
		}
		else{
			$('#capture, .renfort').show();
		}
		
		
		googleMap = new google.maps.Map($("#googleMap").get(0), {
			navigationControl : false,
			mapTypeControl : false,
			keyboardShortcuts : false,
			scaleControl : false,
			scrollwheel : false,
			draggable : false,
			streetViewControl : false,
			zoomControl : true,
			zoom : 18,// le niveau de zoom (de 0 à 21) ideal : 17
			minZoom: 14,
			maxZoom: 19,
			center : new google.maps.LatLng(center_lat, center_lng), 
			mapTypeId : google.maps.MapTypeId.ROADMAP
		});
		



	 var styledMap = new google.maps.StyledMapType(stylesGM, {name: "Gmap stylée"});

	 googleMap.mapTypes.set('map_style', styledMap);
	 googleMap.setMapTypeId('map_style');
		
		var secteur = new google.maps.Rectangle;
		var secteur_NW = new google.maps.LatLng(secteur_NW_lat, secteur_NW_lng);
		var secteur_SE = new google.maps.LatLng(secteur_SE_lat, secteur_SE_lng);
		var secteur_perimetre = new google.maps.LatLngBounds(secteur_NW, secteur_SE);
		secteur.setMap(googleMap);
		secteur.setOptions({
			strokeWeight : '1',
			strokeColor:'#ffffff',
			fillColor :'gold',
			fillOpacity : 0.5
		});
		secteur.setBounds(secteur_perimetre);
		$('.radar').show(300);
	});

	$('#popin, #bg_popin').click(hide_popin);
	
	$('#show_inscript').click(function(){
		$('.log').hide(300);
		$('.inscription').show(300);
	});
	
	$('#show_log').click(function(){
		$('.inscription').hide(300);
		$('.log').show(300);
	});
	
	$('#jeton_action').change(function(){
		$('#nb_jeton_action_use').html($('#jeton_action').val());
	});
	
	$('.btn_secteur').click(function(){
		navigator.geolocation.clearWatch(watchposition);
		var nb_jeton = parseInt($('#jeton_action').val());
		var action = $(this).attr("action");
		if(nb_jeton==0){
			show_popin('Vous devez selectionner au moins 1 soldat.');
			return false;
		}

		$.ajax({
			type : 'GET',
			url : API_URL+'API.php',
			jsonpCallback : 'call_' + (++API_call),
			contentType : "application/json",
			dataType : 'jsonp',
			data : 'action='+action+'_secteur&id_user='+$.cookie('id_user')+'&jeton='+nb_jeton+'&id_race='+$.cookie('id_race')+'&NW_lat='+secteur_NW_lat+'&SE_lat='+secteur_SE_lat+'&NW_lng='+secteur_NW_lng+'&SE_lng='+secteur_SE_lng+'&nom_secteur='+$('#renommer_secteur').val(),
			async : false,
			success : function(data) {
				if(typeof data.err != 'undefined'){
					show_popin(data.err);
				}else{
					if(data.max_secteur){
						show_popin('Ce secteur a le maximum de renfort, vous ne pouvez plus le renforcer.');
					}
					else if(action !='attaque'){
						var msg='Action effectuée : '+action+'.';
						if(data.gain_xp){
							msg+= '<br />Gain XP: '+data.gain_xp;
						}
						show_popin(msg);
					}
					
					if(action=='attaque'){
						
						var html='<h1>Combat de secteur</H1>Cliquer sur les dés pour faire défiler le déroulement du combat.<p>Force engagé : ';
						html+='<div class="gradient combat_first">';

						var decal = 0;
                        for(var i =0;i<data.nb_de_attaque_depart; i++){
                        	if(i%5==0){
                        		html+='<br />';
                        		decal=0;
                        	}
                        	
                        	html+='<span alt="soldat" class="img_soldat_combat soldat_'+ $.cookie('id_race')+'" style="left:-'+(decal*12)+'px"></span>';
                        	decal++;
                        	
                        }
                        html+='<br />';
                        
                        var decal = 0;
                        for(var i =0;i<data.nb_de_defense_depart; i++){
                        	if(i%5==0){
                        		html+='<br />';
                        		decal=0;
                        	}
                        	html+='<span alt="soldat" class="img_soldat_combat soldat_'+ data.race_defense+'" style="left:-'+(decal*12)+'px"></span>';
                        	decal++;
                        }
 
						for(var i =0; i<data.nb_combat; i++){
							var de_attaque = data[i].de_attaque.split(',');
							var de_defense = data[i].de_defense.split(',');
							var img_de_att ='';
							var img_de_def ='';
							for(var j=0; j<de_attaque.length; j++){
								img_de_att += '<div class="de_'+de_attaque[j]+'"></div>';
							}
							for(var j=0; j<de_defense.length; j++){
								img_de_def += '<div class="de_'+de_defense[j]+'"></div>';
							}
							html+='<p>'+img_de_att+' ('+data[i].jeton_attaque+')  '+img_de_def+' ('+data[i].jeton_defense+')</p>';
							//$('.resolution_combat').append('<p>Vous perdez : '+data[i].perte_attaque+' <img src="img/soldat_'+ $.cookie('id_race')+'.png" alt="soldat" /></p><p>Le secteur perd : '+data[i].perte_defense+' <img src="img/soldat_'+data.race_defense+'.png" alt="soldat" /> </p>');
							html+='</div><div class="gradient combat" id="combat_'+i+'" next_combat="'+(i+1)+'">';
							var decal = 0;
                            for(var k =0;k< (data[i].jeton_attaque-data[i].perte_attaque); k++){
                            	if(k%5==0){
                            		html+='<br />';
                            		decal=0;
                            	}
                            	html+='<span class="img_soldat_combat soldat_'+ $.cookie('id_race')+'" style="left:-'+(decal*12)+'px"></span>';
                            	decal++;
                            }
                            html+='<br />';
                            var decal = 0;
                            for(var k =0;k<(data[i].jeton_defense-data[i].perte_defense); k++){
                            	if(k%5==0){
                            		html+='<br />';
                            		decal=0;
                            	}
                            	html+='<span class="img_soldat_combat soldat_'+ data.race_defense+'" style="left:-'+(decal*12)+'px"></span>';
                            	decal++;
                            }
                            html+='<br />';
						}
						html+='</div>';
						if(data.nb_de_attaque_fin>0){
							html+='<div class="gradient combat combat_end" id="combat_'+i+'" next_combat="0">Vous avez conquis ce territoire !</div>';
						}
						else if(data.nb_de_defense_depart - data.nb_de_defense_fin>0){
							html+='<div class="gradient combat combat_end" id="combat_'+i+'" next_combat="0">Vous avez affaiblit ce territoire !</div>';
						}
						else{
							html+='<div class="gradient combat combat_end" id="combat_'+i+'" next_combat="0">Votre action n’a pas affaiblit ce territoire...</div>';
						}
						if(data.gain_xp){
							$('.resolution_combat').append('Gain XP: '+data.gain_xp);
						}
						$('.radar').hide(300);
						$('.resolution_combat').html(html);
						
						$('.resolution_combat').show(300);
					}
					else{
						setTimeout(go_home,4000);
					}
				}
				
			},
			error : function(e) {
				debug(e.message);
			}
		});
	});
	

});

function show_popin(txt) {

	body_width = $(document).width();
	body_height = $(document).height();

	$('#bg_popin').css('width', body_width);
	$('#bg_popin').css('height', body_height);

	$('#popin').html(txt);

	$('#bg_popin').show(100);
	$('#popin').show(100);

	setTimeout(adjust_popin, 100);
	setTimeout(adjust_popin, 200);
	setTimeout(adjust_popin, 300);
	setTimeout(adjust_popin, 500);
	setTimeout(adjust_popin, 800);
	setTimeout(adjust_popin, 1000);
}

function adjust_popin() {
	var decal_left = Math.round((body_width - $('#popin').outerWidth()) / 2);
	$('#popin').animate({
		left : decal_left
	}, 100);
	// $('#popin').css('left',decal_left);
	var decal_top = Math
			.round(($(window).height() - $('#popin').outerHeight()) / 2)
			+ $(document).scrollTop();
	$('#popin').animate({
		top : decal_top
	}, 100);
	// $('#popin').css('top',decal_top);
}

function hide_popin() {
	$('#popin').hide(200);
	$('#bg_popin').hide(250);
}

function get_info_user() {

	$.ajax({
		type : 'GET',
		url : API_URL+'API.php',
		jsonpCallback : 'call_' + (++API_call),
		contentType : "application/json",
		dataType : 'jsonp',
		data : 'action=get_info_users&id_user=' + $.cookie('id_user'),
		async : true,
		success : function(data) {
			loading(false);
			$.cookie('id_user', data.user.id, { expires: date_expire_cookie });
			$.cookie('nom', data.user.nom, { expires: date_expire_cookie });
			$.cookie('id_race', data.race.id, { expires: date_expire_cookie });
			$.cookie('groupe', data.race.groupe, { expires: date_expire_cookie });
			$.cookie('user_agent', data.user.user_agent, { expires: date_expire_cookie });
			if(data.race.id>=1){
				$('.connect').show();
			}
			if(data.race.id>1){
				$('.connect_mordeur').show();
			}
			
			var calcul = calcul_lvl(data.user.xp);
			$('#lvl_bar').html(calcul.level);
			$('#lvl_bar_sup').html(calcul.level+1);
			$('.xp').html(data.user.xp);
			$('.xp_max_lvl').html(calcul.xp_cumul_level_suiv);
			$('#progress_contenu').css('width',calcul.perc+'%');
			
			$('#nom_perso').html(data.user.nom);
			$('#description').html(data.race.desc);
			$('#ma_race').html(data.race.nom+' (lvl '+calcul.level+')');
			$('#ma_race').css('color',data.race.couleur);
			$('#jeton').html(data.user.jeton);
			$('#jeton_max').html(data.race.jeton);
			$('.soldat_moi').removeClass().addClass( 'soldat_moi soldat_'+data.race.id );
            
			

			
			if(data.user.id.length>1) $('#need_inscription').hide();
			$('#jeton_action').html('');

			$('#img_qrcode').attr('src',API_URL+'qrcode_'+data.user.id+'_1.png');
			
			for(var i=0; i<=data.user.jeton; i++){
				$('#jeton_action').append('<option value="'+i+'">'+i+'</option>');
			}

			if(!data.user.jeton && data.user.id){
				$('.need_jeton').show();
			}
			else{
				$('.need_jeton').hide();
			}
		},
		error : function(e) {
			loading(false);
			debug(e.message);
		}
	});
}

function get_secteur() {

	$.ajax({
		type : 'GET',
		url : API_URL+'API.php',
		jsonpCallback : 'call_' + (++API_call),
		contentType : "application/json",
		dataType : 'jsonp',
		data : 'action=get_secteur',
		async : false,
		success : function(data) {
			loading(false);
			for(var i=0; i<data.nb_secteur; i++){

				var secteur = new google.maps.Rectangle;
				var secteur_NW = new google.maps.LatLng(data[i].NW_lat, data[i].NW_lng);
				var secteur_SE = new google.maps.LatLng(data[i].SE_lat, data[i].SE_lng);
				var secteur_perimetre = new google.maps.LatLngBounds(secteur_NW, secteur_SE);
				secteur.setMap(googleMap);
				secteur.setOptions({
					fillColor : data[i].race.couleur,
					strokeWeight : '1',
					strokeColor:'#ffffff',
					fillOpacity : 0.5
				});
				secteur.setBounds(secteur_perimetre);
			}

		},
		error : function(e) {
			loading(false);
			debug(e.message);
		}
	});
}

function get_info_secteur(NW_lat, SE_lat, NW_lng, SE_lng) {

	$.ajax({
		type : 'GET',
		url : API_URL+'API.php',
		jsonpCallback : 'call_' + (++API_call),
		contentType : "application/json",
		dataType : 'jsonp',
		data : 'action=get_info_secteur&NW_lat='+NW_lat+'&SE_lat='+SE_lat+'&NW_lng='+NW_lng+'&SE_lng='+SE_lng,
		async : true,
		success : function(data) {
			
			if(data.capturable){
				$('#capture, .renfort, .attaque, .affiche_info').hide();
				$('.capturable, #capturable').show();
				$('#img_mini_soldat').removeClass().addClass( 'mini_soldat_1' );
				var nom = genere_nom_secteur();
				$('#renommer_secteur').val(nom);
				$('.nom_secteur').html(nom);
			}
			else{
				$('#info_secteur').attr('id_secteur',data.secteur.id);
				$('#capturable').hide();
				$('#capture, .affiche_info').show();
				
				var nom = data.secteur.nom;
				$('#renommer_secteur').val(nom);
				if(!nom) nom='sans nom';
				$('.nom_secteur').html(nom);
				$('#nom_proprio').html(data.proprio.nom);
				$('#race_proprio').html('<span style="font-weight:bold;color:'+data.race.couleur+'">'+data.race.nom+'</span>');
				$('#img_mini_soldat').removeClass().addClass( 'mini_soldat_'+data.race.id );
				$('#pt_renfort').html(data.secteur.jeton);

				if(data.race.groupe == parseInt($.cookie('groupe'))){

					$('.attaque, .capturable').hide();
					$('.renfort').show();
				}
				else{
					
					$('.capturable, .renfort').hide();
					$('.attaque').show();
				}
				
			}
			
			if(parseInt($.cookie('id_race')) == 2 || parseInt($.cookie('id_race'))==3){
				//cas des hybrides
				$('.attaque, .renfort, #select_jeton_action').hide();
				$('#hybride_restriction').show();
			}
			else{
				$('#hybride_restriction').hide();
				$('#select_jeton_action').show();
			}

		},
		error : function(e) {
			loading(false);
			debug(e.message);
		}
	});
}

function get_disciple() {

	$.ajax({
		type : 'GET',
		url : API_URL+'API.php',
		jsonpCallback : 'call_' + (++API_call),
		contentType : "application/json",
		dataType : 'jsonp',
		data : 'action=get_disciple&id_user=' + $.cookie('id_user'),
		async : false,
		success : function(data) {
			loading(false);
			$('#nb_disciple').html(data.nb_disciple);
			if(data.nb_disciple>1){
				$('#plur_disciple').html("s");
			}
			$('#info_mes_disciples').html('');
			for( var i =0; i<data.nb_disciple; i++){
				var calcul = calcul_lvl(data[i].xp);
				$('#info_mes_disciples').append('<div class="mes_disciples gradient">'+(i+1)+') <span class="nom_disciple" nom="'+data[i].nom+'" id="'+data[i].id+'">'+data[i].nom+' (lvl '+calcul.level+')</span>: mordu&nbsp;le&nbsp;:'+data[i].mordu.replace(' ','&nbsp;')+' dernière&nbsp;activité&nbsp;:'+data[i].activite.replace(' ','&nbsp;')+'</div>');
			}
		},
		error : function(e) {
			loading(false);
			debug(e.message);
		}
	});
}



function get_inventaire() {

	$.ajax({
		type : 'GET',
		url : API_URL+'API.php',
		jsonpCallback : 'call_' + (++API_call),
		contentType : "application/json",
		dataType : 'jsonp',
		data : 'action=get_inventaire&id_user=' + $.cookie('id_user'),
		async : false,
		success : function(data) {
			$('.inventaire').html('<h2>Votre inventaire. <span class="tuto" affiche="explication_objet">(?)</span></h2><div id="explication_objet">Vous pouvez distribuer votre qrcode (imprimer sur le terrain) ou donner sur un forum / email...<br /> Si une autre personne le scan, il récuperera cet objet, et l’objet disparaitra de votre inventaire.</h3><h3>Cliquer sur le nom de l’objet pour l’utiliser</div><br />');
			for( var i =0; i<data.nb_objet; i++){
				$('.inventaire').append('<div class="div_qrcode_objet gradient"><a href="'+API_URL+'qrcode_'+data[i].uniqid+'_2.png"><img src="'+API_URL+'qrcode_'+data[i].uniqid+'_2.png" class="qrcode_objet"  /></a> &nbsp; <span class="nom_objet" use="'+data[i].uniqid+'">'+data[i].nom+'</span>: <span class="desc_objet">'+data[i].description+'</span> <span class="drop_objet" use="'+data[i].uniqid+'">abandonner l’objet</span> </div>');
			}
			if(!data.nb_objet){
				$('.inventaire').html('Vous n’avez pas d’objet.');
			}
		},
		error : function(e) {
			debug(e.message);
		}
	});
}

function use_objet(uniqid){

	$.ajax({
		type : 'GET',
		url : API_URL+'API.php',
		jsonpCallback : 'call_' + (++API_call),
		contentType : "application/json",
		dataType : 'jsonp',
		data : 'action=use_objet&id_user=' + $.cookie('id_user')+'&id_objet='+uniqid+'&id_race='+$.cookie('id_race'),
		async : false,
		success : function(data) {
			
			if(data.err){
				show_popin(data.err);
			}
			else{
				eval(data.eval);
				get_info_user();
			}
		},
		error : function(e) {
			debug(e.message);
		}
	});
}

function drop_objet(uniqid){

	$.ajax({
		type : 'GET',
		url : API_URL+'API.php',
		jsonpCallback : 'call_' + (++API_call),
		contentType : "application/json",
		dataType : 'jsonp',
		data : 'action=drop_objet&id_user=' + $.cookie('id_user')+'&id_objet='+uniqid+'&id_race='+$.cookie('id_race'),
		async : false,
		success : function(data) {
			
			if(data.err){
				show_popin(data.err);
			}
			else{
				eval(data.eval);
				get_info_user();
			}
		},
		error : function(e) {
			debug(e.message);
		}
	});
}



function get_secteurs(id_user) {
	$('.cherche_objet').show();
	$('.affiche_precision').show();
	$.ajax({
		type : 'GET',
		url : API_URL+'API.php',
		jsonpCallback : 'call_' + (++API_call),
		contentType : "application/json",
		dataType : 'jsonp',
		data : 'action=get_secteur&id_user=' + id_user+'&id_race=' + $.cookie('id_race'),
		async : false,
		success : function(data) {
			loading(false);
			$('#nb_secteur').html(data.nb_secteur);
			$('#nb_secteur_race').html(data.nb_race_secteur);
			$('#info_mes_secteurs').html('');
			for( var i =0; i<data.nb_secteur; i++){
				if(data[i].jeton>1){
					plur_renfort ='s';
				}
				else{
					plur_renfort ='';
				}
				$('#info_mes_secteurs').append('<div class="mes_secteurs gradient" id_secteur="'+data[i].id_secteur+'" NW_lat="'+data[i].NW_lat+'" NW_lng="'+data[i].NW_lng+'" SE_lat="'+data[i].SE_lat+'" SE_lng="'+data[i].SE_lng+'" def="'+data[i].jeton+'" nom="'+data[i].nom+'"  id_proprio="'+data[i].user.id+'" nom_proprio="'+data[i].user.nom+'" xp_proprio="'+data[i].user.xp+'" race="'+data[i].race.nom+'" race_groupe="'+data[i].race.groupe+'" race_id="'+data[i].race.id+'" race_couleur="'+data[i].race.couleur+'">'+(i+1)+') Secteur '+data[i].nom+': '+data[i].jeton+' renfort'+plur_renfort+' <span class="oeil img_oeil"></span></div>');
			}
			$('.aucun_secteur').hide();
			if(!data.nb_secteur){
				$('.au_moins_un_secteur').hide();
				$('.aucun_secteur').show();
				$('.qui_possede').html('Vous ne possedez');
			}
			else if(data.nb_secteur>1){
				$('#plur_secteur').html('s');
				$('.au_moins_un_secteur').show();
				$('.aucun_secteur').hide();
				$('.qui_possede').html('Vous possedez');
			}
			else{
				$('#plur_secteur').html('');
				$('.au_moins_un_secteur').show();
				$('.aucun_secteur').hide();
				$('.qui_possede').html('Vous possedez');
			}
			if(data.nb_secteur_race>1){
				$('#plur_secteur_race').html("s");
			}

			if(typeof data[0]!='undefined' && data[0].id_proprio !=$.cookie('id_user')){
				$('#race_proprio').html(data[0].race.nom);
				$('#race_proprio').css('color',data[0].race.couleur);


				
			}
			
		},
		error : function(e) {
			loading(false);
			debug(e.message);
		}
	});
}


function init_gmap() {

	if (!show_map)
		return false;
	
	body_width = $(document).width()-20; // on laisse de la place au scrollbarr
	body_height = $(document).height();
	console.log('screen: '+body_width+'x'+body_height);
	$("#googleMap").width(Math.min(body_width, 925));
	$("#googleMap").width(body_width);
	$("#googleMap").height(Math.min(body_width, 300));
	
	if (typeof googleMap == 'undefined') {
		

		
		googleMap = new google.maps.Map($("#googleMap").get(0), {
			navigationControl : false,
			mapTypeControl : false,
			keyboardShortcuts : false,
			scaleControl : false,
			scrollwheel : false,
			draggable : false,
			streetViewControl : false,
			zoomControl : true,
			zoom : 17,// le niveau de zoom (de 0 à 21) ideal : 17
			minZoom: 14,
			maxZoom: 19,
			center : new google.maps.LatLng(latitude, longitude), 
			mapTypeId : google.maps.MapTypeId.ROADMAP
		});
		
	}
	


 var styledMap = new google.maps.StyledMapType(stylesGM, {name: "Gmap stylée"});

 googleMap.mapTypes.set('map_style', styledMap);
 googleMap.setMapTypeId('map_style');
 
	watchposition = navigator.geolocation.watchPosition(callbackSuccess, callbackError, {maximumAge:0, enableHighAccuracy : true, timeout:10000	});


}

/**
 * récupère la latitude et la longitude
 * position.timestamp; //timestamp auquel la position à été calculée
 * position.coords.latitude; //latitude de l'utilisateur
 * position.coords.longitude; //sa longitude position.coords.altitude; //son
 * altitude position.coords.accuracy; //la précision des coordonnées en
 * mètres position.coords.altitudeAccuracy; //la précision de l'altitude en
 * mètres position.coords.heading; //l'angle de l'utilisateur
 * position.coords.speed; //et pour finir sa vitesse en mètres/s
 */
 var tt_acc=0;
 var nb_call=0;
 var interval_radar;
function callbackSuccess(position) {
	nb_call++;
	
	$('#search_position, #actions, #googleMapHeader').show();
	$('#search_position').removeClass().addClass( 'radar_on');

	latitude = position.coords.latitude;
	longitude = position.coords.longitude;
	accuracy = Math.round(position.coords.accuracy);
	
	if(accuracy <=100 || nb_call>10) {
		tt_acc++;
		$('#loading_radar').attr('src','img/none.png');
		$('#loading_radar_mess').hide();
		if(tt_acc>2){
			navigator.geolocation.clearWatch(watchposition); 
			clearInterval(interval_radar);
			interval_radar = null;
			watchposition = null;
			position.coords.accuracy = 101; //permet de pas stocké l'ancien et de clear direct
			tt_acc=0;
			$('#search_position').removeClass().addClass( 'radar_off');
		}
		else{
			position.coords.accuracy = 21;
		}
	}

	$('.precision').html(accuracy+'&nbsp;m |'+nb_call);
	if(accuracy>1000 && nb_call>9){
		$('#loading_radar').attr('src','img/none.png');
		navigator.geolocation.clearWatch(watchposition);
		clearInterval(interval_radar);
		interval_radar = null;
		$('.radar, #loading_radar_mess').hide();
		$('.precis').show(300);
	}
	else if(accuracy>1000){
		$('#actions, #googleMapHeader').hide();
		$('#loading_radar').attr('src','img/parasite.png');
		$('#loading_radar_mess').show();
		$('#loading_radar').width($(document).width()+100);
		$('#loading_radar').height($('#googleMap').height()+5);
		if(!interval_radar){
			interval_radar = setInterval(function(){
				setTimeout(function(){
					$('#loading_radar').effect( "shake" );
				},1000);
			},4000);
		}
		
	}
	else{
		$('.precis').hide();
		$('.radar').show();
	}

	googleMap.panTo(new google.maps.LatLng(latitude, longitude));
	var image = {
		url : 'img/sprite.png',
		size : new google.maps.Size(48, 48),
		origin : new google.maps.Point(0, 0),
		anchor : new google.maps.Point(24, 24)
	};

	if (typeof marker != 'undefined') {
		marker.setMap(null);
	}

	marker = new google.maps.Marker({
		position : new google.maps.LatLng(latitude, longitude),
		map : googleMap,
		icon : image,
		title : 'vous'
	});

	new Graticule(googleMap, false);

	if (typeof secteur != 'undefined') {
		secteur.setMap(null);
	}
	secteur = new google.maps.Rectangle;
	secteur_NW_lat = Math.floor(latitude * 1000 + 1) / 1000;
	secteur_NW_lng = Math.floor(longitude * 1000) / 1000;
	secteur_SE_lat = Math.floor(latitude * 1000) / 1000;
	secteur_SE_lng = Math.floor(longitude * 1000 + 1) / 1000;
	var secteur_NW = new google.maps.LatLng(secteur_NW_lat, secteur_NW_lng);
	var secteur_SE = new google.maps.LatLng(secteur_SE_lat, secteur_SE_lng);
	$('#secteur').html(
			secteur_NW_lat.toFixed(3) + ',' + secteur_NW_lng.toFixed(3) + ' - '
					+ secteur_SE_lat.toFixed(3) + ','
					+ secteur_SE_lng.toFixed(3));
	secteur_perimetre = new google.maps.LatLngBounds(secteur_NW, secteur_SE);
	secteur.setMap(googleMap);
	secteur.setOptions({
		strokeWeight : '1',
		strokecolor :'#fff',
		fillOpacity : 0
	});
	secteur.setBounds(secteur_perimetre);
	get_info_secteur(secteur_NW_lat.toFixed(3), secteur_SE_lat.toFixed(3), secteur_NW_lng.toFixed(3), secteur_SE_lng.toFixed(3)); 
}

function callbackError(error) {
	switch (error.code) {
	case error.UNKNOWN_ERROR:
		alert("La géolocalisation a rencontré une erreur.");
		break;
	case error.PERMISSION_DENIED:
		alert("L'utilisateur n'a pas voulu donner sa position.");
		break;
	case error.POSITION_UNAVAILABLE:
		alert("Les coordonnées de l'utilisateur n'ont pas pu être trouvées.");
		break;
	case error.TIMEOUT:
		//alert("La géolocalisation prend trop de temps.");
		navigator.geolocation.getCurrentPosition(callbackSuccess, callbackError, {maximumAge:0, enableHighAccuracy : true, timeout:10000	});
		break;
	default:
		alert('erreur inconnue');
		break;
	}
}

function loading(bool) {
	if (bool) {
		$('#content').hide(300);
		$('#loading').show(300);
	} else {
		$('#loading').hide(300);
		$('#content').show(300);
	}
}

function debug(txt) {
	$('#debug').html(txt);
}

function check_morsure(){
	morsure = window.location.search.match('master=([^&]+)');
	if(typeof morsure =='object' && morsure){
		//on c'est fait mordre
		return morsure[1];
	}
	else return false;
}

function check_objet(){
	objet = window.location.search.match('objet=([^&]+)');
	if(typeof objet =='object' && objet){
		//on a scanner un objet
		return objet[1];
	}
	else return false;
}

function check_perte_territoire(){
	var ck = window.location.search.match('ckptterr=([^&]+)');
	if(typeof ck =='object' && ck){
		//on a scanner un objet
		return ck[1];
	}
	else return false;
}

function go_home(){
	$('.logo').trigger('click');
}

function reload(){
	location.href = location.protocol+'//'+location.host+location.pathname;
}

function calcul_lvl(xp){
	var xp_test	= xp/50;
	var lvl_cal	=  Math.floor(Math.sqrt(xp_test*2));
	var xp_lvl		= (lvl_cal*(lvl_cal+1))/2;

	if(xp_lvl>xp_test){
		lvl_cal	= lvl_cal-1;
	}
	
	var xp_cumul_ce_lvl	= 50*(lvl_cal*(lvl_cal+1))/2;
	var xp_cumul_level_suiv	= 50*((lvl_cal+1)*(lvl_cal+2))/2;
	var xp_ce_level			= xp-xp_cumul_ce_lvl;
	var xp_level_suiv		= xp_cumul_level_suiv-xp_cumul_ce_lvl;
    var perc = Math.floor(xp_ce_level/xp_level_suiv*100);
	
    return {"level":lvl_cal, "xp_cumul_ce_lvl":xp_cumul_ce_lvl,"xp_cumul_level_suiv":xp_cumul_level_suiv,"xp_ce_level":xp_ce_level,"xp_level_suiv":xp_level_suiv,"perc":perc};
 }

function genere_nom_secteur(){
	var nom = new Array('Alpha','Bravo','Charlie','Delta','Echo','Foxtrot','Golf','Hotel','India','Juliett','Kilo','Lima','Mike','November','Oscar','Papa','Québec','Romeo','Sierra','Tango','Uniform','Victor','Whiskey','X-ray','Yanki','Zulu');
	var inc = Math.round(Math.random()*(nom.length-1));
	var date = new Date();
	
	return nom[inc]+date.getDate()+(date.getMonth()+1);
}

