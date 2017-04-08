     var map;
     var markers = [];

     function initMap() {
      var styles =
       [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]}];


      map = new google.maps.Map(document.getElementById("map"), {
        center: {lat: 40.7413549, lng: -73.9980244},
        zoom: 13,
        styles: styles,
        mapTypeControl: false
      });
      var locations = [
      {title: "park ave penthouse", location: {lat: 40.7713024, lng: -73.9632393}},
      {title: "Chelsea Loft", location: {lat: 40.7444883, lng: -73.9949465}},
      {title: "Union Square", location: {lat: 40.7347062, lng: -73.9895759}}
      ];

      var largeInfowindow = new google.maps.InfoWindow();
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
     }

    function populateInfoWindow(marker, infowindow) {
      if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent("<div>" + marker.title + "</div>");
        infowindow.open(map, marker);
        infowindow.addListener("closeclick", function(){
        infowindow.setMarker(null);
        });
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