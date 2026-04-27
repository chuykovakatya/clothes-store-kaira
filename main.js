const CART_KEY = "kaira_cart";
const USERS_KEY = "kaira_users";
const CURRENT_USER_KEY = "kaira_current_user";
const ORDERS_KEY = "kaira_orders";

function getFromStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        return fallback;
    }
}

function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) {
        alert(message);
        return;
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}

function getPriceNumber(price) {
    return Number(String(price).replace(/[^0-9.]/g, "")) || 0;
}

function getCart() {
    return getFromStorage(CART_KEY, []);
}

function saveCart(cart) {
    saveToStorage(CART_KEY, cart);
}

function getUsers() {
    return getFromStorage(USERS_KEY, []);
}

function saveUsers(users) {
    saveToStorage(USERS_KEY, users);
}

function getOrders() {
    return getFromStorage(ORDERS_KEY, []);
}

function saveOrders(orders) {
    saveToStorage(ORDERS_KEY, orders);
}

function getCurrentUser() {
    const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
    if (!currentUserId) return null;
    return getUsers().find((user) => user.id === currentUserId) || null;
}

function setCurrentUser(userId) {
    localStorage.setItem(CURRENT_USER_KEY, userId);
}

function logoutUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
}

function initSlider() {
    const wrapper = document.querySelector(".slider__wrapper");
    const arrow = document.getElementById("arrow");
    if (!wrapper || !arrow) return;

    let currentSlide = 0;
    const slides = document.querySelectorAll(".slider__item");
    const totalSlides = slides.length;
    let startX = 0;

    wrapper.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
    });

    wrapper.addEventListener("touchend", (e) => {
        const endX = e.changedTouches[0].clientX;
        if (startX - endX > 50) currentSlide++;
        if (endX - startX > 50) currentSlide--;
        if (currentSlide >= totalSlides) currentSlide = 0;
        if (currentSlide < 0) currentSlide = totalSlides - 1;
        wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
    });

    arrow.addEventListener("click", () => {
        currentSlide++;
        if (currentSlide >= totalSlides) currentSlide = 0;
        wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
    });
}

function initCatalogButton() {
    const btn = document.querySelector(".catalog-btn");
    const footer = document.querySelector(".footer-block");
    if (!btn || !footer) return;

    window.addEventListener("scroll", () => {
        const footerTop = footer.getBoundingClientRect().top;
        const screenHeight = window.innerHeight;
        if (footerTop <= screenHeight - 100) {
            btn.style.opacity = "0";
            btn.style.pointerEvents = "none";
        } else {
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
        }
    });
}

function initAddToCart() {
    document.querySelectorAll(".card__btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const card = btn.closest(".card");
            if (!card) return;

            const product = {
                id: btn.getAttribute("data-id") || String(Date.now()),
                name: card.querySelector(".card__name")?.textContent?.trim() || "Товар",
                price: card.querySelector(".card__price")?.textContent?.trim() || "$0",
                img: card.querySelector("img")?.getAttribute("src") || "",
                quantity: 1
            };

            const cart = getCart();
            const existingProduct = cart.find((item) => item.id === product.id);
            if (existingProduct) {
                existingProduct.quantity = (existingProduct.quantity || 1) + 1;
            } else {
                cart.push(product);
            }

            saveCart(cart);
            btn.textContent = "В корзине";
            showToast("Товар добавлен в корзину");
        });
    });
}

function renderCart() {
    const container = document.querySelector(".cart-list");
    const totalEl = document.querySelector(".cart-total");
    const countEl = document.querySelector(".cart-count");
    const payBtn = document.querySelector(".cart-pay");
    if (!container || !totalEl || !countEl) return;

    const cart = getCart();
    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = '<p class="cart-empty">Корзина пустая. Перейдите в каталог и добавьте товары.</p>';
        countEl.textContent = "Товаров: 0";
        totalEl.textContent = "Итого: $0";
        if (payBtn) payBtn.disabled = true;
        return;
    }

    let total = 0;
    let count = 0;

    cart.forEach((item, index) => {
        const quantity = item.quantity || 1;
        total += getPriceNumber(item.price) * quantity;
        count += quantity;

        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="cart-item__info">
                <p class="cart-item__name">${item.name}</p>
                <p class="cart-item__price">${item.price}</p>
                <p class="cart-item__quantity">Количество: ${quantity}</p>
            </div>
            <button class="cart-item__delete" type="button" data-index="${index}">Удалить</button>
        `;
        container.appendChild(div);
    });

    countEl.textContent = "Товаров: " + count;
    totalEl.textContent = "Итого: $" + total.toFixed(2);
    if (payBtn) payBtn.disabled = false;

    document.querySelectorAll(".cart-item__delete").forEach((btn) => {
        btn.addEventListener("click", () => {
            const index = Number(btn.getAttribute("data-index"));
            const updatedCart = getCart();
            updatedCart.splice(index, 1);
            saveCart(updatedCart);
            renderCart();
        });
    });
}

function pay() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast("Сначала войдите или зарегистрируйтесь");
        setTimeout(() => location.href = "profile.html", 900);
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        showToast("Корзина пустая");
        return;
    }

    const total = cart.reduce((sum, item) => sum + getPriceNumber(item.price) * (item.quantity || 1), 0);
    const order = {
        id: "order-" + Date.now(),
        userId: currentUser.id,
        items: cart,
        total,
        date: new Date().toISOString()
    };

    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);
    saveCart([]);

    showToast("Оплата прошла успешно. Покупки добавлены в профиль");
    setTimeout(() => location.href = "profile.html", 900);
}

window.pay = pay;

function renderProfileHistory(user) {
    const container = document.querySelector(".profile-history");
    if (!container) return;

    if (!user) {
        container.innerHTML = '<p class="profile-empty">Войдите в профиль, чтобы увидеть покупки.</p>';
        return;
    }

    const orders = getOrders().filter((order) => order.userId === user.id);
    if (orders.length === 0) {
        container.innerHTML = '<p class="profile-empty">Покупок пока нет.</p>';
        return;
    }

    container.innerHTML = orders.map((order) => {
        const date = new Date(order.date).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
        const itemsHtml = order.items.map((item) => `
            <div class="history-product">
                <img src="${item.img}" alt="${item.name}">
                <div>
                    <p class="history-product__name">${item.name}</p>
                    <p>${item.price} × ${item.quantity || 1}</p>
                </div>
            </div>
        `).join("");
        return `
            <article class="history-item">
                <div class="history-item__top">
                    <b>Заказ ${order.id.replace("order-", "#")}</b>
                    <span>${date}</span>
                </div>
                ${itemsHtml}
                <p class="history-item__total">Сумма: $${order.total.toFixed(2)}</p>
            </article>
        `;
    }).join("");
}

function initProfile() {
    if (!document.querySelector(".profile-page")) return;

    const nameInput = document.querySelector('input[placeholder="Имя"]');
    const surnameInput = document.querySelector('input[placeholder="Фамилия"]');
    const phoneInput = document.querySelector('input[placeholder="Телефон"]');
    const registerBtn = document.querySelector(".profile__btn");
    const loginBtn = document.querySelector(".login-btn");
    const logoutBtn = document.querySelector(".logout-btn");
    const form = document.querySelector(".profile-form");
    const profileView = document.querySelector(".profile-view");
    const profileTitle = document.querySelector(".profile__title");
    const viewName = document.getElementById("viewName");
    const viewSurname = document.getElementById("viewSurname");
    const viewPhone = document.getElementById("viewPhone");
    const viewAvatar = document.getElementById("viewAvatar");
    const avatars = document.querySelectorAll(".avatar-option");

    if (!nameInput || !surnameInput || !phoneInput || !registerBtn || !loginBtn || !logoutBtn || !form || !profileView) return;

    let selectedAvatar = "moon-outline";

    function setActiveAvatar(avatarName) {
        selectedAvatar = avatarName;
        avatars.forEach((avatar) => {
            const iconName = avatar.getAttribute("name") || "";
            avatar.classList.toggle("active", iconName === avatarName);
        });
    }

    function clearForm() {
        nameInput.value = "";
        surnameInput.value = "";
        phoneInput.value = "";
        setActiveAvatar("moon-outline");
    }

    function showForm() {
        form.style.display = "block";
        profileView.style.display = "none";
        if (profileTitle) profileTitle.textContent = "Регистрация или вход";
        renderProfileHistory(null);
    }

    function showProfile(user) {
        form.style.display = "none";
        profileView.style.display = "block";
        if (profileTitle) profileTitle.textContent = "Мой профиль";
        if (viewName) viewName.textContent = user.name;
        if (viewSurname) viewSurname.textContent = user.surname;
        if (viewPhone) viewPhone.textContent = user.phone;
        if (viewAvatar) viewAvatar.innerHTML = `<ion-icon name="${user.avatar}"></ion-icon>`;
        renderProfileHistory(user);
    }

    avatars.forEach((avatar) => {
        avatar.addEventListener("click", () => {
            setActiveAvatar(avatar.getAttribute("name") || "moon-outline");
        });
    });

    registerBtn.addEventListener("click", () => {
        const name = nameInput.value.trim();
        const surname = surnameInput.value.trim();
        const phone = phoneInput.value.trim();

        if (!name || !surname || !phone) {
            showToast("Заполните имя, фамилию и телефон");
            return;
        }

        const users = getUsers();
        const existingUser = users.find((user) => user.phone === phone);
        if (existingUser) {
            showToast("Пользователь с таким телефоном уже есть. Нажмите «Войти»");
            return;
        }

        const newUser = {
            id: "user-" + Date.now(),
            name,
            surname,
            phone,
            avatar: selectedAvatar,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        saveUsers(users);
        setCurrentUser(newUser.id);
        showToast("Регистрация успешна");
        showProfile(newUser);
    });

    loginBtn.addEventListener("click", () => {
        const phone = phoneInput.value.trim();
        if (!phone) {
            showToast("Введите телефон для входа");
            return;
        }

        const user = getUsers().find((item) => item.phone === phone);
        if (!user) {
            showToast("Пользователь не найден. Зарегистрируйтесь");
            return;
        }

        setCurrentUser(user.id);
        showToast("Вы вошли в профиль");
        showProfile(user);
    });

    logoutBtn.addEventListener("click", () => {
        logoutUser();
        clearForm();
        showForm();
        showToast("Вы вышли из профиля");
    });

    setActiveAvatar("moon-outline");
    const currentUser = getCurrentUser();
    if (currentUser) showProfile(currentUser);
    else showForm();
}

function initContactModal() {
    const modal = document.getElementById("contactModal");
    const openBtn = document.getElementById("contactBtn");
    const closeBtn = document.getElementById("modalClose");

    if (openBtn && modal) openBtn.addEventListener("click", () => modal.style.display = "flex");
    if (closeBtn && modal) closeBtn.addEventListener("click", () => modal.style.display = "none");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.style.display = "none";
        });
    }
}

function initMobileMenu() {
    const mobileMenu = document.querySelector(".mobile-menu");
    const mobileMenuOpen = document.querySelector(".mobile-menu-toggle");
    const mobileMenuClose = document.querySelector(".mobile-menu__close");
    if (!mobileMenu || !mobileMenuOpen || !mobileMenuClose) return;

    mobileMenuOpen.addEventListener("click", () => {
        mobileMenu.classList.add("active");
        document.body.style.overflow = "hidden";
    });

    mobileMenuClose.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        document.body.style.overflow = "";
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            mobileMenu.classList.remove("active");
            document.body.style.overflow = "";
        });
    });
}

window.addEventListener("DOMContentLoaded", () => {
    initSlider();
    initCatalogButton();
    initAddToCart();
    renderCart();
    initProfile();
    initContactModal();
    initMobileMenu();
});

/* ===== Product detail cards for catalog and main slider ===== */
const KAIRA_PRODUCTS = {
    "1": {
        id: "1",
        name: "Рубашка",
        price: "$25.00",
        img: "./figma/одежда/image 1.png",
        category: "Женская рубашка",
        description: "Свободная рубашка в классическом стиле. Подходит для повседневных образов, офиса и вечерних сочетаний.",
        material: "Хлопок, мягкая костюмная ткань",
        sizes: "XS, S, M, L",
        color: "Молочный / светлый"
    },
    "2": {
        id: "2",
        name: "Костюм",
        price: "$50.00",
        img: "./figma/одежда/image 2.png",
        category: "Классический костюм",
        description: "Элегантный костюм с аккуратной посадкой. Можно носить комплектом или отдельно с базовыми вещами.",
        material: "Костюмная ткань",
        sizes: "S, M, L",
        color: "Темный"
    },
    "3": {
        id: "3",
        name: "Платье",
        price: "$70.00",
        img: "./figma/одежда/2026-04-19_17-37-21 1.png",
        category: "Платье миди",
        description: "Лаконичное платье для особых случаев и стильных повседневных образов. Акцент на силуэт и детали.",
        material: "Плотная мягкая ткань",
        sizes: "XS, S, M",
        color: "Нейтральный"
    },
    "4": {
        id: "4",
        name: "Брюки",
        price: "$35.00",
        img: "./figma/одежда/image 3.png",
        category: "Классические брюки",
        description: "Брюки прямого кроя, которые легко сочетать с рубашками, жакетами и базовыми топами.",
        material: "Костюмная ткань",
        sizes: "S, M, L, XL",
        color: "Темный"
    }
};

function addProductToCartById(productId) {
    const item = KAIRA_PRODUCTS[productId];
    if (!item) return;

    const cart = getCart();
    const existingProduct = cart.find((product) => product.id === item.id);
    if (existingProduct) {
        existingProduct.quantity = (existingProduct.quantity || 1) + 1;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            img: item.img,
            quantity: 1
        });
    }

    saveCart(cart);
    showToast("Товар добавлен в корзину");
}

function createProductModal() {
    if (document.querySelector(".product-modal")) return;

    const modal = document.createElement("div");
    modal.className = "product-modal";
    modal.innerHTML = `
        <div class="product-modal__content">
            <button class="product-modal__close" type="button" aria-label="Закрыть">×</button>
            <div class="product-modal__image-wrap">
                <img class="product-modal__image" src="" alt="">
            </div>
            <div class="product-modal__info">
                <p class="product-modal__category"></p>
                <h2 class="product-modal__title"></h2>
                <p class="product-modal__price"></p>
                <p class="product-modal__description"></p>
                <div class="product-modal__details">
                    <p><b>Размеры:</b> <span class="product-modal__sizes"></span></p>
                    <p><b>Материал:</b> <span class="product-modal__material"></span></p>
                    <p><b>Цвет:</b> <span class="product-modal__color"></span></p>
                </div>
                <div class="product-modal__actions">
                    <button class="product-modal__cart" type="button">Добавить в корзину</button>
                    <a class="product-modal__go-cart" href="./cart.html">Перейти в корзину</a>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    };

    modal.querySelector(".product-modal__close").addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("active")) closeModal();
    });
}

function openProductCard(productId) {
    const product = KAIRA_PRODUCTS[productId];
    if (!product) return;

    createProductModal();
    const modal = document.querySelector(".product-modal");
    if (!modal) return;

    modal.querySelector(".product-modal__image").src = product.img;
    modal.querySelector(".product-modal__image").alt = product.name;
    modal.querySelector(".product-modal__category").textContent = product.category;
    modal.querySelector(".product-modal__title").textContent = product.name;
    modal.querySelector(".product-modal__price").textContent = product.price;
    modal.querySelector(".product-modal__description").textContent = product.description;
    modal.querySelector(".product-modal__sizes").textContent = product.sizes;
    modal.querySelector(".product-modal__material").textContent = product.material;
    modal.querySelector(".product-modal__color").textContent = product.color;

    const cartBtn = modal.querySelector(".product-modal__cart");
    cartBtn.onclick = () => addProductToCartById(product.id);

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function initProductCards() {
    document.querySelectorAll(".product-open").forEach((element) => {
        element.addEventListener("click", (event) => {
            event.preventDefault();
            const productId = element.getAttribute("data-id") || element.closest(".product")?.getAttribute("data-id");
            openProductCard(productId);
        });
    });
}

window.addEventListener("DOMContentLoaded", () => {
    initProductCards();
});
