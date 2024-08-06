let accessTokenMapBox = "pk.eyJ1IjoiZnJhbWEyMSIsImEiOiJjam1ic2Z1Mm0wM3Y3M3BudmwzNnN0NnFxIn0.-iqcjpd5MNpWIsGgj5VDMg"

let messageOffline = 'Map is not loaded in offline mode. Please connect to internet to load the map and reload the page.'

getLocation()
offlineNotif()

function offlineNotif(){
  if (!navigator.onLine) {
    if (Notification.permission == 'granted') {
      navigator.serviceWorker.getRegistration().then(function(reg){
        reg.showNotification(messageOffline)
      })
    }

    alert(messageOffline)
  }
}

function getLocation(){

  navigator.permissions.query({name:'geolocation'}).then(function(result) {
    if (result.state == 'granted') {
      report(result.state);
      // geoBtn.style.display = 'none';
    } else if (result.state == 'prompt') {
      report(result.state);
      // geoBtn.style.display = 'none';
      navigator.geolocation.getCurrentPosition(geoSuccess, geoFailedHandler);
    } else if (result.state == 'denied') {
      report(result.state);
      // geoBtn.style.display = 'inline';
    }
    result.onchange = function() {
      report(result.state);
    }
  });

  if (navigator && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(geoSuccess, geoFailedHandler);
    console.log("Geolocation supported");
  }
  else{
    console.log("PERMISSION_DENIED");
    geoFailedHandler()
  }
}

function report(state) {
  console.log('Permission ' + state);
}

function geoFailedHandler(){
  // Bandung (UNIKOM)
  let position = {
    latitude: -6.887261,
    longitude: 107.615645
  }

  let messageBox = document.getElementById('map-message')
  messageBox.style.display = "none"
  let currentLocation = {
    lat : position.latitude,
    long : position.longitude
  }
  initMapBox("mapid", currentLocation)
}


function geoSuccess(position){
  let messageBox = document.getElementById('map-message')
  messageBox.style.display = "none"
  let currentLocation = {
    lat : position.coords.latitude,
    long : position.coords.longitude
  }
  initMapBox("mapid", currentLocation)
}

function initMapBox(mapElement,location){
  let myMap = L.map(mapElement).setView([location.lat, location.long], 13)

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
 attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
 maxZoom: 18,
 id: 'mapbox.streets',
 accessToken: accessTokenMapBox
}).addTo(myMap);

  let currentPosition = L.marker([location.lat, location.long]).addTo(myMap)
  currentPosition.bindPopup("Your Location")
  // let radiusMarker = L.circleMarker([location.lat, location.long], {radius:1000}).addTo(mapElement)

  fetchRestaurantLocations(myMap, location)
}

function fetchRestaurantLocations(mapElement, location){

  let restaurantPlacesRequest = new Request("https://first-project.azurewebsites.net/api/maps?location="+location.lat+","+location.long)
  fetch(restaurantPlacesRequest).then(function(response){
    // console.log(response);
    return response.json()
  }).then(function(response){
    // console.log(response);
    bindRestaurantPlaces(mapElement, response)
  })
}

function bindRestaurantPlaces(mapElement, restaurants){
  console.log(restaurants);
  restaurants.forEach(function(item){
    let customIcon = L.icon({
      iconUrl : item.icon,
      iconSize : [30,30]
    })

    fetch(new Request('https://first-project.azurewebsites.net/api/maps/reviews/'+item.place_id)).then(function(response){
      return response.json()
    }).then(function(response){
      item.reviews = response.reviews
      item.other_photos = response.photos
    })

    let placeMarker = L.marker([item.geometry.location.lat,item.geometry.location.lng], {icon:customIcon}).addTo(mapElement)

    placeMarker.bindPopup(item.name).on("click", function(){
      console.log(item.name);
      document.getElementById('review-area').classList.add("show")
      showPhotoInReviewAreas(item.other_photos)
      showReviewInReviewArea(item.reviews)

    }).on('popupclose', function(){
      document.getElementById('review-area').classList.remove("show")
      resetReviewArea()
    })
  })
}

function geoFailed(error) {
  let messageBox = document.getElementById('map-message')
  switch(error.code) {
      case error.PERMISSION_DENIED:
          messageBox.innerHTML = "<p>User denied the request for Geolocation.</p><p>Please allow geolocation permission and try again</p>"
          break;
      case error.POSITION_UNAVAILABLE:
          messageBox.innerHTML = "Location information is unavailable."
          break;
      case error.TIMEOUT:
          messageBox.innerHTML = "The request to get user location timed out."
          break;
      case error.UNKNOWN_ERROR:
          messageBox.innerHTML = "An unknown error occurred."
          break;
  }

  alert(message)
}

function resetReviewArea(){
  let photoArea = document.getElementById('photo-list')
  let reviewArea = document.getElementById('review-list')

  photoArea.innerHTML = ""
  reviewArea.innerHTML = ""
}

function showPhotoInReviewAreas(photos){
  let photoArea = document.getElementById('photo-list')
  photos.forEach(function(item){
    let imageElement = document.createElement('img')

    fetch(new Request('https://first-project.azurewebsites.net//api/maps/place/photo?reference='+item.photo_reference)).then(function(response){
      return response.json()

    }).then(function(response){
      // console.log(response.data);
      // // console.log();
      imageElement.src = response.data
      imageElement.classList.add('location-photo')

      photoArea.append(imageElement)
    })
  })
}

function showReviewInReviewArea(reviews){
  let reviewArea = document.getElementById('review-list')
  reviews.forEach(function(item){
    let authorElement = document.createElement('p')
    let reviewElement = document.createElement('p')
    authorElement.innerHTML = item.author_name
    reviewElement.innerHTML = item.text

    authorElement.classList.add('review-author')
    reviewElement.classList.add('review-text')

    let reviewBox = document.createElement('div')
    reviewBox.classList.add('review-box')
    reviewBox.append(authorElement)
    reviewBox.append(reviewElement)

    reviewArea.append(reviewBox)
  })
}

function dummyReview(){
  let reviewArea = document.getElementById('review-list')
  let photoArea = document.getElementById('photo-list')

  let dummyData =[
    {author : 'Asep', text:'Nice location'},
    {author : 'Ujang', text:'Such a good place'},
    {author : 'Siti', text:'Amazing'}
  ]

  let dummyImage = {
    location : '/image/dummy-review',
    images : [
      'rumah-makan-1.png',
      'rumah-makan-2.jpg',
      'rumah-makan-3.jpg',
      'rumah-makan-4.jpg'
    ]
  }

  dummyImage.images.forEach(function(item){
    let imageElement = document.createElement('img')
    imageElement.src = dummyImage.location + '/' + item
    imageElement.classList.add('location-photo')

    photoArea.append(imageElement)
  })

  dummyData.forEach(function(item){
    let authorElement = document.createElement('p')
    let reviewElement = document.createElement('p')
    authorElement.innerHTML = item.author
    reviewElement.innerHTML = item.text

    authorElement.classList.add('review-author')
    reviewElement.classList.add('review-text')

    let reviewBox = document.createElement('div')
    reviewBox.classList.add('review-box')
    reviewBox.append(authorElement)
    reviewBox.append(reviewElement)

    reviewArea.append(reviewBox)
  })
}