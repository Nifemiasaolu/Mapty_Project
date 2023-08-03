'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

/////

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10)

  constructor(distance, coords, duration){
    this.distance = distance; // in km
    this.coords = coords; // [lat, lng]
    this.duration = duration; // in min
  }
}

// Child(s) of Workout Class 
class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(distance, coords, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  // Calculate the Pace 
  calcPace() {
    //in min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  } 
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(distance, coords, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed(){
    //km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running ([24,-37], 54, 35, 263);
// const cycle1 = new Cycling ([24,-37], 44, 76, 754);
// console.log(run1, cycle1);


////////////////////////////////////////
//APPLICATION ARCHITECTURE
// Implementing App class
class App {
  // Declaring the global variables in a class
  #map; //This is how to declare it, as a private property
  #mapEvent;

  constructor() {
    // Constructor method is called immediately when a new object is created from its class.
    this._getPosition();

    // Render and submit workout form
    form.addEventListener('submit', this._newWorkout.bind(this)); //If the method (newWorkout) is not binded to the 'this' keyword,...
    // ...the 'this' keyword will point to 'form'...
    //...and that's not what we want. We want the 'this' keyword to point to the 'class App' (APP Object).
    //When working with eventListeners in classes, you need to always bind the this keyword.

    // Switching between Cadence and Elevation
    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation)
      // Get Current location coordinates
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    //   Render Map on current location
    const coords = [latitude, longitude];

    // console.log(this);
    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(this.#map);

    //  Handling User clicks on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus(); //First input form to fill immediately
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    // Clear input fields
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';

    // Display workout on map
    const { lat, lng } = this.#mapEvent.latlng;

    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        })
      )
      .setPopupContent('Workout')
      .openPopup();
  }
}

const app = new App(); //app object created from App class, and its created immediately when the page loads.
