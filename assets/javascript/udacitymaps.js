     var map;
     var markers = [];
     var polygon = null;

     function initMap() {
      // var styles =
      //  [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]}];


      map = new google.maps.Map(document.getElementById("map"), {
        center: {lat: 40.7413549, lng: -73.9980244},
        zoom: 13,
        // styles: styles,
        mapTypeControl: false
      });
      var locations = [
      {title: "park ave penthouse", location: {lat: 40.7713024, lng: -73.9632393}},
      {title: "Chelsea Loft", location: {lat: 40.7444883, lng: -73.9949465}},
      {title: "Union Square", location: {lat: 40.7347062, lng: -73.9895759}},
      {title: "Sagrada Familia", location: {lat: 41.403633, lng: 2.17437}}
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
      document.getElementById("hide-listings").addEventListener("click", hideListings);
      document.getElementById("toggle-drawing").addEventListener("click", function() {
        toggleDrawing(drawingManager);
      });
      document.getElementById("zoom-to-area").addEventListener("click", function() {
        zoomToArea();
      });
      document.getElementById("search-within-time").addEventListener("click", function() {
        searchWithinTime();
      });
      drawingManager.addListener("overlaycomplete", function(event) {
        if (polygon) {
          polygon.setMap(null);
          hideListings();
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
        infowindow.setMarker(null);
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

    function hideListings() {
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

    function searchWithinTime() {
      var distanceMatrixService = new google.maps.DistanceMatrixService;
      var address = document.getElementById("search-within-time-text").value;
        if (address === "") {
          window.alert("you must enter an address.");
        } else {
          hideListings();
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
                content: durationText + "away" + distanceText
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