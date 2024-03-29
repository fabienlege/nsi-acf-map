<?php

if ( !class_exists( 'nsi_field_google_map' ) ):

  class nsi_field_google_map extends acf_field {

    /*
     *  __construct
     *
     *  This function will setup the field type data
     *
     *  @type  function
     *  @date  5/03/2014
     *  @since  5.0.0
     *
     *  @param  n/a
     *  @return  n/a
     */

    function initialize() {

      // vars
      $this->name     = 'nsi_google_map';
      $this->label    = __( "Google Map by NSI", 'acf' );
      $this->category = 'jquery';
      $this->defaults = array(
        'height'     => '',
        'center_lat' => '',
        'center_lng' => '',
        'zoom'       => '',
      );
      $this->default_values = array(
        'height'     => '400',
        'center_lat' => '-37.81411',
        'center_lng' => '144.96328',
        'zoom'       => '14',
      );
    }

    /*
     *  input_admin_enqueue_scripts
     *
     *  description
     *
     *  @type  function
     *  @date  16/12/2015
     *  @since  5.3.2
     *
     *  @param  $post_id (int)
     *  @return  $post_id (int)
     */

    function input_admin_enqueue_scripts() {

      wp_enqueue_script( 'osm/maps', "https://unpkg.com/leaflet@1.3.4/dist/leaflet.js" );
      wp_enqueue_style( 'osm/maps', "https://unpkg.com/leaflet@1.3.4/dist/leaflet.css" );
      wp_enqueue_script( 'nsi/gmap', plugin_dir_url( __FILE__ ) . "../assets/js/map.js", ['acf-input'] );
      wp_enqueue_style( 'nsi/gmap', plugin_dir_url( __FILE__ ) . "../assets/css/map.css" );

    }

    /*
     *  render_field()
     *
     *  Create the HTML interface for your field
     *
     *  @param  $field - an array holding all the field's data
     *
     *  @type  action
     *  @since  3.6
     *  @date  23/01/13
     */

    function render_field( $field ) {

      // validate value
      if ( empty( $field['value'] ) ) {
        $field['value'] = array();
      }

      // value
      $field['value'] = wp_parse_args( $field['value'], array(
        'address' => '',
        'lat'     => '',
        'lng'     => '',
      ) );

      // default options
      foreach ( $this->default_values as $k => $v ) {

        if ( empty( $field[$k] ) ) {
          $field[$k] = $v;
        }

      }

      // vars
      $atts = array(
        'id'        => $field['id'],
        'class'     => "nsi-google-map {$field['class']}",
        'data-lat'  => $field['center_lat'],
        'data-lng'  => $field['center_lng'],
        'data-zoom' => $field['zoom'],
      );

      // has value
      if ( $field['value']['address'] ) {
        $atts['class'] .= ' -value';
      }

      ?>
		<div <?php acf_esc_attr_e( $atts );?>>

			<div class="acf-hidden">
				<?php foreach ( $field['value'] as $k => $v ):
        acf_hidden_input( array( 'name' => $field['name'] . '[' . $k . ']', 'value' => $v, 'data-name' => $k ) );
      endforeach;?>
			</div>

			<div class="title">

				<div class="acf-actions -hover">
					<a href="#" data-name="search" class="acf-icon -search grey" title="<?php _e( "Search", 'acf' );?>"></a><?php
  ?><a href="#" data-name="clear" class="acf-icon -cancel grey" title="<?php _e( "Clear location", 'acf' );?>"></a><?php
  ?><a href="#" data-name="locate" class="acf-icon -location grey" title="<?php _e( "Find current location", 'acf' );?>"></a>
				</div>

				<input class="search" type="text" placeholder="<?php _e( "Search for address...", 'acf' );?>" value="<?php echo esc_attr( $field['value']['address'] ); ?>" />
				<i class="acf-loading"></i>

			</div>

			<div class="canvas" style="<?php echo esc_attr( 'height: ' . $field['height'] . 'px' ); ?>"></div>

		</div>
		<?php

    }

    /*
     *  render_field_settings()
     *
     *  Create extra options for your field. This is rendered when editing a field.
     *  The value of $field['name'] can be used (like bellow) to save extra data to the $field
     *
     *  @type  action
     *  @since  3.6
     *  @date  23/01/13
     *
     *  @param  $field  - an array holding all the field's data
     */

    function render_field_settings( $field ) {

      // center_lat
      acf_render_field_setting( $field, array(
        'label'        => __( 'Center', 'acf' ),
        'instructions' => __( 'Center the initial map', 'acf' ),
        'type'         => 'text',
        'name'         => 'center_lat',
        'prepend'      => 'lat',
        'placeholder'  => $this->default_values['center_lat'],
      ) );

      // center_lng
      acf_render_field_setting( $field, array(
        'label'        => __( 'Center', 'acf' ),
        'instructions' => __( 'Center the initial map', 'acf' ),
        'type'         => 'text',
        'name'         => 'center_lng',
        'prepend'      => 'lng',
        'placeholder'  => $this->default_values['center_lng'],
        '_append'      => 'center_lat',
      ) );

      // zoom
      acf_render_field_setting( $field, array(
        'label'        => __( 'Zoom', 'acf' ),
        'instructions' => __( 'Set the initial zoom level', 'acf' ),
        'type'         => 'text',
        'name'         => 'zoom',
        'placeholder'  => $this->default_values['zoom'],
      ) );

      // allow_null
      acf_render_field_setting( $field, array(
        'label'        => __( 'Height', 'acf' ),
        'instructions' => __( 'Customize the map height', 'acf' ),
        'type'         => 'text',
        'name'         => 'height',
        'append'       => 'px',
        'placeholder'  => $this->default_values['height'],
      ) );

    }

    /*
     *  validate_value
     *
     *  description
     *
     *  @type  function
     *  @date  11/02/2014
     *  @since  5.0.0
     *
     *  @param  $post_id (int)
     *  @return  $post_id (int)
     */

    function validate_value( $valid, $value, $field, $input ) {

      // bail early if not required
      if ( !$field['required'] ) {

        return $valid;

      }

      if ( empty( $value ) || empty( $value['lat'] ) || empty( $value['lng'] ) ) {

        return false;

      }

      // return
      return $valid;

    }

    /*
     *  update_value()
     *
     *  This filter is appied to the $value before it is updated in the db
     *
     *  @type  filter
     *  @since  3.6
     *  @date  23/01/13
     *
     *  @param  $value - the value which will be saved in the database
     *  @param  $post_id - the $post_id of which the value will be saved
     *  @param  $field - the field array holding all the field options
     *
     *  @return  $value - the modified value
     */

    function update_value( $value, $post_id, $field ) {

      // Check if value is an empty array and convert to empty string.
      if ( empty( $value ) || empty( $value['lat'] ) ) {
        $value = "";
      }

      // return
      return $value;
    }
  }

// initialize
  acf_register_field_type( 'nsi_field_google_map' );

endif; // class_exists check

?>