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
    let allMenusData = {};
    let allOrdersData = null;
    let pendingRemoveOrderId = null;

    // 1. 등록된 메뉴 목록 실시간 로드
    if (menuRef) {
        onValue(menuRef, (snapshot) => {
            allMenusData = snapshot.val() || {};
            renderMyRegisteredMenus(allMenusData);
            if (allOrdersData !== null) {
                renderOrders(allOrdersData);
            }
        });
    }

    // 2. 주문 내역 실시간 로드
    if (ordersRef) {
        onValue(ordersRef, (snapshot) => {
            allOrdersData = snapshot.val() || {};
            renderOrders(allOrdersData);
        });
    }

    // 내 컴퓨터에서 등록한 메뉴만 필터링해서 렌더링
    function renderMyRegisteredMenus(data) {
        registeredMenuList.innerHTML = '';
        if (!data) {
            registeredMenuList.innerHTML = '<li class="empty-item">등록된 메뉴가 없습니다</li>';
            return;
        }

        const validKeys = myMenuKeys.filter(key => data && data[key]);

        if (validKeys.length === 0) {
            registeredMenuList.innerHTML = '<li class="empty-item">등록된 메뉴가 없습니다</li>';
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

    // 본인 가게에서 등록한 메뉴만 포함된 주문 내역 렌더링
    function renderOrders(data) {
        orderList.innerHTML = '';

        if (!data || Object.keys(data).length === 0) {
            orderList.innerHTML = '<div class="empty-order">현재 들어온 주문이 없습니다. 🐾</div>';
            orderCountBadge.textContent = '신규 0건';
            return;
        }

        // 각 주문에서 '내 가게가 등록한 메뉴'만 추출
        const myFilteredOrders = Object.keys(data)
            .reverse()
            .map((orderId) => {
                const order = data[orderId];
                const myItems = (order.items || []).filter((item) => {
                    if (item.id) {
                        return myMenuKeys.includes(item.id);
                    }
                    return myMenuKeys.some(
                        (key) => allMenusData[key] && allMenusData[key].name === item.name
                    );
                });

                return {
                    orderId,
                    order,
                    myItems
                };
            })
            .filter((entry) => entry.myItems.length > 0);

        if (myFilteredOrders.length === 0) {
            orderList.innerHTML = '<div class="empty-order">현재 들어온 주문이 없습니다. 🐾</div>';
            orderCountBadge.textContent = '신규 0건';
            return;
        }

        orderCountBadge.textContent = `신규 ${myFilteredOrders.length}건`;

        myFilteredOrders.forEach(({ orderId, order, myItems }) => {
            const status = order.status || '접수대기';

            const card = document.createElement('div');
            card.className = 'order-item-card';

            const itemsHtml = myItems.map(item => 
                `<li>- ${item.name} x ${item.quantity}개 (${(item.price * item.quantity).toLocaleString()}원)</li>`
            ).join('');

            const myTotalPrice = myItems.reduce(
                (sum, item) => sum + (item.price * item.quantity),
                0
            );

            // 3단계 상태별 태그, 버튼 문구, 배달버튼 활성화 여부 설정
            let statusTagHtml = `<span class="order-status-tag">접수대기</span>`;
            let cookBtnText = '조리 시작';
            let cookBtnClass = 'action-btn cook-btn';
            let isDeliveryDisabled = true;

            if (status === '조리중') {
                statusTagHtml = `<span class="order-status-tag cooking">조리중</span>`;
                cookBtnText = '조리 완료';
                cookBtnClass = 'action-btn cook-btn in-progress';
                isDeliveryDisabled = true;
            } else if (status === '조리완료' || status === '배달중') {
                statusTagHtml = `<span class="order-status-tag done">조리완료</span>`;
                cookBtnText = '✓ 조리 완료';
                cookBtnClass = 'action-btn cook-btn completed';
                isDeliveryDisabled = false;
            }

            card.innerHTML = `
                <div class="order-card-header">
                    <span class="order-time">🕒 ${order.createdAt || '방금 전'}</span>
                    ${statusTagHtml}
                </div>
                <ul class="order-items-detail">
                    ${itemsHtml}
                </ul>
                <div class="order-total-price">
                    총 결제금액: ${myTotalPrice.toLocaleString()}원
                </div>
                <div class="order-action-btns">
                    <button class="${cookBtnClass}" data-id="${orderId}" data-status="${status}">
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

        // [접수대기 ➔ 조리중 ➔ 조리완료] 순서 제어
        if (target.classList.contains('cook-btn')) {
            const currentStatus = target.dataset.status || '접수대기';
            let nextStatus = '접수대기';

            if (currentStatus === '접수대기') {
                nextStatus = '조리중';
            } else if (currentStatus === '조리중') {
                nextStatus = '조리완료';
            } else if (currentStatus === '조리완료') {
                nextStatus = '조리완료';
            }

            update(ref(db, `orders/${orderId}`), { status: nextStatus });
        }

        // [배달기사 요청] 클릭 시 손님2 화면에 '배달중' 즉시 반영 및 팝업 오픈
        if (target.classList.contains('delivery-btn') && !target.disabled) {
            pendingRemoveOrderId = orderId;
            update(ref(db, `orders/${orderId}`), { status: '배달중' });
            modalOverlay.classList.add('active');
        }
    });

    // 팝업 모달 [확인] 클릭 시 주인 화면 목록에서 해당 주문 삭제
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
