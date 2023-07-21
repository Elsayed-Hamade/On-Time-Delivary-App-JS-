const message = document.querySelector(".message");
const messageContent = document.querySelector(".message-content");
const closeMessage = document.querySelector(".close-message");
const formOverlay = document.querySelector(".form-overlay");
const linkInput = document.querySelector(".link");
const submitBtn = document.querySelector(".submit-btn");
const companyInput = document.querySelector(".company");
const shippingInput = document.querySelector(".shipping");
// const productsContainer = document.querySelector(".products-container");

class Order {
  constructor(coords, company, shipping, link, distance) {
    this.coords = coords;
    this.company = company;
    this.shipping = shipping;
    this.link = link;
    this.distance = distance;
    this._calcDaysPrice();
  }

  _calcDaysPrice() {
    if (this.shipping === "regular") {
      this.price = Math.floor(this.distance / 100);
      this.days = Math.floor(this.price / 10);
    }
    if (this.shipping === "fast") {
      this.price = Math.floor(this.distance / 50);
      this.days = Math.floor(this.price / 20);
    }
    return this.price, this.days;
  }
}

class App {
  #map;
  #mapEv;
  #orders = [];
  constructor() {
    this._getPosition();
    submitBtn.addEventListener("click", this._newOrder.bind(this));
    closeMessage.addEventListener("click", this._hideMessage);
  }

  // Map Functionality

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this._loadMap(latitude, longitude);
      },
      () => {
        this._showMessage("Please Allow location Access");
      }
    );
  }

  _loadMap(lat, long) {
    this.#map = L.map("map").setView([lat, long], 18);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));
  }

  _newOrder(e) {
    e.preventDefault();
    const { lat, lng } = this.#mapEv.latlng;
    const companyValue = companyInput.value;
    const shippingValue = shippingInput.value;
    const linkValue = linkInput.value;
    let order;
    if (linkInput.value) {
      order = new Order(
        [lat, lng],
        companyValue,
        shippingValue,
        linkValue,
        this._calcDistance()
      );
      this.#orders.push(order);
      linkInput.value = "";
    } else {
      this._showMessage("Please, Enter Your Product Link");
    }
    this._addMarker(order);
  }

  _showForm(mapEvent) {
    this.#mapEv = mapEvent;
    this._hideFormOverlay();
    this._calcDistance();
  }

  _addMarker(order) {
    // START HERE
    L.marker(order.coords)
      .addTo(this.#map)
      .bindPopup("A pretty CSS popup.<br> Easily customizable.");
  }

  _calcDistance(lat, lng) {
    const latMain = (34.0196354 * Math.PI) / 180;
    const lngMain = (-119.0026526 * Math.PI) / 180;
    const latUser = (lat * Math.PI) / 180;
    const lngUser = (lng * Math.PI) / 180;

    // Haversine Formula
    const dlon = lngUser - lngMain;
    const dlat = latUser - latMain;

    let a =
      Math.pow(Math.sin(dlat / 2), 2) +
      Math.cos(latMain) * Math.cos(latUser) * Math.pow(Math.sin(dlon / 2), 2);

    let c = 2 * Math.asin(Math.sqrt(a));
    let r = 3956;
    const distance = c * r * 1.60934;

    return distance;
  }

  // UI Functionality
  _showMessage(content) {
    messageContent.innerHTML = content;
    message.style.scale = 1;
    message.classList.add("visible");
  }

  _hideMessage() {
    message.style.scale = 0;
    setTimeout(() => {
      message.classList.remove("visible");
    }, 500);
  }

  _hideFormOverlay() {
    formOverlay.classList.add("hidden");
    setTimeout(() => {
      formOverlay.style.display = "none";
    }, 800);
  }
}

const app = new App();
