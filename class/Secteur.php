<?php
class Secteur{
	private $db;
	
	public function __construct(){
		$this->db = new MyPDO();
	}
	
	public function get($id_user= 0){
		//TODO optim limité secteur par lat/long bound gmap
		if($id_user){
			$filtre =' s.id_proprio=\''.$id_user.'\''; //TODO SECUR
		}
		else{
			$filtre=1;
		}
		$ret= $this->db->query('SELECT s.id_secteur,s.NW_lat, s.SE_lat, s.NW_lng, s.SE_lng, s.nom, s.id_proprio, s.jeton, s.id_race_proprio, s.date_capture, r.nom as race,r.groupe, r.couleur
				FROM '.MyPDO::DB_FLAG.'secteur s
				JOIN '.MyPDO::DB_FLAG.'race r ON s.id_race_proprio = r.id_race
				WHERE '.$filtre);
		return  $ret;
	}
	
	public function random_get($id_user){
		$ret= $this->db->query('SELECT s.id_secteur,s.NW_lat, s.SE_lat, s.NW_lng, s.SE_lng, s.nom, s.id_proprio, s.jeton, s.id_race_proprio, s.date_capture, r.nom as race, r.groupe, r.couleur
				FROM '.MyPDO::DB_FLAG.'secteur s
				JOIN '.MyPDO::DB_FLAG.'race r ON s.id_race_proprio = r.id_race
				WHERE s.id_proprio != ?
				ORDER BY rand()
				LIMIT 1;
				',$id_user);
		return  $ret;
	}
	
	public function get_nb_by_race($id_race){
		$ret= $this->db->query('SELECT count(*) as nb
				FROM '.MyPDO::DB_FLAG.'secteur s
				WHERE s.id_race_proprio=?',$id_race);

		return  $ret[0]->nb;
	}
	
	public function get_info($NW_lat, $SE_lat, $NW_lng, $SE_lng){

		$ret= $this->db->query('SELECT s.id_secteur, s.nom, s.id_proprio, s.jeton, s.id_race_proprio, s.date_capture, r.nom as race, r.groupe, r.couleur, u.nom as proprio
				FROM '.MyPDO::DB_FLAG.'secteur s
				JOIN '.MyPDO::DB_FLAG.'race r ON s.id_race_proprio = r.id_race
				JOIN '.MyPDO::DB_FLAG.'user u ON s.id_proprio = u.uniqid
				WHERE s.NW_lat=? and s.SE_lat=? and s.NW_lng=? and s.SE_lng=?',$NW_lat, $SE_lat, $NW_lng, $SE_lng);
		return  $ret;
	}
	
	public function capture($id_user,$id_race,$jeton,$NW_lat, $SE_lat, $NW_lng, $SE_lng,$nom = ''){
		$this->db->query('INSERT INTO '.MyPDO::DB_FLAG.'secteur 
				( `NW_lat`, `SE_lat`, `NW_lng`, `SE_lng`, `nom`, `id_proprio`, `id_race_proprio`, `jeton`, `date_capture`) 
				VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, now() );',$NW_lat, $SE_lat, $NW_lng, $SE_lng,$nom, $id_user, $id_race, $jeton);
	}
	public function attaque($jeton,$NW_lat, $SE_lat, $NW_lng, $SE_lng){
		$this->db->query('UPDATE '.MyPDO::DB_FLAG.'secteur set jeton=?
				WHERE NW_lat=? and SE_lat=? and NW_lng=? and SE_lng=?',$jeton, $NW_lat, $SE_lat, $NW_lng, $SE_lng);
	}
	public function renfort($jeton,$NW_lat, $SE_lat, $NW_lng, $SE_lng){
		$this->db->query('UPDATE '.MyPDO::DB_FLAG.'secteur set jeton=jeton+? 
				WHERE NW_lat=? and SE_lat=? and NW_lng=? and SE_lng=?',$jeton, $NW_lat, $SE_lat, $NW_lng, $SE_lng);
	}
	public function change($id_user,$id_race,$jeton,$NW_lat, $SE_lat, $NW_lng, $SE_lng){
		$this->db->query('UPDATE '.MyPDO::DB_FLAG.'secteur set jeton=?, id_proprio=?, id_race_proprio=?, date_capture=now()
				WHERE NW_lat=? and SE_lat=? and NW_lng=? and SE_lng=?',$jeton,$id_user,$id_race, $NW_lat, $SE_lat, $NW_lng, $SE_lng);
	}
	
	public function renomme($id_user,$nom,$NW_lat, $SE_lat, $NW_lng, $SE_lng ){
		$this->db->query('UPDATE '.MyPDO::DB_FLAG.'secteur set nom=?
				WHERE id_proprio=? and NW_lat=? and SE_lat=? and NW_lng=? and SE_lng=?',$nom,$id_user,$NW_lat, $SE_lat, $NW_lng, $SE_lng);
	}
	
	public function perte_territoire(){
		$ret = $this->db->query('SELECT creato FROM '.MyPDO::DB_FLAG.'perte_secteur where creato=?',date('Y-m-d'));
		if(isset($ret[0]->creato)){
			$lastdate = $ret[0]->creato;
		}
		else{
			$lastdate =date('Y-m-d');
		}
		
		$tools = new Tools();
		$nb_jour = $tools->nbJours($lastdate, date('Y-m-d'));
		if($nb_jour>=Config::NB_JOUR_PERTE_TERRITOIRE || !isset($ret[0]->creato)){
		
			$this->db->query('UPDATE '.MyPDO::DB_FLAG.'secteur set jeton=jeton-?',Config::NB_JETON_PERTE_TERRITOIRE);
			$this->db->query('DELETE FROM '.MyPDO::DB_FLAG.'secteur WHERE jeton<=0');
			$this->db->query('OPTIMIZE TABLE '.MyPDO::DB_FLAG.'secteur');
			$this->db->query('INSERT INTO '.MyPDO::DB_FLAG.'perte_secteur (creato) VALUES(now())');
		}
	}
	
	public function logs($id_secteur,$log){
		if(!$id_secteur) return false;
		$filename = 'logs/secteurs/'.$id_secteur.'.html';
		$contenu = @file_get_contents($filename);
		$fp = fopen($filename,'w+');
		$log = '<strong>['.date("d/m/Y H\hi").']</strong> '.$log.'<br />'.$contenu;
		fwrite($fp, $log);
		return true;
	}
	
}?>