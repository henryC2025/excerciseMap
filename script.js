'use strict';

let map, mapEvent;

// INFO WORKOUT CLASS
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // km
    this.duration = duration; // min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // get month gets number zero based and then use array to get month
    this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDay()}`;
  }

  // click() {
  //   this.clicks++;
  // }
}

// INFO running
class Running extends Workout {
  // defining a field
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// INFO cycling
class Cycling extends Workout {
  // defining a field
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    // km/h
    this.speed = this.distance / this.duration / 60;
    return this.speed;
  }
}

const run1 = new Running([39, -12], 5.2, 24, 178);
const cycling1 = new Cycling([39, -12], 34, 2, 500);

// console.log(run1);
// console.log(cycling1);

//___________________________________________________________________//

// INFO APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const resetButton = document.querySelector('.button-submit');
// const removeButton = document.querySelector('.remove-button');

// const removeButton = document.querySelector('.remove-button');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    // get data from local storage
    this._getLocalStorage();
    // executes automatically
    this._getPosition();
    // target to this to App
    form.addEventListener('submit', this._newWorkout.bind(this));
    // toggle fields
    inputType.addEventListener('change', this._toggleElevationField.bind(this));

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    // reset button
    resetButton.addEventListener('click', this.reset);
  }

  // INFO remove workout
  _removeWorkout() {
    if (!document.querySelector('.remove-button'))
      return console.log('No workouts to delete');
    document
      .querySelector('.remove-button')
      .addEventListener('click', function () {
        console.log('remove workout');
      });
  }

  // INFO get position
  _getPosition() {
    if (navigator.geolocation)
      // accepts two call back functions
      // 1: success
      // 2: fail
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position!');
        }
      );
  }

  // INFO load map
  _loadMap(position) {
    // console.log(position);
    // destructuring
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(latitude, longitude);

    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    // console.log(coords);

    // need an element with ID of map for library to work
    // 'L' is a name space with various methods
    // coordinates and zoom level
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    // render marker

    this.#workouts.forEach(work => this._renderWorkoutMarker(work));

    // can change theme
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // method from leaflet library
    // handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
  }

  // INFO display form
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  // INFO hide form
  _hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);

    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }

  // INFO toggle fields
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  // INFO add new workout
  _newWorkout(e) {
    const validInputs = (...inputs) =>
      // loop over array and check if every input is finite
      inputs.every(inp => Number.isFinite(inp));

    // returns true or false
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // LEC get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // LEC if workout is running(valid), create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        // revert valid, if not number display invalid message
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration)
      )
        return alert('Input Invalid!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // LEC if workout cycling(valid), create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        // revert valid, if not number display invalid message
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Input Invalid!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // LEC add new workout object to workout array
    this.#workouts.push(workout);
    // console.log(workout);
    // console.log(this.#workouts);

    // LEC render workout on map as marker
    this._renderWorkoutMarker(workout);

    // LEC render workout on list
    this._renderWorkout(workout);

    // LEC hide form + clear input fields
    this._hideForm();

    // LEC set local storage
    this._setLocalStorage();
  }

  // INFO
  _renderWorkoutMarker(workout) {
    // only accepts array and not object therefore [] is used
    // marker added to map, create pop up and add to marker (can also create function)
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

  // INFO
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${
      workout.description
    }<button class="btn remove-button">Remove</button></h2>
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
      </div>`;

    if (workout.type === 'running') {
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
  </li>`;
    }

    if (workout.type === 'cycling') {
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
        
      </div>`;
    }

    // insert after form
    form.insertAdjacentHTML('afterend', html);
  }

  // INFO
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    // console.log(workoutEl);

    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    // leaflet method to change view
    // can add behaviour for customization
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the public interface
    // workout.click();
  }

  // INFO working with local storage
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    // console.log(localStorage);
  }

  _getLocalStorage() {
    // doing opposite by parsing the string
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);

    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => this._renderWorkout(work));
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }

  // BUG TO DO BUTTON
}

const app = new App();
