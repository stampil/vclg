<?php
class Race{
	private $db;
	
	public function __construct(){
		$this->db = new MyPDO();
	}
	
	public function get_stats(){

		$ret= $this->db->query('SELECT r.nom,count(groupe) as nb, couleur
				FROM '.MyPDO::DB_FLAG.'user u
				JOIN '.MyPDO::DB_FLAG.'race r on u.id_race = r.id_race
				GROUP by r.id_race 
				ORDER BY groupe');
		return  $ret;
	}
	
	public function get_stats_by_secteur(){
	
	$ret= $this->db->query('SELECT COUNT( * ) AS nb, r.nom, r.couleur
	FROM  '.MyPDO::DB_FLAG.'secteur s
	JOIN '.MyPDO::DB_FLAG.'race r ON s.id_race_proprio = r.id_race
	GROUP BY groupe');
	return  $ret;
	
	}
}
?>