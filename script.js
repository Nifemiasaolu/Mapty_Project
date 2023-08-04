'use strict';

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
  id = (Date.now() + '').slice(-10);

  constructor(distance, coords, duration) {
    this.distance = distance; // in km
    this.coords = coords; // [lat, lng]
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()} `;
  }
}

// Child(s) of Workout Class
class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(distance, coords, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription(); //We couldn't call this method on the 'Workout object(class)' bcos it doesn't have a 'type'.
    // Hence, we calling it on both child class.
  }

  // Calculate the Pace
  calcPace() {
    //in min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling'; // same as that inside the constructor

  constructor(coords, distance, duration, elevationGain) {
    super(distance, coords, duration);
    this.elevationGain = elevationGain;
    // this.type = 'cycling';
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
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
  #workout = [];

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

    containerWorkouts.addEventListener('click', this._moveToPopup);
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

  _hideForm() {
    // Empty/ Clear inputs
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.remove('hidden');

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const valueInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    //This means that the (...inputs) REST produces an array which is looped over...
    // ...therefore the 'inputs.every' which is a method (returns true or false), then decides to loop through...
    // ... the operation. If after looping, Number.isFinite returns 'false' at any point, then 'input.every' returns 'false'...
    // ... and if it returns 'true' all through, then 'input.every' takes up 'true'

    //Condition for positive number
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If running workout, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid using Guard Clause
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !valueInputs(distance, duration, cadence) || // Refactored method of writing the conditions
        !allPositive(distance, duration, cadence) // Must be Positive number condition
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence); // creating running object
    }

    // If cycling workout, create cylcing object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (
        !valueInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation); // creating cycling object
    }

    // Add new object to workout array
    this.#workout.push(workout);
    // console.log(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide the form + clear the input field
    this._hideForm();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
    `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    console.log(workoutEl);
  }
}

const app = new App(); //app object created from App class, and its created immediately when the page loads.
