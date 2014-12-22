<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header('Content-type: text/javascript; charset=UTF-8');
ob_start("ob_gzhandler");
function auto_load($class) {
	require './class/' . $class . '.php';
}
spl_autoload_register('auto_load');

/*spl_autoload_register(function ($class) {
 require './class/' . $class . '.php';
		});*/ //php 5.3

$db = new MyPDO();
$secteur = new Secteur();
$user = new User();
$race = new Race();
$tools = new Tools();
$id_user = 0;
?>
<?php
if(isset($_GET["callback"])){
	$callback = $_GET["callback"];
}
else{
	$callback='API_SC';
}
?>
<?php echo $callback ?>({<?php
switch($_GET['action']){

	case 'cherche_objet':
		$id_user = $_GET["id_user"];
		$NW_lat =$_GET["NW_lat"];
		$SE_lat = $_GET["SE_lat"];
		$NW_lng = $_GET["NW_lng"];
		$SE_lng = $_GET["SE_lng"];


		$info_secteur = $secteur->get_info($NW_lat, $SE_lat, $NW_lng, $SE_lng);
		$info_user = $user->get_info($id_user);
		$calcul = $tools->calcul_lvl($info_user[0]->xp);
		$lvl = $calcul->level;
				

		//if(!@$info_secteur[0]->id_secteur){//neutre
			$cherche = $user->cherche_objet($id_user,$NW_lat, $SE_lat, $NW_lng, $SE_lng);
			$xp = 0;
			if($cherche===false){
				echo '"err":"Ce secteur a déjà été scanné aujourd’hui."';
			}
			elseif (!$cherche){ //tableau vide d'objet non trouvé
				echo '"err":"Vous n’avez rien trouvé sur ce secteur aujourd’hui."';
				$secteur->logs($info_secteur[0]->id_secteur, $info_user[0]->nom.' (<span style="color:'.$info_user[0]->couleur.'">'.$info_user[0]->race.' lvl '.$lvl.'</span>) a fouillé ce secteur.');				
			}
			else{
				$secteur->logs($info_secteur[0]->id_secteur, $info_user[0]->nom.' (<span style="color:'.$info_user[0]->couleur.'">'.$info_user[0]->race.' lvl '.$lvl.'</span>) a fouillé ce secteur.');
				
				$xp = Config::XP_CHERCHE_OBJET;
				$user->add_xp($id_user,$xp);
				$liste='Vous avez trouvez : <br />';
				for($i=0;$i<count($cherche);$i++){
					$liste.='1x '.str_replace('"','\"',$cherche[$i]).',';
				}
				$liste = substr($liste,0, -1);
				echo '"liste":"'.$liste.'","gain_xp":'.$xp;
			}
		//}
		/*else{
			echo '"err":"Le secteur n’est plus neutre, vous ne pouvez plus effectuer de recherche."';
		}*/
		break;

	case 'capture_secteur':
		$id_user = $_GET["id_user"];
		$jeton_use = $_GET["jeton"];
		
		$info_user = $user->get_info($id_user);
		$calcul = $tools->calcul_lvl($info_user[0]->xp);
		$lvl = $calcul->level;
		
		
		
		if($lvl<=1 && $jeton_use>1){
			$jeton_use = 1;
			echo '"err":"Seul une partie de vos renfort (1) à été utilisé pour cappé le secteur avec votre level ('.$lvl.')",';
		}
		
		if ( $jeton_use > $lvl && $lvl>0 ) {
				
			$jeton_use = $lvl;
			if($jeton_use){
				echo '"err":"Seul une partie de vos renfort ('.$jeton_use.') à été utilisé pour cappé le secteur avec votre level ('.$lvl.')",';
			}
		}
		
		if($jeton_use > Config::MAX_RENFORT_SECTEUR){		
			$jeton_use = Config::MAX_RENFORT_SECTEUR;
			echo '"err":"Seul une partie de vos renfort ('.$jeton_use.') à été utilisé pour cappé le secteur",';
		}
		
		
		$secteur->capture($id_user,$_GET["id_race"],$jeton_use,$_GET["NW_lat"], $_GET["SE_lat"], $_GET["NW_lng"], $_GET["SE_lng"],$_GET["nom_secteur"]);
		$user->add_jeton($id_user,-$jeton_use);
		
		$secteur->logs($info_secteur[0]->id_secteur, $info_user[0]->nom.' (<span style="color:'.$info_user[0]->couleur.'">'.$info_user[0]->race.' lvl '.$lvl.'</span>) a capturé ce secteur avec '.$jeton_use.' soldat'.($jeton_use>1?'s':'').'.');
		
		$xp = $jeton_use*Config::XP_CAPTURE_SECTEUR;
		$user->add_xp($id_user,$xp);
		echo '"gain_xp":'.$xp;
		break;

	case 'attaque_secteur':
		$id_user = $_GET["id_user"];
		$jeton_use = $_GET["jeton"];
		$NW_lat =$_GET["NW_lat"];
		$SE_lat = $_GET["SE_lat"];
		$NW_lng = $_GET["NW_lng"];
		$SE_lng = $_GET["SE_lng"];
		$id_race = $_GET["id_race"];
		$info_user = $user->get_info($id_user);
		$calcul = $tools->calcul_lvl($info_user[0]->xp);
		$lvl = $calcul->level;

		$info_secteur = $secteur->get_info($NW_lat, $SE_lat, $NW_lng, $SE_lng);
		
		
		$nb_de_attaque = $jeton_use;
		$nb_de_defense = $info_secteur[0]->jeton;

		$i=0;

		echo '"nb_de_attaque_depart":'.$nb_de_attaque.',"nb_de_defense_depart":'.$nb_de_defense.',';
		while($nb_de_attaque >0 && $nb_de_defense>0 ){
				
			$nb_de_attaque_use = min($nb_de_attaque,Config::NB_MAX_DE_ATTAQUE);
			$nb_de_defense_use = min($nb_de_defense,Config::NB_MAX_DE_DEFENSE);
				
			$jet_defense=$jet_attaque= array();
			$jets_defense=$jets_attaque= "";
				
			for($j = 0; $j<$nb_de_attaque_use; $j++){
				$jet= rand(1,Config::VAL_DE_ATTAQUE);
				array_push($jet_attaque,$jet);
				$jets_attaque.=$jet.',';
			}
			sort($jet_attaque);
				
			$jet_attaque = array_reverse($jet_attaque);
				
			for($j = 0; $j<$nb_de_defense_use; $j++){
				$jet= rand(1,Config::VAL_DE_DEFENSE);
				array_push($jet_defense,$jet);
				$jets_defense.=$jet.',';
			}
			sort($jet_defense);
			$jet_defense = array_reverse($jet_defense);
				
			$perte_attaque= $perte_defense = 0;
				
			while(count($jet_attaque)>0 && count($jet_defense)>0){

				$jet_max_attaque = array_shift($jet_attaque);
				$jet_max_defense = array_shift($jet_defense);
				if($jet_max_attaque>$jet_max_defense){
					$perte_defense++;
				}
				else{
					$perte_attaque++;
				}

			}
				
			$jets_attaque = substr($jets_attaque, 0, -1);
			$jets_defense = substr($jets_defense, 0, -1);
				
			echo '"'.$i++.'":{
			"jeton_attaque":'.$nb_de_attaque.',
			"jeton_defense":'.$nb_de_defense.',
			"de_attaque":"'.$jets_attaque.'",
			"de_defense":"'.$jets_defense.'",
			"perte_attaque":'.$perte_attaque.',
			"perte_defense":'.$perte_defense.'
		},';
				
			$nb_de_attaque-=$perte_attaque;
			$nb_de_defense-=$perte_defense;
				

		}
		echo '"nb_combat":'.$i.', "nb_de_attaque_fin":'.$nb_de_attaque.', "nb_de_defense_fin":'.$nb_de_defense.',';
		
		$calcul = $tools->calcul_lvl($info_user[0]->xp);
		$lvl = $calcul->level;
		
		if($nb_de_attaque>0){
			$secteur->change($id_user,$id_race, $nb_de_attaque, $NW_lat, $SE_lat, $NW_lng, $SE_lng);
			$secteur->logs($info_secteur[0]->id_secteur, $info_user[0]->nom.' (<span style="color:'.$info_user[0]->couleur.'">'.$info_user[0]->race.' lvl '.$lvl.'</span>) a capturé ce secteur avec '.$jeton_use.' soldat'.($jeton_use>1?'s':'').'.');
				
		}else{
			$secteur->attaque($nb_de_defense,$NW_lat,$SE_lat , $NW_lng, $SE_lng);
			$secteur->logs($info_secteur[0]->id_secteur, $info_user[0]->nom.' (<span style="color:'.$info_user[0]->couleur.'">'.$info_user[0]->race.' lvl '.$lvl.'</span>) a attaqué ce secteur avec '.$jeton_use.' soldat'.($jeton_use>1?'s':'').'.');
				
		}
		$user->add_jeton($id_user, -$jeton_use); //TODO VERIF PERTE JETON QD ATTAQUE
		$xp =$jeton_use*Config::XP_ATTAQUE_SECTEUR;
		$user->add_xp($id_user,$xp);
		echo '"race_defense":'.$info_secteur[0]->id_race_proprio.',"gain_xp":'.$xp;
		break;
		
	case 'stats_secteur':
		$ret = $race->get_stats_by_secteur();
		$nb_result = count($ret);
		for($i=0;$i<$nb_result;$i++){
			echo '"'.$i.'" : {
			"couleur":"'.$ret[$i]->couleur.'",
			"nom":"'.ucfirst($ret[$i]->nom).'",
			"nb":"'.$ret[$i]->nb.'"
		},';
		}
		echo '"nb_result":'.$nb_result;
		break;
		
	case 'stats_race':
		$ret = $race->get_stats();
		$nb_result = count($ret);
		for($i=0;$i<$nb_result;$i++){
			echo '"'.$i.'" : {
				"couleur":"'.$ret[$i]->couleur.'",
				"nom":"'.ucfirst($ret[$i]->nom).'",
				"nb":"'.$ret[$i]->nb.'"
			},';
		}
		echo '"nb_result":'.$nb_result;
		break;

	case 'renfort_secteur':
		$NW_lat = $_GET["NW_lat"];
		$SE_lat = $_GET["SE_lat"];
		$NW_lng= $_GET["NW_lng"];
		$SE_lng = $_GET["SE_lng"];
		$id_user = $_GET["id_user"];
		$id_race = $_GET["id_race"];
		$jeton_use = $_GET["jeton"];
		
		$max_secteur = 'false';
		$info_secteur = $secteur->get_info($NW_lat, $SE_lat, $NW_lng, $SE_lng);
		$ancien_jeton_sect = $info_secteur[0]->jeton;
		$nv_jeton_sect = $ancien_jeton_sect + $jeton_use;
		
		$info_user = $user->get_info($id_user);
		$calcul = $tools->calcul_lvl($info_user[0]->xp);
		$lvl = $calcul->level;

				
		if($ancien_jeton_sect>$lvl && $lvl>0){
			echo '"err":"Votre level ne permet que de cappé un secteur jusqu’à '.$lvl.' renfort."';
			break;
		}
		
		if($lvl<=1 && $nv_jeton_sect>1){
			echo '"err":"au level 0 et au level 1, vous ne pouvez pas mettre plus de 1 renfort par secteur, le nombre max de renfort possible d’un secteur correspond à votre level"';
			break;
		}
		if ( $nv_jeton_sect > $lvl && $lvl>0 ) {
			
			$nv_jeton_sect = $lvl;
			$jeton_use = $nv_jeton_sect - $ancien_jeton_sect;
			if($jeton_use){
				echo '"err":"Seul une partie de vos renfort ('.$jeton_use.') à été utilisé pour cappé le secteur avec votre level ('.$lvl.')",';
			}
			else{
				echo '"err":"le seuil de renfort de se secteur correspond à votre level, gagner des levels pour mieux renforcer les secteurs."';
				break;
			}
		}
		
		
		
		if(Config::MAX_RENFORT_SECTEUR - $nv_jeton_sect<0){ // si les jeton qu'on met dépase le max possible, on prend que les jeton pour aller au max.
			$jeton_use = Config::MAX_RENFORT_SECTEUR -  $info_secteur[0]->jeton;
			$max_secteur = 'true';
		}
		if($jeton_use >0){
			/*$info_user = $user->get_info($id_user);
			$nv_jeton = $info_user[0]->jeton - $jeton_use ;*/
			$secteur->renfort($jeton_use,$NW_lat,$SE_lat , $NW_lng,$SE_lng );
			$user->add_jeton($id_user, -$jeton_use);
		}
		$secteur->logs($info_secteur[0]->id_secteur, $info_user[0]->nom.' (<span style="color:'.$info_user[0]->couleur.'">'.$info_user[0]->race.' lvl '.$lvl.'</span>) a renforcé ce secteur avec '.$jeton_use.' soldat'.($jeton_use>1?'s':'').'.');
		
		$xp = $jeton_use*Config::XP_RENFORT_SECTEUR;
		$user->add_xp($id_user,$xp);
		echo '"max_secteur":'.$max_secteur.',"gain_xp":'.$xp;
		break;

	case 'log_info_users':
		$email = $_GET['email'];
		if($email!='undefined' ){
			$ret = $user->log_info($email, $_GET['mdp']);
			if(isset($ret[0]->uniqid) && $ret[0]->uniqid ) {
				echo '"user": {"id": "'.$ret[0]->uniqid.'"}';
			}
			else{
				echo '"err":"email ou mdp non reconnu"';
			}
		}
		break;

	case 'get_info_users':
		$id_race = $groupe_race= 0;
		$nom_race = "visiteur non identifié";
		$jeton = $jeton_max = $xp =0;
		$race_desc = $user_agent= "";
		$race_color ="#fff";
		$id_user = @$_GET['id_user'];

		if($id_user!='undefined' && $id_user){
			$ret = $user->get_info($id_user);
			$user->update_last_co($id_user);
			$nom = str_replace('"','\"',$ret[0]->nom);
			$id_race = $ret[0]->id_race;
			$groupe_race = $ret[0]->groupe;
			$nom_race = $ret[0]->race;
			$user_agent = $ret[0]->user_agent;
			$jeton = $ret[0]->jeton;
			$jeton_max = $ret[0]->nb_jeton;
			$last_jeton_receive = $ret[0]->last_jeton_receive;
			$race_color = $ret[0]->couleur;
			$xp=$ret[0]->xp;
			if($last_jeton_receive != date('Y-m-d')){
				$user->set_jeton($id_user,$jeton_max);
				$jeton = $jeton_max;
			}
			$race_desc = str_replace('"','\"',$ret[0]->race_desc);
		}
		else{
			$id_user=0;
			$nom = "visiteur";
		}
		echo '"user":{"id":"'.$id_user.'","nom":"'.$nom.'","jeton":'.$jeton.',"xp":'.$xp.',"user_agent":"'.$user_agent.'"},"race":{"id":"'.$id_race.'","groupe":"'.$groupe_race.'","nom":"'.$nom_race.'","desc":"'.$race_desc.'","couleur":"'.$race_color.'","jeton":'.$jeton_max.'}';
		break;

	case 'perte_territoire':
		$secteur->perte_territoire();
		break;

	case 'get_inventaire':
		$id_user = $_GET['id_user'];
		$nb_objet = 0;
		if($id_user){
			$ret = $user->get_inventaire($id_user);
			$nb_objet = count($ret);
			for ($i=0; $i<$nb_objet; $i++){
				echo '"'.$i.'":{"nom":"'.str_replace('"','\"',$ret[$i]->nom).'","uniqid":"'.$ret[$i]->uniqid.'","description":"'.str_replace("\r\n",'<br />',$ret[$i]->description).'"},';
			}
		}
		echo '"nb_objet": '.$nb_objet;
		break;
			
	case 'set_objet':
		$id_user = $_GET['id_user'];
		$id_objet = $_GET['id_objet'];
		$objet = $user->recupere_objet($id_user, $id_objet);
		if($objet==-1){
			echo '"err":"Il n’y a aucun interet à vous donner votre propre objet.<br /> Il faut scanner des qrcode objet appartenant à vos amis, pas les votres !"';
			break;
		}
		if($objet){
			echo '"nom":"'.str_replace('"','\"',$objet).'"';
		}
		break;
			
	case 'use_objet':
		$id_user = $_GET['id_user'];
		$id_race =  $_GET['id_race'];
		$id_objet = $_GET['id_objet'];
		if($id_user){
			$objet = $user->use_objet($id_user,$id_objet);
			if(!$objet){
				echo '"err":"Cet objet ne vous appartient plus"';
				break;
			}
			$user->add_xp($id_user,Config::XP_USE_OBJET);
			switch ($objet){
				case Config::OBJET_ANTIDOTE :
					echo '"eval":"show_popin(\'Vous buvez un antidote.<br />Gain XP :'.Config::XP_USE_OBJET.'\');$.cookie(\'morsure\',\'\');$.cookie(\'date_morsure\',\'\');"';
					break;
				case Config::OBJET_RECRUE :
					$user->add_jeton($id_user, 1);
					echo '"eval":"show_popin(\'Cette recrue a rejoint les rangs.<br />Gain XP :'.Config::XP_USE_OBJET.'\');"';
					break;
				case Config::OBJET_GRIMOIRE : 
					$user->add_xp($id_user,Config::XP_GRIMOIRE);
					echo '"eval":"show_popin(\'Ce grimoire c’est révélé très interessant...<br />Gain XP :'.(Config::XP_GRIMOIRE + Config::XP_USE_OBJET).'\');"';
					break;
				case Config::OBJET_ECLAIREUR_HUMAIN   :
					if($id_race==Config::RACE_HUMAIN){

						$info_secteur = $secteur->random_get($id_user);
						if(!$info_secteur){
							echo '"eval":"show_popin(\'Votre eclaireur ne donne plus signe de vie...\');"';
							break;
						}
						else{
							$info_proprio = $user->get_info($info_secteur[0]->id_proprio);
							$user->add_jeton($id_user, 1); //1 eclaireur vaut 1 action, permet de tjrs interagir avec le serveur de l'eclaireur
							
							echo '"eval":"$(\'.info_eclaireur\').html(\'\');$(\'.info_eclaireur\').append(\'<div class=\"mes_secteurs gradient\" id_secteur=\"'.$info_secteur[0]->id_secteur.'\" NW_lat=\"'.$info_secteur[0]->NW_lat.'\" NW_lng=\"'.$info_secteur[0]->NW_lng.'\" SE_lat=\"'.$info_secteur[0]->SE_lat.'\" SE_lng=\"'.$info_secteur[0]->SE_lng.'\" def=\"'.$info_secteur[0]->jeton.'\" nom=\"'.str_replace(array("'",'"'),array("’",''),$info_secteur[0]->nom).'\" id_proprio=\"'.$info_secteur[0]->id_proprio.'\" nom_proprio=\"'.str_replace(array("'",'"'),array("’",''),$info_proprio[0]->nom).'\" xp_proprio=\"'.$info_proprio[0]->xp.'\" race=\"'.$info_proprio[0]->race.'\" race_couleur=\"'.$info_proprio[0]->couleur.'\" race_id=\"'.$info_proprio[0]->id_race.'\" race_groupe=\"'.$info_proprio[0]->groupe.'\">Secteur '.str_replace("'","’",$info_secteur[0]->nom).': '.$info_secteur[0]->jeton.' renfort'.($info_secteur[0]->jeton>1?'s':'').' <img src=\"img/oeil.png\" class=\"img_oeil\" /></div>\');$(\'.page\').hide();$(\'.info_eclaireur\').show();"';
						}
					}
					else{
						$user->add_xp($id_user,Config::XP_ECLAIREUR_HUMAIN);
						echo '"eval":"show_popin(\'Cet humain était délicieux...<br />Gain XP :'.(Config::XP_ECLAIREUR_HUMAIN + Config::XP_USE_OBJET).'\');"';
					}
					break;
			}
		}
		break;
		
		case 'drop_objet':
			$id_user = $_GET['id_user'];
			$id_race =  $_GET['id_race'];
			$id_objet = $_GET['id_objet'];
			if($id_user){
				$objet = $user->use_objet($id_user,$id_objet);
				if(!$objet){
					echo '"err":"Cet objet ne vous appartient plus"';
					break;
				}
				echo '"eval":"show_popin(\'Vous avez abandonné cet objet...\');"';
			}
			break;
			
	case 'get_disciple':
		$id_user = $_GET['id_user'];
		$nb_disciple = 0;
		if($id_user){
			$ret = $user->get_disciple($id_user);
			$nb_disciple = count($ret);
			for ($i=0; $i<$nb_disciple; $i++){
				echo '"'.$i.'":{"id":"'.$ret[$i]->uniqid.'","nom":"'.str_replace('"','\"',$ret[$i]->nom).'","xp":'.$ret[$i]->xp.',"mordu":"'.$tools->datefr($ret[$i]->mordu_le).'","activite":"'.$tools->datefr($ret[$i]->last_co).'"},';
			}
		}
		echo '"nb_disciple": '.$nb_disciple;
		break;

	case 'get_secteur':
		$id_user = @$_GET['id_user'];

		$id_race =  @$_GET['id_race'];
		$nb_secteur_race = $secteur->get_nb_by_race($id_race);
		if($id_user) $info_user = $user->get_info($id_user);
		

		$ret = $secteur->get($id_user);

		for ($i=0; $i<count($ret); $i++){
			echo '"'.$i.'":{"nom":"'.str_replace('"','\"',$ret[$i]->nom).'","NW_lat":'.$ret[$i]->NW_lat.',"NW_lng":'.$ret[$i]->NW_lng.',"SE_lat":'.$ret[$i]->SE_lat.',"SE_lng":'.$ret[$i]->SE_lng.',"jeton":'.$ret[$i]->jeton.',"user":{"id":"'.$id_user.'","nom":"'.str_replace('"','\"',@$info_user[0]->nom).'","xp":"'.@$info_user[0]->xp.'"},"race":{"id":'.$ret[$i]->id_race_proprio.',"nom":"'.str_replace('"','\"',$ret[$i]->race).'","couleur":"'.$ret[$i]->couleur.'","groupe":"'.$ret[$i]->groupe.'"},"id_secteur":'.$ret[$i]->id_secteur.'},';
		}
		echo '"nb_secteur":'.count($ret).',"nb_race_secteur":'.$nb_secteur_race;
		break;

	case 'set_nom_secteur':
		$NW_lat = $_GET["NW_lat"];
		$SE_lat = $_GET["SE_lat"];
		$NW_lng= $_GET["NW_lng"];
		$SE_lng = $_GET["SE_lng"];
		$id_user = $_GET["id_user"];
		$nom = str_replace(array("'",'"'),array("’",''),$_GET["nom"]);
		$info_secteur = $secteur->get_info($NW_lat, $SE_lat, $NW_lng, $SE_lng);
		$info_user = $user->get_info($id_user);
		$calcul = $tools->calcul_lvl($info_user[0]->xp);
		$lvl = $calcul->level;
		$secteur->logs($info_secteur[0]->id_secteur, $info_user[0]->nom.' (<span style="color:'.$info_user[0]->couleur.'">'.$info_user[0]->race.' lvl '.$lvl.'</span>) a renommé ce secteur : '.$info_secteur[0]->nom.'-&gt;'.$nom.'.');
		
		$secteur->renomme($id_user, $nom, $NW_lat, $SE_lat, $NW_lng, $SE_lng);
		break;

	case 'get_info_secteur': // s.id_secteur, s.nom, s.id_proprio, s.jeton, s.id_race_proprio, s.date_capture, r.nom as race
		$ret = $secteur->get_info($_GET["NW_lat"], $_GET["SE_lat"], $_GET["NW_lng"], $_GET["SE_lng"]);
		if(@$ret[0]->id_secteur){
			echo '"secteur":{"id":'.$ret[0]->id_secteur.',"nom":"'.str_replace('"','\"',$ret[0]->nom).'","jeton":"'.$ret[0]->jeton.'","date_capture":"'.$tools->datefr($ret[0]->date_capture).'"},"race":{"id":'.$ret[0]->id_race_proprio.',"nom":"'.$ret[0]->race.'","couleur":"'.$ret[0]->couleur.'","groupe":"'.$ret[0]->groupe.'"},"proprio":{"id":"'.$ret[0]->id_proprio.'","nom":"'.str_replace('"','\"',$ret[0]->proprio).'"},"capturable":false';
		}
		else{
			echo '"capturable":true';
		}
		break;

	case 'set_info_users':
		$nom = $_GET['nom'];
		$mdp = $_GET['mdp'];
		$email = $_GET['email'];
		$race = isset($_GET["race"])?$_GET["race"]:Config::RACE_HUMAIN;

		$useragent=$_SERVER['HTTP_USER_AGENT'];
		$is_mobile = false;
		if(preg_match('/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i',$useragent)||preg_match('/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i',substr($useragent,0,4))){
			$is_mobile = true;
		}


		if(!$nom || !$mdp || !$email){
			echo '"err":"Vous devez remplir les champs de saisie."';
		}
		else if(!$is_mobile){
			echo '"err":"Vous devez vous enregistrer à partir de votre smartphone."';
		}
		else{
			$id_user = $user->set_info($nom,$mdp,$email, $race);
			if($id_user){
				echo '"nom":"'.str_replace('"','\"',$nom).'", "id_user" : "'.$id_user.'","user_agent":"'.$_SERVER["HTTP_USER_AGENT"].'"';
			}
			else{
				echo '"err":"Votre email '.str_replace('"','\"',$email).' est déjà inscrit en base."';
			}
		}
		break;

	case 'set_morsure':
		$id_user = $_GET['id_user'];
		$id_master = $_GET['morsure'];
		$force = $_GET['force'];
		$info_user = $user->get_info($id_user);
		$info_master = $user->get_info($id_master);
		$race_master = @$info_master[0]->id_race;
		$info_master_race = @$info_master[0]->race;
		$xp = 0;
		if(isset($info_master[0]->xp)) $xp = $info_master[0]->xp;
		$date_morsure = $_GET['date'];
		if(!$race_master){
			echo '"morsure":false,"raison":"pas de race master"';
			break;
		}
		$morsure = false;
		$hybride= 'false';

		switch ($info_user[0]->id_race){
			case Config::RACE_HUMAIN: // cas mordu = humain
				if($info_user[0]->user_agent == $info_master[0]->user_agent){ //si les user_agent sont identique, la morsure generera un hybride
					if( $race_master== Config::RACE_LOUP_GAROU  || $race_master == Config::RACE_LYCAN_ALPHA ){
						$race_master = Config::RACE_HYBRIDE_LG;
						$hybride = 'true';
					}
					else if($race_master== Config::RACE_VAMPIRE  ||  $race_master == Config::RACE_MAITRE_VAMPIRE){
						$race_master = Config::RACE_HYBRIDE_VAMP;
						$hybride = 'true';
					}
				}
				else{
					if( $race_master== Config::RACE_LOUP_GAROU  || $race_master == Config::RACE_LYCAN_ALPHA ){
						$race_master = Config::RACE_LOUP_GAROU;
					}
					else if($race_master== Config::RACE_VAMPIRE  ||  $race_master == Config::RACE_MAITRE_VAMPIRE){
						$race_master = Config::RACE_VAMPIRE;
					}
				}
				$morsure = true;
				break;
			case Config::RACE_HYBRIDE_LG: 
				if( $info_user[0]->user_agent != $info_master[0]->user_agent && ($race_master==Config::RACE_LOUP_GAROU || $race_master ==  Config::RACE_LYCAN_ALPHA) ){
					$morsure = true;
					$race_master = Config::RACE_LOUP_GAROU;
				}
				break;
			case Config::RACE_HYBRIDE_VAMP: 
				if($info_user[0]->user_agent != $info_master[0]->user_agent && ($race_master==Config::RACE_VAMPIRE ||  $race_master == Config::RACE_MAITRE_VAMPIRE) ){
					$morsure = true;
					$race_master = Config::RACE_VAMPIRE;
				}
				break;
		}

		if(isset($info_master[0]->uniqid) && $morsure){
			$nb_jour_mordu = $tools->nbJours($date_morsure, date("Y-m-d"));
			if($nb_jour_mordu >=Config::NB_JOUR_TRANSFORMATION || $force){
				echo '"transformation":true,';
				if($hybride == 'true'){
					$id_user = 0; // regle hybride ne sont pas des disciple
				}
				$user->set_morsure($id_user,$id_master,$race_master, $date_morsure);
				$reel_perte  = $user->delete_xp($id_user, Config::XP_PERTE_MORSURE_ENNEMI);
				echo '"perte_xp":'.$reel_perte.',';
			}
			else{
				$jour_restant = Config::NB_JOUR_TRANSFORMATION-$nb_jour_mordu;
				echo '"transformation":false, "reste_jour":'.$jour_restant.',';
			}
			echo '"morsure":true, "hybride":'.$hybride.', "master":{"nom":"'.str_replace('"','\"',$info_master[0]->nom).'","xp":'.$xp.',"race":"'.$info_master_race.'","couleur":"'.@$info_master[0]->couleur.'"}';

		}
		else{
			echo '"morsure":false,"raison":"race incompatible","master":{"nom":"'.str_replace('"','\"',$info_master[0]->nom).'","race":"'.$info_master_race.'","couleur":"'.$info_master[0]->couleur.'"},';
				if($race_master != $info_user[0]->id_race ){
				$reel_perte  = $user->delete_xp($id_user, Config::XP_PERTE_MORSURE_ENNEMI);
				echo '"perte_xp":'.$reel_perte;
			}
		}

		break;

	default:
		echo '"err":"action non reconnue"';
		break;
}
?>
})

<?php 
ob_end_flush();
?>