document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 가져오기
    const categoryBtnGrid = document.getElementById('categoryBtnGrid');
    const menuGrid = document.getElementById('menuGrid');
    const currentCategoryTitle = document.getElementById('currentCategoryTitle');
    const cartList = document.getElementById('cartList');
    const totalPriceEl = document.getElementById('totalPrice');
    const cartBadge = document.getElementById('cartBadge');
    const orderBtn = document.getElementById('orderBtn');
    const backBtn = document.getElementById('backBtn');

    // LocalStorage에서 가게 주인이 등록한 메뉴 불러오기
    let menus = JSON.parse(localStorage.getItem('wawaMenus')) || [];
    let cart = []; // 장바구니 배열
    let selectedCategory = null; // 현재 선택된 카테고리

    // 카테고리 버튼 클릭 이벤트
    categoryBtnGrid.addEventListener('click', (e) => {
        if (!e.target.classList.contains('cat-select-btn')) return;

        // 활성 버튼 스타일 전환
        document.querySelectorAll('.cat-select-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        selectedCategory = e.target.dataset.category;
        currentCategoryTitle.textContent = `🍽️ [${selectedCategory}] 메뉴판`;
        
        renderMenus();
    });

    // 선택된 카테고리에 해당하는 메뉴만 화면에 렌더링
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

    // 메뉴 카드 안의 '담기' 버튼 클릭 이벤트 위임
    menuGrid.addEventListener('click', (e) => {
        if (!e.target.classList.contains('add-cart-btn')) return;
        const name = e.target.dataset.name;
        const priceStr = e.target.dataset.price;
        addToCart(name, priceStr);
    });

    // 장바구니에 메뉴 추가
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

    // 장바구니 수량 변경 및 삭제 이벤트 위임
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

    // 장바구니 현황 렌더링 및 총금액 계산
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

    // 주문하기 버튼
    orderBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('장바구니에 담긴 메뉴가 없습니다!');
            return;
        }
        alert('성공적으로 주문이 완료되었습니다! 🐾 맛있게 준비해 드릴게요.');
        cart = [];
        renderCart();
    });

    // 처음으로 버튼
    backBtn.addEventListener('click', () => {
        location.href = 'index.html';
    });
});