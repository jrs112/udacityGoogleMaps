     var map;
     var markers = [];
     var polygon = null;
     var placeMarkers = [];

     function initMap() {
      // var styles =
      //  [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]}];


      map = new google.maps.Map(document.getElementById("map"), {
        center: {lat: 40.7413549, lng: -73.9980244},
        zoom: 13,
        // styles: styles,
        mapTypeControl: false
      });
      var timeAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById("search-within-time-text"));
      var zoomAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById("zoom-to-area-text"));
      zoomAutocomplete.bindTo("bounds", map);
      var searchBox = new google.maps.places.SearchBox(
        document.getElementById("places-search"));
      searchBox.setBounds(map.getBounds());
      var locations = [
      {title: "park ave penthouse", location: {lat: 40.7713024, lng: -73.9632393}},
      {title: "Chelsea Loft", location: {lat: 40.7444883, lng: -73.9949465}},
      {title: "Union Square", location: {lat: 40.7347062, lng: -73.9895759}}
      // {title: "Sagrada Familia", location: {lat: 41.403633, lng: 2.17437}}
      ];

      var largeInfowindow = new google.maps.InfoWindow();
      var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_LEFT,
          drawingModes: [
          google.maps.drawing.OverlayType.POLYGON
          ]
        }
      });
      var defaultIcon = makeMarkerIcon("009155");
      var highlightedIcon = makeMarkerIcon("FFFF24");

      for (var i = 0; i < locations.length; i++) {
        var position = locations[i].location;
        var title = locations[i].title;
        var marker = new google.maps.Marker({
          map: map,
          position: position,
          title: title,
          icon: defaultIcon,
          animation: google.maps.Animation.DROP,
          id: i
        })
        markers.push(marker);
        marker.addListener("click", function(){
          populateInfoWindow(this, largeInfowindow)
        });
        marker.addListener("mouseover", function() {
          this.setIcon(highlightedIcon);
        });
        marker.addListener("mouseout", function() {
          this.setIcon(defaultIcon);
        });
      }
      document.getElementById("show-listings").addEventListener("click", showListings);
      document.getElementById("hide-listings").addEventListener("click", function() {
        hideMarkers(markers);
      });
      document.getElementById("toggle-drawing").addEventListener("click", function() {
        toggleDrawing(drawingManager);
      });
      document.getElementById("zoom-to-area").addEventListener("click", function() {
        zoomToArea();
      });
      document.getElementById("search-within-time").addEventListener("click", function() {
        searchWithinTime();
      });
      searchBox.addListener("places_changed", function() {
        searchBoxPlaces(this);
      });
      document.getElementById("go-places").addEventListener("click", textSearchPlaces);
      drawingManager.addListener("overlaycomplete", function(event) {
        if (polygon) {
          polygon.setMap(null);
          hideMarkers(markers);
        }
        drawingManager.setDrawingMode(null);
        polygon = event.overlay;
        polygon.setEditable(true);
        searchWithinPolygon();
        polygon.getPath().addListener("set_at", searchWithinPolygon);
        polygon.getPath().addListener("insert_at", searchWithinPolygon)
      });
     }

    function populateInfoWindow(marker, infowindow) {
      if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent("<div>" + marker.title + "</div>");
        infowindow.open(map, marker);
        infowindow.addListener("closeclick", function(){
        infowindow.marker = null;
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius= 50;
        function getStreetView(data, status) {
          if (status === google.maps.StreetViewStatus.OK) {
            var nearStreetViewLocation = data.location.latLng;
            var heading = google.maps.geometry.spherical.computeHeading(
              nearStreetViewLocation, marker.position);
            infowindow.setContent("<div>" + marker.title + "</div><div id='pano'></div>");
            var panoramaOptions = {
              position: nearStreetViewLocation,
              pov: {
                heading: heading,
                pitch: 15
              }
            };
            var panorama = new google.maps.StreetViewPanorama(
              document.getElementById("pano"), panoramaOptions);
          } else {
            infowindow.setContent("<div>" + marker.title + "</div>" + "<div>No Street View Found</div>");
          }
        }
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        infowindow.open(map, marker);
      }
    }

    function showListings() {
      var bounds = new google.maps.LatLngBounds();
      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
      }
      map.fitBounds(bounds);
    }

    function hideMarkers(markers) {
      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
      }
    }

    function makeMarkerIcon(markerColor) {
      var markerImage = new google.maps.MarkerImage(
        "http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|"+ markerColor +
          "|40|_|%E2%80%A2",
        new google.maps.Size(21,34),
        new google.maps.Point(0,0),
        new google.maps.Point(10,34),
        new google.maps.Size(21,34));
      return markerImage;
    }

    function toggleDrawing(drawingManager) {
      if (drawingManager.map) {
        drawingManager.setMap(null);
          if (polygon) {
            polygon.setMap(null);
          }
      } else {
        drawingManager.setMap(map);
      }
    }

    function searchWithinPolygon() {
      for (var i = 0; i < markers.length; i++) {
        if (google.maps.geometry.poly.containsLocation(markers[i].position,polygon)) {
          markers[i].setMap(map);
        } else {
          markers[i].setMap(null);
        }
      }
    }

    function zoomToArea() {
      var geocoder = new google.maps.Geocoder();
      var address = document.getElementById("zoom-to-area-text").value;
      if (address === "") {
        window.alert("You must enter an area, or address.")
      } else {
        geocoder.geocode(
          { address: address,
            // componentRestrictions: {locality: "United States"}
          }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
              map.setCenter(results[0].geometry.location);
              map.setZoom(15);
              $("#address-field").text(results[0].formatted_address)
            } else {
              window.alert("We cold not find that location.  Try entering a more specific place!");
            }
          });
      }
    }

    function displayDirections(origin) {
      hideMarkers(markers);
      var directionsService = new google.maps.DirectionsService;
      var destinationAddress =
        document.getElementById("search-within-time-text").value;
      var mode = document.getElementById("mode").value;
      directionsService.route({
        origin: origin,
        destination: destinationAddress,
        travelMode: google.maps.TravelMode[mode]
      }, function(response, status) {
          if (status === google.maps.DirectionsStatus.OK) {
            var directionsDisplay = new google.maps.DirectionsRenderer({
              map: map,
              directions: response,
              draggable: true,
              polylineOptions: {
                strokeColor: "green"
              }
            });
          } else {
            window.alert("Direction request failed due to " + status);
          }
      });
    }

    function searchWithinTime() {
      var distanceMatrixService = new google.maps.DistanceMatrixService;
      var address = document.getElementById("search-within-time-text").value;
        if (address === "") {
          window.alert("you must enter an address.");
        } else {
          hideMarkers(markers);
          var origins = [];
          for (var i = 0; i < markers.length; i++) {
            origins[i] = markers[i].position;
          }
          var destination = address;
          var mode = document.getElementById("mode").value;
          distanceMatrixService.getDistanceMatrix({
            origins: origins,
            destinations: [destination],
            travelMode: google.maps.TravelMode[mode],
            unitSystem: google.maps.UnitSystem.IMPERIAL,
          }, function(response, status) {
            if (status !== google.maps.DistanceMatrixStatus.OK) {
              window.alert("Error was: " + status);
            } else {
              displayMarkersWithinTime(response);
              }
          });
        }
    }

    function displayMarkersWithinTime(response) {
      var maxDuration = document.getElementById("max-duration").value;
      var origins = response.originAddresses;
      var destinations = response.destinationAddresses;
      var atLeastOne = false;
      for (var i = 0; i < origins.length; i++) {
        var results = response.rows[i].elements;
        for (var j = 0; j < results.length; j++) {
          var element = results[j];
          if (element.status === "OK") {
            var distanceText = element.distance.text;
            var duration = element.duration.value / 60;
            var durationText = element.duration.text;
            if (duration <= maxDuration) {
              markers[i].setMap(map);
              atLeastOne = true;
              var infowindow = new google.maps.InfoWindow({
                content: durationText + "away" + distanceText +
                "<div><input type=\'button\' value=\'View Route\' onclick=" +
                "\'displayDirections(&quot;" + origins[i] + "&quot;);\'></input></div>"
              });
              infowindow.open(map, markers[i]);
              markers[i].infowindow = infowindow;
              google.maps.event.addListener(markers[i], "click", function() {
                this.infowindow.close();
              });
            }
          }
        }
      }
    }

    function searchBoxPlaces(searchBox) {
      var bounds = map.getBounds();
      hideMarkers(placeMarkers);
      var places = searchBox.getPlaces();
      createMarkersForPlaces(places);
      if (places.length === 0) {
        window.alert("We did not find any places matching that search!");
      }
    }

    function textSearchPlaces() {
      var bounds = map.getBounds();
      hideMarkers(placeMarkers);
      var placesService = new google.maps.places.PlacesService(map);
      placesService.textSearch({
        query: document.getElementById("places-search").value,
        bounds: bounds
      }, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          createMarkersForPlaces(results);
        }
      });
    }

    function createMarkersForPlaces(places) {
      var bounds = new google.maps.LatLngBounds();
      for (var i = 0; i < places.length; i++) {
        var place = places[i];
        var icon = {
          url: place.icon,
          size: new google.maps.Size(35, 35),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(15, 34),
          scaledSize: new google.maps.Size(25, 25)
        };
        var marker = new google.maps.Marker({
          map: map,
          icon: icon,
          title: place.name,
          position: place.geometry.location,
          id: place.place_id
        });
        var placeInfoWindow = new google.maps.InfoWindow();
        marker.addListener("click",function() {
          if (placeInfoWindow.marker == this) {
            console.log("this infowindow already is on this marker!");
          } else {
          getPlacesDetails(this, placeInfoWindow);
            }
        });

        placeMarkers.push(marker);
        if (place.geometry.viewport) {
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      }
      map.fitBounds(bounds);
    }

    function getPlacesDetails(marker, infowindow) {
      var service = new google.maps.places.PlacesService(map);
      service.getDetails({
        placeId: marker.id
      }, function (place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          infowindow.marker = marker;
          var innerHTML = "<div>";
          if (place.name) {
            innerHTML += "<strong>" + place.name + "</strong>";
          }
          if (place.formatted_address) {
            innerHTML += "<br>" + place.formatted_address;
          }
          if (place.formatted_phone_number) {
            innerHTML += "<br>" + place.formatted_phone_number;
          }
          if (place.opening_hours) {
            innerHTML += "<br><br><strong>Hours:</strong><br>" +
              place.opening_hours.weekday_text[0] + "<br>" +
              place.opening_hours.weekday_text[1] + "<br>" +
              place.opening_hours.weekday_text[2] + "<br>" +
              place.opening_hours.weekday_text[3] + "<br>" +
              place.opening_hours.weekday_text[4] + "<br>" +
              place.opening_hours.weekday_text[5] + "<br>" +
              place.opening_hours.weekday_text[6];
          }
          if (place.photos) {
            innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
                {maxHeight: 100, maxWidth: 200}) + '">';
          }
          innerHTML += "</div>";
          infowindow.setContent(innerHTML);
          infowindow.open(map, marker);
          infowindow.addListener("closeclick", function() {
            infowindow.marker = null;
          });

        }
      });
    }