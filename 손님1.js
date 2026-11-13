import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA6Cp4wtBdLj5qccadneCWfCSe2qfg1FDU",
    authDomain: "deliverywawa.firebaseapp.com",
    databaseURL: "https://deliverywawa-default-rtdb.firebaseio.com",
    projectId: "deliverywawa",
    storageBucket: "deliverywawa.firebasestorage.app",
    messagingSenderId: "137660899274",
    appId: "1:137660899274:web:957d0dc6e86715c3a6f933",
    measurementId: "G-1KRDR5LGD8"
};

let db, menuRef;
try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    menuRef = ref(db, 'menus');
} catch (e) {
    console.error("Firebase 초기화 오류:", e);
}

document.addEventListener('DOMContentLoaded', () => {
    const categoryBtnGrid = document.getElementById('categoryBtnGrid');
    const menuGrid = document.getElementById('menuGrid');
    const currentCategoryTitle = document.getElementById('currentCategoryTitle');
    const cartList = document.getElementById('cartList');
    const totalPriceEl = document.getElementById('totalPrice');
    const cartBadge = document.getElementById('cartBadge');
    const orderBtn = document.getElementById('orderBtn');
    const orderStatusBtn = document.getElementById('orderStatusBtn');
    const backBtn = document.getElementById('backBtn');

    let menus = [];
    let cart = []; 
    let selectedCategory = null; 
    let isMenuLoadError = false;

    if (menuRef) {
        onValue(menuRef, (snapshot) => {
            isMenuLoadError = false;
            const data = snapshot.val();
            if (data) {
                menus = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
            } else {
                menus = [];
            }

            if (selectedCategory) {
                renderMenus();
            }
        }, (error) => {
            console.error("메뉴 조회 실패:", error);
            isMenuLoadError = true;
            menuGrid.innerHTML = `<div class="no-menu" style="color: #ff6b6b;">메뉴를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>`;
        });
    } else {
        isMenuLoadError = true;
        menuGrid.innerHTML = `<div class="no-menu" style="color: #ff6b6b;">메뉴를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>`;
    }

    categoryBtnGrid.addEventListener('click', (e) => {
        if (!e.target.classList.contains('cat-select-btn')) return;

        document.querySelectorAll('.cat-select-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        selectedCategory = e.target.dataset.category;
        currentCategoryTitle.textContent = `🍽️ [${selectedCategory}] 메뉴판`;
        
        renderMenus();
    });

    function renderMenus() {
        menuGrid.innerHTML = '';

        if (isMenuLoadError) {
            menuGrid.innerHTML = `<div class="no-menu" style="color: #ff6b6b;">메뉴를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>`;
            return;
        }

        if (!selectedCategory) {
            menuGrid.innerHTML = `<div class="no-menu">위에서 카테고리를 선택해 주세요! 🐾</div>`;
            return;
        }

        const filteredMenus = menus.filter(menu => menu.category === selectedCategory);

        if (filteredMenus.length === 0) {
            menuGrid.innerHTML = `<div class="no-menu">등록된 메뉴가 없습니다</div>`;
            return;
        }

        filteredMenus.forEach((menu) => {
            const card = document.createElement('div');
            card.className = 'menu-card';
            card.innerHTML = `
                <div class="card-name">${menu.name}</div>
                <div class="card-price">${menu.price}원</div>
                <button class="add-cart-btn" data-id="${menu.id}" data-name="${menu.name}" data-price="${menu.price}">담기</button>
            `;
            menuGrid.appendChild(card);
        });
    }

    menuGrid.addEventListener('click', (e) => {
        if (!e.target.classList.contains('add-cart-btn')) return;
        const id = e.target.dataset.id;
        const name = e.target.dataset.name;
        const priceStr = e.target.dataset.price;
        addToCart(id, name, priceStr);
    });

    function addToCart(id, name, priceStr) {
        const price = Number(String(priceStr).replace(/,/g, ''));
        const existingItem = cart.find(item => item.id === id && item.name === name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }
        renderCart();
    }

    cartList.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
        if (index === undefined) return;

        if (e.target.classList.contains('plus-btn')) {
            cart[index].quantity += 1;
        } else if (e.target.classList.contains('minus-btn')) {
            cart[index].quantity -= 1;
            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }
        } else if (e.target.classList.contains('delete-item-btn')) {
            cart.splice(index, 1);
        }
        renderCart();
    });

    function renderCart() {
        cartList.innerHTML = '';

        if (cart.length === 0) {
            cartList.innerHTML = `<li class="empty-cart">장바구니가 비어 있습니다.</li>`;
            totalPriceEl.textContent = '0원';
            cartBadge.textContent = '0';
            return;
        }

        let totalPrice = 0;
        let totalCount = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            totalCount += item.quantity;

            const li = document.createElement('li');
            li.className = 'cart-item';
            li.innerHTML = `
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-price">${itemTotal.toLocaleString()}원 (${item.quantity}개)</span>
                </div>
                <div class="cart-item-controls">
                    <button class="plus-btn" data-index="${index}">+</button>
                    <button class="minus-btn" data-index="${index}">-</button>
                    <button class="delete-item-btn" data-index="${index}">✕</button>
                </div>
            `;
            cartList.appendChild(li);
        });

        totalPriceEl.textContent = `${totalPrice.toLocaleString()}원`;
        cartBadge.textContent = totalCount;
    }

    // 주문하기 클릭 -> 팝업 확인 후 손님2.html로 이동
    orderBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('장바구니에 담긴 메뉴가 없습니다!');
            return;
        }

        if (db) {
            const ordersRef = ref(db, 'orders');
            const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const createdAt = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            const orderData = {
                items: cart,
                totalPrice,
                status: '접수대기',
                createdAt
            };

            const newOrderRef = push(ordersRef, orderData);
            newOrderRef
                .then(() => {
                    // 손님2 화면에서 내 주문 내역과 실시간 상태를 추적하기 위해 로컬에 저장
                    const myOrders = JSON.parse(localStorage.getItem('myWawaOrders')) || [];
                    myOrders.push({
                        id: newOrderRef.key,
                        ...orderData
                    });
                    localStorage.setItem('myWawaOrders', JSON.stringify(myOrders));

                    alert('성공적으로 주문이 완료되었습니다! 🐾 맛있게 준비해 드릴게요.');
                    cart = [];
                    renderCart();
                    location.href = '손님2.html';
                })
                .catch((error) => {
                    console.error("주문 실패:", error);
                    alert("주문 전송 중 오류가 발생했습니다.");
                });
        } else {
            alert("데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        }
    });

    // 주문현황확인 버튼 클릭 -> 손님2.html로 이동
    if (orderStatusBtn) {
        orderStatusBtn.addEventListener('click', () => {
            location.href = '손님2.html';
        });
    }

    backBtn.addEventListener('click', () => {
        location.href = 'index.html';
    });
});
