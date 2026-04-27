type Product = {
    id: string;
    name: string;
    price: string;
    img: string;
    quantity?: number;
};

type User = {
    id: string;
    name: string;
    surname: string;
    phone: string;
    avatar: string;
    createdAt: string;
};

type Order = {
    id: string;
    userId: string;
    items: Product[];
    total: number;
    date: string;
};

const CART_KEY = "kaira_cart";
const USERS_KEY = "kaira_users";
const CURRENT_USER_KEY = "kaira_current_user";
const ORDERS_KEY = "kaira_orders";

function getFromStorage<T>(key: string, fallback: T): T {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) as T : fallback;
    } catch {
        return fallback;
    }
}

function saveToStorage<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
}

function showToast(message: string): void {
    const toast = document.getElementById("toast");

    if (!toast) {
        alert(message);
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function getPriceNumber(price: string): number {
    return Number(String(price).replace(/[^0-9.]/g, "")) || 0;
}

function getCart(): Product[] {
    return getFromStorage<Product[]>(CART_KEY, []);
}

function saveCart(cart: Product[]): void {
    saveToStorage(CART_KEY, cart);
}

function getUsers(): User[] {
    return getFromStorage<User[]>(USERS_KEY, []);
}

function saveUsers(users: User[]): void {
    saveToStorage(USERS_KEY, users);
}

function getOrders(): Order[] {
    return getFromStorage<Order[]>(ORDERS_KEY, []);
}

function saveOrders(orders: Order[]): void {
    saveToStorage(ORDERS_KEY, orders);
}

function getCurrentUser(): User | null {
    const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
    if (!currentUserId) return null;

    return getUsers().find((user) => user.id === currentUserId) || null;
}

function setCurrentUser(userId: string): void {
    localStorage.setItem(CURRENT_USER_KEY, userId);
}

function logoutUser(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
}

function initSlider(): void {
    const wrapper = document.querySelector(".slider__wrapper") as HTMLElement | null;
    const arrow = document.getElementById("arrow") as HTMLElement | null;

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

function initCatalogButton(): void {
    const btn = document.querySelector(".catalog-btn") as HTMLElement | null;
    const footer = document.querySelector(".footer-block") as HTMLElement | null;

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

function initAddToCart(): void {
    document.querySelectorAll(".card__btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const button = btn as HTMLElement;
            const card = button.closest(".card");
            if (!card) return;

            const product: Product = {
                id: button.getAttribute("data-id") || String(Date.now()),
                name: (card.querySelector(".card__name") as HTMLElement | null)?.textContent?.trim() || "Товар",
                price: (card.querySelector(".card__price") as HTMLElement | null)?.textContent?.trim() || "$0",
                img: (card.querySelector("img") as HTMLImageElement | null)?.getAttribute("src") || "",
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
            button.textContent = "В корзине";
            showToast("Товар добавлен в корзину");
        });
    });
}

function renderCart(): void {
    const container = document.querySelector(".cart-list") as HTMLElement | null;
    const totalEl = document.querySelector(".cart-total") as HTMLElement | null;
    const countEl = document.querySelector(".cart-count") as HTMLElement | null;
    const payBtn = document.querySelector(".cart-pay") as HTMLButtonElement | null;

    if (!container || !totalEl || !countEl) return;

    const cart = getCart();
    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = `<p class="cart-empty">Корзина пустая. Перейдите в каталог и добавьте товары.</p>`;
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
            const index = Number((btn as HTMLElement).getAttribute("data-index"));
            const updatedCart = getCart();
            updatedCart.splice(index, 1);
            saveCart(updatedCart);
            renderCart();
        });
    });
}

function pay(): void {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        showToast("Сначала войдите или зарегистрируйтесь");
        setTimeout(() => {
            location.href = "profile.html";
        }, 900);
        return;
    }

    const cart = getCart();

    if (cart.length === 0) {
        showToast("Корзина пустая");
        return;
    }

    const total = cart.reduce((sum, item) => {
        return sum + getPriceNumber(item.price) * (item.quantity || 1);
    }, 0);

    const order: Order = {
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

    showToast("Оплата прошла успешно. Покупки добавлены в профиль. Заходите к нам почаще!");
    setTimeout(() => {
        location.href = "profile.html";
    }, 900);
}

(window as any).pay = pay;

function renderProfileHistory(user: User | null): void {
    const container = document.querySelector(".profile-history") as HTMLElement | null;
    if (!container) return;

    if (!user) {
        container.innerHTML = `<p class="profile-empty">Войдите в профиль, чтобы увидеть покупки.</p>`;
        return;
    }

    const orders = getOrders().filter((order) => order.userId === user.id);

    if (orders.length === 0) {
        container.innerHTML = `<p class="profile-empty">Покупок пока нет.</p>`;
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

function initProfile(): void {
    const profilePage = document.querySelector(".profile-page");
    if (!profilePage) return;

    const nameInput = document.querySelector('input[placeholder="Имя"]') as HTMLInputElement | null;
    const surnameInput = document.querySelector('input[placeholder="Фамилия"]') as HTMLInputElement | null;
    const phoneInput = document.querySelector('input[placeholder="Телефон"]') as HTMLInputElement | null;
    const registerBtn = document.querySelector(".profile__btn") as HTMLButtonElement | null;
    const loginBtn = document.querySelector(".login-btn") as HTMLButtonElement | null;
    const logoutBtn = document.querySelector(".logout-btn") as HTMLButtonElement | null;
    const form = document.querySelector(".profile-form") as HTMLElement | null;
    const profileView = document.querySelector(".profile-view") as HTMLElement | null;
    const profileTitle = document.querySelector(".profile__title") as HTMLElement | null;
    const viewName = document.getElementById("viewName");
    const viewSurname = document.getElementById("viewSurname");
    const viewPhone = document.getElementById("viewPhone");
    const viewAvatar = document.getElementById("viewAvatar");
    const avatars = document.querySelectorAll(".avatar-option");

    if (!nameInput || !surnameInput || !phoneInput || !registerBtn || !loginBtn || !logoutBtn || !form || !profileView) return;

    let selectedAvatar = "moon-outline";

    function setActiveAvatar(avatarName: string): void {
        selectedAvatar = avatarName;
        avatars.forEach((avatar) => {
            const iconName = avatar.getAttribute("name") || "";
            avatar.classList.toggle("active", iconName === avatarName);
        });
    }

    function clearForm(): void {
        nameInput.value = "";
        surnameInput.value = "";
        phoneInput.value = "";
        setActiveAvatar("moon-outline");
    }

    function showForm(): void {
        form.style.display = "block";
        profileView.style.display = "none";
        if (profileTitle) profileTitle.textContent = "Регистрация/Вход";
        renderProfileHistory(null);
    }

    function showProfile(user: User): void {
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

        const newUser: User = {
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
    if (currentUser) {
        showProfile(currentUser);
    } else {
        showForm();
    }
}

function initContactModal(): void {
    const modal = document.getElementById("contactModal") as HTMLElement | null;
    const openBtn = document.getElementById("contactBtn") as HTMLElement | null;
    const closeBtn = document.getElementById("modalClose") as HTMLElement | null;

    if (openBtn && modal) {
        openBtn.addEventListener("click", () => {
            modal.style.display = "flex";
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.style.display = "none";
        });
    }
}

function initMobileMenu(): void {
    const mobileMenu = document.querySelector(".mobile-menu") as HTMLElement | null;
    const mobileMenuOpen = document.querySelector(".mobile-menu-toggle") as HTMLElement | null;
    const mobileMenuClose = document.querySelector(".mobile-menu__close") as HTMLElement | null;

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
