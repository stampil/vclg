<?php
class User{
	private $db;
	
	public function __construct(){
		$this->db = new MyPDO();
	}
	
	public function update_last_co($id_user){
		$this->db->query('UPDATE '.MyPDO::DB_FLAG.'user set last_co=NOW() where uniqid=?',  $id_user);
		return true;
	}
	
	public function set_jeton($id_user,$nb_jeton){
		if($nb_jeton>=0 ){
			$this->db->query('UPDATE '.MyPDO::DB_FLAG.'user set jeton=? , last_jeton_receive=NOW() where uniqid=?', $nb_jeton, $id_user);	
		}
		return true;
	}
	
	public function add_jeton($id_user,$nb_jeton){

		if(is_numeric($nb_jeton) ){
			$this->db->query('UPDATE '.MyPDO::DB_FLAG.'user set jeton=jeton+?  where uniqid=?', $nb_jeton, $id_user);
		}
		return true;
	}
	
	public function cherche_objet($id_user,$NW_lat, $SE_lat, $NW_lng, $SE_lng){
		$query ='SELECT id_user 
				FROM '.MyPDO::DB_FLAG.'secteur_scan 
				WHERE id_user=? AND NW_lat=? AND SE_lat=? AND NW_lng=? AND SE_lng=? AND creato=?';
		$ret= $this->db->query($query, $id_user,number_format($NW_lat,3), number_format($SE_lat,3), number_format($NW_lng,3), number_format($SE_lng,3),date("Y-m-d"));
		if(!@$ret[0]->id_user){//secteur pas encore scanné
			$this->objet_cherche($id_user, $NW_lat, $SE_lat, $NW_lng, $SE_lng);
			return $this->generate_objet($id_user);

		}
		return false;
	}
		
	private function objet_cherche($id_user,$NW_lat, $SE_lat, $NW_lng, $SE_lng){
		$this->db->query('INSERT INTO '.MyPDO::DB_FLAG.'secteur_scan (id_user,NW_lat, SE_lat, NW_lng, SE_lng, creato)
				VALUES(?,?,?,?,?,now())', $id_user,$NW_lat, $SE_lat, $NW_lng, $SE_lng);
	}
	
	private function generate_objet($id_user){
		$return = array();
		$ret= $this->db->query('SELECT id_objet, nom, description, chance_tomber
				FROM '.MyPDO::DB_FLAG.'objet');
		foreach($ret as $o){
			if(rand(0, 100)<= $o->chance_tomber){
				array_push($return, $o->nom);
				$this->create_objet($id_user, $o->id_objet);
			}
		}
		return $return;
	}
	
	private function create_objet($id_user, $id_objet){
		$this->db->query('INSERT INTO '.MyPDO::DB_FLAG.'user_objet (uniqid,id_objet,id_user)
				VALUES(\''.uniqid().'\',?,?)',$id_objet, $id_user);
	}
	
	public function get_info($id_user){
		return $this->db->query('SELECT r.nom as race, r.groupe, r.id_race, r.description as race_desc, r.nb_jeton, r.couleur, u.id_user, u.user_agent, u.uniqid, u.nom, u.jeton, u.last_jeton_receive, u.disciple_de, u.mordu_le, u.xp
				FROM '.MyPDO::DB_FLAG.'user u
				JOIN '.MyPDO::DB_FLAG.'race r
				ON u.id_race = r.id_race
				WHERE u.uniqid=?', $id_user);
	}
	
	public function check_info($email){
		$ret= $this->db->query('SELECT uniqid FROM '.MyPDO::DB_FLAG.'user where email=?', $email);
		return  @$ret[0]->uniqid;
	}
	
	public function recupere_objet($id_user, $id_objet){
		$ret = $this->db->query('SELECT o.nom, uo.id_user
				 FROM '.MyPDO::DB_FLAG.'objet o
				 JOIN '.MyPDO::DB_FLAG.'user_objet uo ON o.id_objet = uo.id_objet
				 WHERE uo.uniqid=?', $id_objet);
		if(@$ret[0]->id_user == $id_user){
			return -1;
		}
		if(@$ret[0]->nom){
		$this->db->query('UPDATE '.MyPDO::DB_FLAG.'user_objet set id_user=? where uniqid=?',$id_user, $id_objet);
		return $ret[0]->nom;
		}
		return false;
		
	}
	
	public function set_info($nom,$mdp,$email,$id_race){
		if($this->check_info($email) ){
			return 0;
		}
		$uniqid = uniqid();
		$this->db->query('INSERT INTO '.MyPDO::DB_FLAG.'user (uniqid,user_agent, nom, mdp, email, id_race, first_co, last_co) VALUES("'.$uniqid.'","'.$_SERVER['HTTP_USER_AGENT'].'",?,?,?,?,now(),now())', $nom, $mdp, $email, $id_race);
		return $uniqid;
	}
	
	public function log_info($email, $mdp){
		$ret= $this->db->query('SELECT uniqid FROM '.MyPDO::DB_FLAG.'user where email=? and mdp=?', $email, $mdp);
		return  $ret;
	}
	
	public function get_disciple($id_user){

		$ret= $this->db->query('SELECT uniqid, nom, mordu_le, last_co, xp FROM '.MyPDO::DB_FLAG.'user where disciple_de=?', $id_user);
		return  $ret;
	}
	
	public function get_inventaire($id_user){
	
		$ret= $this->db->query('SELECT uo.uniqid, o.nom, o.description
				 FROM '.MyPDO::DB_FLAG.'user_objet uo
				 JOIN '.MyPDO::DB_FLAG.'objet o ON uo.id_objet = o.id_objet
				 WHERE uo.id_user=?', $id_user);
		return  $ret;
	}
	
	public function set_morsure($id_user,$morsure, $id_race, $date){
		$this->db->query('UPDATE '.MyPDO::DB_FLAG.'user set disciple_de=?, id_race=?, mordu_le=? where uniqid=?', $morsure, $id_race, $date, $id_user);
	}
	
	public function use_objet($id_user,$uniqid){
		$ret= $this->db->query('SELECT id_objet
				FROM '.MyPDO::DB_FLAG.'user_objet 
				WHERE id_user=? AND uniqid=?', $id_user, $uniqid);
		$id_objet = @$ret[0]->id_objet;
		if($id_objet){ //appartient bien a l'user
			$this->db->query('DELETE IGNORE FROM '.MyPDO::DB_FLAG.'user_objet
					WHERE uniqid=?', $uniqid);
		}
		
		return $id_objet;
	}
	
	public function add_xp($id_user,$xp=0){
		$this->db->query('UPDATE '.MyPDO::DB_FLAG.'user SET xp=xp+? WHERE uniqid=?',$xp,$id_user);
	}
	
	public function delete_xp($id_user,$xp=0){
		$ret = $this->db->query('SELECT xp
				FROM '.MyPDO::DB_FLAG.'user  WHERE uniqid=?',$id_user);
		$old_xp = $ret[0]->xp;
		if($xp>$old_xp){
			$xp = $old_xp; //on ne peut pas perdre + d'xp que l'on en as.
		}
		$this->db->query('UPDATE '.MyPDO::DB_FLAG.'user
				 SET xp=xp-?
				 WHERE uniqid=?',$xp,$id_user);
		return $xp;
	}	
	
}
?>