// Firebase SDK 임포트
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 🌟 [중요] 본인의 Firebase 프로젝트 설정 값으로 아래 내용을 채워넣어 주세요!
// (Firebase 콘솔 -> 프로젝트 설정 -> 웹 앱 추가 후 나오는 firebaseConfig 객체 복사해서 붙여넣기)
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
const menuRef = ref(db, 'menus'); // 데이터베이스 내 'menus' 경로

document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submitBtn');
    const categorySelect = document.getElementById('category');
    const menuNameInput = document.getElementById('menuName');
    const menuPriceInput = document.getElementById('menuPrice');
    const menuList = document.getElementById('menuList');
    const menuCount = document.getElementById('menuCount');
    const backBtn = document.getElementById('backBtn');

    let menusData = {};

    // 🔄 Firebase 실시간 데이터 동기화 (누가 등록하든 실시간 반영)
    onValue(menuRef, (snapshot) => {
        const data = snapshot.val();
        menusData = data || {};
        renderMenus(menusData);
    });

    // 메뉴 등록 버튼 클릭
    submitBtn.addEventListener('click', () => {
        const category = categorySelect.value;
        const name = menuNameInput.value.trim();
        const priceRaw = menuPriceInput.value;

        if (!category || category === "카테고리를 선택해주세요") {
            alert('음식 카테고리를 선택해주세요!');
            categorySelect.focus();
            return;
        }
        if (!name) {
            alert('음식 이름을 입력해주세요!');
            menuNameInput.focus();
            return;
        }
        if (!priceRaw || priceRaw <= 0) {
            alert('올바른 가격을 입력해주세요!');
            menuPriceInput.focus();
            return;
        }

        const price = Number(priceRaw).toLocaleString();

        // Firebase에 새 메뉴 푸시 (데이터 자동 저장)
        push(menuRef, {
            category,
            name,
            price
        }).then(() => {
            // 입력창 초기화
            categorySelect.selectedIndex = 0;
            menuNameInput.value = '';
            menuPriceInput.value = '';
            categorySelect.focus();
        }).catch((error) => {
            console.error("메뉴 등록 실패: ", error);
        });
    });

    // 화면에 메뉴 목록 그리기
    function renderMenus(data) {
        menuList.innerHTML = '';
        const keys = Object.keys(data);

        if (keys.length === 0) {
            menuList.innerHTML = '<li class="empty-item">아직 등록된 메뉴가 없습니다.</li>';
            menuCount.textContent = '0개';
            return;
        }

        keys.forEach((key) => {
            const menu = data[key];
            const li = document.createElement('li');
            li.innerHTML = `
                <span><b>[${menu.category}]</b> ${menu.name}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #845ec2; font-weight: bold;">${menu.price}원</span>
                    <button class="delete-menu-btn" data-key="${key}" style="background:#ff6b6b; color:white; border:none; padding:3px 8px; border-radius:6px; cursor:pointer;">삭제</button>
                </div>
            `;
            menuList.appendChild(li);
        });

        menuCount.textContent = `${keys.length}개`;
    }

    // 메뉴 삭제 기능
    menuList.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-menu-btn')) return;
        const key = e.target.dataset.key;
        remove(ref(db, `menus/${key}`));
    });

    // 처음으로 버튼
    backBtn.addEventListener('click', () => {
        location.href = 'index.html'; 
    });
});
