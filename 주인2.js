import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase 설정
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

let db, menuRef, ordersRef;
try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    menuRef = ref(db, 'menus');
    ordersRef = ref(db, 'orders');
} catch (e) {
    console.error("Firebase 초기화 오류:", e);
}

document.addEventListener('DOMContentLoaded', () => {
    const registeredMenuList = document.getElementById('registeredMenuList');
    const orderList = document.getElementById('orderList');
    const orderCountBadge = document.getElementById('orderCountBadge');
    const menuManageBtn = document.getElementById('menuManageBtn');
    const backBtn = document.getElementById('backBtn');
    
    const modalOverlay = document.getElementById('modalOverlay');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    // 내 컴퓨터에서 등록한 메뉴 Key 목록 로드
    let myMenuKeys = JSON.parse(localStorage.getItem('myWawaMenuKeys')) || [];
    let pendingRemoveOrderId = null; // 삭제 대기 중인 주문 ID

    // 1. 등록된 메뉴 목록 실시간 로드
    if (menuRef) {
        onValue(menuRef, (snapshot) => {
            const data = snapshot.val();
            renderMyRegisteredMenus(data);
        });
    }

    // 2. 주문 내역 실시간 로드
    if (ordersRef) {
        onValue(ordersRef, (snapshot) => {
            const data = snapshot.val();
            renderOrders(data);
        });
    }

    // 🐾 내 컴퓨터에서 등록한 메뉴만 필터링해서 렌더링
    function renderMyRegisteredMenus(data) {
        registeredMenuList.innerHTML = '';
        if (!data) {
            registeredMenuList.innerHTML = '<li class="empty-item">아직 등록한 메뉴가 없습니다.</li>';
            return;
        }

        const validKeys = myMenuKeys.filter(key => data && data[key]);

        if (validKeys.length === 0) {
            registeredMenuList.innerHTML = '<li class="empty-item">아직 등록한 메뉴가 없습니다.</li>';
            return;
        }

        validKeys.forEach((key) => {
            const menu = data[key];
            if (!menu) return;
            const li = document.createElement('li');
            li.innerHTML = `
                <span><b>[${menu.category}]</b> ${menu.name}</span>
                <span style="color: #845ec2; font-weight: bold;">${menu.price}원</span>
            `;
            registeredMenuList.appendChild(li);
        });
    }

    // 주문 내역 렌더링 함수
    function renderOrders(data) {
        orderList.innerHTML = '';

        if (!data) {
            orderList.innerHTML = '<div class="empty-order">현재 들어온 주문이 없습니다. 🐾</div>';
            orderCountBadge.textContent = '신규 0건';
            return;
        }

        const orderKeys = Object.keys(data).reverse();
        orderCountBadge.textContent = `신규 ${orderKeys.length}건`;

        orderKeys.forEach((orderId) => {
            const order = data[orderId];
            const isCooked = order.status === '조리완료';

            const card = document.createElement('div');
            card.className = 'order-item-card';

            const itemsHtml = order.items.map(item => 
                `<li>- ${item.name} x ${item.quantity}개 (${(item.price * item.quantity).toLocaleString()}원)</li>`
            ).join('');

            // 조리 버튼 텍스트 및 클래스
            const cookBtnText = isCooked ? '✓ 조리 완료' : '조리 시작';
            const cookBtnClass = isCooked ? 'action-btn cook-btn completed' : 'action-btn cook-btn';
            
            // 상태 태그
            let statusTagHtml = `<span class="order-status-tag">접수대기</span>`;
            if (isCooked) statusTagHtml = `<span class="order-status-tag done">조리완료</span>`;

            // 🌟 조리가 완료되기 전(!isCooked)에는 배달기사 요청 버튼 비활성화 (disabled)
            const isDeliveryDisabled = !isCooked;

            card.innerHTML = `
                <div class="order-card-header">
                    <span class="order-time">🕒 ${order.createdAt || '방금 전'}</span>
                    ${statusTagHtml}
                </div>
                <ul class="order-items-detail">
                    ${itemsHtml}
                </ul>
                <div class="order-total-price">
                    총 결제금액: ${order.totalPrice ? order.totalPrice.toLocaleString() : 0}원
                </div>
                <div class="order-action-btns">
                    <button class="${cookBtnClass}" data-id="${orderId}">
                        ${cookBtnText}
                    </button>
                    <button class="action-btn delivery-btn" data-id="${orderId}" ${isDeliveryDisabled ? 'disabled' : ''}>
                        배달기사 요청
                    </button>
                </div>
            `;

            orderList.appendChild(card);
        });
    }

    // 버튼 클릭 이벤트
    orderList.addEventListener('click', (e) => {
        const target = e.target;
        const orderId = target.dataset.id;
        if (!orderId) return;

        // [조리시작] <-> [✓ 조리 완료] 토글
        if (target.classList.contains('cook-btn')) {
            const isCurrentlyCompleted = target.classList.contains('completed');
            const newStatus = isCurrentlyCompleted ? '접수대기' : '조리완료';

            update(ref(db, `orders/${orderId}`), { status: newStatus });
        }

        // [배달기사 요청] 클릭 시 (활성화 상태일 때만 동작)
        if (target.classList.contains('delivery-btn') && !target.disabled) {
            pendingRemoveOrderId = orderId; // 삭제할 주문 ID 기록
            modalOverlay.classList.add('active'); // 팝업 띄우기
        }
    });

    // 🌟 팝업 모달 [확인] 누르면 주문 삭제 및 팝업 닫기
    modalCloseBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
        if (pendingRemoveOrderId && db) {
            remove(ref(db, `orders/${pendingRemoveOrderId}`));
            pendingRemoveOrderId = null;
        }
    });

    // 페이지 이동 버튼
    menuManageBtn.addEventListener('click', () => {
        location.href = '주인1.html';
    });

    backBtn.addEventListener('click', () => {
        location.href = 'index.html';
    });
});
