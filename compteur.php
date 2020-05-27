<?php
// récupération de l'heure courante
$date_courante = date("Y-m-d H:i:s");

// récupération de l'adresse IP du client (on cherche d'abord à savoir si il est derrière un proxy)
if(isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
  $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
}
elseif(isset($_SERVER['HTTP_CLIENT_IP'])) {
  $ip  = $_SERVER['HTTP_CLIENT_IP'];
}
else {
  $ip = $_SERVER['REMOTE_ADDR'];
}
// récupération du domaine du client
$host = gethostbyaddr($ip);

// récupération du navigateur et de l'OS du client
$navigateur = $_SERVER['HTTP_USER_AGENT'];

// récupération du REFERER
if (isset($_SERVER['HTTP_REFERER'])) {
  if (eregi($_SERVER['HTTP_HOST'], $_SERVER['HTTP_REFERER'])) {
  $referer ='';
  }
  else {
  $referer = $_SERVER['HTTP_REFERER'];
  }
}
else {
  $referer ='';
}

$ligne = array($date_courante,$ip,$host,$navigateur,$referer);
$chemin_csv = 'visites.csv';
$chemin_txt = 'visites.txt';
$delimiteur = ';'; // Pour une tabulation, utiliser $delimiteur = "t";


$fichier_csv = fopen($chemin_csv, 'a');
$fichier_txt = fopen($chemin_txt, 'a');
//fprintf($fichier_csv, chr(0xEF).chr(0xBB).chr(0xBF));

fputcsv($fichier_csv, $ligne, $delimiteur);
fputcsv($fichier_txt, $ligne, $delimiteur);
fclose($fichier_csv);
fclose($fichier_txt);

?>