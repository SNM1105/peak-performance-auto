// ===== MOBILE MENU TOGGLE =====
const menuToggle = document.getElementById("mobile-menu");
const navClose = document.getElementById("nav-close");
const nav = document.querySelector(".nav");
if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    nav.classList.toggle("active");
  });
}
if (navClose) {
  navClose.addEventListener("click", () => {
    nav.classList.remove("active");
  });
}

// ===== HELPER FUNCTIONS =====

// Helper function to get status badge HTML
function getStatusBadge(status) {
  if (status === "available") {
    return `<span class="status-badge status-available">Available</span>`;
  } else if (status === "reserved") {
    return `<span class="status-badge status-reserved">Reserved</span>`;
  } else {
    return `<span class="status-badge status-available">Available</span>`;
  }
}

// Helper function to format price
function formatPrice(price) {
  return `$${price.toLocaleString()}`;
}

// Function to change main image - GLOBAL
window.changeCarImage = function(imgSrc, thumbnail) {
  const mainImg = document.getElementById("main-img");
  if (mainImg) {
    mainImg.src = imgSrc;
  }
  
  // Remove active class from all thumbnails
  const thumbnails = document.querySelectorAll(".thumbnail");
  thumbnails.forEach(thumb => thumb.classList.remove("active"));
  
  // Add active class to clicked thumbnail
  if (thumbnail) {
    thumbnail.classList.add("active");
  }
}

// ===== HOME PAGE FEATURED CARS (3 most recent) =====
const featuredContainer = document.querySelector("#inventory .car-grid");
if (featuredContainer) {
  loadFeaturedCars();
}

async function loadFeaturedCars() {
  try {
    const { data: cars, error } = await supabaseClient
      .from('cars')
      .select('*')
      .eq('status', 'available')  // Only show available cars
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Error fetching featured cars:', error);
      featuredContainer.innerHTML = '<p style="text-align:center; color:red; grid-column: 1/-1;">Error loading vehicles</p>';
      return;
    }

    if (!cars || cars.length === 0) {
      featuredContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No vehicles available</p>';
      return;
    }

    featuredContainer.innerHTML = cars
      .map(car => `
        <div class="car-card">
          <div class="car-image-container">
            <img src="${car.image || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${car.name}">
            ${getStatusBadge(car.status)}
          </div>
          <h3>${car.name}</h3>
          <p><strong>Price:</strong> ${formatPrice(car.price)}</p>
          <p><strong>Mileage:</strong> ${car.mileage ? car.mileage.toLocaleString() + ' km' : 'N/A'}</p>
          <a href="car.html?id=${car.id}" class="btn small">View Details</a>
        </div>
      `)
      .join("");
  } catch (err) {
    console.error('Unexpected error:', err);
    featuredContainer.innerHTML = '<p style="text-align:center; color:red; grid-column: 1/-1;">Failed to load vehicles</p>';
  }
}

// ===== INVENTORY PAGE (fetch from Supabase) =====
const inventoryContainer = document.getElementById("inventory-list");
if (inventoryContainer) {
  loadInventory();
}

async function loadInventory() {
  try {
    const { data: cars, error } = await supabaseClient
      .from('cars')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error fetching cars:', error);
      inventoryContainer.innerHTML = '<p style="text-align:center; color:red; grid-column: 1/-1;">Error loading vehicles</p>';
      return;
    }

    if (!cars || cars.length === 0) {
      inventoryContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No vehicles available</p>';
      return;
    }

    inventoryContainer.innerHTML = cars
      .map(car => `
        <div class="car-card">
          <div class="car-image-container">
            <img src="${car.image || 'https://via.placeholder.com/400x300?text=No+Image'}" alt="${car.name}">
            ${getStatusBadge(car.status)}
          </div>
          <h3>${car.name}</h3>
          <p><strong>Price:</strong> ${formatPrice(car.price)}</p>
          <p><strong>Mileage:</strong> ${car.mileage ? car.mileage.toLocaleString() + ' km' : 'N/A'}</p>
          <p style="font-size: 0.85rem; color: ${car.accident_status === 'clean' ? '#00c853' : '#ff9800'};">
            ${car.accident_status === 'clean' ? '✓ Clean' : '⚠ Accidented'}
          </p>
          <a href="car.html?id=${car.id}" class="btn small">View Details</a>
        </div>
      `)
      .join("");
  } catch (err) {
    console.error('Unexpected error:', err);
    inventoryContainer.innerHTML = '<p style="text-align:center; color:red; grid-column: 1/-1;">Failed to load vehicles</p>';
  }
}

// ===== CAR DETAILS PAGE (fetch from Supabase with multiple images) =====
const carDetailsContainer = document.getElementById("car-details");
if (carDetailsContainer) {
  loadCarDetails();
}

async function loadCarDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"));

  if (!id) {
    carDetailsContainer.innerHTML = '<p style="text-align:center;">Car ID not found</p>';
    return;
  }

  try {
    // Fetch car details
    const { data: car, error: carError } = await supabaseClient
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();

    if (carError || !car) {
      console.error('Error fetching car:', carError);
      carDetailsContainer.innerHTML = '<p style="text-align:center;">Car not found</p>';
      return;
    }

    console.log('Car loaded:', car);

    // Fetch car images
    const { data: images, error: imagesError } = await supabaseClient
      .from('car_images')
      .select('*')
      .eq('car_id', id)
      .order('display_order', { ascending: true });

    if (imagesError) {
      console.error('Error fetching images:', imagesError);
    }

    console.log(`Images for car ${id}:`, images);

    // Build images array
    let carImages = [];
    if (images && images.length > 0) {
      carImages = images.map(img => img.image_url);
    } else if (car.image) {
      carImages = [car.image];
    } else {
      carImages = ['https://via.placeholder.com/500x350?text=No+Image'];
    }

    console.log('Final image URLs:', carImages);

    // Format mileage
    const formattedMileage = car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A';
    
    // Accident status badge
    const getAccidentBadge = (status, repairStatus) => {
      if (status === 'clean') {
        return '<span style="color: #00c853; font-weight: bold;">✓ Clean Title</span>';
      } else if (status === 'accidented') {
        if (repairStatus === 'fixed') {
          return '<span style="color: #00c853; font-weight: bold;">⚠ Previously Accidented (Fully Repaired)</span>';
        } else if (repairStatus === 'being_fixed') {
          return '<span style="color: #ff9800; font-weight: bold;">⚠ Previously Accidented (Being Repaired)</span>';
        } else {
          return '<span style="color: #e11; font-weight: bold;">⚠ Previously Accidented</span>';
        }
      }
      return 'N/A';
    };
    
    // Repair status badge
    const getRepairStatusBadge = (repairStatus) => {
      if (repairStatus === 'fixed') {
        return '<span style="color: #00c853; font-weight: bold;">✓ All Repairs Complete</span>';
      } else if (repairStatus === 'being_fixed') {
        return '<span style="color: #ff9800; font-weight: bold;">🔧 Currently Being Repaired</span>';
      } else if (repairStatus === 'not_applicable') {
        return '<span style="color: #00c853; font-weight: bold;">✓ No Repairs Needed</span>';
      }
      return 'N/A';
    };
    
    // Reserve button
    const isAvailable = car.status === "available";
    const reserveButtonHTML = isAvailable
      ? `<a href="#" class="btn reserve-btn">Reserve This Car</a>`
      : `<a href="#" class="btn" style="background: #666; cursor: not-allowed;" onclick="return false;">Vehicle Reserved</a>`;

    carDetailsContainer.innerHTML = `
      <div class="car-details-content">
        <div class="image-gallery">
          <div class="main-image">
            <img id="main-img" src="${carImages[0]}" alt="${car.name}">
            ${getStatusBadge(car.status)}
          </div>
          ${carImages.length > 1 ? `
          <div class="thumbnail-container">
            ${carImages.map((img, index) => `
              <img class="thumbnail ${index === 0 ? 'active' : ''}" 
                   src="${img}" 
                   alt="${car.name} ${index + 1}" 
                   onclick="window.changeCarImage('${img}', this)">
            `).join('')}
          </div>
          ` : ''}
          <div class="car-primary-info">
            <h1>${car.name}</h1>
            <p class="price-large">${formatPrice(car.price)}</p>
            <p class="deposit-info">Deposit: ${formatPrice(car.deposit_amount)}</p>
            ${reserveButtonHTML}
          </div>
        </div>

        <div class="car-info">
          <h3 style="margin-top: 0; margin-bottom: 1rem; color: #e11;">Vehicle Details</h3>
          <p><strong>Mileage:</strong> ${formattedMileage}</p>
          <p><strong>Exterior Color:</strong> ${car.exterior_color || 'N/A'}</p>
          <p><strong>Interior Color:</strong> ${car.interior_color || 'N/A'}</p>
          <p><strong>Transmission:</strong> ${car.transmission || 'N/A'}</p>
          <p><strong>Drivetrain:</strong> ${car.drivetrain || 'N/A'}</p>
          <p><strong>Engine:</strong> ${car.engine || 'N/A'}</p>
          <p><strong>Fuel Type:</strong> ${car.fuel_type || 'N/A'}</p>
          
          <hr style="margin: 1.5rem 0; border: none; border-top: 2px solid #eee;">
          
          <h3 style="margin-bottom: 1rem; color: #e11;">Condition</h3>
          <p><strong>Accident History:</strong> ${getAccidentBadge(car.accident_status, car.fully_repaired)}</p>
          ${car.accident_details ? `<p style="color: #666; font-size: 0.9rem; margin-left: 1rem; margin-top: 0.5rem;"><em>${car.accident_details}</em></p>` : ''}
          
          <hr style="margin: 1.5rem 0; border: none; border-top: 2px solid #eee;">
          
          <p><strong>Status:</strong> ${getStatusBadge(car.status)}</p>
        </div>
      </div>
    `;

    // Attach reserve button handler
    if (isAvailable) {
      setTimeout(() => {
        const reserveButton = document.querySelector('.reserve-btn');
        if (reserveButton) {
          reserveButton.addEventListener('click', function(e) {
            e.preventDefault();
            showCustomerInfoModal(car.id);
          });
        }
      }, 100);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    carDetailsContainer.innerHTML = '<p style="text-align:center; color:red;">Failed to load car details</p>';
  }
}

// ===== CONTACT POPUP FUNCTIONALITY =====
document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup");
  const openBtn = document.getElementById("book-btn");
  const closeBtn = document.getElementById("close-popup");
  const emailForm = document.getElementById("emailForm");

  if (!popup) return;

  if (openBtn) {
    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      popup.style.display = "flex";
      const firstInput = popup.querySelector("input, textarea, button");
      if (firstInput) firstInput.focus();
      document.body.style.overflow = "hidden";
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      popup.style.display = "none";
      document.body.style.overflow = "";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.style.display = "none";
      document.body.style.overflow = "";
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popup.style.display === "flex") {
      popup.style.display = "none";
      document.body.style.overflow = "";
    }
  });

  if (emailForm) {
    emailForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(emailForm);

      const response = await fetch(emailForm.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" }
      });

      if (response.ok) {
        alert("Thanks! Your appointment request has been sent.");
        emailForm.reset();
        popup.style.display = "none";
        document.body.style.overflow = "";
      } else {
        alert("Oops! Something went wrong. Please try again later.");
      }
    });
  }
});

// ===== CUSTOMER INFO MODAL =====
function showCustomerInfoModal(carId) {
  // Create modal HTML
  const modalHTML = `
    <div class="customer-info-modal" id="customer-info-modal">
      <div class="customer-info-content">
        <span class="close" id="close-customer-modal">&times;</span>
        <h2>Contact Information</h2>
        <p>Please provide your contact details so we can reach you about this vehicle.</p>
        
        <form class="customer-info-form" id="customer-info-form">
          <label for="customer-name">Full Name *</label>
          <input type="text" id="customer-name" name="name" required>
          <span class="error-message" id="name-error">Please enter your name</span>
          
          <label for="customer-email">Email Address *</label>
          <input type="email" id="customer-email" name="email" required>
          <span class="error-message" id="email-error">Please enter a valid email</span>
          
          <label for="customer-phone">Phone Number *</label>
          <input type="tel" id="customer-phone" name="phone" required placeholder="(514) 555-1234">
          <span class="error-message" id="phone-error">Please enter your phone number</span>
          
          <button type="submit" class="btn">Continue to Payment</button>
        </form>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const modal = document.getElementById('customer-info-modal');
  const closeBtn = document.getElementById('close-customer-modal');
  const form = document.getElementById('customer-info-form');
  
  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Close modal handlers
  closeBtn.addEventListener('click', () => {
    modal.remove();
    document.body.style.overflow = '';
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      document.body.style.overflow = '';
    }
  });
  
  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('customer-name').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    
    // Basic validation
    let isValid = true;
    
    if (!name) {
      document.getElementById('name-error').style.display = 'block';
      isValid = false;
    } else {
      document.getElementById('name-error').style.display = 'none';
    }
    
    if (!email || !email.includes('@')) {
      document.getElementById('email-error').style.display = 'block';
      isValid = false;
    } else {
      document.getElementById('email-error').style.display = 'none';
    }
    
    if (!phone) {
      document.getElementById('phone-error').style.display = 'block';
      isValid = false;
    } else {
      document.getElementById('phone-error').style.display = 'none';
    }
    
    if (!isValid) return;
    
    // Store customer info and proceed to checkout
    modal.remove();
    document.body.style.overflow = '';
    startCheckout(carId, { name, email, phone });
  });
}

// ===== STRIPE CHECKOUT INTEGRATION =====
async function startCheckout(carId, customerInfo) {
  try {
    const reserveButton = document.querySelector('.reserve-btn');
    const originalText = reserveButton.textContent;
    reserveButton.textContent = 'Loading...';
    reserveButton.disabled = true;
    reserveButton.style.opacity = '0.6';

    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        carId: carId,
        customerInfo: customerInfo 
      })
    });

    const data = await response.json();

    if (data.error) {
      alert('Error: ' + data.error);
      reserveButton.textContent = originalText;
      reserveButton.disabled = false;
      reserveButton.style.opacity = '1';
      return;
    }

    if (data.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to start checkout. Please try again.');
    
    const reserveButton = document.querySelector('.reserve-btn');
    if (reserveButton) {
      reserveButton.textContent = 'Reserve This Car';
      reserveButton.disabled = false;
      reserveButton.style.opacity = '1';
    }
  }
}