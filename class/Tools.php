<?php 
class Tools{

	public function  nbJours($debut, $fin) {
		//60 secondes X 60 minutes X 24 heures dans une journée
		$nbSecondes= 60*60*24;

		$debut_ts = strtotime($debut);
		$fin_ts = strtotime($fin);
		$diff = $fin_ts - $debut_ts;
		return round($diff / $nbSecondes);
	}

	public function datefr($date){

		$ret = preg_replace("/([0-9]{4})-([0-9]{1,2})-([0-9]{1,2}) ([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})/","\\3/\\2/\\1 \\4h\\5",$date);
		$ret = preg_replace("/([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})/","\\3/\\2/\\1",$date);

		return $ret;
	}

	public function troncate($str, $limit) {
		return strlen($str) > $limit ? substr($str, 0, $limit - 3) . '...' : $str;
	}
	
	public function calcul_lvl($xp){
	$xp_test	= $xp/50;
	$lvl_cal	=  floor(sqrt($xp_test*2));
	$xp_lvl		= ($lvl_cal*($lvl_cal+1))/2;

	if($xp_lvl>$xp_test){
		$lvl_cal	= $lvl_cal-1;
	}
	
	$xp_cumul_ce_lvl	= 50*($lvl_cal*($lvl_cal+1))/2;
	$xp_cumul_level_suiv	= 50*(($lvl_cal+1)*($lvl_cal+2))/2;
	$xp_ce_level			= $xp-$xp_cumul_ce_lvl;
	$xp_level_suiv		= $xp_cumul_level_suiv-$xp_cumul_ce_lvl;
   $perc = floor($xp_ce_level/$xp_level_suiv*100);
   
   $obj = new stdClass;
   $obj->level = $lvl_cal;
   $obj->xp_cumul_ce_lvl = $xp_cumul_ce_lvl;
   $obj->xp_cumul_level_suiv = $xp_cumul_level_suiv;
   $obj->xp_ce_level = $xp_ce_level;
   $obj->xp_level_suiv = $xp_level_suiv;
   $obj->perc = $perc;
    return $obj;
 }


}

?>