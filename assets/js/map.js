(function($, undefined){
	
	var Field = acf.Field.extend({
		
		type: 'nsi_google_map',
		
    map: false,
    marker: false,
		
		wait: 'load',
		
		events: {
			'click a[data-name="clear"]': 		'onClickClear',
			'click a[data-name="locate"]': 		'onClickLocate',
			'click a[data-name="search"]': 		'onClickSearch',
			'keydown .search': 					'onKeydownSearch',
			'keyup .search': 					'onKeyupSearch',
			'focus .search': 					'onFocusSearch',
			'blur .search': 					'onBlurSearch',
			'showField':						'onShow'
		},
		
		$control: function(){
			return this.$('.nsi-google-map');
		},
		
		$input: function( name ){
			return this.$('input[data-name="' + (name || 'address') + '"]');
		},
		
		$search: function(){
			return this.$('.search');
		},
		
		$canvas: function(){
			return this.$('.canvas');
		},
		
		addClass: function( name ){
			this.$control().addClass( name );
		},
		
		removeClass: function( name ){
			this.$control().removeClass( name );
		},
		
		getValue: function(){
			
			// defaults
			var val = {
				lat: '',
				lng: '',
				address: ''
			};
			
			// loop
			this.$('input[type="hidden"]').each(function(){
				val[ $(this).data('name') ] = $(this).val();
			});
			
			// return false if no lat/lng
			if( !val.lat || !val.lng ) {
				val = false;
			}
			
			// return
			return val;
		},
		
		setValue: function( val ){
			
			// defaults
			val = acf.parseArgs(val, {
				lat: '',
				lng: '',
				address: ''
			});
			
			// loop
			for( var name in val ) {
				acf.val( this.$input(name), val[name] );
			}
			
			// return false if no lat/lng
			if( !val.lat || !val.lng ) {
				val = false;
			}
			
			// render
			this.renderVal( val );
			
			// action
			var latLng = this.newLatLng( val.lat, val.lng );
			acf.doAction('google_map_change', latLng, this.map, this);
    },
    
    addMarker: function( LatLng ){
      if(!this.marker){
        var marker = L.marker( LatLng,{
          title: "Localisation de l'adresse",
          draggable: 'true'
        });
        this.marker = marker;
      }
      else{
        this.marker.setLatLng(LatLng)
      }
      this.marker.addTo(this.map);
    },
		
		renderVal: function( val ){
			
		    // has value
		    if( val ) {
			     this.addClass('-value');
			     this.setPosition( val.lat, val.lng );
			     this.addMarker( this.newLatLng( val.lat, val.lng ) );
			     
		    // no value
		    } else {
			     this.removeClass('-value');
			     this.marker.remove();
		    }
		    
		    // search
		    this.$search().val( val.address );
		},
		
		setPosition: function( lat, lng ){
			
			// vars
			this.addMarker( this.newLatLng( lat, lng ) );
			
			// center
			this.center();
			
			// return
			return this;
		},
		
		center: function(){
			
			// vars
			var position = this.marker.getLatLng();
			var lat = this.get('lat');
			var lng = this.get('lng');
			
			// if marker exists, center on the marker
			if( position ) {
				lat = position.lat
				lng = position.lng;
			}
			
			// latlng
			var latLng = this.newLatLng( lat, lng );
				
			// set center of map
	    this.map.panTo( latLng );
		},
		
		getSearchVal: function(){
			return this.$search().val();
		},
		
		initialize: function(){
			
			// Ensure Google API is loaded and then initialize map.
			withAPI( this.initializeMap.bind(this) );
		},
		
		newLatLng: function( lat, lng ){
			return [lat, lng];
		},
		
		initializeMap: function(){
			
			// vars
			var zoom = this.get('zoom');
			var lat = this.get('lat');
      var lng = this.get('lng');
      
      // Create map
      var map = L.map(this.$canvas()[0],{
        center: this.newLatLng(lat,lng),
        zoom: parseInt( zoom ),
        dragging: true,
        tap: true,
        scrollWheelZoom: false,

        //layers: [standardLayer, L.layerGroup([marker])]
      });
      // Layer Standard OSM
      L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);

      var autocomplete = false;
      /*this.autocomplete_timeout = null
      jQuery(this.$search()).keyup(function(){
        if(this.autocomplete_timeout){
          clearTimeout(this.autocomplete_timeout)
        }
        this.autocomplete_timeout = setTimeout(function(){
          this.searchAddress(jQuery(this.$search()).val())
        }.bind(this), 1000)
      }.bind(this))*/

      // Append references.
      map.acf = this;
      map.autocomplete = autocomplete;
      this.map = map;

      //Create marker
      this.addMarker( this.newLatLng( lat, lng ) );

      // Add map events.
      this.addMapEvents( this, map, this.marker, autocomplete );
      
      // action for 3rd party customization
      acf.doAction('nsi_google_map_init', map, this.marker, this);
      
      // set position
      var val = this.getValue();
      this.renderVal( val );
		},
		
		addMapEvents: function( field, map, marker, autocomplete ){
			
			// Click map.
	    map.on('click', function( e ) {
		        
				// vars
				var lat = e.latlng.lat;
				var lng = e.latlng.lng;
				
				 // search
				field.searchPosition( lat, lng );
			});
			
			// Drag marker.
		  marker.on('dragend', function(){
			    
		    // vars
				var position = marker.getLatLng()
				var lat = position.lat;
			  var lng = position.lng;
			    
			    // search
				field.searchPosition( lat, lng );
			});
			
			// Autocomplete search.
	    if( autocomplete ) {
		        
				// autocomplete event place_changed is triggered each time the input changes
				// customize the place object with the current "search value" to allow users controll over the address text
				/*google.maps.event.addListener(autocomplete, 'place_changed', function() {
					var place = this.getPlace();
					place.address = field.getSearchVal();
				    field.setPlace( place );
				});*/
	    }
		},
		
		searchPosition: function( lat, lng ){
			
			// vars
			var latLng = this.newLatLng( lat, lng );
			var $wrap = this.$control();
			
			// set position
			this.setPosition( lat, lng );
			
			// add class
		    $wrap.addClass('-loading');
		    
		    // callback
		    var callback = $.proxy(function( results, status ){
			    
			    // remove class
			    $wrap.removeClass('-loading');
			    
			    // vars
			    var address = '';
			    
			    // validate
				if( !results ) {
					console.log('Geocoder failed due to: ' + status);
				} else if( !results.features[0] ) {
					console.log('No results found');
				} else {
          console.log(results);
					address = results.features[0].properties.housenumber+' '+results.features[0].properties.street+', '+results.features[0].properties.postcode+' '+results.features[0].properties.city+', '+results.features[0].properties.country;
				}
				
				// update val
				this.val({
					lat: lat,
					lng: lng,
					address: address
				});
				
		    }, this);
		    
        // query
        this.val({
					lat: lat,
					lng: lng,
					address: this.$search().val()
				});
        /*jQuery.ajax({
          url: "https://photon.komoot.de/reverse/",
          method: 'GET',
          data:{
            lat: lat,
            lon: lng,
            limit: 1
          },
          success: callback
        })*/
		},
		
		/*setPlace: function( place ){
			
			// bail if no place
			if( !place ) return this;
			
			// search name if no geometry
			// - possible when hitting enter in search address
			if( place.name && !place.geometry ) {
				this.searchAddress(place.name);
				return this;
			}
			
			// vars
			var lat = place.geometry.location.lat();
			var lng = place.geometry.location.lng();
			var address = place.address || place.formatted_address;
			
			// update
			this.setValue({
				lat: lat,
				lng: lng,
				address: address
			});
			
		    // return
		    return this;
		},*/
		
		searchAddress: function( address ){
			
		    // is address latLng?
		    var latLng = address.split(',');
		    if( latLng.length == 2 ) {
			    
          // vars
          var lat = latLng[0];
          var lng = latLng[1];
            
          // check
			    if( $.isNumeric(lat) && $.isNumeric(lng) ) {
				    return this.searchPosition( lat, lng );
			    }
		    }
		    
		    // vars
		    var $wrap = this.$control();
		    
		    // add class
		    $wrap.addClass('-loading');
		    
		    // callback
		    var callback = this.proxy(function( results, status ){
			    
			    // remove class
			    $wrap.removeClass('-loading');
			    
			    // vars
			    var lat = '';
			    var lng = '';
			    
			    // validate
          if( !results ) {
            console.log('Geocoder failed due to: ' + status);
          } else if( !results.features[0] ) {
            console.log('No results found');
          } else {
            lat = results.features[0].geometry.coordinates[1];
            lng = results.features[0].geometry.coordinates[0];
            //address = results[0].formatted_address;
          }
				
          // update val
          this.val({
            lat: lat,
            lng: lng,
            address: address
          });
				
				  //acf.doAction('google_map_geocode_results', results, status, this.$el, this);
				
		    });
		    
		    // query
		    jQuery.ajax({
          url: "https://photon.komoot.de/api/",
          method: 'GET',
          data:{
            q: address,
            limit: 1
          },
          success: callback
        })
		},
		
		searchLocation: function(){
			
			// Try HTML5 geolocation
			if( !navigator.geolocation ) {
				return alert( acf.__('Sorry, this browser does not support geolocation') );
			}
			
			// vars
		    var $wrap = this.$control();
			
			// add class
		    $wrap.addClass('-loading');
		    
		    // callback
		    var onSuccess = $.proxy(function( results, status ){
			    
			    // remove class
			    $wrap.removeClass('-loading');
			    
			    // vars
				  var lat = results.coords.latitude;
			    var lng = results.coords.longitude;
			    
			    // search;
			    this.searchPosition( lat, lng );
				
		    }, this);
		    
		    var onFailure = function( error ){
			    $wrap.removeClass('-loading');
		    }
		    
		    // try query
			navigator.geolocation.getCurrentPosition( onSuccess, onFailure );
		},
		
		onClickClear: function( e, $el ){
			this.val( false );
		},
		
		onClickLocate: function( e, $el ){
			this.searchLocation();
		},
		
		onClickSearch: function( e, $el ){
			this.searchAddress( this.$search().val() );
		},
		
		onFocusSearch: function( e, $el ){
			this.removeClass('-value');
			this.onKeyupSearch.apply(this, arguments);
		},
		
		onBlurSearch: function( e, $el ){
			
			// timeout to allow onClickLocate event
			this.setTimeout(function(){
				this.removeClass('-search');
				if( $el.val() ) {
					this.addClass('-value');
				}
			}, 100);			
		},
		
		onKeyupSearch: function( e, $el ){
			if( $el.val() ) {
				this.addClass('-search');
			} else {
				this.removeClass('-search');
			}
		},
		
		onKeydownSearch: function( e, $el ){
			
			// prevent form from submitting
			if( e.which == 13 ) {
				e.preventDefault();
			}
		},
		
		onMousedown: function(){
			
/*
			// clear timeout in 1ms (onMousedown will run before onBlurSearch)
			this.setTimeout(function(){
				clearTimeout( this.get('timeout') );
			}, 1);
*/
		},
		
		onShow: function(){
			
			// bail early if no map
			// - possible if JS API was not loaded
			if( !this.map ) {
				return false;
			}
			
			// center map when it is shown (by a tab / collapsed row)
			// - use delay to avoid rendering issues with browsers (ensures div is visible)
			this.setTimeout( this.center, 10 );
		}
	});
	
	acf.registerFieldType( Field );
	
	// Vars.
	var loading = false;
	var geocoder = false;
	
	/**
	 * withAPI
	 *
	 * Loads the Google Maps API library and troggers callback.
	 *
	 * @date	28/3/19
	 * @since	5.7.14
	 *
	 * @param	function callback The callback to excecute.
	 * @return	void
	 */
	
	function withAPI( callback ) {
    
    return callback();

	}
	
})(jQuery);