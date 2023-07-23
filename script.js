const message = document.querySelector(".message");
const messageContent = document.querySelector(".message-content");
const closeMessage = document.querySelector(".close-message");
const formOverlay = document.querySelector(".form-overlay");
const linkInput = document.querySelector(".link");
const submitBtn = document.querySelector(".submit-btn");
const companyInput = document.querySelector(".company");
const shippingInput = document.querySelector(".shipping");
const productsContainer = document.querySelector(".products-container");
const deleteBtns = document.querySelector(".delete");

class Order {
  id = (Date.now() + "").slice(-9);
  constructor(coords, company, shipping, link, distance) {
    this.coords = coords;
    this.company = company;
    this.shipping = shipping;
    this.link = link;
    this.distance = distance;
    this._calcDaysPrice();
    this.description = this._description();
  }

  _calcDaysPrice() {
    if (this.shipping === "Regular") {
      this.price = Math.floor(this.distance / 100);
      this.days = Math.floor(this.price / 10);
    }
    if (this.shipping === "Fast") {
      this.price = Math.floor(this.distance / 50);
      this.days = Math.floor(this.price / 20);
    }
    return this.price, this.days;
  }

  _description() {
    const descHtml = `
      <h4>${this.company}</h4>
      <p>ID: ${this.id}</p>
    `;
    return descHtml;
  }
}

class App {
  #map;
  #mapEv;
  #orders = [];
  #markers = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    submitBtn.addEventListener("click", this._newOrder.bind(this));
    closeMessage.addEventListener("click", this._hideMessage);
    productsContainer.addEventListener("click", (e) => {
      this._delete(e);
    });
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

  _loadMap(lat, lng) {
    this.#map = L.map("map").setView([lat, lng], 18);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));
    this.#orders.forEach((order) => {
      this._addMarker(order);
    });
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
        this._calcDistance(lat, lng)
      );
      this.#orders.push(order);
      linkInput.value = "";
    } else {
      this._showMessage("Please, Enter Your Product Link");
    }
    this._addMarker(order);
    this._showFormOverlay();
    this._addOrders(order);
    this._setLocalStorage();
  }

  _showForm(mapEvent) {
    this.#mapEv = mapEvent;
    this._hideFormOverlay();
  }

  _addMarker(order) {
    if (order) {
      const marker = L.marker(order.coords)
        .addTo(this.#map)
        .bindPopup(
          L.popup({
            minWidth: 50,
            maxWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: "popup",
          })
        )
        .setPopupContent(`${order.description}`)
        .openPopup();
      this.#markers.push(marker);
    }
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

  _addOrders(order) {
    const orderHtml = `
      <div class="product">
      <h1 class="product-id">${order.id}</h1>
      <div class="product-info">
        <div class="selected-company">
          <i class="fa-solid fa-globe"></i>
          <p class="selected-company-name">${order.company}</p>
        </div>
        <div class="selected-shipping">
          <i class="fa-solid fa-cart-flatbed"></i>
          <p class="selected-shipping-type">${order.shipping}</p>
        </div>
        <div class="selected-link">
          <i class="fa-solid fa-link"></i>
          <a href="${
            order.link
          }" class="selected-link-href" target="_blank">${order.link.slice(
      0,
      6
    )}....</a>
        </div>
        <div class="days-selected">
          <p class="days-selected-number">
            Days : <span class="days-number">${order.days}</span>
          </p>
        </div>
        <div class="price-selected">
          <p class="price-selected-number">
            Price : <span class="price-number">${order.price}</span>
          </p>
        </div>
        <button class="delete">
          <i class="fa-solid fa-trash"></i>
          Delete
        </button>
      </div>
    </div>
      `;

    productsContainer.insertAdjacentHTML("afterbegin", orderHtml);
  }

  _delete(event) {
    if (event.target.classList.contains("delete")) {
      productsContainer.textContent = "";
      const targetID =
        event.target.closest(".product-info").previousElementSibling
          .textContent;
      this.#orders.forEach((order) => {
        if (order.id === targetID) {
          const index = this.#orders.indexOf(order);
          this.#orders.splice(index, 1);
          this.#markers.forEach((marker) => {
            if (
              marker._latlng.lat === order.coords[0] &&
              marker._latlng.lng === order.coords[1]
            ) {
              this.#map.removeLayer(marker);
              const indexMarker = this.#markers.indexOf(marker);
              this.#orders.splice(indexMarker, 1);
            }
          });
        }
      });
      this.#orders.forEach((order) => {
        this._addOrders(order);
      });
    }

    this._setLocalStorage();
  }

  _setLocalStorage() {
    localStorage.setItem("ordersData", JSON.stringify(this.#orders));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("ordersData"));
    if (!data) return;
    this.#orders = data;
    this.#orders.forEach((order) => {
      this._addOrders(order);
    });
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

  _showFormOverlay() {
    formOverlay.classList.remove("hidden");
    formOverlay.style.display = "flex";
  }
}

const app = new App();
