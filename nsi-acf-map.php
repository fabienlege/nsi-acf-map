<?php
/***
 *                                    _           _____ 
 *                                   | |         |  ___|
 *   __ _  __ _  ___ _ __   ___ ___  | |__   ___ |___ \ 
 *  / _` |/ _` |/ _ \ '_ \ / __/ _ \ | '_ \ / _ \    \ \
 * | (_| | (_| |  __/ | | | (_|  __/ | | | | (_) /\__/ /
 *  \__,_|\__, |\___|_| |_|\___\___| |_| |_|\___/\____/ 
 *         __/ |                                        
 *        |___/                                         
 *
 */
/*
Plugin Name: NSI Map plugin for ACF
Plugin URI: https://agenceho5.com
Description: Ajoute une hellobar en haut du site internet
Version: 1.0
Author: Fabien LEGE | NSI - Agence ho5
Author URI: https://agenceho5.com
*/

// exit if accessed directly
if( ! defined( 'ABSPATH' ) ) exit;


// check if class already exists
if( !class_exists('acf_plugin_nsi_google_map') ) :

class acf_plugin_nsi_google_map {
	
	// vars
	var $settings;
	
	
	/*
	*  __construct
	*
	*  This function will setup the class functionality
	*
	*  @type	function
	*  @date	17/02/2016
	*  @since	1.0.0
	*
	*  @param	void
	*  @return	void
	*/
	
	function __construct() {
		
		// settings
		// - these will be passed into the field class.
		$this->settings = array(
			'version'	=> '1.0.0',
			'url'		=> plugin_dir_url( __FILE__ ),
			'path'		=> plugin_dir_path( __FILE__ )
		);
		
		
		// include field
		add_action('acf/include_field_types', 	array($this, 'include_field')); // v5
		add_action('acf/register_fields', 		array($this, 'include_field')); // v4
	}
	
	
	/*
	*  include_field
	*
	*  This function will include the field type class
	*
	*  @type	function
	*  @date	17/02/2016
	*  @since	1.0.0
	*
	*  @param	$version (int) major ACF version. Defaults to false
	*  @return	void
	*/
	
	function include_field( $version = false ) {
		
		// support empty $version
		if( !$version ) $version = 4;
				
		// include
		include_once('fields/acf-google-map.php');
	}
	
}


// initialize
new acf_plugin_nsi_google_map();


// class_exists check
endif;
	
?>