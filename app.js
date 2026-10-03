(() => {
  const STORAGE_KEY = "northline-toyota-vehicles-v1";
  const LEGACY_STORAGE_KEY = "northline-vehicles-v1";
  const BODY_TYPES = ["Sedan", "SUV", "Hatchback", "MPV", "Pickup", "Coupe", "Estate", "Van"];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const safeImage = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1100&q=80";
  let vehicles = loadVehicles();
  let selectedPhotos = [];
  let toastTimer;

  function loadVehicles() {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.warn("Saved showroom inventory could not be read.", error);
    }
    return [];
  }

  function saveVehicles() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
      return true;
    } catch (error) {
      showToast("Storage is full. Try removing a photo or a vehicle.");
      return false;
    }
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  function formatMileage(value) {
    return `${new Intl.NumberFormat("en-GB").format(Number(value) || 0)} miles`;
  }

  function vehicleCard(vehicle) {
    const title = `Toyota ${vehicle.model}`;
    const image = vehicle.photos?.[0] || safeImage;
    const sold = vehicle.status === "Sold";
    return `<article class="vehicle-card" data-vehicle-id="${escapeHtml(vehicle.id)}">
      <div class="vehicle-photo"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.onerror=null;this.src='${safeImage}'"><span class="vehicle-status ${sold ? "sold" : ""}">${escapeHtml(vehicle.status || "Available")}</span></div>
      <div class="vehicle-info"><div class="vehicle-topline"><div class="vehicle-name"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(vehicle.engine || "Carefully prepared")}</p></div><div class="vehicle-price">${formatPrice(vehicle.price)}</div></div>
      <div class="vehicle-specs"><span>${escapeHtml(vehicle.type)} <i class="spec-dot"></i></span><span>${escapeHtml(vehicle.year)} <i class="spec-dot"></i></span><span>${formatMileage(vehicle.mileage)} <i class="spec-dot"></i></span><span>${escapeHtml(vehicle.transmission)} <i class="spec-dot"></i></span><span>${escapeHtml(vehicle.fuel)}</span></div>
      <p class="vehicle-description">${escapeHtml(vehicle.description)}</p><div class="vehicle-actions"><button class="button button-dark detail-button" type="button" data-action="details" data-id="${escapeHtml(vehicle.id)}">View details <span aria-hidden="true">→</span></button><a class="text-link" href="tel:+442079460280">Contact dealer <span aria-hidden="true">↗</span></a><div class="owner-actions"><button type="button" data-action="edit" data-id="${escapeHtml(vehicle.id)}">Edit</button><button type="button" data-action="delete" data-id="${escapeHtml(vehicle.id)}">Delete</button></div></div></div>
    </article>`;
  }

  function renderHome(query = "") {
    const normalized = query.trim().toLowerCase();
    const matches = vehicles.filter(vehicle => vehicle.status !== "Sold" && `Toyota ${vehicle.model} ${vehicle.type} ${vehicle.fuel} ${vehicle.description}`.toLowerCase().includes(normalized)).slice(0, 3);
    $("#featured-list").innerHTML = matches.map(vehicleCard).join("");
    $("#featured-empty").hidden = matches.length > 0;
    $("#featured-empty p").textContent = normalized ? "No Toyotas match that search." : "No Toyotas listed just yet.";
  }

  function renderCars() {
    const type = $("#filter-brand").value;
    const model = $("#filter-model").value.trim().toLowerCase();
    const maxPrice = Number($("#filter-price").value) || Infinity;
    const minYear = Number($("#filter-year").value) || 0;
    const transmission = $("#filter-transmission").value;
    const fuel = $("#filter-fuel").value;
    const filtered = vehicles.filter(vehicle =>
      (!type || vehicle.type === type) &&
      (!model || vehicle.model.toLowerCase().includes(model)) &&
      Number(vehicle.price) <= maxPrice &&
      Number(vehicle.year) >= minYear &&
      (!transmission || vehicle.transmission === transmission) &&
      (!fuel || vehicle.fuel === fuel)
    );
    $("#cars-list").innerHTML = filtered.map(vehicleCard).join("");
    $("#cars-empty").hidden = filtered.length > 0;
    const hasVehicles = vehicles.length > 0;
    $("#cars-empty h2").textContent = hasVehicles ? "No cars found" : "No Toyotas listed yet";
    $("#cars-empty p").textContent = hasVehicles
      ? "Try widening your filters, or check back soon."
      : "Add a Toyota to see matching results for body type, model, price, year, transmission and fuel.";
    $("#empty-reset").textContent = hasVehicles ? "Clear filters" : "Add your first Toyota";
    $("#empty-reset").className = hasVehicles ? "button button-outline-dark" : "button button-dark";
    $("#results-count").textContent = `${filtered.length} ${filtered.length === 1 ? "car" : "cars"}`;
  }

  function configureToyotaCopy() {
    document.title = "Northline Toyota | Find Your Next Toyota";
    $('meta[name="description"]').content = "A considered collection of Toyota cars, with straightforward advice and attentive service from Northline Toyota.";
    $$(".brand-copy strong").forEach(element => { element.textContent = "NORTHLINE"; });
    $$(".brand-copy small").forEach(element => { element.textContent = "TOYOTA COLLECTION"; });
    $$(".brand").forEach(element => { element.setAttribute("aria-label", "Northline Toyota home"); });
    $(".hero .eyebrow").textContent = "THE NORTHLINE TOYOTA STANDARD";
    $("#hero-query").placeholder = "Try “Corolla” or “SUV”";
    $("#hero-query").setAttribute("aria-label", "Search Toyota models and body types");
    $(".inventory-section .section-heading .eyebrow").textContent = "THE TOYOTA COLLECTION";
    $(".inventory-section .section-heading h2").textContent = "Featured Toyotas";
    $("#featured-empty .text-link").textContent = "Browse the Toyota collection →";
    $(".cars-section").previousElementSibling.querySelector(".eyebrow").textContent = "THE TOYOTA COLLECTION";
    $(".cars-section").previousElementSibling.querySelector("h1").textContent = "Find your Toyota.";
    $(".cars-section").previousElementSibling.querySelector("p").textContent = "Explore Toyota sedans, SUVs, hatchbacks and more.";
    $("#cars-empty .empty-mark").textContent = "T";
    $("#filter-model").placeholder = "Any Toyota model";
    $("#vehicle-form").elements.model.placeholder = "e.g. Corolla Hybrid";
    $("#vehicle-form-eyebrow").textContent = "NORTHLINE TOYOTA COLLECTION";
    $(".footer-bottom").firstElementChild.lastChild.textContent = " Northline Toyota";
    $(".footer-col a[href='#about']").textContent = "About Northline Toyota";
  }

  function refresh() {
    renderHome($("#hero-query").value);
    renderCars();
    const typeSelect = $("#filter-brand");
    const currentType = typeSelect.value;
    typeSelect.innerHTML = `<option value="">All body types</option>${BODY_TYPES.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}`;
    typeSelect.value = BODY_TYPES.includes(currentType) ? currentType : "";
    typeSelect.parentElement.querySelector("span").textContent = "Body type";
    renderCars();
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function setPage(page) {
    const validPages = ["home", "cars", "services", "about", "contact"];
    const activePage = validPages.includes(page) ? page : "home";
    $$(".page-view").forEach(view => view.classList.toggle("is-active", view.dataset.page === activePage));
    $$(".main-nav a").forEach(link => {
      const current = link.dataset.nav === activePage;
      link.classList.toggle("is-current", current);
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    $(".main-nav").classList.remove("is-open");
    $(".menu-toggle").setAttribute("aria-expanded", "false");
    if (activePage === "cars") renderCars();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openVehicleForm(vehicle = null) {
    const form = $("#vehicle-form");
    form.reset();
    selectedPhotos = vehicle?.photos ? [...vehicle.photos] : [];
    form.elements.id.value = vehicle?.id || "";
    $("#vehicle-dialog-title").textContent = vehicle ? "Edit vehicle" : "Add a vehicle";
    $("#vehicle-form-eyebrow").textContent = vehicle ? "UPDATE TOYOTA COLLECTION" : "NORTHLINE TOYOTA COLLECTION";
    $("#publish-vehicle").innerHTML = vehicle ? 'Save changes <span aria-hidden="true">→</span>' : 'Publish vehicle <span aria-hidden="true">→</span>';
    if (vehicle) {
      ["type", "model", "price", "year", "mileage", "transmission", "fuel", "engine", "description", "status"].forEach(key => { form.elements[key].value = vehicle[key] ?? ""; });
    }
    renderPhotoPreviews();
    $("#vehicle-dialog").showModal();
  }

  function organizeVehicleForm() {
    const form = $("#vehicle-form");
    const originalGrid = $(".form-grid", form);
    const labels = [...originalGrid.querySelectorAll(":scope > label")];
    const brandLabel = labels.find(label => label.querySelector('[name="brand"]'));
    const bodyTypeSelect = document.createElement("select");
    bodyTypeSelect.name = "type";
    bodyTypeSelect.required = true;
    bodyTypeSelect.innerHTML = `<option value="">Select Toyota body type</option>${BODY_TYPES.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}`;
    brandLabel.firstChild.textContent = "Body type";
    brandLabel.querySelector('[name="brand"]').replaceWith(bodyTypeSelect);
    const statusLabel = labels.find(label => label.querySelector('[name="status"]'));
    const statusField = document.createElement("fieldset");
    statusField.className = "status-field";
    const legend = document.createElement("legend");
    legend.textContent = "Availability";
    const options = document.createElement("div");
    options.className = "status-options";
    ["Available", "Sold"].forEach((status, index) => {
      const optionLabel = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "status";
      input.value = status;
      input.required = true;
      input.defaultChecked = index === 0;
      const text = document.createElement("span");
      text.textContent = status;
      optionLabel.append(input, text);
      options.append(optionLabel);
    });
    statusField.append(legend, options);
    statusLabel.replaceWith(statusField);

    const fieldsByName = new Map([...originalGrid.querySelectorAll(":scope > label, :scope > fieldset")].map(field => {
      const name = field.querySelector("[name]")?.name;
      return [name, field];
    }));
    const sections = [
      { title: "Toyota details", description: "Body type, model and asking price.", fields: ["type", "model", "price", "year"] },
      { title: "Specifications", description: "The details buyers compare.", fields: ["mileage", "transmission", "fuel", "engine"] },
      { title: "Listing", description: "Describe the car and set its availability.", fields: ["description", "status"] }
    ];
    sections.forEach((section, index) => {
      const wrapper = document.createElement("section");
      wrapper.className = "form-section";
      const heading = document.createElement("div");
      heading.className = "form-section-heading";
      const number = document.createElement("span");
      number.textContent = String(index + 1).padStart(2, "0");
      const copy = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = section.title;
      const description = document.createElement("p");
      description.textContent = section.description;
      copy.append(title, description);
      heading.append(number, copy);
      const grid = document.createElement("div");
      grid.className = "form-grid";
      section.fields.forEach(name => {
        const field = fieldsByName.get(name);
        if (field) grid.append(field);
      });
      wrapper.append(heading, grid);
      originalGrid.before(wrapper);
    });
    originalGrid.remove();
  }

  function renderPhotoPreviews() {
    $("#photo-previews").innerHTML = selectedPhotos.map((photo, index) => `<div class="photo-preview"><img src="${escapeHtml(photo)}" alt="Vehicle photo ${index + 1}"><button type="button" aria-label="Remove photo ${index + 1}" data-remove-photo="${index}">×</button></div>`).join("");
  }

  function showDetails(id) {
    const vehicle = vehicles.find(item => item.id === id);
    if (!vehicle) return;
    const title = `Toyota ${vehicle.model}`;
    const image = vehicle.photos?.[0] || safeImage;
    $("#detail-content").innerHTML = `<img class="detail-image" src="${escapeHtml(image)}" alt="${escapeHtml(title)}" onerror="this.onerror=null;this.src='${safeImage}'"><span class="eyebrow">${escapeHtml(vehicle.status || "Available")} · ${escapeHtml(vehicle.year)}</span><h2 id="detail-title">${escapeHtml(title)}</h2><div class="detail-price">${formatPrice(vehicle.price)}</div><div class="detail-specs"><span>${formatMileage(vehicle.mileage)}</span><span>${escapeHtml(vehicle.transmission)}</span><span>${escapeHtml(vehicle.fuel)}</span><span>${escapeHtml(vehicle.engine || "")}</span></div><p>${escapeHtml(vehicle.description)}</p><a class="button button-dark" href="tel:+442079460280">Contact the showroom <span aria-hidden="true">↗</span></a>`;
    $("#detail-dialog").showModal();
  }

  function handleVehicleAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { id, action } = button.dataset;
    const vehicle = vehicles.find(item => item.id === id);
    if (!vehicle) return;
    if (action === "details") showDetails(id);
    if (action === "edit") openVehicleForm(vehicle);
    if (action === "delete" && window.confirm(`Delete Toyota ${vehicle.model} from the collection?`)) {
      vehicles = vehicles.filter(item => item.id !== id);
      if (saveVehicles()) { refresh(); showToast("Vehicle removed from the collection."); }
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  organizeVehicleForm();
  configureToyotaCopy();
  $$(".main-nav a").forEach(link => link.addEventListener("click", () => setPage(link.dataset.nav)));
  window.addEventListener("hashchange", () => setPage(location.hash.slice(1)));
  $(".menu-toggle").addEventListener("click", event => {
    const nav = $(".main-nav");
    const open = nav.classList.toggle("is-open");
    event.currentTarget.setAttribute("aria-expanded", String(open));
  });
  $("#hero-search").addEventListener("submit", event => {
    event.preventDefault();
    location.hash = "cars";
    $("#filter-model").value = $("#hero-query").value.trim();
    renderCars();
  });
  $("#hero-query").addEventListener("input", () => renderHome($("#hero-query").value));
  $("#vehicle-filters").addEventListener("input", renderCars);
  $("#vehicle-filters").addEventListener("change", renderCars);
  $("#vehicle-filters").addEventListener("reset", () => setTimeout(renderCars));
  $("#empty-reset").addEventListener("click", () => {
    if (vehicles.length) $("#vehicle-filters").reset();
    else openVehicleForm();
  });
  $("#featured-list").addEventListener("click", handleVehicleAction);
  $("#cars-list").addEventListener("click", handleVehicleAction);
  $$(".add-vehicle-button").forEach(button => button.addEventListener("click", () => openVehicleForm()));
  $$(".dialog-close, .cancel-vehicle").forEach(button => button.addEventListener("click", () => $("#vehicle-dialog").close()));
  $(".detail-close").addEventListener("click", () => $("#detail-dialog").close());
  $("#vehicle-dialog").addEventListener("click", event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  $("#detail-dialog").addEventListener("click", event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  $("#photo-previews").addEventListener("click", event => {
    const removeButton = event.target.closest("[data-remove-photo]");
    if (!removeButton) return;
    selectedPhotos.splice(Number(removeButton.dataset.removePhoto), 1);
    renderPhotoPreviews();
  });
  $("#vehicle-photos").addEventListener("change", async event => {
    const files = [...event.currentTarget.files];
    const remainingSlots = Math.max(0, 8 - selectedPhotos.length);
    if (files.length > remainingSlots) showToast("Up to 8 photos can be saved per vehicle.");
    try {
      const dataUrls = await Promise.all(files.slice(0, remainingSlots).map(fileToDataUrl));
      selectedPhotos.push(...dataUrls);
      renderPhotoPreviews();
    } catch (error) {
      showToast("One of those photos could not be read. Please try another image.");
    }
    event.currentTarget.value = "";
  });
  $("#vehicle-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const id = String(data.get("id") || `nl-${Date.now()}`);
    const previous = vehicles.find(item => item.id === id);
    const vehicle = {
      id,
      brand: "Toyota",
      type: String(data.get("type")),
      model: String(data.get("model")).trim(),
      price: Number(data.get("price")),
      year: Number(data.get("year")),
      mileage: Number(data.get("mileage")),
      transmission: String(data.get("transmission")),
      fuel: String(data.get("fuel")),
      engine: String(data.get("engine")).trim(),
      description: String(data.get("description")).trim(),
      status: String(data.get("status") || "Available"),
      photos: [...selectedPhotos]
    };
    if (!vehicle.photos.length && previous?.photos?.length) vehicle.photos = [...previous.photos];
    if (!vehicle.photos.length) vehicle.photos = [safeImage];
    if (previous) vehicles = vehicles.map(item => item.id === id ? vehicle : item);
    else vehicles.unshift(vehicle);
    if (saveVehicles()) {
      refresh();
      $("#vehicle-dialog").close();
      showToast(previous ? "Vehicle details updated." : "Vehicle published to your collection.");
    }
  });
  $("#contact-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = new FormData(form).get("name");
    $("#contact-message").textContent = `Thank you, ${name}. Your message is ready for the Northline team to follow up.`;
    form.reset();
  });
  $("#current-year").textContent = new Date().getFullYear();

  refresh();
  setPage(location.hash.slice(1) || "home");
})();