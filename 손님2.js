import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

let db, ordersRef;
try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    ordersRef = ref(db, 'orders');
} catch (e) {
    console.error("Firebase 초기화 오류:", e);
}

document.addEventListener('DOMContentLoaded', () => {
    const orderStatusList = document.getElementById('orderStatusList');
    const menuBackBtn = document.getElementById('menuBackBtn');
    const homeBtn = document.getElementById('homeBtn');

    let myOrders = JSON.parse(localStorage.getItem('myWawaOrders')) || [];

    if (ordersRef) {
        onValue(ordersRef, (snapshot) => {
            const liveOrders = snapshot.val() || {};
            renderCustomerOrders(liveOrders);
        }, (error) => {
            console.error("주문 현황 조회 실패:", error);
            orderStatusList.innerHTML = `<div class="empty-status" style="color: #ff6b6b;">주문 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>`;
        });
    } else {
        orderStatusList.innerHTML = `<div class="empty-status" style="color: #ff6b6b;">주문 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>`;
    }

    function renderCustomerOrders(liveOrders) {
        myOrders = JSON.parse(localStorage.getItem('myWawaOrders')) || [];

        if (myOrders.length === 0) {
            orderStatusList.innerHTML = `<div class="empty-status">아직 주문한 내역이 없습니다! 메뉴판에서 맛있는 음식을 주문해 보세요 🐾</div>`;
            return;
        }

        // 최신 상태 동기화 (가게에서 배달기사 요청 후 팝업 확인 시 DB에서 삭제되므로, 삭제된 주문은 '배달출발'로 유지)
        const updatedMyOrders = myOrders.map((order) => {
            if (liveOrders[order.id]) {
                return {
                    ...order,
                    ...liveOrders[order.id]
                };
            } else {
                return {
                    ...order,
                    status: '배달출발'
                };
            }
        });

        localStorage.setItem('myWawaOrders', JSON.stringify(updatedMyOrders));
        orderStatusList.innerHTML = '';

        // 최신 주문이 맨 위에 오도록 역순 렌더링
        [...updatedMyOrders].reverse().forEach((order) => {
            const status = order.status || '접수대기';

            // 단계 인덱스 매핑 (0: 접수대기, 1: 조리중, 2: 조리완료, 3: 배달중/배달출발)
            let currentStep = 0;
            let badgeText = '주문 접수 대기중';
            let badgeClass = 'current-state-pill';

            if (status === '조리중') {
                currentStep = 1;
                badgeText = '맛있게 조리중 🔥';
                badgeClass = 'current-state-pill cooking';
            } else if (status === '조리완료') {
                currentStep = 2;
                badgeText = '조리 완료 · 기사 호출 대기 ✅';
                badgeClass = 'current-state-pill done';
            } else if (status === '배달중' || status === '배달출발') {
                currentStep = 3;
                badgeText = '배달기사 배정 완료 · 배달 출발 🛵';
                badgeClass = 'current-state-pill delivery';
            }

            const steps = [
                { icon: '📩', label: '접수대기' },
                { icon: '🍳', label: '조리중' },
                { icon: '✅', label: '조리완료' },
                { icon: '🛵', label: '배달출발' }
            ];

            const stepsHtml = steps.map((step, idx) => {
                let cls = 'step-box';
                if (idx < currentStep) cls += ' passed';
                if (idx === currentStep) cls += ' active';
                return `
                    <div class="${cls}">
                        <div class="step-icon">${step.icon}</div>
                        <div class="step-label">${step.label}</div>
                    </div>
                `;
            }).join('');

            const itemsHtml = (order.items || []).map(item =>
                `<li>• ${item.name} × ${item.quantity}개 (${(item.price * item.quantity).toLocaleString()}원)</li>`
            ).join('');

            const card = document.createElement('div');
            card.className = 'status-card';
            card.innerHTML = `
                <div class="status-card-top">
                    <span class="order-time-text">🕒 주문 시간: ${order.createdAt || '방금 전'}</span>
                    <span class="${badgeClass}">${badgeText}</span>
                </div>
                <div class="progress-steps">
                    ${stepsHtml}
                </div>
                <div class="ordered-items-box">
                    <ul class="ordered-items-list">
                        ${itemsHtml}
                    </ul>
                    <div class="ordered-total-row">
                        <span>총 결제 금액</span>
                        <span>${order.totalPrice ? order.totalPrice.toLocaleString() : 0}원</span>
                    </div>
                </div>
            `;

            orderStatusList.appendChild(card);
        });
    }

    // 메뉴판(손님1.html)으로 이동
    menuBackBtn.addEventListener('click', () => {
        location.href = '손님1.html';
    });

    // 홈(index.html)으로 이동
    homeBtn.addEventListener('click', () => {
        location.href = 'index.html';
    });
});
