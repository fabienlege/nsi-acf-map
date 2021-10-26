(function ($, undefined) {

	var Field = acf.Field.extend({

		type: 'nsi_google_map',

		map: false,
		marker: false,

		wait: 'load',

		events: {
			'click a[data-name="clear"]': 'onClickClear',
			'click a[data-name="locate"]': 'onClickLocate',
			'keydown .search': 'onKeydownSearch',
			'keyup .search': 'onKeyupSearch',
			'focus .search': 'onFocusSearch',
			'blur .search': 'onBlurSearch',
			'showField': 'onShow'
		},

		$control: function () {
			return this.$('.nsi-google-map');
		},

		$input: function (name) {
			return this.$('input[data-name="' + (name || 'address') + '"]');
		},

		$search: function () {
			return this.$('.search');
		},

		$searchButton: function () {
			return this.$(`a[data-name="search"]`);
		},

		$canvas: function () {
			return this.$('.canvas');
		},

		addClass: function (name) {
			this.$control().addClass(name);
		},

		removeClass: function (name) {
			this.$control().removeClass(name);
		},

		getValue: function () {

			// defaults
			var val = {
				lat: '',
				lng: '',
				address: ''
			};

			// loop
			this.$('input[type="hidden"]').each(function () {
				val[$(this).data('name')] = $(this).val();
			});

			// return false if no lat/lng
			if (!val.lat || !val.lng) {
				val = false;
			}

			// return
			return val;
		},

		setValue: function (val) {

			// defaults
			val = acf.parseArgs(val, {
				lat: '',
				lng: '',
				address: ''
			});

			// loop
			for (var name in val) {
				acf.val(this.$input(name), val[name]);
			}

			// return false if no lat/lng
			if (!val.lat || !val.lng) {
				val = false;
			}

			// render
			this.renderVal(val);

			// action
			var latLng = this.newLatLng(val.lat, val.lng);
			acf.doAction('google_map_change', latLng, this.map, this);
		},

		addMarker: function (LatLng) {
			if (!this.marker) {
				var marker = L.marker(LatLng, {
					title: "Localisation de l'adresse",
					draggable: 'true'
				});
				this.marker = marker;
			}
			else {
				this.marker.setLatLng(LatLng)
			}
			this.marker.addTo(this.map);
		},

		renderVal: function (val) {

			// has value
			if (val) {
				this.addClass('-value');
				this.setPosition(val.lat, val.lng);
				this.addMarker(this.newLatLng(val.lat, val.lng));

				// no value
			} else {
				this.removeClass('-value');
				this.marker.remove();
			}

			// search
			this.$search().val(val.address);
		},

		setPosition: function (lat, lng) {

			// vars
			this.addMarker(this.newLatLng(lat, lng));

			// center
			this.center();

			// return
			return this;
		},

		center: function () {

			// vars
			var position = this.marker.getLatLng();
			var lat = this.get('lat');
			var lng = this.get('lng');

			// if marker exists, center on the marker
			if (position) {
				lat = position.lat
				lng = position.lng;
			}

			// latlng
			var latLng = this.newLatLng(lat, lng);

			// set center of map
			this.map.panTo(latLng);
		},

		getSearchVal: function () {
			return this.$search().val();
		},

		initialize: function () {
			// Ensure Google API is loaded and then initialize map.
			withAPI(this.initializeMap.bind(this));
			$(this.$searchButton()).click(this.onClickSearch.bind(this));
		},

		newLatLng: function (lat, lng) {
			return [lat, lng];
		},

		initializeMap: function () {

			// vars
			var zoom = this.get('zoom');
			var lat = this.get('lat');
			var lng = this.get('lng');

			// Create map
			var map = L.map(this.$canvas()[0], {
				center: this.newLatLng(lat, lng),
				zoom: parseInt(zoom),
				dragging: true,
				tap: true,
				scrollWheelZoom: false,

				//layers: [standardLayer, L.layerGroup([marker])]
			});
			// Layer Standard OSM
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);

			var autocomplete = false;

			// Append references.
			map.acf = this;
			map.autocomplete = autocomplete;
			this.map = map;

			//Create marker
			this.addMarker(this.newLatLng(lat, lng));

			// Add map events.
			this.addMapEvents(this, map, this.marker, autocomplete);

			// action for 3rd party customization
			acf.doAction('nsi_google_map_init', map, this.marker, this);

			// set position
			var val = this.getValue();
			this.renderVal(val);
		},

		addMapEvents: function (field, map, marker, autocomplete) {

			// Click map.
			map.on('click', function (e) {

				// vars
				var lat = e.latlng.lat;
				var lng = e.latlng.lng;

				// search
				field.searchPosition(lat, lng);
			});

			// Drag marker.
			marker.on('dragend', function () {

				// vars
				var position = marker.getLatLng()
				var lat = position.lat;
				var lng = position.lng;

				// search
				field.searchPosition(lat, lng);
			});
		},

		searchPosition: function (lat, lng) {

			// vars
			var latLng = this.newLatLng(lat, lng);
			var $wrap = this.$control();

			// set position
			this.setPosition(lat, lng);

			// add class
			$wrap.addClass('-loading');

			// callback
			var callback = $.proxy(function (results, status) {

				// remove class
				$wrap.removeClass('-loading');

				// vars
				var address = '';

				// validate
				if (!results) {
					console.log('Geocoder failed due to: ' + status);
				} else if (!results.features[0]) {
					console.log('No results found');
				} else {
					console.log(results);
					address = results.features[0].properties.housenumber + ' ' + results.features[0].properties.street + ', ' + results.features[0].properties.postcode + ' ' + results.features[0].properties.city + ', ' + results.features[0].properties.country;
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
		},

		searchAddress: function (address) {
			// is address latLng?
			var latLng = address.split(',');
			if (latLng.length == 2) {

				// vars
				var lat = latLng[0];
				var lng = latLng[1];

				// check
				if ($.isNumeric(lat) && $.isNumeric(lng)) {
					return this.searchPosition(lat, lng);
				}
			}

			// vars
			var $wrap = this.$control();

			// add class
			$wrap.addClass('-loading');

			// callback
			var callback = this.proxy(function (results, status) {

				// remove class
				$wrap.removeClass('-loading');

				// vars
				var lat = '';
				var lng = '';

				// validate
				if (!results) {
					console.log('Geocoder failed due to: ' + status);
				} else if (!results.data.length) {
					console.log('No results found');
				} else {
					lat = results.data[0].latitude;
					lng = results.data[0].longitude;
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
				url: "https://proxy.fabienlege.fr/geo-api",
				method: 'GET',
				data: {
					access_key: "cd002e2c1c8c13e4f472a78fa4f65d53",
					query: address,
				},
				success: callback
			})
		},

		searchLocation: function () {

			// Try HTML5 geolocation
			if (!navigator.geolocation) {
				return alert(acf.__('Sorry, this browser does not support geolocation'));
			}

			// vars
			var $wrap = this.$control();

			// add class
			$wrap.addClass('-loading');

			// callback
			var onSuccess = $.proxy(function (results, status) {

				// remove class
				$wrap.removeClass('-loading');

				// vars
				var lat = results.coords.latitude;
				var lng = results.coords.longitude;

				// search;
				this.searchPosition(lat, lng);

			}, this);

			var onFailure = function (error) {
				$wrap.removeClass('-loading');
			}

			// try query
			navigator.geolocation.getCurrentPosition(onSuccess, onFailure);
		},

		onClickClear: function (e, $el) {
			this.val(false);
		},

		onClickLocate: function (e, $el) {
			this.searchLocation();
		},

		onClickSearch: function (e, $el) {
			this.searchAddress(this.$search().val());
			e.preventDefault();
		},

		onFocusSearch: function (e, $el) {
			this.removeClass('-value');
			this.onKeyupSearch.apply(this, arguments);
		},

		onBlurSearch: function (e, $el) {

			// timeout to allow onClickLocate event
			this.setTimeout(function () {
				this.removeClass('-search');
				if ($el.val()) {
					this.addClass('-value');
				}
			}, 3000);
		},

		onKeyupSearch: function (e, $el) {
			if ($el.val()) {
				this.addClass('-search');
			} else {
				this.removeClass('-search');
			}
		},

		onKeydownSearch: function (e, $el) {

			// prevent form from submitting
			if (e.which == 13) {
				e.preventDefault();
			}
		},

		onShow: function () {

			// bail early if no map
			// - possible if JS API was not loaded
			if (!this.map) {
				return false;
			}

			// center map when it is shown (by a tab / collapsed row)
			// - use delay to avoid rendering issues with browsers (ensures div is visible)
			this.setTimeout(this.center, 10);
		}
	});

	acf.registerFieldType(Field);

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

	function withAPI(callback) {

		return callback();

	}

})(jQuery);