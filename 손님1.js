// Firebase SDK 임포트
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🌟 [중요] 위와 동일한 본인의 Firebase 프로젝트 설정 값 입력
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const menuRef = ref(db, 'menus');

document.addEventListener('DOMContentLoaded', () => {
    const categoryBtnGrid = document.getElementById('categoryBtnGrid');
    const menuGrid = document.getElementById('menuGrid');
    const currentCategoryTitle = document.getElementById('currentCategoryTitle');
    const cartList = document.getElementById('cartList');
    const totalPriceEl = document.getElementById('totalPrice');
    const cartBadge = document.getElementById('cartBadge');
    const orderBtn = document.getElementById('orderBtn');
    const backBtn = document.getElementById('backBtn');

    let menus = []; // 서버에서 실시간으로 받아올 메뉴 배열
    let cart = []; 
    let selectedCategory = null; 

    // 🔄 서버에서 실시간 메뉴 데이터 수신
    onValue(menuRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // 객체 형태로 들어온 데이터를 배열로 변환
            menus = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        } else {
            menus = [];
        }

        // 카테고리가 선택되어 있다면 화면 갱신
        if (selectedCategory) {
            renderMenus();
        }
    });

    // 카테고리 버튼 클릭 이벤트
    categoryBtnGrid.addEventListener('click', (e) => {
        if (!e.target.classList.contains('cat-select-btn')) return;

        document.querySelectorAll('.cat-select-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        selectedCategory = e.target.dataset.category;
        currentCategoryTitle.textContent = `🍽️ [${selectedCategory}] 메뉴판`;
        
        renderMenus();
    });

    // 선택된 카테고리의 메뉴 렌더링
    function renderMenus() {
        menuGrid.innerHTML = '';

        if (!selectedCategory) {
            menuGrid.innerHTML = `<div class="no-menu">위에서 카테고리를 선택해 주세요! 🐾</div>`;
            return;
        }

        const filteredMenus = menus.filter(menu => menu.category === selectedCategory);

        if (filteredMenus.length === 0) {
            menuGrid.innerHTML = `<div class="no-menu">등록된 '${selectedCategory}' 메뉴가 없습니다. 🐾</div>`;
            return;
        }

        filteredMenus.forEach((menu) => {
            const card = document.createElement('div');
            card.className = 'menu-card';
            card.innerHTML = `
                <div class="card-name">${menu.name}</div>
                <div class="card-price">${menu.price}원</div>
                <button class="add-cart-btn" data-name="${menu.name}" data-price="${menu.price}">담기</button>
            `;
            menuGrid.appendChild(card);
        });
    }

    // 장바구니 담기
    menuGrid.addEventListener('click', (e) => {
        if (!e.target.classList.contains('add-cart-btn')) return;
        const name = e.target.dataset.name;
        const priceStr = e.target.dataset.price;
        addToCart(name, priceStr);
    });

    function addToCart(name, priceStr) {
        const price = Number(priceStr.replace(/,/g, ''));
        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ name, price, quantity: 1 });
        }
        renderCart();
    }

    // 장바구니 조작
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

    orderBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('장바구니에 담긴 메뉴가 없습니다!');
            return;
        }
        alert('성공적으로 주문이 완료되었습니다! 🐾 맛있게 준비해 드릴게요.');
        cart = [];
        renderCart();
    });

    backBtn.addEventListener('click', () => {
        location.href = 'index.html';
    });
});
